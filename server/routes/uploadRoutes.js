import express from 'express';
import multer from 'multer';
import path from 'path';
import { supabase } from '../config/supabase.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// @desc    Upload single or multiple images to Supabase Storage
// @route   POST /api/uploads
// @access  Private/Admin
router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload buffer directly to Supabase Storage bucket 'products'
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase Storage Upload Error:', error);
        // Fallback: If bucket does not exist or upload errors, provide encoded data URI in dev
        if (process.env.NODE_ENV !== 'production') {
          const base64 = file.buffer.toString('base64');
          uploadedUrls.push(`data:${file.mimetype};base64,${base64}`);
          continue;
        }
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
