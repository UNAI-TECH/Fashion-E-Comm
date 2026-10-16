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

    // HMAC-SHA256 verification
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (expected !== signature) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const body = JSON.parse(rawBody.toString('utf8'));
    const event = body.event;
    const payload = body.payload;

    console.log(`Razorpay Webhook: "${event}"`);

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
        await supabase.from('orders').update({
          payment_status: 'Completed',
          status: 'Confirmed',
          payment_method: 'UPI',
          updated_at: new Date().toISOString()
        }).eq('id', targetOrderId);
        console.log(`Order ${targetOrderId} → Confirmed`);
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const targetOrderId = payment?.notes?.orderId;

      if (targetOrderId) {
        await supabase.from('orders').update({
          payment_status: 'Failed',
          updated_at: new Date().toISOString()
        }).eq('id', targetOrderId);
        console.log(`Order ${targetOrderId} → Failed`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error?.message);
    return res.status(500).json({ success: false, message: error?.message });
  }
}
