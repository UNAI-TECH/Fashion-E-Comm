import express from 'express';
import {
  createGooglePayOrder,
  verifyGooglePayPayment,
  getGooglePayStatus,
} from '../controllers/paymentController.js';

const router = express.Router();

// ── Google Pay India Direct Routes ──
router.post('/google-pay/create-order', createGooglePayOrder);
router.post('/google-pay/verify', verifyGooglePayPayment);
router.get('/google-pay/status/:orderId', getGooglePayStatus);

export default router;

