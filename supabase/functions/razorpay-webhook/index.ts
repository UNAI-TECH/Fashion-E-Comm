// Supabase Edge Function: razorpay-webhook
// Handles Razorpay Webhook events with idempotency & cryptographic signature validation
// Set secret: supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-razorpay-signature, x-razorpay-event-id, content-type',
}

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not set')
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Read raw body and signature header
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const eventId = req.headers.get('x-razorpay-event-id')

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing x-razorpay-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Cryptographic HMAC-SHA256 signature verification
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (!timingSafeEqual(expectedSignature, signature)) {
      console.warn('Webhook signature mismatch')
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Parse verified payload
    const body = JSON.parse(rawBody)
    const event = body.event
    const payload = body.payload
    const resolvedEventId = eventId || body?.id

    console.log(`Razorpay Webhook: Verified event "${event}" [${resolvedEventId || 'no-id'}] received`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Idempotency Check: Don't re-process duplicate events
    if (resolvedEventId) {
      try {
        const { data: existingEvent } = await supabase
          .from('webhook_events')
          .select('event_id, status')
          .eq('event_id', resolvedEventId)
          .maybeSingle()

        if (existingEvent && existingEvent.status === 'processed') {
          console.log(`Webhook: Event ${resolvedEventId} already processed. Returning 200 OK.`)
          return new Response(JSON.stringify({ status: 'already_processed', eventId: resolvedEventId }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } catch (evCheckErr) {
        // Non-blocking if table not yet migrated
        console.warn('Idempotency check note:', evCheckErr)
      }
    }

    // 5. Handle supported events
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity
      const order = payload?.order?.entity
      const targetOrderId =
        payment?.notes?.orderId ||
        order?.notes?.orderId ||
        order?.receipt
      const rzpOrderId = payment?.order_id || order?.id
      const rzpPaymentId = payment?.id

      // Locate internal order by ID or by razorpay_order_id
      let orderRecord: any = null
      if (targetOrderId) {
        const { data: byId } = await supabase.from('orders').select('*').eq('id', targetOrderId).maybeSingle()
        orderRecord = byId
      }
      if (!orderRecord && rzpOrderId) {
        const { data: byRzp } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle()
        orderRecord = byRzp
      }

      const finalOrderId = orderRecord?.id || targetOrderId

      if (finalOrderId) {
        // Decrement product stock if order was not previously marked as Paid
        if (orderRecord && orderRecord.payment_status !== 'Paid') {
          try {
            const { data: items } = await supabase
              .from('order_items')
              .select('product_id, quantity')
              .eq('order_id', finalOrderId)

            if (items && Array.isArray(items)) {
              for (const it of items) {
                if (it.product_id) {
                  const { data: p } = await supabase
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', it.product_id)
                    .maybeSingle()

                  if (p && typeof p.stock_quantity === 'number') {
                    await supabase
                      .from('products')
                      .update({ stock_quantity: Math.max(0, p.stock_quantity - (it.quantity || 1)) })
                      .eq('id', it.product_id)
                  }
                }
              }
            }
          } catch (stkErr) {
            console.warn('Stock decrement note:', stkErr)
          }
        }

        // Prepare order update payload
        const updatePayload: Record<string, any> = {
          payment_status: 'Paid',
          status: 'Processing',
          payment_method: payment?.method === 'upi' ? 'UPI' : 'Razorpay',
          payment_timestamp: new Date().toISOString(),
          payment_result: {
            razorpay_payment_id: rzpPaymentId,
            razorpay_order_id: rzpOrderId,
            amount: payment?.amount ? payment.amount / 100 : undefined,
            currency: payment?.currency || 'INR',
            method: payment?.method,
            captured_at: new Date().toISOString(),
            source: 'webhook'
          },
          updated_at: new Date().toISOString(),
        }

        if (rzpPaymentId) updatePayload.razorpay_payment_id = rzpPaymentId
        if (rzpOrderId) updatePayload.razorpay_order_id = rzpOrderId

        // CRITICAL: Execute update and throw if it fails (never return 200 on DB failure)
        const { error: updateErr } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', finalOrderId)

        if (updateErr) {
          console.error(`Failed to update order ${finalOrderId} in webhook:`, updateErr)
          return new Response(JSON.stringify({
            error: `Database update failed: ${updateErr.message}`,
            code: updateErr.code
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log(`Order ${finalOrderId} successfully confirmed & marked Paid via webhook`)

        // Insert or update payment audit record in public.payments
        try {
          const { data: existingPay } = await supabase
            .from('payments')
            .select('id')
            .eq('order_id', finalOrderId)
            .maybeSingle()

          const shippingAddr = orderRecord?.shipping_address || {}
          const customerName = shippingAddr.full_name || [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(' ') || 'Customer'
          const customerPhone = shippingAddr.phone || ''

          const payData = {
            order_id: finalOrderId,
            user_id: orderRecord?.user_id || null,
            method: 'Razorpay',
            payment_method: payment?.method === 'upi' ? 'UPI' : 'Razorpay',
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPaymentId,
            gateway_txn_id: rzpPaymentId,
            payment_id: rzpPaymentId,
            payer_vpa: payment?.vpa || payment?.email || '',
            customer_name: customerName,
            customer_phone: customerPhone,
            status: 'Paid',
            amount: payment?.amount ? payment.amount / 100 : (orderRecord?.total_amount || 0),
            currency: payment?.currency || 'INR',
            gateway_response: payment || {},
            created_at: new Date().toISOString(),
          }

          if (existingPay?.id) {
            await supabase.from('payments').update(payData).eq('id', existingPay.id)
          } else {
            await supabase.from('payments').insert([payData])
          }
        } catch (payInsertErr) {
          console.warn('Payment insert note:', payInsertErr)
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity
      const targetOrderId = payment?.notes?.orderId || payment?.description
      const rzpOrderId = payment?.order_id

      let orderRecord: any = null
      if (targetOrderId) {
        const { data: byId } = await supabase.from('orders').select('*').eq('id', targetOrderId).maybeSingle()
        orderRecord = byId
      }
      if (!orderRecord && rzpOrderId) {
        const { data: byRzp } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle()
        orderRecord = byRzp
      }

      const finalOrderId = orderRecord?.id || targetOrderId

      if (finalOrderId && orderRecord?.payment_status !== 'Paid') {
        const { error: failErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'Failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalOrderId)

        if (failErr) {
          console.error(`Failed to mark order ${finalOrderId} as failed:`, failErr)
          return new Response(JSON.stringify({ error: failErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log(`Order ${finalOrderId} marked as Failed`)
      }
    } else if (event === 'refund.created' || event === 'refund.processed') {
      const payment = payload?.payment?.entity
      const targetOrderId = payment?.notes?.orderId
      const rzpOrderId = payment?.order_id

      let finalOrderId = targetOrderId
      if (!finalOrderId && rzpOrderId) {
        const { data: byRzp } = await supabase.from('orders').select('id').eq('razorpay_order_id', rzpOrderId).maybeSingle()
        finalOrderId = byRzp?.id
      }

      if (finalOrderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'Refunded',
            status: 'Cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalOrderId)

        console.log(`Order ${finalOrderId} marked as Refunded`)
      }
    }

    // 6. Record processed event for future idempotency
    if (resolvedEventId) {
      try {
        await supabase.from('webhook_events').upsert([{
          event_id: resolvedEventId,
          event_type: event,
          status: 'processed',
          payload: { event, timestamp: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }], { onConflict: 'event_id' })
      } catch (evSaveErr) {
        console.warn('webhook_events record note:', evSaveErr)
      }
    }

    return new Response(JSON.stringify({ status: 'ok', event }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Webhook processing fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
