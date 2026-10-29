import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./Bulk-upload/supabase_products_raw.json', 'utf8'));

let count5 = 0;
let count4 = 0;
let others = 0;

raw.forEach(p => {
  const len = (p.images || []).length;
  if (len === 5) count5++;
  else if (len === 4) count4++;
  else others++;
});

console.log(`Products with 5 images in DB array: ${count5}, with 4 images: ${count4}, other: ${others}`);
