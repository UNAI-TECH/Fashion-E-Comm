import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const {
      amount,
      orderId,
      receipt,
      items = [],
      couponCode,
      customerName = 'Customer',
      customerEmail = '',
      customerPhone = '',
      notes = {}
    } = req.body || {};

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
    const targetOrderId = orderId || receipt || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    let supabase = null;
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }

    let verifiedAmount = Number(amount) || 0;

    // STEP A: Authoritative Server-side Price & Stock Validation
    if (supabase && Array.isArray(items) && items.length > 0) {
      const productIds = items
        .map(i => i.id || i.product_id)
        .filter(id => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));

      if (productIds.length > 0) {
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity')
          .in('id', productIds);

        if (!prodErr && dbProducts && dbProducts.length > 0) {
          let serverSubtotal = 0;

          for (const item of items) {
            const prod = dbProducts.find(p => p.id === (item.id || item.product_id));
            if (prod) {
              const reqQty = Number(item.quantity) || 1;
              const currentStock = prod.stock_quantity != null ? prod.stock_quantity : 25;

              // Validate stock availability
              if (currentStock < reqQty) {
                return res.status(400).json({
                  success: false,
                  code: 'INSUFFICIENT_STOCK',
                  message: `Item "${prod.name}" has only ${currentStock} unit(s) remaining in stock.`
                });
              }

              serverSubtotal += Number(prod.price) * reqQty;
            }
          }

          // Authoritative coupon validation
          let serverDiscount = 0;
          if (couponCode) {
            const { data: coupon } = await supabase
              .from('coupons')
              .select('*')
              .eq('code', couponCode.trim().toUpperCase())
              .eq('status', 'Active')
              .maybeSingle();

            if (coupon) {
              const val = Number(coupon.discount_value);
              serverDiscount = coupon.discount_type === 'Percentage'
                ? Math.round(serverSubtotal * (val / 100))
                : Math.min(val, serverSubtotal);
            }
          }

          if (serverSubtotal > 0) {
            verifiedAmount = Math.max(0, serverSubtotal - serverDiscount);
          }
        }
      }
    }

    if (!verifiedAmount || verifiedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payable order amount' });
    }

    // Convert to integer subunits (paise for INR)
    const amountInPaise = Math.round(verifiedAmount * 100);
    const receiptId = targetOrderId.slice(0, 40);

    // STEP B: Check for existing order / idempotency
    if (supabase) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, razorpay_order_id, payment_status, total_amount')
        .eq('id', targetOrderId)
        .maybeSingle();

      if (existingOrder && existingOrder.payment_status === 'Completed') {
        return res.status(400).json({
          success: false,
          code: 'ORDER_ALREADY_PAID',
          message: 'This order has already been paid and confirmed.'
        });
      }
    }

    // Real Razorpay credentials → create order via official Razorpay Orders API
    if (keyId && !keyId.includes('placeholder') && keySecret && !keySecret.includes('placeholder')) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          orderId: targetOrderId,
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          ...notes
        }
      });

      // Persist the relationship between internal order and razorpay order
      if (supabase) {
        await supabase
          .from('orders')
          .update({
            razorpay_order_id: rzpOrder.id,
            total_amount: verifiedAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetOrderId);
      }

      return res.status(200).json({
        success: true,
        id: rzpOrder.id,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId,
        receipt: rzpOrder.receipt,
        verifiedAmount,
        isSimulated: false
      });
    }

    // Fallback for local sandbox/placeholder testing without live API keys
    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (supabase) {
      await supabase
        .from('orders')
        .update({
          razorpay_order_id: simulatedOrderId,
          total_amount: verifiedAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetOrderId);
    }

    return res.status(200).json({
      success: true,
      id: simulatedOrderId,
      orderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      receipt: receiptId,
      verifiedAmount,
      isSimulated: true
    });
  } catch (error) {
    console.error('create-order error:', error?.message, error?.stack?.substring(0, 500));
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal payment order creation error'
    });
  }
}
