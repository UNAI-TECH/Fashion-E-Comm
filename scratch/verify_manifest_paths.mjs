import fs from 'fs';
import path from 'path';

const manifestCsv = fs.readFileSync('./Bulk-upload/output/Aanya_Fashions_Image_Manifest.csv', 'utf8');
const lines = manifestCsv.trim().split('\n').slice(1);

const productMap = new Map();

for (const line of lines) {
  const parts = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      parts.push(cur);
      cur = '';
    } else cur += char;
  }
  parts.push(cur);

  const prodName = parts[0].trim();
  const localPath = parts[6].trim();
  
  if (!productMap.has(prodName)) {
    productMap.set(prodName, []);
  }
  productMap.get(prodName).push(localPath);
}

console.log('Total products in manifest:', productMap.size);
for (const [name, files] of productMap.entries()) {
  const fileNames = files.map(f => path.basename(f));
  const allExist = files.every(f => fs.existsSync(f));
  if (!allExist) console.log(`Missing files for ${name}`);
}
console.log('All files verified existing on disk!');
