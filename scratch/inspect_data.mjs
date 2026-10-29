import fs from 'fs';
import path from 'path';

const rawProducts = JSON.parse(fs.readFileSync('./Bulk-upload/supabase_products_raw.json', 'utf8'));
console.log('Total products in raw JSON:', rawProducts.length);

const manifestCsv = fs.readFileSync('./Bulk-upload/output/Aanya_Fashions_Image_Manifest.csv', 'utf8');
const manifestLines = manifestCsv.trim().split('\n').slice(1);

const productMapFromManifest = new Map();
for (const line of manifestLines) {
  // Parse CSV line
  // product_name,product_url,product_id,sku,image_position,original_image_url,local_image_path,download_status,image_verification
  const parts = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  parts.push(cur);

  const productName = parts[0].trim();
  const productId = parts[2].trim();
  const sku = parts[3].trim();
  const imgPos = parts[4].trim();
  const originalUrl = parts[5].trim();
  const localPath = parts[6].trim();
  const status = parts[7].trim();

  if (!productMapFromManifest.has(productName)) {
    productMapFromManifest.set(productName, {
      id: productId,
      sku: sku,
      images: []
    });
  }
  productMapFromManifest.get(productName).images.push({
    pos: imgPos,
    originalUrl,
    localPath,
    status,
    exists: fs.existsSync(localPath)
  });
}

console.log('Products in manifest:', productMapFromManifest.size);

let totalImagesFound = 0;
let totalImagesMissing = 0;

for (const [name, info] of productMapFromManifest.entries()) {
  for (const img of info.images) {
    if (img.exists) totalImagesFound++;
    else totalImagesMissing++;
  }
}

console.log(`Images found locally: ${totalImagesFound}, Missing: ${totalImagesMissing}`);

// Check if any product in rawProducts is NOT in manifest
const manifestNames = new Set(productMapFromManifest.keys());
const rawNames = rawProducts.map(p => p.name);
const notInManifest = rawNames.filter(n => !manifestNames.has(n));
console.log('Products in raw JSON but NOT in manifest:', notInManifest.length, notInManifest);
