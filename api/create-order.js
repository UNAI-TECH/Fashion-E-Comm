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
      customerName = 'Customer',
      customerEmail = '',
      customerPhone = '',
      notes = {}
    } = req.body || {};

    const amountNum = Number(amount);

    // Validate amount >= 100 paise
    if (!amount || isNaN(amountNum) || amountNum < 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
        },
        message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Razorpay credentials not configured.'
        },
        message: 'Razorpay credentials not configured.'
      });
    }

    const receiptId = (receipt || orderId || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`).slice(0, 40);

    const orderOptions = {
      amount: Math.round(amountNum),
      currency: (currency || 'INR').toUpperCase(),
      receipt: receiptId,
      notes: {
        orderId: orderId || receiptId,
        customerName,
        customerEmail,
        customerPhone,
        ...notes
      }
    };

    let rzpOrder;
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      rzpOrder = await razorpay.orders.create(orderOptions);
    } catch (rzpErr) {
      console.error('Razorpay Orders API Error:', rzpErr);
      const isAuthError = rzpErr?.statusCode === 401 ||
        rzpErr?.error?.code === 'BAD_REQUEST_ERROR' && rzpErr?.error?.description?.toLowerCase().includes('authenticate') ||
        rzpErr?.error?.description?.toLowerCase().includes('api key') ||
        rzpErr?.message?.toLowerCase().includes('auth') ||
        rzpErr?.message?.toLowerCase().includes('key_id');

      if (isAuthError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: 'Razorpay authentication failed. Please check your credentials.'
          },
          message: 'Razorpay authentication failed. Please check your credentials.'
        });
      }

      const errMsg = rzpErr?.error?.description || rzpErr?.message || 'Razorpay order creation failed';
      return res.status(500).json({
        success: false,
        error: {
          code: rzpErr?.error?.code || 'RAZORPAY_API_ERROR',
          message: errMsg
        },
        message: errMsg
      });
    }

    // Save razorpay_order_id to Supabase if orderId is provided
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (orderId && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('orders')
          .update({
            razorpay_order_id: rzpOrder.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('Supabase update notice:', dbErr?.message);
      }
    }

    // Return: { order_id, amount, currency }
    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      key_id: keyId,
      keyId: keyId
    });
  } catch (error) {
    console.error('Create Order Fatal Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Internal server error'
      },
      message: error.message || 'Internal server error'
    });
  }
}
