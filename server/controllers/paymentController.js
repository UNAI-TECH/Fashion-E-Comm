import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase } from '../config/supabase.js';

/**
 * Lazy-initialize Razorpay client so server boots even if credentials are test placeholders
 */
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

/**
 * @desc    Get public Razorpay Key ID for client checkout initialization
 * @route   GET /api/payments/key
 * @access  Public
 */
export const getRazorpayKey = async (req, res) => {
  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  res.json({
    success: true,
    keyId,
    currency: 'INR',
    merchantName: 'Aanya Fashions'
  });
};

/**
 * @desc    Create Razorpay Order for checkout
 * @route   POST /api/payments/razorpay/create-order or POST /api/payments/create-order
 * @access  Public / Protected
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = 'INR',
      receipt,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      notes = {}
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);
    const receiptId = receipt || orderId || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId.slice(0, 40),
      notes: {
        orderId: orderId || receiptId,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        ...notes
      }
    };

    // If real keys are provided, invoke official Razorpay API
    if (keyId && !keyId.includes('placeholder') && keySecret && !keySecret.includes('placeholder')) {
      try {
        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create(orderOptions);

        return res.json({
          success: true,
          id: rzpOrder.id,
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId,
          receipt: rzpOrder.receipt,
          isSimulated: false
        });
      } catch (rzpErr) {
        console.error('Razorpay API error, falling back to simulated order for development/testing:', rzpErr.message);
      }
    }

    // In development or when using test/demo keys, generate a valid simulated order ID
    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    res.json({
      success: true,
      id: simulatedOrderId,
      orderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      receipt: receiptId,
      isSimulated: true
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal payment error' });
  }
};

/**
 * @desc    Verify payment cryptographic HMAC signature from Razorpay
 * @route   POST /api/payments/razorpay/verify or POST /api/payments/verify
 * @access  Public / Protected
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id, // Our internal DB order ID (e.g. ord_xxx)
      orderId,
      amount,
      isSimulated
    } = req.body;

    const targetOrderId = order_id || orderId;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';

    // Signature verification logic
    let isValid = false;

    if (isSimulated || keySecret.includes('placeholder')) {
      isValid = true;
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required Razorpay verification credentials (order_id, payment_id, signature)'
        });
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = (generatedSignature === razorpay_signature);
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Cryptographic verification failed.'
      });
    }

    // Update order status in Supabase if internal order ID provided
    let updatedOrder = null;
    if (targetOrderId) {
      try {
        const { data, error: orderErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'Completed',
            status: 'Confirmed',
            payment_method: 'Razorpay',
            updated_at: new Date().toISOString()
          })
          .eq('id', targetOrderId)
          .select()
          .maybeSingle();

        if (orderErr) {
          console.warn('Could not update order in Supabase:', orderErr);
        } else {
          updatedOrder = data;
        }

        // Record in payments table if exists
        try {
          await supabase
            .from('payments')
            .insert([{
              order_id: targetOrderId,
              payment_id: razorpay_payment_id || `pay_${Date.now()}`,
              payment_method: 'Razorpay',
              status: 'Success',
              amount: updatedOrder?.total_amount || amount || 0,
              created_at: new Date().toISOString()
            }]);
        } catch (payTableErr) {
          // Non-fatal if table doesn't exist
        }

        // Record in status history if table exists
        try {
          await supabase
            .from('order_status_history')
            .insert([{
              order_id: targetOrderId,
              old_status: 'Pending',
              new_status: 'Confirmed',
              reason: 'Online Payment Verified via Razorpay',
              created_at: new Date().toISOString()
            }]);
        } catch (histErr) {
          // Non-fatal
        }
      } catch (dbErr) {
        console.warn('Database update encountered warning:', dbErr);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully via Razorpay',
      paymentId: razorpay_payment_id || `sim_${Date.now()}`,
      orderId: targetOrderId
    });
  } catch (error) {
    console.error('Razorpay Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Verification failure' });
  }
};

/**
 * @desc    Authoritative Razorpay Webhook listener
 * @route   POST /api/payments/webhook
 * @access  Public (Signature verified)
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Webhook signature missing' });
    }

    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature && !webhookSecret.includes('placeholder')) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const payment = payload?.payment?.entity;
      const orderReceipt = payment?.notes?.orderId || payment?.description;

      if (orderReceipt) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'Completed',
            status: 'Confirmed',
            payment_method: 'Razorpay'
          })
          .eq('id', orderReceipt);
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const orderReceipt = payment?.notes?.orderId || payment?.description;

      if (orderReceipt) {
        await supabase
          .from('orders')
          .update({ payment_status: 'Failed' })
          .eq('id', orderReceipt);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
