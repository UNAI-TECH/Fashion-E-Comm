import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { amount, receipt, orderId, customerName, customerEmail, customerPhone, notes = {} } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
    const amountInPaise = Math.round(Number(amount) * 100);
    const receiptId = (receipt || orderId || `rcpt_${Date.now()}`).slice(0, 40);

    // Real Razorpay keys → call Razorpay Orders API
    if (keyId && !keyId.includes('placeholder') && keySecret && !keySecret.includes('placeholder')) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          orderId: orderId || receiptId,
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          ...notes
        }
      });

      return res.status(200).json({
        success: true,
        id: rzpOrder.id,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId,
        receipt: rzpOrder.receipt,
        isSimulated: false
      });
    }

    // Placeholder keys → simulated order for testing
    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.status(200).json({
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
    console.error('create-order error:', error?.message, error?.stack?.substring(0, 500));
    return res.status(500).json({ success: false, message: error?.message || 'Internal payment error' });
  }
}
