import ExcelJS from 'exceljs';
import { getAllProducts } from './productDataService.js';

/**
 * Generate complete Excel workbook of all products
 */
export async function generateProductsExcelWorkbook() {
  const products = await getAllProducts();
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Aanya Fashion E-Commerce Platform';
  workbook.lastModifiedBy = 'Aanya Fashion Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: Products
  // ═══════════════════════════════════════════════════════════════════════════
  const worksheet = workbook.addWorksheet('Products', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Define Columns
  worksheet.columns = [
    { header: 'id', key: 'id', width: 38 },
    { header: 'name', key: 'name', width: 34 },
    { header: 'description', key: 'description', width: 45 },
    { header: 'price', key: 'price', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'compare_at_price', key: 'compare_at_price', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'category', key: 'category', width: 18 },
    { header: 'category_id', key: 'category_id', width: 38 },
    { header: 'image_url', key: 'image_url', width: 35 },
    { header: 'images', key: 'images', width: 45 },
    { header: 'stock_quantity', key: 'stock_quantity', width: 16, style: { numFmt: '#,##0' } },
    { header: 'low_stock_threshold', key: 'low_stock_threshold', width: 20, style: { numFmt: '#,##0' } },
    { header: 'status', key: 'status', width: 14 },
    { header: 'rating', key: 'rating', width: 12, style: { numFmt: '0.00' } },
    { header: 'colors', key: 'colors', width: 25 },
    { header: 'created_at', key: 'created_at', width: 26 },
    { header: 'updated_at', key: 'updated_at', width: 26 },
    { header: 'specifications', key: 'specifications', width: 45 },
    { header: 'offer_enabled', key: 'offer_enabled', width: 16 },
    { header: 'offer_details', key: 'offer_details', width: 45 },
    { header: 'variant_group_id', key: 'variant_group_id', width: 38 },
    { header: 'variant_color', key: 'variant_color', width: 20 },
    { header: 'material_type', key: 'material_type', width: 24 }
  ];

  // Header Styling (Luxury Deep Green with Gold accents)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A2F' } // Deep forest green
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: false
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF335544' } },
      bottom: { style: 'medium', color: { argb: 'FFD4AF37' } }, // Gold accent border
      left: { style: 'thin', color: { argb: 'FF335544' } },
      right: { style: 'thin', color: { argb: 'FF335544' } }
    };
  });

  // Add Product Rows
  products.forEach((prod, idx) => {
    // Format complex columns reversibly
    const imagesStr = Array.isArray(prod.images) ? JSON.stringify(prod.images) : (prod.images || '[]');
    const colorsStr = Array.isArray(prod.colors) ? JSON.stringify(prod.colors) : (prod.colors || '[]');
    const specsStr = typeof prod.specifications === 'object' && prod.specifications !== null
      ? JSON.stringify(prod.specifications)
      : (prod.specifications || '{}');
    const offerStr = typeof prod.offer_details === 'object' && prod.offer_details !== null
      ? JSON.stringify(prod.offer_details)
      : (prod.offer_details || '{}');

    const row = worksheet.addRow({
      id: prod.id || '',
      name: prod.name || '',
      description: prod.description || '',
      price: Number(prod.price) || 0,
      compare_at_price: prod.compare_at_price != null ? Number(prod.compare_at_price) : null,
      category: prod.category || 'Sarees',
      category_id: prod.category_id || '',
      image_url: prod.image_url || '',
      images: imagesStr,
      stock_quantity: prod.stock_quantity != null ? Number(prod.stock_quantity) : 25,
      low_stock_threshold: prod.low_stock_threshold != null ? Number(prod.low_stock_threshold) : 5,
      status: prod.status || 'Published',
      rating: prod.rating != null ? Number(prod.rating) : 4.8,
      colors: colorsStr,
      created_at: prod.created_at || new Date().toISOString(),
      updated_at: prod.updated_at || new Date().toISOString(),
      specifications: specsStr,
      offer_enabled: prod.offer_enabled ? 'TRUE' : 'FALSE',
      offer_details: offerStr,
      variant_group_id: prod.variant_group_id || '',
      variant_color: prod.variant_color || '',
      material_type: prod.material_type || ''
    });

    row.height = 22;

    // Zebra striping
    const isEven = idx % 2 === 0;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: [4, 5, 10, 11, 13].includes(colNumber) ? 'right' : 'left'
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FBF9' }
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  // Enable AutoFilter on row 1
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2: Export Metadata
  // ═══════════════════════════════════════════════════════════════════════════
  const metaSheet = workbook.addWorksheet('Export Metadata');
  metaSheet.columns = [
    { header: 'Property', key: 'property', width: 28 },
    { header: 'Value', key: 'value', width: 60 }
  ];

  const metaHeader = metaSheet.getRow(1);
  metaHeader.height = 26;
  metaHeader.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A2F' } };
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const metadataEntries = [
    ['Export Timestamp', new Date().toISOString()],
    ['Schema Version', '1.0.0'],
    ['Total Products Exported', products.length],
    ['Target Database Table', 'public.products'],
    ['Storage Bucket', 'products (Supabase Storage)'],
    ['Image Format Optimization', 'Optimized WebP (quality 82, transparency preserved)'],
    ['Supported Status Values', 'Published, Draft, Archived'],
    ['Array & JSON Serialization', 'Standard reversible JSON string format'],
    ['Platform', 'Aanya Fashion E-Commerce (React + Vite + Supabase)']
  ];

  metadataEntries.forEach(([prop, val]) => {
    const row = metaSheet.addRow({ property: prop, value: val });
    row.height = 20;
    row.getCell(1).font = { bold: true };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 3: Import Instructions
  // ═══════════════════════════════════════════════════════════════════════════
  const guideSheet = workbook.addWorksheet('Import Instructions');
  guideSheet.columns = [
    { header: 'Section', key: 'section', width: 22 },
    { header: 'Instruction / Guideline', key: 'guideline', width: 75 }
  ];

  const guideHeader = guideSheet.getRow(1);
  guideHeader.height = 26;
  guideHeader.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A2F' } };
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const instructions = [
    ['Updating Existing Products', 'To update an existing product, keep its "id" column unchanged. All other editable fields will be updated.'],
    ['Adding New Products', 'To add a new product, leave the "id" cell blank or omit it. The system will auto-generate a UUID and validate uniqueness.'],
    ['Product Names', 'The "name" field must be non-empty and globally unique. Changing a name to an existing product with a different ID causes a conflict.'],
    ['Price & Compare Price', 'Price must be a positive number. "compare_at_price" is optional (must be >= price for discount calculations).'],
    ['Categories', 'Standard categories: Sarees, Kurtis, Lehengas, Salwar Sets, Western, Maxi, Tradition.'],
    ['Status Values', 'Accepted values are "Published", "Draft", or "Archived". Defaults to "Published" if omitted.'],
    ['Stock & Thresholds', '"stock_quantity" defaults to 25. "low_stock_threshold" defaults to 5. Values must be non-negative integers.'],
    ['Image URLs', 'Must be valid paths starting with "/" (e.g. /saree_s1.webp) or full HTTPS URLs. WebP format is recommended for optimal egress bandwidth.'],
    ['Images Array', 'Provide a JSON array of URLs: ["/img1.webp", "/img2.webp"]. The first image will be used as primary if image_url is empty.'],
    ['Colors Array', 'Provide hex color codes or color names in a JSON array: ["#800000", "#D4AF37"].'],
    ['Specifications (JSON)', 'Key-value JSON object: {"fabric": "Pure Silk", "weave": "Banarasi", "wash_care": "Dry Clean Only"}.'],
    ['Offers (JSON)', 'offer_enabled must be TRUE or FALSE. offer_details JSON: {"discount_pct": 20, "badge": "Festive Offer", "code": "FESTIVE20"}.'],
    ['Preview Mode', 'Always use "Preview Import" before committing to view planned inserts, updates, and detect any potential errors or conflicts.']
  ];

  instructions.forEach(([sec, guide]) => {
    const row = guideSheet.addRow({ section: sec, guideline: guide });
    row.height = 22;
    row.getCell(1).font = { bold: true };
  });

  return workbook;
}

export default {
  generateProductsExcelWorkbook
};
