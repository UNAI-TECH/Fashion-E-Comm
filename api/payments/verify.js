import crypto from 'crypto';
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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      order_id,
      amount
    } = req.body || {};

    const finalOrderId = orderId || order_id;
    const rzpOrderId = razorpay_order_id;
    const rzpPaymentId = razorpay_payment_id;
    const rzpSignature = razorpay_signature;

    if (!rzpPaymentId || !rzpSignature) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PAYMENT_CREDENTIALS',
        message: 'Missing razorpay_payment_id or razorpay_signature for verification.'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        code: 'CONFIG_ERROR',
        message: 'Server payment key secret not configured.'
      });
    }

    // Cryptographic HMAC Verification
    let isSignatureValid = false;
    if (rzpOrderId) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      try {
        isSignatureValid = crypto.timingSafeEqual(
          Buffer.from(generatedSignature, 'utf-8'),
          Buffer.from(rzpSignature, 'utf-8')
        );
      } catch {
        isSignatureValid = false;
      }
    } else {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Payment verification failed: cryptographic signature mismatch.'
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
          console.log('[Payment Verify] Fetched Razorpay payment:', {
            id: rzpPaymentEntity.id,
            amountPaise: rzpPaymentEntity.amount,
            currency: rzpPaymentEntity.currency,
            status: rzpPaymentEntity.status
          });
        }
      } catch (rzpFetchErr) {
        console.warn('Could not fetch Razorpay payment entity:', rzpFetchErr?.message);
      }
    }

    // Synchronize status with Supabase Database
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && (finalOrderId || rzpOrderId)) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch existing order to preserve customer details and check status
        let existingOrder = null;
        if (finalOrderId) {
          const { data } = await supabase.from('orders').select('*').eq('id', finalOrderId).maybeSingle();
          existingOrder = data;
        }
        if (!existingOrder && rzpOrderId) {
          const { data } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle();
          existingOrder = data;
        }

        const resolvedOrderId = existingOrder?.id || finalOrderId;
        const expectedAmountInRupees = Number(existingOrder?.total_amount ?? amount);
        const expectedAmountInPaise = Math.round(expectedAmountInRupees * 100);

        // Validate amount against Razorpay API
        if (rzpPaymentEntity) {
          if (rzpPaymentEntity.order_id && rzpOrderId && rzpPaymentEntity.order_id !== rzpOrderId) {
            return res.status(400).json({
              success: false,
              code: 'ORDER_MISMATCH',
              message: 'Razorpay payment does not correspond to this order ID.'
            });
          }

          if (typeof rzpPaymentEntity.amount === 'number' && expectedAmountInPaise > 0 && rzpPaymentEntity.amount !== expectedAmountInPaise) {
            console.error(`Amount mismatch: expected ${expectedAmountInPaise} paise, but received ${rzpPaymentEntity.amount} paise.`);
            return res.status(400).json({
              success: false,
              code: 'AMOUNT_MISMATCH',
              message: `Payment amount mismatch: expected ₹${expectedAmountInRupees} (${expectedAmountInPaise} paise), but charged amount was ₹${rzpPaymentEntity.amount / 100} (${rzpPaymentEntity.amount} paise).`
            });
          }
        }

        // Update order status to Paid & Processing
        if (resolvedOrderId) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'Paid',
              status: 'Processing',
              payment_method: 'Online Payment (Razorpay)',
              razorpay_payment_id: rzpPaymentId,
              razorpay_order_id: rzpOrderId,
              payment_timestamp: new Date().toISOString(),
              payment_result: {
                razorpay_payment_id: rzpPaymentId,
                razorpay_order_id: rzpOrderId,
                razorpay_signature: rzpSignature,
                verified_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', resolvedOrderId);

          // Record payment record in public.payments
          try {
            const { data: existingPay } = await supabase
              .from('payments')
              .select('id')
              .eq('order_id', resolvedOrderId)
              .maybeSingle();

            const shippingAddr = existingOrder?.shipping_address || {};
            const customerName = shippingAddr.full_name || [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(' ') || 'Customer';
            const customerPhone = shippingAddr.phone || '';

            const payPayload = {
              order_id: resolvedOrderId,
              user_id: existingOrder?.user_id || null,
              method: 'Razorpay',
              payment_method: 'Razorpay',
              razorpay_order_id: rzpOrderId,
              razorpay_payment_id: rzpPaymentId,
              razorpay_signature: rzpSignature,
              gateway_txn_id: rzpPaymentId,
              payment_id: rzpPaymentId,
              customer_name: customerName,
              customer_phone: customerPhone,
              currency: 'INR',
              status: 'Paid',
              amount: Number(amount) || Number(existingOrder?.total_amount) || 0,
              gateway_response: {
                razorpay_order_id: rzpOrderId,
                razorpay_payment_id: rzpPaymentId,
                status: 'PAID',
                verified_at: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            };

            if (existingPay?.id) {
              await supabase.from('payments').update(payPayload).eq('id', existingPay.id);
            } else {
              await supabase.from('payments').insert([payPayload]);
            }
          } catch (payInsertErr) {
            console.warn('[Payment Verify] Payment record insert note:', payInsertErr?.message);
          }

          // Direct stock decrement for order items (if not already done)
          if (!existingOrder?.stock_decremented) {
            try {
              const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', resolvedOrderId);
              if (items && Array.isArray(items)) {
                for (const item of items) {
                  if (item.product_id) {
                    const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).maybeSingle();
                    if (p && typeof p.stock_quantity === 'number') {
                      await supabase.from('products').update({
                        stock_quantity: Math.max(0, p.stock_quantity - (item.quantity || 1))
                      }).eq('id', item.product_id);
                    }
                  }
                }
                await supabase.from('orders').update({ stock_decremented: true }).eq('id', resolvedOrderId);
              }
            } catch (stockErr) {
              console.warn('[Payment Verify] Stock deduction notice:', stockErr?.message);
            }
          }
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
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Verification failed.' },
      message: error.message || 'Verification failed.'
    });
  }
}
