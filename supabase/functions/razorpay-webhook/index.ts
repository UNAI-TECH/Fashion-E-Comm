// Supabase Edge Function: razorpay-webhook
// Deploy with: supabase functions deploy razorpay-webhook
// Set secrets: supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-razorpay-signature, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // 1. Read raw body for HMAC verification
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing x-razorpay-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Verify HMAC-SHA256 signature
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

    if (expectedSignature !== signature) {
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

    console.log(`Razorpay Webhook: Event "${event}" received`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity
      const order = payload?.order?.entity
      const targetOrderId =
        payment?.notes?.orderId ||
        order?.notes?.orderId ||
        order?.receipt

      if (targetOrderId) {
        // Fetch existing status for idempotency
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('id, payment_status, status, stock_decremented')
          .eq('id', targetOrderId)
          .maybeSingle()

        // Atomic stock fulfillment
        if (!currentOrder?.stock_decremented) {
          try {
            await supabase.rpc('fulfill_order_stock', { p_order_id: targetOrderId })
          } catch (stkErr) {
            console.warn('Webhook stock fulfillment notice:', stkErr)
          }
        }

        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'Completed',
            status: 'Confirmed',
            payment_method: payment?.method === 'upi' ? 'UPI' : 'Razorpay',
            razorpay_payment_id: payment?.id,
            razorpay_order_id: payment?.order_id || order?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetOrderId)

        if (error) {
          console.error('Failed to update order in webhook:', error)
        } else {
          console.log(`Order ${targetOrderId} confirmed via webhook`)
        }

        try {
          await supabase.from('payments').insert([{
            order_id: targetOrderId,
            payment_id: payment?.id || `pay_${Date.now()}`,
            payment_method: payment?.method || 'Razorpay',
            status: 'Success',
            amount: payment?.amount ? payment.amount / 100 : 0,
            currency: payment?.currency || 'INR',
            gateway_txn_id: payment?.id,
            payer_vpa: payment?.vpa || payment?.email || '',
            created_at: new Date().toISOString(),
          }])
        } catch {}
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity
      const targetOrderId =
        payment?.notes?.orderId ||
        payment?.description

      if (targetOrderId) {
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('id, payment_status')
          .eq('id', targetOrderId)
          .maybeSingle()

        // Do not downgrade already completed payments
        if (currentOrder && currentOrder.payment_status !== 'Completed') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'Failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetOrderId)

          console.log(`Order ${targetOrderId} marked as payment Failed`)
        }
      }
    } else if (event === 'refund.created' || event === 'refund.processed') {
      const refund = payload?.refund?.entity
      const payment = payload?.payment?.entity
      const targetOrderId = payment?.notes?.orderId

      if (targetOrderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'Refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetOrderId)

        console.log(`Order ${targetOrderId} marked as Refunded`)
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
