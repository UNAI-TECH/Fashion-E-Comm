import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '../data/products_store.json');

// Memory cache of products
let cachedProducts = null;
let lastSupabaseHealthCheck = 0;
let isSupabaseHealthy = false;
let lastEgressWarning = null;

/**
 * Load local products from disk
 */
function loadLocalStore() {
  if (cachedProducts) return cachedProducts;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      cachedProducts = JSON.parse(data);
      return cachedProducts;
    }
  } catch (err) {
    console.error('[productDataService] Error loading local store:', err.message);
  }
  return [];
}

/**
 * Save products to local disk store
 */
function saveLocalStore(products) {
  try {
    cachedProducts = products;
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[productDataService] Error saving local store:', err.message);
    return false;
  }
}

/**
 * Check Supabase availability with caching to avoid slamming restricted quota
 */
async function checkSupabaseAvailable() {
  const now = Date.now();
  if (now - lastSupabaseHealthCheck < 30000) {
    return isSupabaseHealthy;
  }
  lastSupabaseHealthCheck = now;
  try {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (error) {
      if (error.status === 402 || error.message?.includes('exceed_cached_egress_quota')) {
        lastEgressWarning = 'Supabase restricted: exceed_cached_egress_quota (Status 402)';
      }
      isSupabaseHealthy = false;
      return false;
    }
    isSupabaseHealthy = true;
    lastEgressWarning = null;
    return true;
  } catch (err) {
    isSupabaseHealthy = false;
    return false;
  }
}

/**
 * Get all products (unpaginated) for export or batch processing
 */
export async function getAllProducts() {
  const hasSupabase = await checkSupabaseAvailable();
  if (hasSupabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        saveLocalStore(data);
        return data;
      }
    } catch (e) {
      console.warn('[productDataService] Supabase query failed, using local store:', e.message);
    }
  }
  return loadLocalStore();
}

/**
 * Get paginated & filtered products for API
 */
