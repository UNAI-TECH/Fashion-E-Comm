import fs from 'fs';
import path from 'path';

const manifestCsvPath = './Bulk-upload/output/Aanya_Fashions_Image_Manifest.csv';
const outputBaseDir = './product Images';

console.log('--- PREPARING "product Images" FOLDER ---');

// 1. Ensure clean base directory
if (fs.existsSync(outputBaseDir)) {
  console.log(`Cleaning existing "${outputBaseDir}" directory...`);
  fs.rmSync(outputBaseDir, { recursive: true, force: true });
}
fs.mkdirSync(outputBaseDir, { recursive: true });

// 2. Parse CSV manifest
const manifestCsv = fs.readFileSync(manifestCsvPath, 'utf8');
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

console.log(`Found ${productMap.size} distinct products to process.`);

let totalCopied = 0;
let errors = 0;

for (const [productName, imagePaths] of productMap.entries()) {
  // Clean product folder name for OS compatibility (trim whitespace)
  const safeFolderName = productName.trim();
  const productDir = path.join(outputBaseDir, safeFolderName);
  
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  for (const srcPath of imagePaths) {
    if (!fs.existsSync(srcPath)) {
      console.error(`❌ Source image does not exist: ${srcPath}`);
      errors++;
      continue;
    }

    const fileName = path.basename(srcPath);
    const destPath = path.join(productDir, fileName);

    fs.copyFileSync(srcPath, destPath);
    totalCopied++;
  }
}

console.log('\n--- SUMMARY ---');
console.log(`Total Products: ${productMap.size}`);
console.log(`Total Images Copied: ${totalCopied}`);
console.log(`Errors: ${errors}`);

// Verify directory structure
const createdFolders = fs.readdirSync(outputBaseDir);
console.log(`Folders in "${outputBaseDir}": ${createdFolders.length}`);
