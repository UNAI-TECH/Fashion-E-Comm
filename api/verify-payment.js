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

    const rzpOrderId = razorpay_order_id || order_id;
    const rzpPaymentId = razorpay_payment_id || payment_id;
    const rzpSignature = razorpay_signature || signature;
    const targetOrderId = orderId || (order_id && !order_id.startsWith('order_') ? order_id : null);

    // Missing fields: return 400
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

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    // Secure timing-safe comparison
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

    // Signature mismatch: return 400, do NOT mark as paid
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNATURE_MISMATCH',
          message: 'Invalid payment signature. Verification failed.'
        },
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Return success only if signatures match. If database exists, update order
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const finalOrderId = targetOrderId || (req.body.order_id && !req.body.order_id.startsWith('order_') ? req.body.order_id : null);

    if (finalOrderId && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('orders')
          .update({
            payment_status: 'Completed',
            status: 'Confirmed',
            payment_method: 'UPI',
            razorpay_payment_id: rzpPaymentId,
            razorpay_order_id: rzpOrderId,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalOrderId);

        try {
          await supabase.from('payments').insert([{
            order_id: finalOrderId,
            payment_id: rzpPaymentId,
            payment_method: 'Razorpay',
            status: 'Success',
            amount: amount || 0,
            created_at: new Date().toISOString()
          }]);
        } catch {}

        try {
          await supabase.rpc('fulfill_order_stock', { p_order_id: finalOrderId });
        } catch {}
      } catch (dbErr) {
        console.warn('Supabase verify update warning:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: rzpOrderId,
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
