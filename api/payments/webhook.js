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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-razorpay-signature');

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

    console.log(`Razorpay Webhook: Verified event "${event}" received`);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing for webhook');
      return res.status(200).json({ status: 'ok', warning: 'No DB credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const order = payload?.order?.entity;
      const targetOrderId = payment?.notes?.orderId || order?.notes?.orderId || order?.receipt;

      if (targetOrderId) {
        // Fetch current order status to prevent race conditions & double fulfillment
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('id, payment_status, status, stock_decremented')
          .eq('id', targetOrderId)
          .maybeSingle();

        // 1. Atomic Stock fulfillment (only if not already done)
        if (!currentOrder?.stock_decremented) {
          try {
            await supabase.rpc('fulfill_order_stock', { p_order_id: targetOrderId });
          } catch (stkErr) {
            console.warn('Webhook stock fulfillment notice:', stkErr);
          }
        }

        // 2. Transition order to Confirmed/Completed
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

        // 3. Record in public.payments table
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
        } catch (e) {
          /* Non-fatal */
        }

        console.log(`Webhook: Order ${targetOrderId} successfully confirmed and fulfilled.`);
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const targetOrderId = payment?.notes?.orderId || payment?.description;

      if (targetOrderId) {
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('id, payment_status')
          .eq('id', targetOrderId)
          .maybeSingle();

        // Prevent a delayed failed event from downgrading an already captured order
        if (currentOrder && currentOrder.payment_status !== 'Completed') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'Failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', targetOrderId);
          console.log(`Webhook: Order ${targetOrderId} payment status set to Failed`);
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error?.message);
    return res.status(500).json({ success: false, message: error?.message });
  }
}
