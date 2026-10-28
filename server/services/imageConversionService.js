import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';
import { getAllProducts, replaceProductImageUrls } from './productDataService.js';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../../public');
const JOBS_DIR = path.join(__dirname, '../data');
const JOBS_FILE = path.join(JOBS_DIR, 'conversion_jobs.json');

// In-memory jobs tracking
const jobsMap = new Map();

// Load persistent jobs
function loadJobs() {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
      Object.entries(data).forEach(([id, job]) => jobsMap.set(id, job));
    }
  } catch (e) {}
}

function saveJobs() {
  try {
    if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
    const obj = {};
    jobsMap.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(JOBS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {}
}

loadJobs();

/**
 * Check if a buffer is a PNG by magic bytes: 89 50 4E 47 0D 0A 1A 0A
 */
export function isPngBuffer(buf) {
  if (!buf || buf.length < 8) return false;
  return (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4E &&
    buf[3] === 0x47 &&
    buf[4] === 0x0D &&
    buf[5] === 0x0A &&
    buf[6] === 0x1A &&
    buf[7] === 0x0A
  );
}

/**
 * Check if a buffer is WebP: RIFF ... WEBP
 */
export function isWebpBuffer(buf) {
  if (!buf || buf.length < 12) return false;
  const riff = buf.toString('ascii', 0, 4);
  const webp = buf.toString('ascii', 8, 12);
  return riff === 'RIFF' && webp === 'WEBP';
}

/**
 * Resolve local filesystem path for a relative URL (e.g. /saree_s1_cutout.png)
 */
function resolveLocalPath(urlOrPath) {
  if (!urlOrPath) return null;
  // If absolute path
  if (path.isAbsolute(urlOrPath) && fs.existsSync(urlOrPath)) return urlOrPath;

  const clean = urlOrPath.replace(/^\/+/, '').split('?')[0];
  const candidate = path.join(PUBLIC_DIR, clean);
  if (fs.existsSync(candidate)) return candidate;

  return null;
}

/**
 * Fetch or read image buffer from local path or remote URL
 */
async function getImageBuffer(sourceUrl) {
  const local = resolveLocalPath(sourceUrl);
  if (local) {
    const buffer = fs.readFileSync(local);
    return { buffer, localPath: local };
  }

  // Handle remote URL
  if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
    const res = await fetch(sourceUrl, { headers: { 'User-Agent': 'AanyaFashion-Optimizer/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching remote image: ${sourceUrl}`);
    const arrayBuf = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuf), localPath: null };
  }

  throw new Error(`Image not found on disk or network: ${sourceUrl}`);
}

/**
 * Scan all products and catalog files to discover candidate images
 */
export async function discoverProductImages() {
  const products = await getAllProducts();
  const imageMap = new Map(); // normalized URL -> { sources: [], isPng: boolean, isWebp: boolean }

  // 1. Scan from products table
  products.forEach(p => {
    const allUrls = [p.image_url, ...(Array.isArray(p.images) ? p.images : [])].filter(Boolean);
    allUrls.forEach(url => {
      const clean = url.trim();
      if (!imageMap.has(clean)) {
        imageMap.set(clean, {
          url: clean,
          referencedInProducts: [p.id],
          isPng: false,
          isWebp: false,
          originalSize: 0,
          localPath: null
        });
      } else {
        const item = imageMap.get(clean);
        if (!item.referencedInProducts.includes(p.id)) {
          item.referencedInProducts.push(p.id);
        }
      }
    });
  });

  // 2. Also scan all PNG files in public/ that represent catalog assets
  if (fs.existsSync(PUBLIC_DIR)) {
    const files = fs.readdirSync(PUBLIC_DIR);
    files.forEach(file => {
      if (file.toLowerCase().endsWith('.png')) {
        const url = `/${file}`;
        if (!imageMap.has(url)) {
          imageMap.set(url, {
            url,
            referencedInProducts: [],
            isPng: true,
            isWebp: false,
            originalSize: 0,
            localPath: path.join(PUBLIC_DIR, file)
          });
        }
      }
    });
  }

  // 3. Inspect image bytes / extensions
  const items = Array.from(imageMap.values());
  for (const item of items) {
    try {
      const local = resolveLocalPath(item.url);
      if (local) {
        item.localPath = local;
        const stats = fs.statSync(local);
        item.originalSize = stats.size;

        // Check magic bytes
        const fd = fs.openSync(local, 'r');
        const header = Buffer.alloc(16);
        fs.readSync(fd, header, 0, 16, 0);
        fs.closeSync(fd);

        item.isPng = isPngBuffer(header) || local.toLowerCase().endsWith('.png');
        item.isWebp = isWebpBuffer(header) || local.toLowerCase().endsWith('.webp');
      } else {
        item.isPng = item.url.toLowerCase().includes('.png');
        item.isWebp = item.url.toLowerCase().includes('.webp');
      }
    } catch (e) {
      item.error = e.message;
    }
  }

  return items;
}

/**
 * Optimize Product Images - Dry Run or Real Conversion
 */
export async function runImageOptimization({ dryRun = true, quality = 82 } = {}) {
  const jobId = `job_opt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const startTime = new Date().toISOString();

  const job = {
    jobId,
    type: 'image_optimization',
    dryRun,
    quality,
    status: 'processing',
    startTime,
    endTime: null,
    totalImagesScanned: 0,
    pngImagesFound: 0,
    alreadyWebpCount: 0,
    convertedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    totalOriginalBytes: 0,
    totalOptimizedBytes: 0,
    totalBytesSaved: 0,
    percentageReduction: 0,
    items: [],
    errors: []
  };

  jobsMap.set(jobId, job);
  saveJobs();

  try {
    const discovered = await discoverProductImages();
    job.totalImagesScanned = discovered.length;

    const pngItems = discovered.filter(img => img.isPng && !img.isWebp);
    const webpItems = discovered.filter(img => img.isWebp);

    job.pngImagesFound = pngItems.length;
    job.alreadyWebpCount = webpItems.length;

    const urlReplacementMap = {};

    for (const item of discovered) {
      // If already WebP, record as already optimized
      if (item.isWebp) {
        job.items.push({
          url: item.url,
          destUrl: item.url,
          originalSize: item.originalSize,
          optimizedSize: item.originalSize,
          bytesSaved: 0,
          percentageReduction: 0,
          status: 'already_webp'
        });
        job.totalOriginalBytes += item.originalSize;
        job.totalOptimizedBytes += item.originalSize;
        continue;
      }

      // If not PNG (e.g. JPG), retain unchanged
      if (!item.isPng) {
        job.items.push({
          url: item.url,
          destUrl: item.url,
          originalSize: item.originalSize,
          optimizedSize: item.originalSize,
          bytesSaved: 0,
          percentageReduction: 0,
          status: 'skipped_non_png'
        });
        job.totalOriginalBytes += item.originalSize;
        job.totalOptimizedBytes += item.originalSize;
        job.skippedCount++;
        continue;
      }

      // Convert PNG to WebP
      try {
        const { buffer, localPath } = await getImageBuffer(item.url);
        const originalBytes = buffer.length;

        // Perform Sharp WebP compression
        const optimizedBuffer = await sharp(buffer)
          .webp({
            quality: Math.max(50, Math.min(100, quality)),
            effort: 4,
            alphaQuality: 90,
            lossless: false
          })
          .toBuffer();

        const optimizedBytes = optimizedBuffer.length;
        const bytesSaved = Math.max(0, originalBytes - optimizedBytes);
        const pctReduction = originalBytes > 0 ? ((bytesSaved / originalBytes) * 100).toFixed(1) : 0;

        // Verify WebP format
        if (!isWebpBuffer(optimizedBuffer)) {
          throw new Error('Verification failed: Generated buffer is not valid WebP');
        }

        // Determine destination URL & filename
        const destUrl = item.url.replace(/\.png$/i, '.webp');
        const destFileName = path.basename(destUrl);
        const destLocalPath = path.join(PUBLIC_DIR, destFileName);

        if (!dryRun) {
          // Write to local public directory
          fs.writeFileSync(destLocalPath, optimizedBuffer);

          // Verify written file
          const writtenStats = fs.statSync(destLocalPath);
          if (writtenStats.size !== optimizedBytes) {
            throw new Error(`File verification failed on disk for ${destLocalPath}`);
          }

          // Upload to Supabase Storage bucket 'products' if Supabase is healthy
          try {
            const storagePath = `products/${destFileName}`;
            const { error: uploadErr } = await supabase.storage
              .from('products')
              .upload(storagePath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
              });
            if (uploadErr) {
              console.warn(`[imageConversion] Supabase storage upload deferred for ${destFileName}:`, uploadErr.message);
            }
          } catch (storageErr) {
            console.warn(`[imageConversion] Supabase upload failed:`, storageErr.message);
          }

          urlReplacementMap[item.url] = destUrl;
          job.convertedCount++;
        }

        job.totalOriginalBytes += originalBytes;
        job.totalOptimizedBytes += optimizedBytes;

        job.items.push({
          url: item.url,
          destUrl,
          originalSize: originalBytes,
          optimizedSize: optimizedBytes,
          bytesSaved,
          percentageReduction: Number(pctReduction),
          status: dryRun ? 'eligible_for_conversion' : 'converted',
          verifiedWebp: true
        });
      } catch (err) {
        job.failedCount++;
        job.errors.push({ url: item.url, error: err.message });
        job.items.push({
          url: item.url,
          error: err.message,
          status: 'failed'
        });
      }
    }

    // If real conversion, update database product URLs
    if (!dryRun && Object.keys(urlReplacementMap).length > 0) {
      const updateResult = await replaceProductImageUrls(urlReplacementMap);
      job.dbProductsUpdated = updateResult.updatedCount;
    }

    job.totalBytesSaved = Math.max(0, job.totalOriginalBytes - job.totalOptimizedBytes);
    job.percentageReduction = job.totalOriginalBytes > 0
      ? Number(((job.totalBytesSaved / job.totalOriginalBytes) * 100).toFixed(1))
      : 0;

    job.status = 'completed';
    job.endTime = new Date().toISOString();
  } catch (globalErr) {
    job.status = 'failed';
    job.globalError = globalErr.message;
    job.endTime = new Date().toISOString();
  }

  saveJobs();
  return job;
}

/**
 * Get job status by ID
 */
export function getOptimizationJob(jobId) {
  return jobsMap.get(jobId) || null;
}

export default {
  discoverProductImages,
  runImageOptimization,
  getOptimizationJob,
  isPngBuffer,
  isWebpBuffer
};
