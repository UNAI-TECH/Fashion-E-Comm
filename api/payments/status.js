import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const orderId = req.query?.order_id || req.body?.order_id || req.query?.orderId || req.body?.orderId;
    const rzpOrderId = req.query?.razorpay_order_id || req.body?.razorpay_order_id;

    if (!orderId && !rzpOrderId) {
      return res.status(400).json({ success: false, message: 'Missing order_id or razorpay_order_id parameter.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Query internal order
    let orderRecord = null;
    if (orderId) {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      orderRecord = data;
    }
    if (!orderRecord && rzpOrderId) {
      const { data } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle();
      orderRecord = data;
    }

    // If order already confirmed Paid in database
    if (orderRecord && orderRecord.payment_status === 'Paid') {
      return res.status(200).json({
        success: true,
        status: 'PAID',
        message: 'Order is confirmed and paid.',
        order: {
          id: orderRecord.id,
          payment_status: orderRecord.payment_status,
          status: orderRecord.status,
          razorpay_payment_id: orderRecord.razorpay_payment_id,
          razorpay_order_id: orderRecord.razorpay_order_id,
          total_amount: orderRecord.total_amount
        }
      });
    }

    // 2. Query Razorpay API directly to get live status (e.g. UPI QR capture)
    const effectiveRzpOrderId = rzpOrderId || orderRecord?.razorpay_order_id;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (effectiveRzpOrderId && keyId && keySecret) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      try {
        const paymentsResponse = await razorpay.orders.fetchPayments(effectiveRzpOrderId);
        const paymentsList = paymentsResponse?.items || [];
        const capturedPayment = paymentsList.find(p => p.status === 'captured');

        if (capturedPayment) {
          const finalOrderId = orderRecord?.id || orderId;

          // Update orders table
          if (finalOrderId) {
            await supabase
              .from('orders')
              .update({
                payment_status: 'Paid',
                status: 'Processing',
                payment_method: capturedPayment.method === 'upi' ? 'UPI' : 'Online Payment (Razorpay)',
                razorpay_payment_id: capturedPayment.id,
                razorpay_order_id: effectiveRzpOrderId,
                payment_timestamp: new Date().toISOString(),
                payment_result: {
                  razorpay_payment_id: capturedPayment.id,
                  razorpay_order_id: effectiveRzpOrderId,
                  method: capturedPayment.method,
                  vpa: capturedPayment.vpa,
                  status: 'PAID'
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', finalOrderId);

            // Update payments table
            try {
              const { data: existingPay } = await supabase.from('payments').select('id').eq('order_id', finalOrderId).maybeSingle();
              const payData = {
                order_id: finalOrderId,
                method: 'Razorpay',
                payment_method: capturedPayment.method === 'upi' ? 'UPI' : 'Razorpay',
                razorpay_order_id: effectiveRzpOrderId,
                razorpay_payment_id: capturedPayment.id,
                gateway_txn_id: capturedPayment.id,
                payment_id: capturedPayment.id,
                payer_vpa: capturedPayment.vpa || '',
                amount: capturedPayment.amount ? capturedPayment.amount / 100 : (orderRecord?.total_amount || 0),
                currency: 'INR',
                status: 'Paid',
                gateway_response: capturedPayment,
                created_at: new Date().toISOString()
              };

              if (existingPay?.id) {
                await supabase.from('payments').update(payData).eq('id', existingPay.id);
              } else {
                await supabase.from('payments').insert([payData]);
              }
            } catch (pErr) {
              console.warn('Payment record sync warning:', pErr);
            }

            // Decrement stock if not decremented
            if (!orderRecord?.stock_decremented) {
              try {
                const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', finalOrderId);
                if (items && Array.isArray(items)) {
                  for (const item of items) {
                    if (item.product_id) {
                      const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).maybeSingle();
                      if (p && typeof p.stock_quantity === 'number') {
                        await supabase.from('products').update({ stock_quantity: Math.max(0, p.stock_quantity - (item.quantity || 1)) }).eq('id', item.product_id);
                      }
                    }
                  }
                  await supabase.from('orders').update({ stock_decremented: true }).eq('id', finalOrderId);
                }
              } catch (stockErr) {
                console.warn('Stock decrement note:', stockErr);
              }
            }
          }

          return res.status(200).json({
            success: true,
            status: 'PAID',
            message: 'Payment successfully captured via Razorpay.',
            order_id: effectiveRzpOrderId,
            payment_id: capturedPayment.id
          });
        }

        const failedPayment = paymentsList.find(p => p.status === 'failed');
        if (failedPayment && paymentsList.length === 1) {
          return res.status(200).json({
            success: false,
            status: 'FAILED',
            message: failedPayment.error_description || 'Payment was declined.'
          });
        }
      } catch (rzpErr) {
        console.warn('Razorpay fetchPayments warning:', rzpErr?.message);
      }
    }

    return res.status(200).json({
      success: false,
      status: orderRecord?.payment_status || 'PENDING',
      message: 'Payment is awaiting completion or bank confirmation.'
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

