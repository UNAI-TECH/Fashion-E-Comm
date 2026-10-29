import fs from 'fs';
import path from 'path';

const raw = JSON.parse(fs.readFileSync('./Bulk-upload/supabase_products_raw.json', 'utf8'));
const manifest = fs.readFileSync('./Bulk-upload/output/Aanya_Fashions_Image_Manifest.csv', 'utf8');

console.log('--- PRODUCTS IN supabase_products_raw.json ---');
raw.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.id}] ${p.name}`);
  const imgs = p.images || [];
  console.log(`   Images in DB array: ${imgs.length}`);
});
