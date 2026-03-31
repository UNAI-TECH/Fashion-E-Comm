import express from 'express';
import {
  createReview,
  getProductReviews,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createReview);
router.route('/:productId').get(getProductReviews);
router.route('/:id').delete(protect, admin, deleteReview);

export default router;
