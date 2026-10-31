import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Consistent currency conversion boundaries
const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const toRupees = (paise) => Number(paise) / 100;

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
      amountInRupees,
      amountInPaise: explicitAmountInPaise,
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
    const SERVICE_ROLE_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZm13anVha3licHVvaXF6a3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc1MTgxNSwiZXhwIjoyMDk0MzI3ODE1fQ.B5LM0c9NoVypcJCUFzMlF2dlRh21bmb5FefDTn7zYko';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY_FALLBACK || process.env.VITE_SUPABASE_ANON_KEY;
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

    const targetOrderId = orderId || receipt || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Authoritative Price Resolution
    // STEP A: Priority 1 - Fetch internal order and its actual total from Supabase orders table
    let authoritativeRupees = null;
    let dbOrder = null;

    if (targetOrderId) {
      const { data: ord, error: ordErr } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, total_price, status, payment_status, currency')
        .eq('id', targetOrderId)
        .maybeSingle();

      if (!ordErr && ord) {
        dbOrder = ord;
        // Verify customer ownership if authenticated
        if (authUserId && dbOrder.user_id && dbOrder.user_id !== authUserId) {
          return res.status(403).json({
            success: false,
            code: 'FORBIDDEN',
            message: 'You are not authorized to pay for this order.'
          });
        }
        const dbTotal = Number(dbOrder.total_amount ?? dbOrder.total_price);
        if (!isNaN(dbTotal) && dbTotal > 0) {
          authoritativeRupees = dbTotal;
        }
      }
    }

    // STEP B: Priority 2 - Calculate server-side from catalog products and coupons table
    if (authoritativeRupees === null && Array.isArray(items) && items.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = items
        .map(i => i.id || i.product_id)
        .filter(id => id && uuidRegex.test(id));

      if (productIds.length > 0) {
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity, offer_enabled, offer_details')
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

          let discount = 0;
          if (couponCode) {
            const codeUpper = couponCode.trim().toUpperCase();
            // 1. Check coupons table
            const { data: coupon } = await supabase
              .from('coupons')
              .select('*')
              .eq('code', codeUpper)
              .eq('status', 'Active')
              .maybeSingle();

            if (coupon) {
              const discVal = Number(coupon.discount_value);
              discount = coupon.discount_type === 'Percentage'
                ? Math.round(subtotal * (discVal / 100))
                : Math.min(discVal, subtotal);
            } else {
              // 2. Check product offer_details fallback (matches frontend CheckoutPage)
              for (const p of dbProducts) {
                if (p.offer_enabled && p.offer_details) {
                  const details = typeof p.offer_details === 'string' ? JSON.parse(p.offer_details) : p.offer_details;
                  if (details?.coupon_code?.toUpperCase() === codeUpper) {
                    const discVal = Number(details.coupon_discount || 0);
                    discount = Math.round(subtotal * (discVal / 100));
                    break;
                  }
                }
              }
            }
          }

          if (subtotal > 0) {
            authoritativeRupees = Math.max(1, subtotal - discount);
          }
        }
      }
    }

    // STEP C: Priority 3 - Explicit amount supplied in request
    if (authoritativeRupees === null) {
      if (amountInRupees != null && Number(amountInRupees) > 0) {
        authoritativeRupees = Number(amountInRupees);
      } else if (explicitAmountInPaise != null && Number(explicitAmountInPaise) > 0) {
        authoritativeRupees = toRupees(explicitAmountInPaise);
      } else if (amount != null && Number(amount) > 0) {
        authoritativeRupees = Number(amount);
      }
    }

    if (authoritativeRupees === null || isNaN(authoritativeRupees) || authoritativeRupees <= 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'Could not determine a valid order amount. Minimum is ₹1.00.'
      });
    }

    // Convert actual INR rupees to paise EXACTLY ONCE
    const amountInPaise = toPaise(authoritativeRupees);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        code: 'MINIMUM_AMOUNT_NOT_MET',
        message: 'Invalid payable order amount. Minimum is 100 paise (₹1.00).'
      });
    }

    // Structured Development & Production-Safe Logging
    console.log('[CreateOrder] Order ID:', targetOrderId);
    console.log('[CreateOrder] Authoritative Order Total (INR):', authoritativeRupees);
    console.log('[CreateOrder] Razorpay Order Amount (Paise):', amountInPaise);
    console.log('[CreateOrder] Razorpay Currency:', currency);

    // 3. Create Razorpay Order via official SDK
    const receiptId = (receipt || targetOrderId).slice(0, 40);
    const orderOptions = {
      amount: amountInPaise,
      currency: (currency || 'INR').toUpperCase(),
      receipt: receiptId,
      notes: {
        orderId: targetOrderId,
        amountInRupees: authoritativeRupees,
        customerName,
        customerEmail,
        customerPhone,
        userId: authUserId || '',
        ...notes
      }
    };

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rzpOrder = await razorpay.orders.create(orderOptions);

    console.log('[CreateOrder] Razorpay Order successfully created:', {
      id: rzpOrder.id,
      amountPaise: rzpOrder.amount,
      currency: rzpOrder.currency
    });

    // 4. Update orders table in Supabase
    try {
      await supabase
        .from('orders')
        .update({
          razorpay_order_id: rzpOrder.id,
          total_amount: authoritativeRupees,
          total_price: authoritativeRupees,
          payment_status: 'Pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetOrderId);
    } catch (dbErr) {
      console.warn('Supabase orders update note:', dbErr?.message);
    }

    // 5. Create or associate record in payments table
    try {
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
        amount: authoritativeRupees,
        gateway_response: { razorpay_order_id: rzpOrder.id, status: rzpOrder.status },
        created_at: new Date().toISOString()
      };

      if (existingPay?.id) {
        await supabase.from('payments').update(paymentRecord).eq('id', existingPay.id);
      } else {
        await supabase.from('payments').insert([paymentRecord]);
      }
    } catch (pErr) {
      console.warn('Payments record note:', pErr?.message);
    }

    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      id: rzpOrder.id,
      amount: rzpOrder.amount, // Authoritative paise for Razorpay Standard Checkout SDK
      amount_in_rupees: authoritativeRupees, // INR rupees for customer reference
      currency: rzpOrder.currency,
      receipt: receiptId,
      key_id: keyId,
      keyId: keyId
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_ERROR', message: error?.message || 'Failed to create payment order.' },
      message: error?.message || 'Failed to create payment order.'
    });
  }
}
