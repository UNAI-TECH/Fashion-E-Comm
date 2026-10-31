import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

/**
 * Dynamically re-read .env from disk so credential changes take effect immediately
 */
const refreshEnv = () => {
  try {
    dotenv.config({ path: envPath, override: true });
  } catch {}
};

/**
 * Initialize Razorpay client with credentials from environment
 */
const getRazorpayInstance = () => {
  refreshEnv();
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay credentials not configured.');
    error.statusCode = 401;
    throw error;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

/**
 * @desc    Get public Razorpay Key ID for client checkout initialization
 * @route   GET /api/payments/key
 * @access  Public
 */
export const getRazorpayKey = async (req, res) => {
  refreshEnv();
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  res.json({
    success: true,
    keyId,
    key_id: keyId,
    currency: 'INR',
    merchantName: process.env.VITE_MERCHANT_NAME || 'Aanya Fashions'
  });
};

/**
 * @desc    Create Razorpay Order for checkout
 * @route   POST /api/create-order, POST /api/payments/create-order
 * @access  Public
 */
// Consistent currency conversion boundaries
const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const toRupees = (paise) => Number(paise) / 100;

export const createRazorpayOrder = async (req, res) => {
  try {
    refreshEnv();
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
        error: {
          code: 'AUTH_FAILED',
          message: 'Razorpay credentials not configured.'
        },
        message: 'Razorpay credentials not configured.'
      });
    }

    const targetOrderId = orderId || receipt || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Authoritative Price Resolution
    let authoritativeRupees = null;

    // STEP A: Fetch internal order from Supabase orders table
    if (targetOrderId && supabase) {
      try {
        const { data: ord } = await supabase
          .from('orders')
          .select('id, user_id, total_amount, total_price, status, payment_status')
          .eq('id', targetOrderId)
          .maybeSingle();

        if (ord) {
          const dbTotal = Number(ord.total_amount ?? ord.total_price);
          if (!isNaN(dbTotal) && dbTotal > 0) {
            authoritativeRupees = dbTotal;
          }
        }
      } catch (dbErr) {
        console.warn('Orders table fetch notice in createRazorpayOrder:', dbErr);
      }
    }

    // STEP B: Explicit amount in request
    if (authoritativeRupees === null) {
      if (amountInRupees != null && Number(amountInRupees) > 0) {
        authoritativeRupees = Number(amountInRupees);
      } else if (explicitAmountInPaise != null && Number(explicitAmountInPaise) > 0) {
        authoritativeRupees = toRupees(explicitAmountInPaise);
      } else if (amount != null && Number(amount) > 0) {
        // If amount was sent as paise (>= 100) or rupees (< 100)
        // If explicit amountInRupees is not present, check whether amount was in rupees
        authoritativeRupees = Number(amount);
      }
    }

    if (authoritativeRupees === null || isNaN(authoritativeRupees) || authoritativeRupees <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid amount. Minimum amount is ₹1.00.'
        },
        message: 'Invalid amount. Minimum amount is ₹1.00.'
      });
    }

    const amountInPaise = toPaise(authoritativeRupees);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
        },
        message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    console.log('[PaymentController] Order ID:', targetOrderId);
    console.log('[PaymentController] Authoritative Total (INR):', authoritativeRupees);
    console.log('[PaymentController] Razorpay Amount (Paise):', amountInPaise);

    const receiptId = (receipt || targetOrderId).slice(0, 40);

    const orderOptions = {
      amount: amountInPaise,
      currency: (currency || 'INR').toUpperCase(),
      receipt: receiptId,
      notes: {
        orderId: targetOrderId,
        amountInRupees: authoritativeRupees,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
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
            message: 'Razorpay authentication failed. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
          },
          message: 'Razorpay authentication failed. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
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

    // Save order details to Supabase if internal orderId is provided
    if (orderId && supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            razorpay_order_id: rzpOrder.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('Supabase order razorpay_order_id update warning:', dbErr?.message);
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
};

/**
 * @desc    Verify payment cryptographic HMAC signature from Razorpay
 * @route   POST /api/verify-payment, POST /api/payments/verify
 * @access  Public
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    refreshEnv();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
      orderId, // Internal database order ID
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

    // Independent Razorpay Server-side Payment Verification
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    let rzpPaymentEntity = null;
    if (keyId && keySecret) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${rzpPaymentId}`, {
          headers: { Authorization: authHeader }
        });
        if (rzpPayRes.ok) {
          rzpPaymentEntity = await rzpPayRes.json();
        }
      } catch (rzpFetchErr) {
        console.warn('Could not fetch Razorpay payment entity in paymentController:', rzpFetchErr?.message);
      }
    }

    // Return success only if signatures match
    let updatedOrder = null;
    const finalOrderId = targetOrderId || (req.body.order_id && !req.body.order_id.startsWith('order_') ? req.body.order_id : null);
    if (finalOrderId && supabase) {
      try {
        // Fetch existing order to compare expected amount
        const { data: existingOrd } = await supabase.from('orders').select('*').eq('id', finalOrderId).maybeSingle();
        const expectedAmountInRupees = Number(existingOrd?.total_amount ?? amount);
        const expectedAmountInPaise = toPaise(expectedAmountInRupees);

        if (rzpPaymentEntity) {
          if (rzpPaymentEntity.order_id && rzpOrderId && rzpPaymentEntity.order_id !== rzpOrderId) {
            return res.status(400).json({
              success: false,
              code: 'ORDER_MISMATCH',
              message: 'Razorpay payment does not correspond to this order ID.'
            });
          }

          if (typeof rzpPaymentEntity.amount === 'number' && expectedAmountInPaise > 0 && rzpPaymentEntity.amount !== expectedAmountInPaise) {
            return res.status(400).json({
              success: false,
              code: 'AMOUNT_MISMATCH',
              message: `Payment amount mismatch: expected ₹${expectedAmountInRupees} (${expectedAmountInPaise} paise), but charged amount was ₹${rzpPaymentEntity.amount / 100} (${rzpPaymentEntity.amount} paise).`
            });
          }
        }

        const { data, error: dbErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'Paid',
            status: 'Processing',
            payment_method: 'UPI',
            razorpay_payment_id: rzpPaymentId,
            razorpay_order_id: rzpOrderId,
            payment_timestamp: new Date().toISOString(),
            payment_result: {
              razorpay_payment_id: rzpPaymentId,
              razorpay_order_id: rzpOrderId,
              status: 'PAID'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', finalOrderId)
          .select()
          .maybeSingle();

        if (dbErr) {
          console.warn('Supabase order update warning:', dbErr.message);
        } else {
          updatedOrder = data;
        }

        try {
          const { data: existingPay } = await supabase.from('payments').select('id').eq('order_id', finalOrderId).maybeSingle();
          const shippingAddr = updatedOrder?.shipping_address || {};
          const customerName = shippingAddr.full_name || [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(' ') || 'Customer';
          const customerPhone = shippingAddr.phone || '';

          const payData = {
            order_id: finalOrderId,
            user_id: updatedOrder?.user_id || null,
            method: 'Razorpay',
            payment_method: 'Razorpay',
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPaymentId,
            gateway_txn_id: rzpPaymentId,
            payment_id: rzpPaymentId,
            customer_name: customerName,
            customer_phone: customerPhone,
            currency: 'INR',
            status: 'Paid',
            amount: updatedOrder?.total_amount || amount || 0,
            gateway_response: { razorpay_order_id: rzpOrderId, razorpay_payment_id: rzpPaymentId, status: 'PAID' },
            created_at: new Date().toISOString()
          };

          if (existingPay?.id) {
            await supabase.from('payments').update(payData).eq('id', existingPay.id);
          } else {
            await supabase.from('payments').insert([payData]);
          }
        } catch {}

        if (!updatedOrder?.stock_decremented) {
          try {
            const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', finalOrderId);
            if (items && Array.isArray(items)) {
              for (const it of items) {
                if (it.product_id) {
                  const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', it.product_id).maybeSingle();
                  if (p && typeof p.stock_quantity === 'number') {
                    await supabase.from('products').update({ stock_quantity: Math.max(0, p.stock_quantity - (it.quantity || 1)) }).eq('id', it.product_id);
                  }
                }
              }
              await supabase.from('orders').update({ stock_decremented: true }).eq('id', finalOrderId);
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Database recording warning:', err);
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

    // Verify HMAC signature using raw request body
    const rawPayload = req.rawBody ? req.rawBody.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    if (expectedSignature !== signature && !webhookSecret.includes('placeholder')) {
      console.warn('Razorpay Webhook: Signature mismatch detected.');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    console.log(`Razorpay Webhook Verified: Event "${event}" received`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const order = payload?.order?.entity;
      const targetOrderId = payment?.notes?.orderId || order?.notes?.orderId || payment?.description || order?.receipt;

      if (targetOrderId && supabase) {
        // Fetch current order status to avoid duplicate fulfillment
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('id, payment_status, status, stock_decremented')
          .eq('id', targetOrderId)
          .maybeSingle();

        // Atomic Stock fulfillment if not already decremented
        if (!currentOrder?.stock_decremented) {
          try {
            await supabase.rpc('fulfill_order_stock', { p_order_id: targetOrderId });
          } catch (stkErr) {
            console.warn('Webhook stock fulfillment notice:', stkErr?.message);
          }
        }

        await supabase
          .from('orders')
          .update({
            payment_status: 'Completed',
            status: 'Confirmed',
            payment_method: payment?.method === 'upi' ? 'UPI' : 'Razorpay',
            razorpay_payment_id: payment?.id,
            razorpay_order_id: payment?.order_id || order?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetOrderId);

        // Record into payments table
        try {
          await supabase.from('payments').insert([{
            order_id: targetOrderId,
            payment_id: payment?.id || `pay_${Date.now()}`,
            gateway_txn_id: payment?.id,
            payment_method: payment?.method || 'Razorpay',
            status: 'Success',
            amount: payment?.amount ? payment.amount / 100 : 0,
            currency: payment?.currency || 'INR',
            payer_vpa: payment?.vpa || payment?.email || '',
            created_at: new Date().toISOString()
          }]);
        } catch (payInsertErr) {
          console.warn('Payment insert notice:', payInsertErr?.message);
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const targetOrderId = payment?.notes?.orderId || payment?.description;

      if (targetOrderId && supabase) {
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('id, payment_status')
          .eq('id', targetOrderId)
          .maybeSingle();

        if (currentOrder && currentOrder.payment_status !== 'Completed') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'Failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', targetOrderId);

          try {
            await supabase.from('payments').insert([{
              order_id: targetOrderId,
              payment_id: payment?.id || `fail_${Date.now()}`,
              gateway_txn_id: payment?.id,
              payment_method: payment?.method || 'Razorpay',
              status: 'Failed',
              amount: payment?.amount ? payment.amount / 100 : 0,
              currency: payment?.currency || 'INR',
              payer_vpa: payment?.vpa || payment?.email || '',
              created_at: new Date().toISOString()
            }]);
          } catch {}
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Check payment status against live Razorpay API and DB
 * @route   GET /api/payments/status
 * @access  Public
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    refreshEnv();
    const orderId = req.query?.order_id || req.body?.order_id || req.query?.orderId;
    const rzpOrderId = req.query?.razorpay_order_id || req.body?.razorpay_order_id;

    if (!orderId && !rzpOrderId) {
      return res.status(400).json({ success: false, message: 'Missing order_id or razorpay_order_id parameter.' });
    }

    let orderRecord = null;
    if (orderId && supabase) {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      orderRecord = data;
    }
    if (!orderRecord && rzpOrderId && supabase) {
      const { data } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle();
      orderRecord = data;
    }

    if (orderRecord && orderRecord.payment_status === 'Paid') {
      return res.status(200).json({
        success: true,
        status: 'PAID',
        message: 'Order is confirmed and paid.',
        order_id: orderRecord.razorpay_order_id,
        payment_id: orderRecord.razorpay_payment_id
      });
    }

    const effectiveRzpOrderId = rzpOrderId || orderRecord?.razorpay_order_id;
    if (effectiveRzpOrderId) {
      try {
        const razorpay = getRazorpayInstance();
        const paymentsResponse = await razorpay.orders.fetchPayments(effectiveRzpOrderId);
        const paymentsList = paymentsResponse?.items || [];
        const captured = paymentsList.find(p => p.status === 'captured');

        if (captured && supabase) {
          const finalOrderId = orderRecord?.id || orderId;
          await supabase
            .from('orders')
            .update({
              payment_status: 'Paid',
              status: 'Processing',
              payment_method: captured.method === 'upi' ? 'UPI' : 'Online Payment (Razorpay)',
              razorpay_payment_id: captured.id,
              razorpay_order_id: effectiveRzpOrderId,
              payment_timestamp: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', finalOrderId);

          const { data: existingPay } = await supabase.from('payments').select('id').eq('order_id', finalOrderId).maybeSingle();
          const payData = {
            order_id: finalOrderId,
            method: 'Razorpay',
            payment_method: captured.method === 'upi' ? 'UPI' : 'Razorpay',
            razorpay_order_id: effectiveRzpOrderId,
            razorpay_payment_id: captured.id,
            gateway_txn_id: captured.id,
            payment_id: captured.id,
            payer_vpa: captured.vpa || '',
            amount: captured.amount ? captured.amount / 100 : (orderRecord?.total_amount || 0),
            currency: 'INR',
            status: 'Paid',
            created_at: new Date().toISOString()
          };

          if (existingPay?.id) {
            await supabase.from('payments').update(payData).eq('id', existingPay.id);
          } else {
            await supabase.from('payments').insert([payData]);
          }

          return res.status(200).json({
            success: true,
            status: 'PAID',
            message: 'Payment captured successfully.',
            payment_id: captured.id,
            order_id: effectiveRzpOrderId
          });
        }
      } catch (e) {
        console.warn('Live Razorpay fetch error:', e?.message);
      }
    }

    return res.status(200).json({
      success: false,
      status: orderRecord?.payment_status || 'PENDING',
      message: 'Payment awaiting completion or bank confirmation.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
