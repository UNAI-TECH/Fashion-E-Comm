import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const MERCHANT_VPA = process.env.VITE_GOOGLE_PAY_VPA || process.env.GOOGLE_PAY_MERCHANT_VPA || 'aanya.fashions@okaxis';
const MERCHANT_NAME = process.env.VITE_MERCHANT_NAME || process.env.GOOGLE_PAY_MERCHANT_NAME || 'Aanya Fashions';
const MERCHANT_MCC = process.env.VITE_MERCHANT_MCC || process.env.GOOGLE_PAY_MCC || '5137';
const PSP_STATUS_API_URL = process.env.PSP_STATUS_API_URL;
const PSP_API_KEY = process.env.PSP_API_KEY;

/**
 * Generates an NPCI-compliant alphanumeric Transaction Reference ID (max 32 chars)
 */
const generateTransactionReference = (orderId) => {
  const cleanOrder = String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  const timeSuffix = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase();
  return `AF${timeSuffix}${cleanOrder}${rand}`.slice(0, 32);
};

// ─── GOOGLE PAY INDIA DIRECT INTEGRATION ───

/**
 * @desc    Initialize a Google Pay order with unique transaction reference
 * @route   POST /api/payments/google-pay/create-order
 * @access  Public / Protected
 */
export const createGooglePayOrder = async (req, res) => {
  try {
    const { orderId, amount, customerName, customerPhone } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const uniqueOrderId = orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txnReference = generateTransactionReference(uniqueOrderId);
    const formattedAmount = Number(amount).toFixed(2);

    res.json({
      success: true,
      orderId: uniqueOrderId,
      transactionReference: txnReference,
      amount: Number(amount),
      currency: 'INR',
      merchantVpa: MERCHANT_VPA,
      merchantName: MERCHANT_NAME,
      mcc: MERCHANT_MCC,
      supportedMethod: 'https://tez.google.com/pay',
    });
  } catch (error) {
    console.error('Google Pay Order Creation Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal error' });
  }
};

/**
 * @desc    Authoritatively verify Google Pay transaction against bank/PSP boundary
 * @route   POST /api/payments/google-pay/verify
 * @access  Public / Protected
 */
export const verifyGooglePayPayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      txnId,
      transactionReference,
      payerVpa,
      customerName,
      customerPhone,
      rawDetails = {},
    } = req.body;

    if (!orderId || !amount || !txnId) {
      return res.status(400).json({
        success: false,
        message: 'orderId, amount, and txnId are required for authoritative payment verification',
      });
    }

    // 1. Authoritative check against orders table
    const { data: order, error: orderFetchErr } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status, status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderFetchErr) {
      console.warn('Could not query order for validation:', orderFetchErr);
    }

    // Amount validation
    if (order && Math.abs(Number(order.total_amount) - Number(amount)) > 1.0) {
      return res.status(400).json({
        success: false,
        status: 'Failed',
        message: `Amount mismatch: Expected ₹${order.total_amount}, got ₹${amount}`,
        requiresPspReconciliation: true,
      });
    }

    // 2. Bank/PSP authoritative status check boundary
    let isBankVerified = false;
    let bankVerificationNotes = 'Awaiting Bank/PSP payment-status API integration.';

    if (PSP_STATUS_API_URL && PSP_API_KEY) {
      try {
        const pspRes = await fetch(PSP_STATUS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PSP_API_KEY}`,
          },
          body: JSON.stringify({
            merchantVpa: MERCHANT_VPA,
            mcc: MERCHANT_MCC,
            transactionReference: transactionReference || txnId,
            orderId: String(orderId),
            amount: Number(amount),
            currency: 'INR',
          }),
        });

        if (pspRes.ok) {
          const pspData = await pspRes.json();
          if (pspData.status === 'SUCCESS' || pspData.status === 'PAID') {
            isBankVerified = true;
            bankVerificationNotes = `Verified via bank/PSP: ${pspData.rrn || pspData.utr || 'Confirmed'}`;
          } else {
            bankVerificationNotes = `Bank reported status: ${pspData.status || 'Pending'}`;
          }
        }
      } catch (pspErr) {
        console.warn('PSP API inquiry warning:', pspErr);
      }
    }

    const determinedPaymentStatus = isBankVerified ? 'Completed' : 'Pending Verification';
    const determinedOrderStatus = isBankVerified ? 'Confirmed' : 'Pending';

    // 3. Insert authoritative payment record into public.payments (idempotent)
    const { data: paymentRecord, error: payInsertErr } = await supabase
      .from('payments')
      .insert({
        order_id: String(orderId),
        user_id: req.user?.id || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        amount: Number(amount),
        currency: 'INR',
        payment_method: 'Google Pay',
        gateway_txn_id: String(txnId),
        payer_vpa: payerVpa || null,
        status: determinedPaymentStatus,
        metadata: {
          merchantVpa: MERCHANT_VPA,
          mcc: MERCHANT_MCC,
          transactionReference: transactionReference || null,
          bankVerificationNotes,
          isBankVerified,
          rawDetails,
          verifiedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (payInsertErr) {
      if (payInsertErr.code === '23505') {
        const { data: existing } = await supabase
          .from('payments')
          .select()
          .eq('gateway_txn_id', String(txnId))
          .single();

        return res.json({
          success: true,
          status: existing?.status || determinedPaymentStatus,
          message: 'Payment transaction already recorded.',
          payment: existing,
          requiresPspReconciliation: !isBankVerified,
        });
      }
      console.error('Failed to insert payment record:', payInsertErr);
    }

    // 4. Update orders table with exact payment status
    const { error: orderUpdateErr } = await supabase
      .from('orders')
      .update({
        payment_status: determinedPaymentStatus,
        status: determinedOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateErr) {
      console.warn('Failed to update order payment status:', orderUpdateErr);
    }

    res.json({
      success: true,
      status: determinedPaymentStatus,
      message: isBankVerified
        ? 'Payment verified by acquiring bank. Order confirmed.'
        : 'Payment details received from Google Pay sheet. Order is Pending Verification awaiting merchant bank/PSP reconciliation.',
      payment: paymentRecord,
      requiresPspReconciliation: !isBankVerified,
    });
  } catch (error) {
    console.error('Google Pay Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal error' });
  }
};

/**
 * @desc    Get Google Pay transaction status by Order ID
 * @route   GET /api/payments/google-pay/status/:orderId
 * @access  Public / Protected
 */
export const getGooglePayStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      orderId,
      status: payment?.status || 'Pending',
      payment: payment || null,
    });
  } catch (error) {
    console.error('Status Check Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal error' });
  }
};
