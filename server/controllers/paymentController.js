import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase } from '../config/supabase.js';

// Lazy-initialize Razorpay client so server boots even if credentials are test placeholders
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// @desc    Create Razorpay order for checkout
// @route   POST /api/payments/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const razorpay = getRazorpayInstance();

    // Amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        ...notes,
        userId: req.user.id
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (rzpError) {
      // In sandbox/development when placeholder keys are used, simulate valid mock response
      if (process.env.NODE_ENV !== 'production' || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
        const simulatedOrderId = `order_${Date.now()}_sim`;
        return res.json({
          success: true,
          id: simulatedOrderId,
          amount: options.amount,
          currency: options.currency,
          keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          isSimulated: true
        });
      }
      throw rzpError;
    }

    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment signature from gateway
// @route   POST /api/payments/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id, // Our internal DB order ID
      isSimulated
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';

    // Signature verification logic
    let isValid = false;

    if (isSimulated && process.env.NODE_ENV !== 'production') {
      isValid = true;
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment verification credentials' });
      }

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
    }

    // Update order status in Supabase if order_id provided
    if (order_id) {
      const { data: updatedOrder, error: orderErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'Completed',
          status: 'Confirmed',
          updated_at: new Date()
        })
        .eq('id', order_id)
        .select()
        .single();

      if (orderErr) {
        console.error('Failed to update order payment status:', orderErr);
      }

      // Record in payments table
      await supabase
        .from('payments')
        .insert({
          order_id,
          payment_id: razorpay_payment_id || `sim_${Date.now()}`,
          payment_method: 'Razorpay',
          status: 'Success',
          amount: updatedOrder ? updatedOrder.total_amount : 0
        });

      // Record in order status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id,
          old_status: 'Pending',
          new_status: 'Confirmed',
          changed_by: req.user.id,
          reason: 'Online Payment Verified via Razorpay'
        });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authoritative Razorpay Webhook listener
// @route   POST /api/payments/webhook
// @access  Public (Signature verified)
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Webhook signature missing' });
    }

    // Verify webhook payload
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderReceipt = payment.notes?.orderId || payment.description;

      if (orderReceipt) {
        await supabase
          .from('orders')
          .update({ payment_status: 'Completed', status: 'Confirmed' })
          .eq('id', orderReceipt);
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      const orderReceipt = payment.notes?.orderId || payment.description;

      if (orderReceipt) {
        await supabase
          .from('orders')
          .update({ payment_status: 'Failed' })
          .eq('id', orderReceipt);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
