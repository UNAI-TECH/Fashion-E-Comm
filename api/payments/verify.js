import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
      orderId,
      amount
    } = req.body || {};

    const rzpOrderId = razorpay_order_id || (order_id && order_id.startsWith('order_') ? order_id : null);
    const rzpPaymentId = razorpay_payment_id || payment_id;
    const rzpSignature = razorpay_signature || signature;
    const targetOrderId = orderId || (order_id && !order_id.startsWith('order_') ? order_id : null);

    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: order_id, payment_id, and signature are required.'
        },
        message: 'Missing required fields: order_id, payment_id, and signature are required.'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Razorpay key secret not configured on server.'
        },
        message: 'Razorpay key secret not configured on server.'
      });
    }

    // Standard Razorpay HMAC-SHA256 signature calculation
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    // Secure timing-safe comparison to prevent timing attacks
    let isMatch = false;
    try {
      const generatedBuffer = Buffer.from(generatedSignature, 'utf8');
      const signatureBuffer = Buffer.from(rzpSignature, 'utf8');
      if (generatedBuffer.length === signatureBuffer.length) {
        isMatch = crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      console.warn(`[Payment Verify] Signature mismatch for razorpay_order_id=${rzpOrderId}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNATURE_MISMATCH',
          message: 'Invalid payment signature. Verification failed.'
        },
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Signature verified! Now handle idempotent database persistence
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const finalOrderId = targetOrderId;

    if (finalOrderId && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if order was already confirmed/paid (idempotency guard)
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, payment_status, status, payment_result')
          .eq('id', finalOrderId)
          .maybeSingle();

        if (existingOrder && (existingOrder.payment_status === 'Paid' || existingOrder.payment_status === 'Completed')) {
          return res.status(200).json({
            success: true,
            status: 'PAID',
            message: 'Payment already verified and confirmed.',
            order_id: rzpOrderId,
            orderId: finalOrderId,
            payment_id: rzpPaymentId,
            signature_valid: true
          });
        }

        // Update order status to Paid & Processing
        await supabase
          .from('orders')
          .update({
            payment_status: 'Paid',
            status: 'Processing',
            payment_method: 'Online Payment (Razorpay)',
            payment_timestamp: new Date().toISOString(),
            payment_result: {
              razorpay_payment_id: rzpPaymentId,
              razorpay_order_id: rzpOrderId,
              razorpay_signature: rzpSignature,
              verified_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', finalOrderId);

        // Record payment record in public.payments
        try {
          await supabase.from('payments').insert([{
            order_id: finalOrderId,
            payment_id: rzpPaymentId,
            gateway_txn_id: rzpPaymentId,
            payment_method: 'Razorpay',
            status: 'Success',
            amount: amount || 0,
            currency: 'INR',
            created_at: new Date().toISOString()
          }]);
        } catch (payInsertErr) {
          console.warn('[Payment Verify] Payment record insert note:', payInsertErr?.message);
        }

        // Direct stock decrement for order items
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
          }
        } catch (rpcErr) {
          console.warn('[Payment Verify] Stock deduction notice:', rpcErr?.message);
        }
      } catch (dbErr) {
        console.warn('[Payment Verify] Database recording warning:', dbErr?.message);
      }
    }

    return res.status(200).json({
      success: true,
      status: 'PAID',
      message: 'Payment verified successfully.',
      order_id: rzpOrderId,
      orderId: finalOrderId,
      payment_id: rzpPaymentId,
      signature_valid: true
    });
  } catch (error) {
    console.error('Verify Payment Fatal Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Internal payment verification error'
      },
      message: error.message || 'Internal payment verification error'
    });
  }
}
