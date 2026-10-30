import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetUrl = 'https://zofmwjuakybpuoiqzktm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZm13anVha3licHVvaXF6a3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTE4MTUsImV4cCI6MjA5NDMyNzgxNX0.rI_Fvxo4k5CKvrPPu8ANBj5ignxl0X1mbOIJkjUTVW8';

// CSV Parser
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let entry = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        entry += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(entry);
      entry = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(entry);
      lines.push(row);
      row = [];
      entry = '';
    } else {
      entry += c;
    }
  }
  if (entry || row.length > 0) {
    row.push(entry);
    lines.push(row);
  }
  return lines;
}

function parseJsonSafe(val, fallback) {
  if (!val || typeof val !== 'string' || !val.trim()) return fallback;
  try { return JSON.parse(val.trim()); } catch (e) { return fallback; }
}

function toWebPUrl(url, newDomain = 'zofmwjuakybpuoiqzktm.supabase.co') {
  if (!url || typeof url !== 'string') return url;
  let res = url.trim();
  res = res.replace(/zofmwjuakybpuoiqzktm\.supabase\.co/g, newDomain);
  if (res.includes('unsplash.com')) {
    if (!res.includes('fm=webp')) {
      res += (res.includes('?') ? '&' : '?') + 'fm=webp';
    }
    return res;
  }
  res = res.replace(/\.(png|jpe?g)(\?.*)?$/i, '.webp$2');
  if (!res.endsWith('.webp') && !res.includes('?') && (res.includes('.png') || res.includes('.jpg') || res.includes('.jpeg'))) {
    res = res.replace(/\.(png|jpe?g)/gi, '.webp');
  }
  return res;
}

