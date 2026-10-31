// Supabase Edge Function: razorpay-verify
// Deploy: supabase functions deploy razorpay-verify
// Secrets: supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Constant-time string equality check to prevent timing attacks
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

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_placeholder'
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || 'rzp_test_secret_placeholder'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      orderId,
      amount,
      isSimulated
    } = await req.json()

    const targetOrderId = order_id || orderId
    if (!targetOrderId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Load pending order from DB
    const { data: dbOrder, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', targetOrderId)
      .maybeSingle()

    if (orderErr || !dbOrder) {
      return new Response(JSON.stringify({ success: false, message: 'Order not found in database' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Idempotency: if already completed, return success
    if (dbOrder.payment_status === 'Completed') {
      return new Response(JSON.stringify({
        success: true,
        status: 'PAID',
        message: 'Order already verified and paid',
        orderId: targetOrderId,
        paymentId: dbOrder.razorpay_payment_id || razorpay_payment_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify order ID match
    if (dbOrder.razorpay_order_id && razorpay_order_id && dbOrder.razorpay_order_id !== razorpay_order_id) {
      return new Response(JSON.stringify({
        success: false,
        code: 'ORDER_MISMATCH',
        message: 'Razorpay order ID does not match internal order record'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Cryptographic HMAC-SHA256 Signature Verification
    let paymentStatus = 'captured'
    let paymentMethodUsed = 'Razorpay (Online)'

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing Razorpay verification credentials'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Compute HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const dataToSign = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
    const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign)
    const generatedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (!timingSafeEqual(generatedSignature, razorpay_signature)) {
      console.error('Signature mismatch for order:', targetOrderId)
      return new Response(JSON.stringify({
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Invalid payment signature'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

      // 3. Verify directly with Razorpay API
      try {
        const basicAuth = btoa(`${keyId}:${keySecret}`)
        const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          headers: { 'Authorization': `Basic ${basicAuth}` }
        })

        if (rzpRes.ok) {
          const rzpPayment = await rzpRes.json()

          if (rzpPayment.order_id && rzpPayment.order_id !== razorpay_order_id) {
            return new Response(JSON.stringify({
              success: false,
              code: 'PAYMENT_ORDER_MISMATCH',
              message: 'Payment entity does not match requested Razorpay order.'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          const expectedAmountInRupees = Number(dbOrder.total_amount ?? dbOrder.total_price);
          const expectedAmountInPaise = Math.round(expectedAmountInRupees * 100);

          if (typeof rzpPayment.amount === 'number' && expectedAmountInPaise > 0 && rzpPayment.amount !== expectedAmountInPaise) {
            return new Response(JSON.stringify({
              success: false,
              code: 'AMOUNT_MISMATCH',
              message: `Payment amount mismatch: expected ₹${expectedAmountInRupees} (${expectedAmountInPaise} paise), but charged amount was ₹${rzpPayment.amount / 100} (${rzpPayment.amount} paise).`
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          paymentStatus = rzpPayment.status
          paymentMethodUsed = rzpPayment.method === 'upi' ? 'UPI' : (rzpPayment.method || 'Razorpay')

          if (paymentStatus === 'authorized') {
            const captureRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ amount: rzpPayment.amount, currency: 'INR' })
            })
            if (captureRes.ok) {
              const captured = await captureRes.json()
              paymentStatus = captured.status
            }
          }

          if (paymentStatus !== 'captured') {
            return new Response(JSON.stringify({
              success: false,
              code: 'PAYMENT_NOT_CAPTURED',
              status: paymentStatus,
              message: `Payment status is ${paymentStatus}, not captured.`
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }
      } catch (e: any) {
        console.warn('Direct Razorpay API fetch warning:', e.message)
      }
    }

    // 4. Atomic Stock Deduction & Order Status Update
    try {
      await supabase.rpc('fulfill_order_stock', { p_order_id: targetOrderId })
    } catch (stkErr) {
      console.warn('Stock fulfillment RPC warning:', stkErr)
    }

    await supabase
      .from('orders')
      .update({
        payment_status: 'Completed',
        status: 'Confirmed',
        payment_method: paymentMethodUsed.includes('UPI') ? 'UPI' : 'Razorpay',
        razorpay_payment_id: razorpay_payment_id || `pay_sim_${Date.now()}`,
        razorpay_order_id: razorpay_order_id || dbOrder?.razorpay_order_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetOrderId)

    try {
      await supabase.from('payments').insert([{
        order_id: targetOrderId,
        payment_id: razorpay_payment_id || `pay_${Date.now()}`,
        gateway_txn_id: razorpay_payment_id,
        payment_method: paymentMethodUsed,
        status: 'Success',
        amount: dbOrder?.total_amount || amount || 0,
        currency: 'INR',
        created_at: new Date().toISOString()
      }])
    } catch {}

    return new Response(JSON.stringify({
      success: true,
      status: 'PAID',
      message: 'Payment verified and order fulfilled successfully',
      paymentId: razorpay_payment_id || `pay_${Date.now()}`,
      orderId: targetOrderId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error?.message || 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
