import express from 'express';
import multer from 'multer';
import { getAdminStats } from '../controllers/adminController.js';
import {
  exportProductsExcel,
  previewProductsImport,
  commitProductsImport,
  getImportJobStatus,
  optimizeProductImages,
  getOptimizeJobStatus
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.route('/stats').get(protect, admin, getAdminStats);

// Section 10 Recommended API Design Endpoints:
// GET /api/admin/products/export
router.get('/products/export', exportProductsExcel);

// POST /api/admin/products/images/optimize & GET .../:jobId
router.post('/products/images/optimize', protect, admin, optimizeProductImages);
router.get('/products/images/optimize/:jobId', protect, admin, getOptimizeJobStatus);

// POST /api/admin/products/import/preview & POST /api/admin/products/import
router.post('/products/import/preview', protect, admin, upload.single('file'), previewProductsImport);
router.post('/products/import', protect, admin, upload.single('file'), commitProductsImport);
router.get('/products/import/:jobId', protect, admin, getImportJobStatus);

export default router;
