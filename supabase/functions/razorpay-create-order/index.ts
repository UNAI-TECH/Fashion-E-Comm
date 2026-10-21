// Supabase Edge Function: razorpay-create-order
// Deploy: supabase functions deploy razorpay-create-order
// Secrets: supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
      amount,
      amountInPaise: explicitAmountInPaise,
      orderId,
      receipt,
      items = [],
      couponCode,
      customerName = 'Customer',
      customerEmail = '',
      customerPhone = '',
      notes = {}
    } = await req.json()

    const targetOrderId = orderId || receipt || `ord_${Date.now()}`
    let verifiedAmount = Number(amount) || 0

    // Authoritative Server-side Price & Stock Calculation
    if (Array.isArray(items) && items.length > 0) {
      const productIds = items
        .map((i: any) => i.id || i.product_id)
        .filter((id: string) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))

      if (productIds.length > 0) {
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity')
          .in('id', productIds)

        if (dbProducts && dbProducts.length > 0) {
          let serverSubtotal = 0
          for (const item of items) {
            const prod = dbProducts.find((p: any) => p.id === (item.id || item.product_id))
            if (prod) {
              const reqQty = Number(item.quantity) || 1
              const currentStock = prod.stock_quantity != null ? prod.stock_quantity : 25

              if (currentStock < reqQty) {
                return new Response(JSON.stringify({
                  success: false,
                  code: 'INSUFFICIENT_STOCK',
                  message: `Item "${prod.name}" has only ${currentStock} unit(s) remaining in stock.`
                }), {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
              }
              serverSubtotal += Number(prod.price) * reqQty
            }
          }

          let serverDiscount = 0
          if (couponCode) {
            const { data: coupon } = await supabase
              .from('coupons')
              .select('*')
              .eq('code', couponCode.trim().toUpperCase())
              .eq('status', 'Active')
              .maybeSingle()

            if (coupon) {
              const val = Number(coupon.discount_value)
              serverDiscount = coupon.discount_type === 'Percentage'
                ? Math.round(serverSubtotal * (val / 100))
                : Math.min(val, serverSubtotal)
            }
          }

          if (serverSubtotal > 0) {
            verifiedAmount = Math.max(0, serverSubtotal - serverDiscount)
          }
        }
      }
    }

    const amountInPaise = Array.isArray(items) && items.length > 0 && verifiedAmount > 0
      ? Math.round(verifiedAmount * 100)
      : (explicitAmountInPaise ? Math.round(Number(explicitAmountInPaise)) : Math.round(verifiedAmount))

    if (!amountInPaise || amountInPaise < 100) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid payable order amount. Minimum is 100 paise (₹1.00).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const receiptId = targetOrderId.slice(0, 40)

    // Call Razorpay API
    if (keyId && !keyId.includes('placeholder') && keySecret && !keySecret.includes('placeholder')) {
      const basicAuth = btoa(`${keyId}:${keySecret}`)
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptId,
          notes: {
            orderId: targetOrderId,
            customerName,
            customerPhone,
            ...notes
          }
        })
      })

      if (!rzpRes.ok) {
        const errJson = await rzpRes.json()
        return new Response(JSON.stringify({ success: false, message: errJson?.error?.description || 'Razorpay order creation failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const rzpOrder = await rzpRes.json()

      // Update internal order with Razorpay Order ID
      await supabase
        .from('orders')
        .update({
          razorpay_order_id: rzpOrder.id,
          total_amount: verifiedAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetOrderId)

      return new Response(JSON.stringify({
        success: true,
        id: rzpOrder.id,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId,
        receipt: rzpOrder.receipt,
        verifiedAmount,
        isSimulated: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fallback sandbox simulation
    const simOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    await supabase
      .from('orders')
      .update({
        razorpay_order_id: simOrderId,
        total_amount: verifiedAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetOrderId)

    return new Response(JSON.stringify({
      success: true,
      id: simOrderId,
      orderId: simOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      receipt: receiptId,
      verifiedAmount,
      isSimulated: true
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
