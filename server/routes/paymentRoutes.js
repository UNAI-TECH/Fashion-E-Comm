import express from 'express';
import {
  createGooglePayOrder,
  verifyGooglePayPayment,
  getGooglePayStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

// ── Google Pay India Direct Routes ──
router.post('/google-pay/create-order', createGooglePayOrder);
router.post('/google-pay/verify', verifyGooglePayPayment);
router.get('/google-pay/status/:orderId', getGooglePayStatus);

// ── Legacy Routes ──
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

export default router;
