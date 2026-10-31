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
      currency = 'INR',
      receipt,
      orderId,
      items = [],
      couponCode,
      customerName = 'Customer',
      customerEmail = '',
      customerPhone = '',
      notes = {}
    } = req.body || {};

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Razorpay credentials not configured.' },
        message: 'Razorpay credentials not configured.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Authenticate user if Bearer token present
    let authUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) authUserId = user.id;
      } catch (authErr) {
        console.warn('Bearer auth extraction note:', authErr?.message);
      }
    }

    // 2. Authoritative Server-side Price & Stock Calculation
    let calculatedAmount = 0;
    const targetOrderId = orderId || receipt || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (Array.isArray(items) && items.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = items
        .map(i => i.id || i.product_id)
        .filter(id => id && uuidRegex.test(id));

      if (productIds.length > 0) {
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity')
          .in('id', productIds);

        if (!prodErr && dbProducts && dbProducts.length > 0) {
          let subtotal = 0;
          for (const item of items) {
            const p = dbProducts.find(x => x.id === (item.id || item.product_id));
            if (p) {
              const qty = Number(item.quantity) || 1;
              if (p.stock_quantity != null && p.stock_quantity < qty) {
                return res.status(400).json({
                  success: false,
                  message: `Item "${p.name}" has only ${p.stock_quantity} left in stock.`
                });
              }
              subtotal += Number(p.price) * qty;
            }
          }

          // Validate coupon if applied
          let discount = 0;
          if (couponCode) {
            const { data: coupon } = await supabase
              .from('coupons')
              .select('*')
              .eq('code', couponCode.trim().toUpperCase())
              .eq('status', 'Active')
              .maybeSingle();

            if (coupon) {
              const discVal = Number(coupon.discount_value);
              discount = coupon.discount_type === 'Percentage'
                ? Math.round(subtotal * (discVal / 100))
                : Math.min(discVal, subtotal);
            }
          }

          if (subtotal > 0) {
            calculatedAmount = Math.max(1, subtotal - discount);
          }
        }
      }
    }

    // If server calculation produced an amount, use it; otherwise fallback to request amount
    const finalAmountInINR = calculatedAmount > 0 ? calculatedAmount : Math.max(1, Math.round(Number(amount) / (Number(amount) > 100 ? 100 : 1)));
    const amountInPaise = Math.round(finalAmountInINR * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    // 3. Create Razorpay Order via official SDK
    const receiptId = (receipt || targetOrderId).slice(0, 40);
    const orderOptions = {
      amount: amountInPaise,
      currency: (currency || 'INR').toUpperCase(),
      receipt: receiptId,
      notes: {
        orderId: targetOrderId,
        customerName,
        customerEmail,
        customerPhone,
        userId: authUserId || '',
        ...notes
      }
    };

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rzpOrder = await razorpay.orders.create(orderOptions);

    // 4. Update orders table in Supabase
    try {
      await supabase
        .from('orders')
        .update({
          razorpay_order_id: rzpOrder.id,
          total_amount: finalAmountInINR,
          payment_status: 'Pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetOrderId);
    } catch (dbErr) {
      console.warn('Supabase orders update note:', dbErr?.message);
    }

    // 5. Create or associate record in payments table
    try {
      // Check if payment already exists for this order
      const { data: existingPay } = await supabase
        .from('payments')
        .select('id')
        .eq('order_id', targetOrderId)
        .maybeSingle();

      const paymentRecord = {
        order_id: targetOrderId,
        user_id: authUserId,
        method: 'Razorpay',
        payment_method: 'Razorpay',
        razorpay_order_id: rzpOrder.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        currency: 'INR',
        status: 'Pending',
        amount: finalAmountInINR,
        gateway_response: { razorpay_order_id: rzpOrder.id, status: rzpOrder.status },
        created_at: new Date().toISOString()
      };

      if (existingPay?.id) {
        await supabase.from('payments').update(paymentRecord).eq('id', existingPay.id);
      } else {
        await supabase.from('payments').insert([paymentRecord]);
      }
    } catch (payDbErr) {
      console.warn('Supabase payments insert note:', payDbErr?.message);
    }

    // Return: { order_id, amount, currency, key_id }
    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      key_id: keyId,
      keyId: keyId,
      verifiedAmount: finalAmountInINR
    });
  } catch (error) {
    console.error('Create Order Fatal Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: error?.error?.code || 'RAZORPAY_API_ERROR',
        message: error?.error?.description || error.message || 'Internal server error'
      },
      message: error?.error?.description || error.message || 'Internal server error'
    });
  }
}