export async function getProducts({
  pageNumber = 1,
  pageSize = 12,
  keyword = '',
  category = '',
  sort = 'newest',
  minPrice = null,
  maxPrice = null,
  inStock = false,
  status = null
}) {
  const hasSupabase = await checkSupabaseAvailable();
  if (hasSupabase) {
    try {
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('products').select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }
      if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`);
      }
      if (category && category !== 'All') {
        query = query.ilike('category', `%${category}%`);
      }
      if (minPrice !== null && !isNaN(minPrice)) query = query.gte('price', minPrice);
      if (maxPrice !== null && !isNaN(maxPrice)) query = query.lte('price', maxPrice);
      if (inStock) query = query.gt('stock_quantity', 0);

      if (sort === 'price-asc') query = query.order('price', { ascending: true });
      else if (sort === 'price-desc') query = query.order('price', { ascending: false });
      else if (sort === 'rating') query = query.order('rating', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const { data, count, error } = await query.range(from, to);
      if (!error && data) {
        return {
          products: data,
          page: pageNumber,
          pages: Math.ceil((count || 0) / pageSize),
          count: count || 0,
          source: 'supabase'
        };
      }
    } catch (e) {
      console.warn('[productDataService] Fallback to local store');
    }
  }

  // Local store fallback
  let list = loadLocalStore();

  if (status) {
    list = list.filter(p => p.status === status);
  }
  if (keyword) {
    const k = keyword.toLowerCase();
    list = list.filter(p =>
      (p.name && p.name.toLowerCase().includes(k)) ||
      (p.description && p.description.toLowerCase().includes(k)) ||
      (p.category && p.category.toLowerCase().includes(k))
    );
  }
  if (category && category !== 'All') {
    const c = category.toLowerCase();
    list = list.filter(p => p.category && p.category.toLowerCase().includes(c));
  }
  if (minPrice !== null && !isNaN(minPrice)) {
    list = list.filter(p => Number(p.price) >= minPrice);
  }
  if (maxPrice !== null && !isNaN(maxPrice)) {
    list = list.filter(p => Number(p.price) <= maxPrice);
  }
  if (inStock) {
    list = list.filter(p => Number(p.stock_quantity) > 0);
  }

  // Sorting
  if (sort === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
  else if (sort === 'rating') list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  else list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const total = list.length;
  const start = (pageNumber - 1) * pageSize;
  const paginated = list.slice(start, start + pageSize);

  return {
    products: paginated,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    count: total,
    source: 'store',
    supabaseEgressRestricted: !isSupabaseHealthy,
    egressWarning: lastEgressWarning
  };
}

/**
 * Get product by ID
 */
export async function getProductById(id) {
  const hasSupabase = await checkSupabaseAvailable();
  if (hasSupabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {}
  }
  const products = loadLocalStore();
  return products.find(p => p.id === id) || null;
}

/**
 * Bulk Upsert products (safely updates or inserts while preserving existing records)
 */
export async function bulkUpsertProducts(productsToUpsert) {
  const current = loadLocalStore();
  const idMap = new Map();
  const nameMap = new Map();

  current.forEach(p => {
    idMap.set(p.id, p);
    nameMap.set(p.name.toLowerCase().trim(), p);
  });

  const inserted = [];
  const updated = [];
  const skipped = [];
  const errors = [];

  for (const item of productsToUpsert) {
    try {
      // Validate required fields
      if (!item.name || !item.name.trim()) {
        errors.push({ id: item.id, name: item.name, error: 'Product name is required.' });
        continue;
      }
      if (item.price === undefined || isNaN(Number(item.price)) || Number(item.price) < 0) {
        errors.push({ id: item.id, name: item.name, error: 'Valid price is required.' });
        continue;
      }

      const cleanName = item.name.trim();
      const lowerName = cleanName.toLowerCase();
      const existingById = item.id ? idMap.get(item.id) : null;
      const existingByName = nameMap.get(lowerName);

      // Check for conflict: different ID with same name
      if (existingByName && (!item.id || existingByName.id !== item.id)) {
        if (!existingById) {
          // If name matches an existing record but supplied UUID differs
          errors.push({
            id: item.id,
            name: cleanName,
            error: `Name conflict: "${cleanName}" already belongs to existing product ID ${existingByName.id}`
          });
          continue;
        }
      }

      const now = new Date().toISOString();
      const targetId = item.id || (existingByName ? existingByName.id : crypto.randomUUID());
      const baseRecord = existingById || existingByName || {};

      const merged = {
        ...baseRecord,
        ...item,
        id: targetId,
        name: cleanName,
        price: Number(item.price),
        compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : null,
        category: item.category || baseRecord.category || 'Sarees',
        category_id: item.category_id || baseRecord.category_id || null,
        image_url: item.image_url || baseRecord.image_url || '',
        images: Array.isArray(item.images) ? item.images : (baseRecord.images || []),
        stock_quantity: item.stock_quantity !== undefined ? Number(item.stock_quantity) : (baseRecord.stock_quantity || 25),
        low_stock_threshold: item.low_stock_threshold !== undefined ? Number(item.low_stock_threshold) : (baseRecord.low_stock_threshold || 5),
        status: item.status || baseRecord.status || 'Published',
        rating: item.rating !== undefined ? Number(item.rating) : (baseRecord.rating || 4.8),
        colors: Array.isArray(item.colors) ? item.colors : (baseRecord.colors || []),
        description: item.description !== undefined ? item.description : (baseRecord.description || ''),
        specifications: item.specifications || baseRecord.specifications || {},
        offer_enabled: item.offer_enabled !== undefined ? !!item.offer_enabled : (baseRecord.offer_enabled || false),
        offer_details: item.offer_details || baseRecord.offer_details || {},
        variant_group_id: item.variant_group_id || baseRecord.variant_group_id || null,
        variant_color: item.variant_color || baseRecord.variant_color || '',
        material_type: item.material_type || baseRecord.material_type || '',
        created_at: baseRecord.created_at || item.created_at || now,
        updated_at: now
      };

      if (existingById || existingByName) {
        updated.push(merged);
      } else {
        inserted.push(merged);
      }

      // Update in-memory index
      idMap.set(merged.id, merged);
      nameMap.set(lowerName, merged);
    } catch (rowErr) {
      errors.push({ id: item.id, name: item.name, error: rowErr.message });
    }
  }

  const updatedAll = Array.from(idMap.values());
  saveLocalStore(updatedAll);

  // Sync to Supabase in background if healthy
  const hasSupabase = await checkSupabaseAvailable();
  if (hasSupabase) {
    try {
      const recordsToSync = [...inserted, ...updated];
      if (recordsToSync.length > 0) {
        await supabase.from('products').upsert(recordsToSync, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[productDataService] Supabase sync deferred:', e.message);
    }
  }

  return {
    success: errors.length === 0,
    totalProcessed: productsToUpsert.length,
    insertedCount: inserted.length,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    errorsCount: errors.length,
    inserted,
    updated,
    errors
  };
}

/**
 * Replace image URLs across all products (used by WebP conversion)
 */
export async function replaceProductImageUrls(urlReplacementMap) {
  if (!urlReplacementMap || Object.keys(urlReplacementMap).length === 0) {
    return { updatedCount: 0 };
  }

  const products = loadLocalStore();
  let updatedCount = 0;
  const changedProducts = [];

  for (const prod of products) {
    let changed = false;

    // Primary image_url
    if (prod.image_url && urlReplacementMap[prod.image_url]) {
      prod.image_url = urlReplacementMap[prod.image_url];
      changed = true;
    }

    // Gallery images
    if (Array.isArray(prod.images)) {
      const newImages = prod.images.map(img => {
        if (urlReplacementMap[img]) {
          changed = true;
          return urlReplacementMap[img];
        }
        return img;
      });
      if (changed) {
        prod.images = newImages;
      }
    }

    if (changed) {
      prod.updated_at = new Date().toISOString();
      updatedCount++;
      changedProducts.push(prod);
    }
  }

  if (updatedCount > 0) {
    saveLocalStore(products);

    // If Supabase is available, update Supabase records
    const hasSupabase = await checkSupabaseAvailable();
    if (hasSupabase) {
      try {
        for (const cp of changedProducts) {
          await supabase.from('products').update({
            image_url: cp.image_url,
            images: cp.images,
            updated_at: cp.updated_at
          }).eq('id', cp.id);
        }
      } catch (e) {
        console.warn('[productDataService] Supabase image URL update deferred:', e.message);
      }
    }
  }

  return { updatedCount, changedProductsCount: changedProducts.length };
}

export default {
  getAllProducts,
  getProducts,
  getProductById,
  bulkUpsertProducts,
  replaceProductImageUrls,
  checkSupabaseAvailable
};
