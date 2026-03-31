/**
 * migrate_images.js
 * 
 * This script downloads existing Unsplash product images and uploads them 
 * to your native Supabase 'products' bucket, then updates the database.
 * 
 * Usage:
 * 1. Ensure your .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for DB updates)
 *    OR use the public key if RLS allows (this script assumes service role for stability).
 * 2. Run: node migrate_images.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env');
  console.log('Ensure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('\n🚀 Starting Image Migration (ESM Mode) 🚀');
  console.log('------------------------------------------');

  // 1. Fetch products
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('❌ Error fetching products:', error.message);
    return;
  }

  console.log(`📦 Found ${products.length} products to process.\n`);

  for (const product of products) {
    // Collect all existing image URLs from both 'images' column and 'image_url' (if it exists)
    const existingImages = product.images || [];
    if (product.image_url && !existingImages.includes(product.image_url)) {
      existingImages.unshift(product.image_url);
    }
    
    if (existingImages.length === 0) {
      console.log(`  - ${product.name}: No images found. Skipping.`);
      continue;
    }

    const newUrls = [];
    let updated = false;

    console.log(`🔹 Processing: ${product.name}`);

    for (const [index, imgUrl] of existingImages.entries()) {
      if (!imgUrl) continue;

      // Skip if already native
      if (imgUrl.includes('supabase.co') || imgUrl.includes('storage.googleapis.com')) {
        console.log(`  - Image ${index + 1} already native. Skipping.`);
        newUrls.push(imgUrl);
        continue;
      }

      try {
        console.log(`  - Migrating: ${imgUrl.substring(0, 50)}...`);
        
        const response = await fetch(imgUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const fileExt = contentType.split('/')[1] || 'jpg';
        const fileName = `${product.id}_${index}.${fileExt}`;
        const filePath = `${product.category?.toLowerCase() || 'general'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, buffer, {
            contentType,
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
        updated = true;
        console.log(`    ✅ Successfully uploaded!`);
      } catch (err) {
        console.error(`    ❌ Failed: ${err.message}`);
        newUrls.push(imgUrl);
      }
    }

    if (updated) {
      const updateData = { images: newUrls };
      // Only include image_url if the column actually existed in the product object
      if ('image_url' in product) {
        updateData.image_url = newUrls[0];
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (updateError) console.error(`    ❌ DB Update Failed: ${updateError.message}`);
      else console.log(`    ⭐ Product updated in database.`);
    }
  }

  console.log('\n✨ Migration Finished! ✨\n');
}

migrate();
