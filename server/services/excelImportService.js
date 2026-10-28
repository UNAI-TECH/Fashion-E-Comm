import ExcelJS from 'exceljs';
import crypto from 'crypto';
import { getAllProducts, bulkUpsertProducts } from './productDataService.js';

// In-memory import jobs tracking
const importJobsMap = new Map();

/**
 * Check if buffer has ZIP/XLSX magic bytes (50 4B 03 04)
 */
export function isZipXlsxBuffer(buf) {
  if (!buf || buf.length < 4) return false;
  return buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04;
}

/**
 * Safely parse JSON or return fallback
 */
function safeJsonParse(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed);
    } catch {
      // If array fallback and comma-separated string
      if (Array.isArray(fallback)) {
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
      return fallback;
    }
  }
  return fallback;
}

/**
 * Validate UUID format
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Process Excel file buffer for Preview or Import
 */
export async function processExcelImport(fileBuffer, { dryRun = true, user = null } = {}) {
  const jobId = `job_imp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const startTime = new Date().toISOString();

  const report = {
    jobId,
    type: 'excel_import',
    dryRun,
    status: 'processing',
    startTime,
    endTime: null,
    totalRows: 0,
    validRows: 0,
    plannedInserts: 0,
    plannedUpdates: 0,
    skippedRows: 0,
    errorsCount: 0,
    conflictCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    errors: [],
    conflicts: [],
    previewRows: [],
    summary: ''
  };

  importJobsMap.set(jobId, report);

  try {
    // 1. File verification
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('Invalid file upload: empty or corrupt buffer.');
    }

    if (fileBuffer.length > 20 * 1024 * 1024) {
      throw new Error('File exceeds maximum upload limit of 20MB.');
    }

    if (!isZipXlsxBuffer(fileBuffer)) {
      throw new Error('Invalid file format: File is not a valid Excel (.xlsx) workbook.');
    }

    // 2. Load Workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    // 3. Find Products Sheet
    const sheet = workbook.getWorksheet('Products') || workbook.worksheets[0];
    if (!sheet) {
      throw new Error('Workbook contains no sheets or missing "Products" sheet.');
    }

    // 4. Map Header row
    const headerRow = sheet.getRow(1);
    const colIndexToKey = {};
    const keyToColIndex = {};

    headerRow.eachCell((cell, colNumber) => {
      const headerText = String(cell.value || '').trim().toLowerCase();
      if (headerText) {
        colIndexToKey[colNumber] = headerText;
        keyToColIndex[headerText] = colNumber;
      }
    });

    const requiredHeaders = ['name', 'price', 'category'];
    for (const reqH of requiredHeaders) {
      if (!keyToColIndex[reqH]) {
        throw new Error(`Missing required column header in Products sheet: "${reqH}"`);
      }
    }

    // 5. Load current database records for cross-validation
    const existingProducts = await getAllProducts();
    const existingIdMap = new Map();
    const existingNameMap = new Map();

    existingProducts.forEach(p => {
      existingIdMap.set(p.id, p);
      existingNameMap.set(p.name.toLowerCase().trim(), p);
    });

    // Tracking within the current uploaded workbook
    const seenWorkbookIds = new Set();
    const seenWorkbookNames = new Set();
    const validRowsToProcess = [];

    // 6. Iterate and validate each data row
    const totalRowCount = sheet.rowCount;
    report.totalRows = Math.max(0, totalRowCount - 1);

    for (let rowNumber = 2; rowNumber <= totalRowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);

      // Check if completely empty row
      let hasData = false;
      const rowData = {};

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const key = colIndexToKey[colNumber];
        if (key) {
          hasData = true;
          // Clean cell value
          let val = cell.value;
          // If RichText or formula result
          if (val && typeof val === 'object') {
            if (val.result !== undefined) val = val.result;
            else if (val.text !== undefined) val = val.text;
          }
          rowData[key] = val;
        }
      });

      if (!hasData) continue;

      const rowErrors = [];

      // A. Validate Name
      const rawName = rowData.name !== undefined ? String(rowData.name).trim() : '';
      if (!rawName) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Product name cannot be empty.' });
      }

      const lowerName = rawName.toLowerCase();
      if (seenWorkbookNames.has(lowerName)) {
        rowErrors.push({
          row: rowNumber,
          field: 'name',
          message: `Duplicate product name within workbook: "${rawName}"`
        });
      }
      seenWorkbookNames.add(lowerName);

      // B. Validate Price
      const rawPrice = rowData.price;
      const priceNum = Number(rawPrice);
      if (rawPrice === undefined || isNaN(priceNum) || priceNum < 0) {
        rowErrors.push({ row: rowNumber, field: 'price', message: 'Valid positive price is required.' });
      }

      // C. Validate Category
      const rawCategory = rowData.category !== undefined ? String(rowData.category).trim() : 'Sarees';
      if (!rawCategory) {
        rowErrors.push({ row: rowNumber, field: 'category', message: 'Category is required.' });
      }

      // D. Validate ID if supplied
      const rawId = rowData.id !== undefined && rowData.id !== null ? String(rowData.id).trim() : '';
      if (rawId) {
        if (!isValidUuid(rawId)) {
          rowErrors.push({ row: rowNumber, field: 'id', message: `Invalid UUID format: "${rawId}"` });
        } else if (seenWorkbookIds.has(rawId)) {
          rowErrors.push({ row: rowNumber, field: 'id', message: `Duplicate UUID within workbook: "${rawId}"` });
        }
        seenWorkbookIds.add(rawId);
      }

      // E. Check Conflicts with existing database records
      const existingById = rawId ? existingIdMap.get(rawId) : null;
      const existingByName = existingNameMap.get(lowerName);

      let action = 'insert';
      if (existingById) {
        action = 'update';
        // If name was changed to something that belongs to a THIRD product
        if (existingByName && existingByName.id !== rawId) {
          report.conflicts.push({
            row: rowNumber,
            name: rawName,
            existingId: existingByName.id,
            incomingId: rawId,
            message: `Name "${rawName}" is already used by product ID ${existingByName.id}`
          });
          rowErrors.push({
            row: rowNumber,
            field: 'name',
            message: `Conflict: Name "${rawName}" already belongs to another existing product ID ${existingByName.id}`
          });
        }
      } else if (existingByName) {
        if (!rawId) {
          // If no ID provided, update existing record with matching unique name
          action = 'update';
        } else {
          // ID was provided, but name belongs to another existing product with different ID
          report.conflicts.push({
            row: rowNumber,
            name: rawName,
            existingId: existingByName.id,
            incomingId: rawId,
            message: `Conflict: Incoming new ID ${rawId} has name "${rawName}" which already exists under ID ${existingByName.id}`
          });
          rowErrors.push({
            row: rowNumber,
            field: 'name',
            message: `Conflict: Name "${rawName}" already exists under ID ${existingByName.id}`
          });
        }
      }

      // F. Status validation
      const rawStatus = rowData.status !== undefined ? String(rowData.status).trim() : 'Published';
      const validStatuses = ['Published', 'Draft', 'Archived'];
      const status = validStatuses.includes(rawStatus) ? rawStatus : 'Published';

      // G. Parse Complex Types (JSON / Arrays)
      const images = safeJsonParse(rowData.images, []);
      const colors = safeJsonParse(rowData.colors, []);
      const specifications = safeJsonParse(rowData.specifications, {});
      const offer_details = safeJsonParse(rowData.offer_details, {});

      // H. Parse Booleans & Numerics
      const rawOfferEnabled = rowData.offer_enabled;
      const offer_enabled = String(rawOfferEnabled).toUpperCase() === 'TRUE' || rawOfferEnabled === true || rawOfferEnabled === 1;

      const compare_at_price = rowData.compare_at_price != null && !isNaN(Number(rowData.compare_at_price))
        ? Number(rowData.compare_at_price)
        : null;

      const stock_quantity = rowData.stock_quantity != null && !isNaN(Number(rowData.stock_quantity))
        ? Math.max(0, parseInt(rowData.stock_quantity, 10))
        : 25;

      const low_stock_threshold = rowData.low_stock_threshold != null && !isNaN(Number(rowData.low_stock_threshold))
        ? Math.max(0, parseInt(rowData.low_stock_threshold, 10))
        : 5;

      const rating = rowData.rating != null && !isNaN(Number(rowData.rating))
        ? Math.min(5, Math.max(0, parseFloat(rowData.rating)))
        : 4.8;

      if (rowErrors.length > 0) {
        report.errors.push(...rowErrors);
        continue;
      }

      // Form normalized product object
      const targetId = rawId || (existingByName ? existingByName.id : crypto.randomUUID());
      const normalizedProduct = {
        id: targetId,
        name: rawName,
        description: rowData.description !== undefined ? String(rowData.description) : '',
        price: priceNum,
        compare_at_price,
        category: rawCategory,
        category_id: rowData.category_id ? String(rowData.category_id).trim() : null,
        image_url: rowData.image_url ? String(rowData.image_url).trim() : (images[0] || ''),
        images: Array.isArray(images) ? images : [],
        stock_quantity,
        low_stock_threshold,
        status,
        rating,
        colors: Array.isArray(colors) ? colors : [],
        specifications,
        offer_enabled,
        offer_details,
        variant_group_id: rowData.variant_group_id ? String(rowData.variant_group_id).trim() : null,
        variant_color: rowData.variant_color ? String(rowData.variant_color).trim() : '',
        material_type: rowData.material_type ? String(rowData.material_type).trim() : '',
        updated_at: new Date().toISOString()
      };

      if (action === 'insert') report.plannedInserts++;
      else report.plannedUpdates++;

      validRowsToProcess.push(normalizedProduct);

      if (report.previewRows.length < 10) {
        report.previewRows.push({
          row: rowNumber,
          action,
          id: targetId,
          name: rawName,
          category: rawCategory,
          price: priceNum,
          stock: stock_quantity,
          status
        });
      }
    }

    report.validRows = validRowsToProcess.length;
    report.errorsCount = report.errors.length;
    report.conflictCount = report.conflicts.length;

    // 7. Commit changes if not dry run and no fatal validation errors
    if (!dryRun) {
      if (report.errorsCount === 0 && validRowsToProcess.length > 0) {
        const upsertResult = await bulkUpsertProducts(validRowsToProcess);
        report.insertedCount = upsertResult.insertedCount;
        report.updatedCount = upsertResult.updatedCount;
        report.skippedRows = upsertResult.skippedCount;
        report.status = 'completed';
        report.summary = `Successfully imported ${validRowsToProcess.length} products (${report.insertedCount} inserted, ${report.updatedCount} updated).`;
      } else {
        report.status = 'failed';
        report.summary = `Import aborted due to ${report.errorsCount} validation errors. Fix errors and retry.`;
      }
    } else {
      report.status = report.errorsCount === 0 ? 'preview_ready' : 'preview_with_errors';
      report.summary = `Validation complete: ${report.validRows} valid rows (${report.plannedInserts} new, ${report.plannedUpdates} updates), ${report.errorsCount} errors, ${report.conflictCount} conflicts.`;
    }

    report.endTime = new Date().toISOString();
  } catch (err) {
    report.status = 'failed';
    report.globalError = err.message;
    report.summary = `Import failed: ${err.message}`;
    report.endTime = new Date().toISOString();
  }

  return report;
}

/**
 * Get import job status by ID
 */
export function getImportJob(jobId) {
  return importJobsMap.get(jobId) || null;
}

export default {
  processExcelImport,
  getImportJob,
  isZipXlsxBuffer
};
