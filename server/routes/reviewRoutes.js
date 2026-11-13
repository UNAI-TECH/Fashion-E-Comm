import express from 'express';
import multer from 'multer';
import {
  createReview,
  getProductReviews,
  deleteReview,
  uploadReviewImages,
} from '../controllers/reviewController.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Optional auth helper: attaches user if token is valid, doesn't block guests
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        req.user = data.user;
      }
    } catch {}
  }
  next();
};

router.route('/')
  .post(optionalAuth, createReview);

router.route('/upload')
  .post(upload.array('images', 4), uploadReviewImages);

router.route('/:productId')
  .get(getProductReviews);

router.route('/:id')
  .delete(deleteReview);

export default router;
