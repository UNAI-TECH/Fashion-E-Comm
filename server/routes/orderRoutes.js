import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  verifyPayment,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/payment/verify').post(protect, verifyPayment);

export default router;
