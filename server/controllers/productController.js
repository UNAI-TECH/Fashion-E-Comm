import { supabase } from '../config/supabase.js';
import {
  getProducts as fetchFilteredProducts,
  getProductById as fetchProductById,
  getAllProducts,
  bulkUpsertProducts
} from '../services/productDataService.js';
import {
  runImageOptimization,
  getOptimizationJob
} from '../services/imageConversionService.js';
import {
  generateProductsExcelWorkbook
} from '../services/excelExportService.js';
import {
  processExcelImport,
  getImportJob
} from '../services/excelImportService.js';

// @desc    Fetch all products with pagination, search, and filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 12;
    const pageNumber = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword ? req.query.keyword.trim() : '';
    const category = req.query.category || '';
    const sort = req.query.sort || 'newest';
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const inStock = req.query.inStock === 'true';
    const status = req.user?.role === 'admin' ? (req.query.status || null) : 'Published';

    const result = await fetchFilteredProducts({
      pageNumber,
      pageSize,
      keyword,
      category,
      sort,
      minPrice,
      maxPrice,
      inStock,
      status
    });

    res.json(result);
  } catch (error) {
    console.error('[productController:getProducts error]:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await fetchProductById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product (Admin)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      images = [],
      image_url,
      category,
      stock = 25,
      stock_quantity,
      discount = 0,
      compare_at_price,
      colors = [],
      specifications = {},
      offer_enabled = false,
      offer_details = {},
      material_type,
      variant_color
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and category are required.'
      });
    }

    const calculatedStock = stock_quantity !== undefined ? Number(stock_quantity) : Number(stock);
    const calculatedComparePrice = compare_at_price !== undefined
      ? Number(compare_at_price)
      : (discount > 0 ? Math.round(Number(price) / (1 - Number(discount) / 100)) : null);

    const imgList = Array.isArray(images) ? images : (images ? [images] : []);
    const primaryImg = image_url || imgList[0] || '';

    const newProduct = {
      name: name.trim(),
      price: Number(price),
      compare_at_price: calculatedComparePrice,
      description: description || '',
      image_url: primaryImg,
      images: imgList.length > 0 ? imgList : [primaryImg],
      category: category.trim(),
      stock_quantity: calculatedStock,
      status: 'Published',
      colors: Array.isArray(colors) ? colors : [],
      specifications: typeof specifications === 'object' ? specifications : {},
      offer_enabled: !!offer_enabled,
      offer_details: typeof offer_details === 'object' ? offer_details : {},
      material_type: material_type || '',
      variant_color: variant_color || ''
    };

    const result = await bulkUpsertProducts([newProduct]);

    if (!result.success || result.errorsCount > 0) {
      return res.status(400).json({ success: false, message: result.errors[0]?.error || 'Failed to create product' });
    }

    res.status(201).json(result.inserted[0] || result.updated[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, id };

    const result = await bulkUpsertProducts([updates]);

    if (!result.success || result.errorsCount > 0) {
      return res.status(400).json({ success: false, message: result.errors[0]?.error || 'Failed to update product' });
    }

    res.json(result.updated[0] || result.inserted[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Attempt Supabase delete
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {}

    // Also remove from local store
    const all = await getAllProducts();
    const filtered = all.filter(p => p.id !== id);
    const { bulkUpsertProducts: _, ...dataService } = await import('../services/productDataService.js');
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dir = path.dirname(fileURLToPath(import.meta.url));
    fs.writeFileSync(path.join(__dir, '../data/products_store.json'), JSON.stringify(filtered, null, 2));

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger WebP Image Optimization (Dry-Run or Real Conversion)
// @route   POST /api/admin/products/images/optimize
// @access  Private/Admin
export const optimizeProductImages = async (req, res) => {
  try {
    const dryRun = req.body?.dryRun !== false && req.query?.dryRun !== 'false';
    const quality = Number(req.body?.quality || req.query?.quality) || 82;

    const result = await runImageOptimization({ dryRun, quality });

    res.json({
      success: result.status === 'completed',
      data: result
    });
  } catch (error) {
    console.error('[optimizeProductImages error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get WebP Image Optimization Job Status
// @route   GET /api/admin/products/images/optimize/:jobId
// @access  Private/Admin
export const getOptimizeJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getOptimizationJob(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Optimization job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export all products to downloadable Excel workbook (.xlsx)
// @route   GET /api/admin/products/export (and GET /api/products/export)
// @access  Public or Admin
export const exportProductsExcel = async (req, res) => {
  try {
    const workbook = await generateProductsExcelWorkbook();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `products_export_${dateStr}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[exportProductsExcel error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Preview Excel bulk import without committing changes
// @route   POST /api/admin/products/import/preview
// @access  Private/Admin
export const previewProductsImport = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file provided. Upload a .xlsx file.'
      });
    }

    const report = await processExcelImport(req.file.buffer, {
      dryRun: true,
      user: req.user
    });

    res.json({
      success: report.errorsCount === 0,
      data: report
    });
  } catch (error) {
    console.error('[previewProductsImport error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Commit Excel bulk import to database
// @route   POST /api/admin/products/import
// @access  Private/Admin
export const commitProductsImport = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file provided. Upload a .xlsx file.'
      });
    }

    const report = await processExcelImport(req.file.buffer, {
      dryRun: false,
      user: req.user
    });

    if (report.errorsCount > 0) {
      return res.status(422).json({
        success: false,
        message: report.summary,
        data: report
      });
    }

    res.json({
      success: true,
      message: report.summary,
      data: report
    });
  } catch (error) {
    console.error('[commitProductsImport error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bulk import job status
// @route   GET /api/admin/products/import/:jobId
// @access  Private/Admin
export const getImportJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getImportJob(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Import job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
