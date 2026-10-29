import fs from 'fs';
import path from 'path';

const base = './product Images';
const folders = fs.readdirSync(base);
console.log('Total product folders:', folders.length);
console.log('\nFirst 5 product folders and their images:');
folders.slice(0, 5).forEach(f => {
  const p = path.join(base, f);
  const files = fs.readdirSync(p);
  console.log(`- [${f}]:`, files);
});

console.log('\nLast 5 product folders and their images:');
folders.slice(-5).forEach(f => {
  const p = path.join(base, f);
  const files = fs.readdirSync(p);
  console.log(`- [${f}]:`, files);
});

let totalImages = 0;
let nonImageFiles = 0;

for (const folder of folders) {
  const p = path.join(base, folder);
  const files = fs.readdirSync(p);
  for (const file of files) {
    if (/\.(png|jpe?g|webp)$/i.test(file)) {
      totalImages++;
    } else {
      nonImageFiles++;
      console.log(`Non-image found: ${folder}/${file}`);
    }
  }
}

console.log(`\nFinal Audit:`);
console.log(`- Total Folders: ${folders.length}`);
console.log(`- Total Images: ${totalImages}`);
console.log(`- Non-image files: ${nonImageFiles} (must be 0)`);