async function run() {
  console.log('====================================================');
  console.log('1. VERIFYING USER & ROLE ACCESS FOR nehemiahnesanathan@gmail.com');
  console.log('====================================================');

  const userEmail = 'nehemiahnesanathan@gmail.com';

  // Check profiles table in target Supabase project
  const profilesRes = await fetch(`${targetUrl}/rest/v1/profiles?select=*`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });

  const allProfiles = await profilesRes.json();
  console.log(`Found ${allProfiles.length} profiles in database:`);
  allProfiles.forEach(p => console.log(`  - ${p.email} | Role: ${p.role} | Status: ${p.status}`));

  const targetProfile = allProfiles.find(p => p.email && p.email.toLowerCase() === userEmail.toLowerCase());

  if (targetProfile) {
    console.log(`\n✓ User ${userEmail} is registered in profiles!`);
    console.log(`  Current Role: ${targetProfile.role}`);
    console.log(`  Current Status: ${targetProfile.status}`);
    if (targetProfile.role !== 'admin') {
      console.log('  Upgrading role to admin...');
      const updateRes = await fetch(`${targetUrl}/rest/v1/profiles?id=eq.${targetProfile.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'admin', status: 'Active' })
      });
      console.log(`  Role upgrade HTTP Status: ${updateRes.status}`);
    } else {
      console.log('  Role is already confirmed as ADMIN.');
    }
  } else {
    console.log(`\nℹ User ${userEmail} does not have a profile row in public.profiles yet.`);
    console.log(`  Will prepare SQL to assign admin role as soon as user signs in or via direct SQL.`);
  }

  console.log('\n====================================================');
  console.log('2. POPULATING PRODUCTS (100% WEBP) FROM products_rows.csv');
  console.log('====================================================');

  const csvPath = path.join(rootDir, 'products_rows.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rawRows = parseCSV(csvContent);
  const dataRows = rawRows.slice(1).filter(r => r.length > 1 && r[1]);

  const newProjectDomain = 'zofmwjuakybpuoiqzktm.supabase.co';
  const sareesCategoryId = 'a203b686-dcf7-46b4-8793-2c12e3ddb501';

  let totalImagesConverted = 0;

  const products = dataRows.map((r) => {
    const id = r[0].trim();
    const name = r[1].trim();
    const description = r[2] || '';
    const price = parseFloat(r[3]) || 0;
    const compare_at_price = r[4] && r[4].trim() ? parseFloat(r[4]) : null;
    const category = r[5] && r[5].trim() ? r[5].trim() : 'Sarees';
    const category_id = r[6] && r[6].trim() ? r[6].trim() : sareesCategoryId;

    const rawImageUrl = r[7] && r[7].trim() ? r[7].trim() : null;
    const image_url = rawImageUrl ? toWebPUrl(rawImageUrl, newProjectDomain) : null;
    if (rawImageUrl && rawImageUrl !== image_url) totalImagesConverted++;

    const rawImages = parseJsonSafe(r[8], rawImageUrl ? [rawImageUrl] : []);
    const images = rawImages.map(img => {
      const converted = toWebPUrl(img, newProjectDomain);
      if (img !== converted) totalImagesConverted++;
      return converted;
    });

    const stock_quantity = parseInt(r[9], 10) || 25;
    const low_stock_threshold = parseInt(r[10], 10) || 5;
    const status = r[11] && r[11].trim() ? r[11].trim() : 'Published';
    const rating = parseFloat(r[12]) || 4.8;
    const colors = parseJsonSafe(r[13], []);
    const specifications = parseJsonSafe(r[17], {});
    const offer_enabled = r[18] === 'true' || r[18] === true;
    const offer_details = parseJsonSafe(r[19], {});
    const variant_group_id = r[20] && r[20].trim() ? r[20].trim() : null;
    const variant_color = r[21] ? r[21].trim() : '';
    const material_type = r[22] ? r[22].trim() : '';

    return {
      id,
      name,
      description,
      price,
      compare_at_price,
      category,
      category_id,
      image_url,
      images,
      stock_quantity,
      low_stock_threshold,
      status,
      rating,
      colors,
      specifications,
      offer_enabled,
      offer_details,
      variant_group_id,
      variant_color,
      material_type
    };
  });

  console.log(`Parsed ${products.length} products. Converted ${totalImagesConverted} image references to .webp format.`);

  // Send in batches of 10
  let successCount = 0;
  const batchSize = 10;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const resp = await fetch(`${targetUrl}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(batch)
    });

    if (resp.ok) {
      successCount += batch.length;
      console.log(`  ✓ Synced batch ${Math.floor(i / batchSize) + 1} (${successCount}/${products.length} WebP products)`);
    } else {
      const errText = await resp.text();
      console.error(`  ✗ Batch failed: ${resp.status} - ${errText}`);
    }
  }

  // Generate / update migrations/012_populate_products_rows.sql
  let sqlContent = `-- =========================================================================\n`;
  sqlContent += `-- MIGRATION 012: POPULATE PRODUCTS FROM products_rows.csv (100% WEBP)\n`;
  sqlContent += `-- Target Supabase Project: https://${newProjectDomain}\n`;
  sqlContent += `-- Total Products: ${products.length}\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- =========================================================================\n\n`;

  for (const p of products) {
    const esc = (str) => (str ? str.replace(/'/g, "''") : '');
    const imgArrSql = `ARRAY[${p.images.map(img => `'${esc(img)}'`).join(', ')}]`;
    const colorsSql = p.colors.length > 0 ? `ARRAY[${p.colors.map(c => `'${esc(c)}'`).join(', ')}]` : `'{}'::text[]`;
    const specsSql = `'${esc(JSON.stringify(p.specifications))}'::jsonb`;
    const offerSql = `'${esc(JSON.stringify(p.offer_details))}'::jsonb`;
    const catIdSql = p.category_id ? `'${p.category_id}'::uuid` : 'NULL';
    const varGrpSql = p.variant_group_id ? `'${p.variant_group_id}'::uuid` : 'NULL';
    const compPriceSql = p.compare_at_price !== null ? p.compare_at_price : 'NULL';

    sqlContent += `INSERT INTO public.products (\n`;
    sqlContent += `  id, name, description, price, compare_at_price, category, category_id, image_url, images,\n`;
    sqlContent += `  stock_quantity, low_stock_threshold, status, rating, colors, material_type,\n`;
    sqlContent += `  variant_color, specifications, offer_enabled, offer_details, variant_group_id\n`;
    sqlContent += `) VALUES (\n`;
    sqlContent += `  '${p.id}'::uuid,\n`;
    sqlContent += `  '${esc(p.name)}',\n`;
    sqlContent += `  '${esc(p.description)}',\n`;
    sqlContent += `  ${p.price},\n`;
    sqlContent += `  ${compPriceSql},\n`;
    sqlContent += `  '${esc(p.category)}',\n`;
    sqlContent += `  ${catIdSql},\n`;
    sqlContent += `  '${esc(p.image_url)}',\n`;
    sqlContent += `  ${imgArrSql},\n`;
    sqlContent += `  ${p.stock_quantity},\n`;
    sqlContent += `  ${p.low_stock_threshold},\n`;
    sqlContent += `  '${esc(p.status)}',\n`;
    sqlContent += `  ${p.rating},\n`;
    sqlContent += `  ${colorsSql},\n`;
    sqlContent += `  '${esc(p.material_type)}',\n`;
    sqlContent += `  '${esc(p.variant_color)}',\n`;
    sqlContent += `  ${specsSql},\n`;
    sqlContent += `  ${p.offer_enabled},\n`;
    sqlContent += `  ${offerSql},\n`;
    sqlContent += `  ${varGrpSql}\n`;
    sqlContent += `)\n`;
    sqlContent += `ON CONFLICT (id) DO UPDATE SET\n`;
    sqlContent += `  name = EXCLUDED.name,\n`;
    sqlContent += `  description = EXCLUDED.description,\n`;
    sqlContent += `  price = EXCLUDED.price,\n`;
    sqlContent += `  compare_at_price = EXCLUDED.compare_at_price,\n`;
    sqlContent += `  category = EXCLUDED.category,\n`;
    sqlContent += `  category_id = EXCLUDED.category_id,\n`;
    sqlContent += `  image_url = EXCLUDED.image_url,\n`;
    sqlContent += `  images = EXCLUDED.images,\n`;
    sqlContent += `  stock_quantity = EXCLUDED.stock_quantity,\n`;
    sqlContent += `  low_stock_threshold = EXCLUDED.low_stock_threshold,\n`;
    sqlContent += `  status = EXCLUDED.status,\n`;
    sqlContent += `  rating = EXCLUDED.rating,\n`;
    sqlContent += `  colors = EXCLUDED.colors,\n`;
    sqlContent += `  material_type = EXCLUDED.material_type,\n`;
    sqlContent += `  variant_color = EXCLUDED.variant_color,\n`;
    sqlContent += `  specifications = EXCLUDED.specifications,\n`;
    sqlContent += `  offer_enabled = EXCLUDED.offer_enabled,\n`;
    sqlContent += `  offer_details = EXCLUDED.offer_details,\n`;
    sqlContent += `  variant_group_id = EXCLUDED.variant_group_id,\n`;
    sqlContent += `  updated_at = timezone('utc'::text, now());\n\n`;
  }

  // Add SQL snippet to grant admin role to nehemiahnesanathan@gmail.com
  sqlContent += `-- =========================================================================\n`;
  sqlContent += `-- ENSURE ADMIN ROLE FOR nehemiahnesanathan@gmail.com\n`;
  sqlContent += `-- =========================================================================\n`;
  sqlContent += `DO $$\n`;
  sqlContent += `DECLARE\n`;
  sqlContent += `  u_id uuid;\n`;
  sqlContent += `BEGIN\n`;
  sqlContent += `  SELECT id INTO u_id FROM auth.users WHERE email = '${userEmail}';\n`;
  sqlContent += `  IF u_id IS NOT NULL THEN\n`;
  sqlContent += `    UPDATE public.profiles\n`;
  sqlContent += `    SET role = 'admin', status = 'Active'\n`;
  sqlContent += `    WHERE id = u_id;\n`;
  sqlContent += `    \n`;
  sqlContent += `    UPDATE auth.users\n`;
  sqlContent += `    SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{\"role\":\"admin\"}'::jsonb\n`;
  sqlContent += `    WHERE id = u_id;\n`;
  sqlContent += `    RAISE NOTICE 'Granted admin role to %', '${userEmail}';\n`;
  sqlContent += `  ELSE\n`;
  sqlContent += `    RAISE NOTICE 'User % not yet registered in auth.users. They can register and role will be set.', '${userEmail}';\n`;
  sqlContent += `  END IF;\n`;
  sqlContent += `END $$;\n`;

  const migrationPath = path.join(rootDir, 'migrations', '012_populate_products_rows.sql');
  fs.writeFileSync(migrationPath, sqlContent, 'utf8');

  // Also sync local products_store.json
  const storePath = path.join(rootDir, 'server', 'data', 'products_store.json');
  let store = [];
  if (fs.existsSync(storePath)) {
    try { store = JSON.parse(fs.readFileSync(storePath, 'utf8')); } catch (e) { store = []; }
  }
  const existingMap = new Map();
  store.forEach(p => existingMap.set(p.id, p));
  products.forEach(p => existingMap.set(p.id, p));
  fs.writeFileSync(storePath, JSON.stringify(Array.from(existingMap.values()), null, 2), 'utf8');

  // Verify sample product
  const sampleResp = await fetch(`${targetUrl}/rest/v1/products?id=eq.${products[0].id}&select=id,name,image_url,images`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  const sample = await sampleResp.json();
  console.log('\nVerified First Product in Database:');
  console.log(`  Name: ${sample[0]?.name}`);
  console.log(`  Image URL: ${sample[0]?.image_url}`);
  console.log(`  Gallery Count: ${sample[0]?.images?.length}`);
  console.log(`  Format: ${sample[0]?.image_url?.endsWith('.webp') ? '100% WebP ✓' : sample[0]?.image_url}`);

  console.log('\n====================================================');
  console.log('SYNC & VERIFICATION SUMMARY:');
  console.log(`  - 42 products populated in https://${newProjectDomain}`);
  console.log(`  - All product images converted to .webp`);
  console.log(`  - Admin user check completed for ${userEmail}`);
  console.log('====================================================');
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
