import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getRazorpayKey,
  checkPaymentStatus,
} from '../controllers/paymentController.js';

const router = express.Router();

// ── Razorpay Standard Checkout Routes ──
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyRazorpayPayment);
router.post('/verify', verifyRazorpayPayment);
router.get('/status', checkPaymentStatus);
router.post('/status', checkPaymentStatus);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/webhook', handleRazorpayWebhook);
router.get('/key', getRazorpayKey);

export default router;
