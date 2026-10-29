import fs from 'fs';
import path from 'path';

function findImages(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findImages(fullPath));
      } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(file)) {
        results.push({ path: fullPath, size: stat.size });
      }
    }
  } catch (e) {}
  return results;
}

const imgs = findImages('.');
const dirGroups = {};
for (const img of imgs) {
  const d = path.dirname(img.path);
  dirGroups[d] = (dirGroups[d] || 0) + 1;
}

console.log('Image directories:');
for (const [d, count] of Object.entries(dirGroups)) {
  console.log(`  ${d}: ${count} files`);
}
