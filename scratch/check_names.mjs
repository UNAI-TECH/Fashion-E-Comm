import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./Bulk-upload/supabase_products_raw.json', 'utf8'));

const invalidCharsRegex = /[\\/:*?"<>|]/;
console.log('Checking 42 product names for Windows path characters:');
raw.forEach((p, i) => {
  const hasInvalid = invalidCharsRegex.test(p.name);
  if (hasInvalid) {
    console.log(`[INVALID] ${i + 1}. "${p.name}" contains invalid char: ${p.name.match(invalidCharsRegex)[0]}`);
  } else {
    console.log(`[OK] ${i + 1}. "${p.name}"`);
  }
});
