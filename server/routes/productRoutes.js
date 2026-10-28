import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsExcel,
  previewProductsImport,
  commitProductsImport,
  getImportJobStatus,
  optimizeProductImages,
  getOptimizeJobStatus
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer memory storage for Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Excel Export (available on /api/products/export and /api/admin/products/export)
router.get('/export', exportProductsExcel);

// WebP Image Optimization
router.post('/images/optimize', protect, admin, optimizeProductImages);
router.get('/images/optimize/:jobId', protect, admin, getOptimizeJobStatus);

// Bulk Excel Import
router.post('/import/preview', protect, admin, upload.single('file'), previewProductsImport);
router.post('/import', protect, admin, upload.single('file'), commitProductsImport);
router.get('/import/:jobId', protect, admin, getImportJobStatus);

// Product CRUD
router.route('/').get(getProducts).post(protect, admin, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
