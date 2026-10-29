import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./Bulk-upload/supabase_products_raw.json', 'utf8'));

// Test 5th image of product 1
const url5 = raw[0].images[4];
console.log('Testing 5th image URL:', url5);
try {
  const res = await fetch(url5);
  console.log('HTTP Status:', res.status, res.statusText);
} catch (e) {
  console.error('Fetch error:', e.message);
}
