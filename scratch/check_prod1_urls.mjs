import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./Bulk-upload/supabase_products_raw.json', 'utf8'));
console.log('Product 1 images:');
console.log(raw[0].images);
console.log('Product 1 image_url:');
console.log(raw[0].image_url);
