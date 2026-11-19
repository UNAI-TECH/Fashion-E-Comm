import ExcelJS from 'exceljs';
import { getAllProducts } from './productDataService.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sanitize a string cell value against formula injection */
function sanitize(val) {
  if (typeof val !== 'string') return val;
  if (val.length > 0 && ['=', '+', '-', '@'].includes(val[0])) {
    return "'" + val;
  }
  return val;
}

/** Get IST date/time strings */
function getISTStrings() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}`;
  const hours = ist.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const timeStr = `${pad(h12)}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())} ${ampm} IST`;
  return { dateStr, timeStr, istDate: ist };
}

/** Determine stock status for a product */
function getStockStatus(prod) {
  const qty = prod.stock_quantity;
  const threshold = prod.low_stock_threshold ?? 5;
  if (qty == null || qty === 0) return 'Out of Stock';
  if (qty > 0 && qty <= threshold) return 'Low Stock';
  return 'In Stock';
}

/** SKU: use sku field or fallback to first 8 chars of id */
function getSKU(prod) {
  return prod.sku || (prod.id ? String(prod.id).slice(0, 8).toUpperCase() : '');
}

/** Common header style */
const DARK_GREEN = 'FF1E3A2F';
const WHITE = 'FFFFFFFF';
const GOLD = 'FFD4AF37';

function applyHeaderStyle(cell, extraOpts = {}) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_GREEN } };
  cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: WHITE }, ...extraOpts.font };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, ...extraOpts.alignment };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF335544' } },
    bottom: { style: 'medium', color: { argb: GOLD } },
    left: { style: 'thin', color: { argb: 'FF335544' } },
    right: { style: 'thin', color: { argb: 'FF335544' } }
  };
}

function applyDataRowStyle(row, idx, numericCols = []) {
  const isEven = idx % 2 === 0;
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: numericCols.includes(colNumber) ? 'right' : 'left'
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' }
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };
  });
}

function styleHeaderRow(ws, height = 28) {
  const row = ws.getRow(1);
  row.height = height;
  row.eachCell({ includeEmpty: true }, cell => applyHeaderStyle(cell));
  return row;
}

// ─── Main Export Function ───────────────────────────────────────────────────

/**
 * Generate complete Excel workbook of all products — Inventory focused
 */
export async function generateProductsExcelWorkbook() {
  const products = await getAllProducts();
  const { dateStr, timeStr } = getISTStrings();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Aanya Fashions Admin System';
  workbook.lastModifiedBy = 'Aanya Fashions Admin System';
  workbook.company = 'Aanya Fashion E-Commerce';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ─── Computed inventory stats ──────────────────────────────────────────────
  const lowStockThresholdDefault = 5;

  const lowStockProducts = products.filter(p => {
    const qty = p.stock_quantity;
    const thr = p.low_stock_threshold ?? lowStockThresholdDefault;
    return qty != null && qty > 0 && qty <= thr;
  });

  const outOfStockProducts = products.filter(p => {
    return (p.stock_quantity == null || p.stock_quantity === 0) ||
      p.status === 'Archived';
  });

  const totalStock = products.reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);

  const totalAvailable = products.filter(p => p.status !== 'Out of Stock')
    .reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);

  const totalInventoryValue = products.reduce((s, p) => {
    return s + ((Number(p.stock_quantity) || 0) * (Number(p.price) || 0));
  }, 0);

  // Category breakdown
  const categoryMap = {};
  for (const p of products) {
    const cat = p.category || 'Uncategorized';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalStock: 0, totalValue: 0 };
    categoryMap[cat].count++;
    categoryMap[cat].totalStock += Number(p.stock_quantity) || 0;
    categoryMap[cat].totalValue += (Number(p.stock_quantity) || 0) * (Number(p.price) || 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: Inventory Summary
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryWs = workbook.addWorksheet('Inventory Summary');

  summaryWs.getColumn(1).width = 36;
  summaryWs.getColumn(2).width = 36;
  summaryWs.getColumn(3).width = 20;
  summaryWs.getColumn(4).width = 20;

  // Title block
  const titleRows = [
    ['Company', 'AANYA FASHIONS'],
    ['Report', 'Inventory Stock Report'],
    ['Export Date', dateStr],
    ['Export Time', timeStr],
    ['Data Source', 'Production Database (Supabase)']
  ];

  titleRows.forEach(([label, value]) => {
    const r = summaryWs.addRow([label, value]);
    r.height = 24;
    const labelCell = r.getCell(1);
    const valueCell = r.getCell(2);
    labelCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: WHITE } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_GREEN } };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
    labelCell.border = { bottom: { style: 'thin', color: { argb: GOLD } } };
    valueCell.font = { name: 'Calibri', size: 11 };
    valueCell.alignment = { vertical: 'middle', horizontal: 'left' };
    valueCell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
  });

  // Blank spacer
  summaryWs.addRow([]);

  // KPIs section header
  const kpiHeaderRow = summaryWs.addRow(['KPI Metric', 'Value']);
  kpiHeaderRow.height = 26;
  kpiHeaderRow.eachCell(cell => applyHeaderStyle(cell));

  const kpis = [
    ['Total Products', products.length],
    ['Total SKUs', products.length],
    ['Total Stock Quantity', totalStock],
    ['Total Available Stock', totalAvailable],
    ['Low Stock Count', lowStockProducts.length],
    ['Out of Stock Count', outOfStockProducts.length],
    ['Total Inventory Value (INR)', totalInventoryValue]
  ];

  kpis.forEach(([label, value], idx) => {
    const r = summaryWs.addRow([label, value]);
    r.height = 22;
    const isEven = idx % 2 === 0;
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } };
    r.getCell(2).font = { name: 'Calibri', size: 10 };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } };
    r.getCell(2).alignment = { horizontal: 'right' };
    if (label.includes('Value')) {
      r.getCell(2).numFmt = '"₹"#,##0.00';
    }
  });

  // Blank spacer
  summaryWs.addRow([]);

  // Category breakdown header
  const catHeaderRow = summaryWs.addRow(['Category', 'Product Count', 'Total Stock', 'Total Value (INR)']);
  catHeaderRow.height = 26;
  catHeaderRow.eachCell(cell => applyHeaderStyle(cell));

  Object.entries(categoryMap).forEach(([cat, data], idx) => {
    const r = summaryWs.addRow([sanitize(cat), data.count, data.totalStock, data.totalValue]);
    r.height = 22;
    const isEven = idx % 2 === 0;
    [1, 2, 3, 4].forEach(col => {
      r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } };
      r.getCell(col).font = { name: 'Calibri', size: 10 };
      r.getCell(col).border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(3).alignment = { horizontal: 'right' };
    r.getCell(4).alignment = { horizontal: 'right' };
    r.getCell(4).numFmt = '"₹"#,##0.00';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2: Complete Inventory
  // ═══════════════════════════════════════════════════════════════════════════
  const invWs = workbook.addWorksheet('Complete Inventory', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  invWs.columns = [
    { header: 'S.No', key: 'sno', width: 7 },
    { header: 'Product ID', key: 'id', width: 38 },
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'Product Name', key: 'name', width: 34 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Stock Quantity', key: 'stock_quantity', width: 16 },
    { header: 'Low Stock Threshold', key: 'low_stock_threshold', width: 20 },
    { header: 'Stock Status', key: 'stock_status', width: 16 },
    { header: 'Selling Price (INR)', key: 'price', width: 20 },
    { header: 'MRP / Compare At (INR)', key: 'compare_at_price', width: 24 },
    { header: 'Discount %', key: 'discount_pct', width: 13 },
    { header: 'Inventory Value (INR)', key: 'inv_value', width: 22 },
    { header: 'Image URL', key: 'image_url', width: 36 },
    { header: 'Last Updated', key: 'updated_at', width: 26 }
  ];

  styleHeaderRow(invWs);

  invWs.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: invWs.columns.length }
  };

  // Numeric column numbers for right-align
  const invNumericCols = [1, 7, 8, 10, 11, 12, 13];

  if (products.length === 0) {
    const r = invWs.addRow(['No data available']);
    r.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
  } else {
    products.forEach((prod, idx) => {
      const qty = prod.stock_quantity != null ? Number(prod.stock_quantity) : null;
      const price = Number(prod.price) || 0;
      const compareAt = prod.compare_at_price != null ? Number(prod.compare_at_price) : null;
      const discountPct = (compareAt && compareAt > price)
        ? Math.round(((compareAt - price) / compareAt) * 100)
        : 0;
      const invValue = (qty || 0) * price;
      const stockStatus = getStockStatus(prod);

      const row = invWs.addRow({
        sno: idx + 1,
        id: sanitize(prod.id || ''),
        sku: sanitize(getSKU(prod)),
        name: sanitize(prod.name || ''),
        category: sanitize(prod.category || ''),
        status: sanitize(prod.status || 'Published'),
        stock_quantity: qty,
        low_stock_threshold: prod.low_stock_threshold ?? 5,
        stock_status: stockStatus,
        price: price,
        compare_at_price: compareAt,
        discount_pct: discountPct,
        inv_value: invValue,
        image_url: sanitize(prod.image_url || ''),
        updated_at: sanitize(prod.updated_at || '')
      });

      applyDataRowStyle(row, idx, invNumericCols);

      // Apply conditional fill for stock status
      if (stockStatus === 'Out of Stock') {
        row.eachCell({ includeEmpty: true }, cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        });
      } else if (stockStatus === 'Low Stock') {
        row.eachCell({ includeEmpty: true }, cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        });
      }

      // Currency formats
      row.getCell('price').numFmt = '"₹"#,##0.00';
      if (compareAt != null) row.getCell('compare_at_price').numFmt = '"₹"#,##0.00';
      row.getCell('inv_value').numFmt = '"₹"#,##0.00';
      row.getCell('stock_quantity').numFmt = '#,##0';
      row.getCell('low_stock_threshold').numFmt = '#,##0';
      row.getCell('discount_pct').numFmt = '0"%"';
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 3: Low Stock Report
  // ═══════════════════════════════════════════════════════════════════════════
  const lowWs = workbook.addWorksheet('Low Stock Report', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  lowWs.columns = [
    { header: 'S.No', key: 'sno', width: 7 },
    { header: 'Product ID', key: 'id', width: 38 },
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'Product Name', key: 'name', width: 34 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Available Qty', key: 'available_qty', width: 15 },
    { header: 'Low Stock Threshold', key: 'threshold', width: 20 },
    { header: 'Reorder Recommendation', key: 'reorder', width: 24 },
    { header: 'Selling Price (INR)', key: 'price', width: 20 },
    { header: 'Inventory Value (INR)', key: 'inv_value', width: 22 },
    { header: 'Last Updated', key: 'updated_at', width: 26 }
  ];

  styleHeaderRow(lowWs);

  const lowNumericCols = [1, 6, 7, 8, 9, 10];

  if (lowStockProducts.length === 0) {
    const r = lowWs.addRow(['No low stock products found']);
    r.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
  } else {
    lowStockProducts.forEach((prod, idx) => {
      const qty = Number(prod.stock_quantity) || 0;
      const thr = prod.low_stock_threshold ?? lowStockThresholdDefault;
      const reorder = Math.max(thr * 3, 20);
      const price = Number(prod.price) || 0;

      const row = lowWs.addRow({
        sno: idx + 1,
        id: sanitize(prod.id || ''),
        sku: sanitize(getSKU(prod)),
        name: sanitize(prod.name || ''),
        category: sanitize(prod.category || ''),
        available_qty: qty,
        threshold: thr,
        reorder: reorder,
        price: price,
        inv_value: qty * price,
        updated_at: sanitize(prod.updated_at || '')
      });

      applyDataRowStyle(row, idx, lowNumericCols);
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFEF3C7' : 'FFFDE68A' } };
      });
      row.getCell('price').numFmt = '"₹"#,##0.00';
      row.getCell('inv_value').numFmt = '"₹"#,##0.00';
      row.getCell('available_qty').numFmt = '#,##0';
      row.getCell('threshold').numFmt = '#,##0';
      row.getCell('reorder').numFmt = '#,##0';
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 4: Out of Stock Report
  // ═══════════════════════════════════════════════════════════════════════════
  const oosWs = workbook.addWorksheet('Out of Stock Report', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  oosWs.columns = [
    { header: 'S.No', key: 'sno', width: 7 },
    { header: 'Product ID', key: 'id', width: 38 },
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'Product Name', key: 'name', width: 34 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Last Updated', key: 'updated_at', width: 26 },
    { header: 'Selling Price (INR)', key: 'price', width: 20 }
  ];

  styleHeaderRow(oosWs);

  const oosNumericCols = [1, 8];

  if (outOfStockProducts.length === 0) {
    const r = oosWs.addRow(['No out of stock products found']);
    r.getCell(1).font = { italic: true, color: { argb: 'FF888888' } };
  } else {
    outOfStockProducts.forEach((prod, idx) => {
      const row = oosWs.addRow({
        sno: idx + 1,
        id: sanitize(prod.id || ''),
        sku: sanitize(getSKU(prod)),
        name: sanitize(prod.name || ''),
        category: sanitize(prod.category || ''),
        status: sanitize(prod.status || ''),
        updated_at: sanitize(prod.updated_at || ''),
        price: Number(prod.price) || 0
      });

      applyDataRowStyle(row, idx, oosNumericCols);
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFEE2E2' : 'FFFECACA' } };
      });
      row.getCell('price').numFmt = '"₹"#,##0.00';
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 5: Export Info
  // ═══════════════════════════════════════════════════════════════════════════
  const infoWs = workbook.addWorksheet('Export Info');
  infoWs.columns = [
    { header: 'Property', key: 'property', width: 32 },
    { header: 'Value', key: 'value', width: 65 }
  ];

  const infoHeaderRow = infoWs.getRow(1);
  infoHeaderRow.height = 26;
  infoHeaderRow.eachCell(cell => applyHeaderStyle(cell));

  const infoEntries = [
    ['Company', 'Aanya Fashions'],
    ['Platform', 'Aanya Fashion E-Commerce (React + Vite + Supabase)'],
    ['Export Timestamp (IST)', `${dateStr} ${timeStr}`],
    ['Schema Version', '2.0.0'],
    ['Total Products Exported', products.length],
    ['Low Stock Count', lowStockProducts.length],
    ['Out of Stock Count', outOfStockProducts.length],
    ['Target Database Table', 'public.products'],
    ['Storage Bucket', 'products (Supabase Storage)'],
    ['Image Format Optimization', 'Optimized WebP (quality 82, transparency preserved)'],
    ['Supported Status Values', 'Published, Draft, Archived'],
    ['Array & JSON Serialization', 'Standard reversible JSON string format'],
    ['Generated By', 'Aanya Fashions Admin System'],
    ['Sheets Included', 'Inventory Summary, Complete Inventory, Low Stock Report, Out of Stock Report, Export Info']
  ];

  infoEntries.forEach(([prop, val], idx) => {
    const row = infoWs.addRow({ property: prop, value: val });
    row.height = 22;
    const isEven = idx % 2 === 0;
    row.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } };
    row.getCell(2).font = { name: 'Calibri', size: 10 };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' } };
  });

  return workbook;
}

export default {
  generateProductsExcelWorkbook
};
