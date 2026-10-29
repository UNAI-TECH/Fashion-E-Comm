import fs from 'fs';
import path from 'path';

const baseDir = './Bulk-upload/output/images';
const folders = fs.readdirSync(baseDir);

let totalFiles = 0;
const counts = {};

for (const folder of folders) {
  const p = path.join(baseDir, folder);
  if (fs.statSync(p).isDirectory()) {
    const files = fs.readdirSync(p);
    totalFiles += files.length;
    counts[folder] = files;
  }
}

console.log('Total folders in Bulk-upload/output/images:', folders.length);
console.log('Total files across all folders:', totalFiles);
console.log('Sample folder files (AF-SAR-TEALGREE-001):', counts['AF-SAR-TEALGREE-001']);
console.log('Sample folder files (AF-SAR-DARKBLAC-033):', counts['AF-SAR-DARKBLAC-033']);
