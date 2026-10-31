import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: false }
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-razorpay-signature, x-razorpay-event-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
    }

    // HMAC-SHA256 signature verification with constant-time comparison
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      console.warn('Razorpay webhook signature mismatch');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const body = JSON.parse(rawBody.toString('utf8'));
    const event = body.event;
    const payload = body.payload;
    const resolvedEventId = eventId || body?.id;

    console.log(`Razorpay Webhook: Verified event "${event}" [${resolvedEventId || 'no-id'}] received`);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing for webhook');
      return res.status(500).json({ success: false, message: 'Server database credentials not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Idempotency guard: Check if already processed
    if (resolvedEventId) {
      try {
        const { data: existingEvent } = await supabase
          .from('webhook_events')
          .select('event_id, status')
          .eq('event_id', resolvedEventId)
          .maybeSingle();

        if (existingEvent && existingEvent.status === 'processed') {
          console.log(`Webhook: Event ${resolvedEventId} already processed. Returning 200 OK.`);
          return res.status(200).json({ status: 'already_processed', eventId: resolvedEventId });
        }
      } catch (evErr) {
        console.warn('Idempotency query note:', evErr);
      }
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const order = payload?.order?.entity;
      const targetOrderId = payment?.notes?.orderId || order?.notes?.orderId || order?.receipt;
      const rzpOrderId = payment?.order_id || order?.id;
      const rzpPaymentId = payment?.id;

      // Locate internal order
      let orderRecord = null;
      if (targetOrderId) {
        const { data: byId } = await supabase.from('orders').select('*').eq('id', targetOrderId).maybeSingle();
        orderRecord = byId;
      }
      if (!orderRecord && rzpOrderId) {
        const { data: byRzp } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle();
        orderRecord = byRzp;
      }

      const finalOrderId = orderRecord?.id || targetOrderId;

      if (finalOrderId) {
        // Stock fulfillment for unfulfilled items
        if (orderRecord && orderRecord.payment_status !== 'Paid') {
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
            }
          } catch (stkErr) {
            console.warn('Webhook stock fulfillment notice:', stkErr);
          }
        }

        const updatePayload = {
          payment_status: 'Paid',
          status: 'Processing',
          payment_method: payment?.method === 'upi' ? 'UPI' : 'Razorpay',
          payment_timestamp: new Date().toISOString(),
          payment_result: {
            razorpay_payment_id: rzpPaymentId,
            razorpay_order_id: rzpOrderId,
            amount: payment?.amount ? payment.amount / 100 : undefined,
            currency: payment?.currency || 'INR',
            method: payment?.method,
            captured_at: new Date().toISOString(),
            source: 'webhook'
          },
          updated_at: new Date().toISOString(),
        };

        if (rzpPaymentId) updatePayload.razorpay_payment_id = rzpPaymentId;
        if (rzpOrderId) updatePayload.razorpay_order_id = rzpOrderId;

        // CRITICAL: Throw if DB update fails (never return 200 on failure)
        const { error: updateErr } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', finalOrderId);

        if (updateErr) {
          console.error(`Failed to update order ${finalOrderId} in webhook:`, updateErr);
          return res.status(500).json({ success: false, error: updateErr.message });
        }

        // Insert or update payment audit record in public.payments
        try {
          const { data: existingPay } = await supabase
            .from('payments')
            .select('id')
            .eq('order_id', finalOrderId)
            .maybeSingle();

          const shippingAddr = orderRecord?.shipping_address || {};
          const customerName = shippingAddr.full_name || [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(' ') || 'Customer';
          const customerPhone = shippingAddr.phone || '';

          const payData = {
            order_id: finalOrderId,
            user_id: orderRecord?.user_id || null,
            method: 'Razorpay',
            payment_method: payment?.method === 'upi' ? 'UPI' : 'Razorpay',
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPaymentId,
            gateway_txn_id: rzpPaymentId,
            payment_id: rzpPaymentId,
            payer_vpa: payment?.vpa || payment?.email || '',
            customer_name: customerName,
            customer_phone: customerPhone,
            status: 'Paid',
            amount: payment?.amount ? payment.amount / 100 : (orderRecord?.total_amount || 0),
            currency: 'INR',
            gateway_response: payment || {},
            created_at: new Date().toISOString(),
          };

          if (existingPay?.id) {
            await supabase.from('payments').update(payData).eq('id', existingPay.id);
          } else {
            await supabase.from('payments').insert([payData]);
          }
        } catch (payErr) {
          console.warn('Payment insert note:', payErr);
        }

        console.log(`Webhook: Order ${finalOrderId} successfully confirmed and fulfilled.`);
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const targetOrderId = payment?.notes?.orderId || payment?.description;
      const rzpOrderId = payment?.order_id;

      let orderRecord = null;
      if (targetOrderId) {
        const { data: byId } = await supabase.from('orders').select('*').eq('id', targetOrderId).maybeSingle();
        orderRecord = byId;
      }
      if (!orderRecord && rzpOrderId) {
        const { data: byRzp } = await supabase.from('orders').select('*').eq('razorpay_order_id', rzpOrderId).maybeSingle();
        orderRecord = byRzp;
      }

      const finalOrderId = orderRecord?.id || targetOrderId;

      if (finalOrderId && orderRecord?.payment_status !== 'Paid') {
        const { error: failErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'Failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', finalOrderId);

        if (failErr) {
          console.error(`Failed to mark order ${finalOrderId} failed:`, failErr);
          return res.status(500).json({ success: false, error: failErr.message });
        }
        console.log(`Webhook: Order ${finalOrderId} payment status set to Failed`);
      }
    } else if (event === 'refund.created' || event === 'refund.processed') {
      const payment = payload?.payment?.entity;
      const targetOrderId = payment?.notes?.orderId;
      const rzpOrderId = payment?.order_id;

      let finalOrderId = targetOrderId;
      if (!finalOrderId && rzpOrderId) {
        const { data: byRzp } = await supabase.from('orders').select('id').eq('razorpay_order_id', rzpOrderId).maybeSingle();
        finalOrderId = byRzp?.id;
      }

      if (finalOrderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'Refunded',
            status: 'Cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalOrderId);

        console.log(`Order ${finalOrderId} marked as Refunded`);
      }
    }

    // Record processed event for future idempotency
    if (resolvedEventId) {
      try {
        await supabase.from('webhook_events').upsert([{
          event_id: resolvedEventId,
          event_type: event,
          status: 'processed',
          payload: { event, timestamp: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }], { onConflict: 'event_id' });
      } catch (evSaveErr) {
        console.warn('webhook_events record note:', evSaveErr);
      }
    }

    return res.status(200).json({ status: 'ok', event });
  } catch (error) {
    console.error('Webhook error:', error?.message);
    return res.status(500).json({ success: false, message: error?.message });
  }
}
