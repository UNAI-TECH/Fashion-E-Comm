import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

const p1Url = process.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
const p1Key = process.env.VITE_SUPABASE_ANON_KEY;

const p2Url = process.env.SUPABASE_URL;
const p2Key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!p1Url || !p1Key) {
  console.error('❌ Missing primary Supabase credentials in .env');
  process.exit(1);
}

const client1 = createClient(p1Url, p1Key);
const client2 = (p2Url && p2Key) ? createClient(p2Url, p2Key) : null;

const productImagesDir = path.join(rootDir, 'product Images');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const ORDERED_FILES = [
  'image-1-front.webp',
  'image-2.webp',
  'image-3.webp',
  'image-4.webp'
];

async function populateAll() {
  console.log('======================================================================');
  console.log('✨ POPULATING SUPABASE WITH EXACT PRODUCT IMAGES MAPPING ✨');
  console.log('======================================================================\n');
  console.log(`📁 Source folder: ${productImagesDir}`);
  console.log(`🌐 Primary Supabase URL: ${p1Url}`);
  if (client2) console.log(`🌐 Secondary Supabase URL: ${p2Url}`);

  // 1. Scan folders
  const allEntries = fs.readdirSync(productImagesDir);
  const productFolders = allEntries.filter(entry => {
    const fullPath = path.join(productImagesDir, entry);
    return fs.statSync(fullPath).isDirectory() && entry !== 'Products';
  }).sort();

  console.log(`\n📦 Found ${productFolders.length} product folders to process.\n`);

  // 2. Fetch existing products from DB
  const { data: dbProducts, error: dbErr } = await client1
    .from('products')
    .select('id, name, image_url, images');

  if (dbErr) {
    console.error('❌ Failed to fetch products from Supabase:', dbErr.message);
    process.exit(1);
  }

  console.log(`🗄️ Retrieved ${dbProducts.length} products from Supabase DB.\n`);

  // Map by name (normalized lowercase trim)
  const productByName = new Map();
  for (const p of dbProducts) {
    productByName.set(p.name.trim().toLowerCase(), p);
  }

  const results = {
    total: productFolders.length,
    success: 0,
    failed: 0,
    items: []
  };

  const localStoreUpdates = {};

  for (let i = 0; i < productFolders.length; i++) {
    const folder = productFolders[i];
    const folderPath = path.join(productImagesDir, folder);
    const progress = `[${i + 1}/${productFolders.length}]`;
    const slug = slugify(folder);

    console.log(`\n--------------------------------------------------`);
    console.log(`${progress} Processing: "${folder}"`);
    console.log(`     Slug: ${slug}`);

    const dbProduct = productByName.get(folder.trim().toLowerCase());
    if (!dbProduct) {
      console.warn(`  ⚠️ Product "${folder}" not found in Supabase database! Skipping.`);
      results.failed++;
      continue;
    }

    // Read available files
    const availableFiles = fs.readdirSync(folderPath);
    // Sort according to ORDERED_FILES
    const filesToUpload = ORDERED_FILES.filter(f => availableFiles.includes(f));
    // If there are other image files not in standard names, include them too
    const otherFiles = availableFiles.filter(f => !ORDERED_FILES.includes(f) && /\.(webp|jpg|jpeg|png)$/i.test(f)).sort();
    const finalFiles = [...filesToUpload, ...otherFiles];

    if (finalFiles.length === 0) {
      console.warn(`  ⚠️ No valid image files in folder "${folder}". Skipping.`);
      results.failed++;
      continue;
    }

    console.log(`     Found ${finalFiles.length} images: ${finalFiles.join(', ')}`);

    const uploadedUrls = [];
    let uploadSuccess = true;

    for (const fileName of finalFiles) {
      const filePath = path.join(folderPath, fileName);
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `sarees/${slug}/${fileName}`;

      try {
        const { error: upErr } = await client1.storage.from('products').upload(storagePath, fileBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

        if (upErr) {
          console.error(`     ❌ Upload failed for ${fileName}:`, upErr.message);
          uploadSuccess = false;
          break;
        }

        const { data: { publicUrl } } = client1.storage.from('products').getPublicUrl(storagePath);
        uploadedUrls.push(publicUrl);
        console.log(`     ✓ Uploaded: ${fileName} (${Math.round(fileBuffer.length / 1024)} KB)`);
      } catch (err) {
        console.error(`     ❌ Exception uploading ${fileName}:`, err.message);
        uploadSuccess = false;
        break;
      }
    }

    if (!uploadSuccess || uploadedUrls.length === 0) {
      console.error(`  ❌ Failed to upload all images for "${folder}".`);
      results.failed++;
      continue;
    }

    const primaryImageUrl = uploadedUrls[0];
    const allImagesUrls = uploadedUrls;

    // 3. Update Supabase primary DB
    const updatePayload = {
      image_url: primaryImageUrl,
      images: allImagesUrls,
      updated_at: new Date().toISOString()
    };

    const { error: updateErr } = await client1
      .from('products')
      .update(updatePayload)
      .eq('id', dbProduct.id);

    if (updateErr) {
      console.error(`  ❌ Failed to update Supabase DB for "${folder}":`, updateErr.message);
      results.failed++;
      continue;
    }

    console.log(`  ✅ Supabase updated: ${dbProduct.id}`);
    console.log(`     image_url: ${primaryImageUrl}`);
    console.log(`     images count: ${allImagesUrls.length}`);

    // If client2 exists, sync secondary Supabase DB as well
    if (client2) {
      try {
        await client2
          .from('products')
          .update(updatePayload)
          .eq('id', dbProduct.id);
      } catch (e) {
        // silent fallback for secondary
      }
    }

    localStoreUpdates[dbProduct.id] = {
      image_url: primaryImageUrl,
      images: allImagesUrls
    };

    results.success++;
    results.items.push({
      id: dbProduct.id,
      name: folder,
      slug,
      image_url: primaryImageUrl,
      images: allImagesUrls
    });
  }

  // 4. Update local cache products_store.json
  const storePath = path.join(rootDir, 'server/data/products_store.json');
  if (fs.existsSync(storePath)) {
    try {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      let storeUpdatedCount = 0;
      for (const item of storeData) {
        if (localStoreUpdates[item.id]) {
          item.image_url = localStoreUpdates[item.id].image_url;
          item.images = localStoreUpdates[item.id].images;
          storeUpdatedCount++;
        }
      }
      fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');
      console.log(`\n💾 Synchronized local cache products_store.json (${storeUpdatedCount} products updated)`);
    } catch (e) {
      console.warn('⚠️ Could not update products_store.json:', e.message);
    }
  }

  // 5. Verification summary
  console.log('\n======================================================================');
  console.log('🏁 POPULATION COMPLETE');
  console.log('======================================================================');
  console.log(`Total Products: ${results.total}`);
  console.log(`Successfully Populated: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  // Test random 3 public URLs for HTTP 200 verification
  if (results.items.length > 0) {
    console.log('\n🔍 Verifying public availability of uploaded images...');
    const samples = [
      results.items[0],
      results.items[Math.floor(results.items.length / 2)],
      results.items[results.items.length - 1]
    ];

    for (const sample of samples) {
      try {
        const resp = await fetch(sample.image_url, { method: 'HEAD' });
        console.log(`  ✓ [HTTP ${resp.status}] ${sample.name} -> ${resp.headers.get('content-type')} (${resp.headers.get('content-length')} bytes)`);
      } catch (e) {
        console.error(`  ❌ Failed to verify ${sample.image_url}:`, e.message);
      }
    }
  }

  console.log('\n✨ All operations finished!\n');
}

populateAll().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
