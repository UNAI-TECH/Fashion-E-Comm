import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

import { createRequire } from 'module';
const require = createRequire(path.join(rootDir, 'server', 'index.js'));
const sharp = require('sharp');

async function convertJpgToWebp() {
  console.log('--- Scanning public directory for JPG and JPEG images ---');
  const files = fs.readdirSync(publicDir);
  
  let convertedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      const baseName = path.basename(file, ext);
      const webpFileName = `${baseName}.webp`;
      const webpFilePath = path.join(publicDir, webpFileName);
      const sourceFilePath = path.join(publicDir, file);

      try {
        const image = sharp(sourceFilePath);
        const metadata = await image.metadata();

        await image
          .webp({ quality: 85, effort: 4 })
          .toFile(webpFilePath);

        const srcSize = fs.statSync(sourceFilePath).size;
        const webpSize = fs.statSync(webpFilePath).size;
        const savings = Math.round(((srcSize - webpSize) / srcSize) * 100);

        console.log(`✓ Converted: ${file} -> ${webpFileName} (${Math.round(webpSize / 1024)} KB, ${savings}% smaller)`);
        convertedCount++;
      } catch (err) {
        console.error(`✗ Error converting ${file}:`, err.message);
      }
    }
  }

  // Also check subdirectories like banners/ or fonts/
  const subdirs = ['banners'];
  for (const sub of subdirs) {
    const subPath = path.join(publicDir, sub);
    if (fs.existsSync(subPath)) {
      const subFiles = fs.readdirSync(subPath);
      for (const file of subFiles) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
          const baseName = path.basename(file, ext);
          const webpFileName = `${baseName}.webp`;
          const webpFilePath = path.join(subPath, webpFileName);
          const sourceFilePath = path.join(subPath, file);
          try {
            await sharp(sourceFilePath)
              .webp({ quality: 85, effort: 4 })
              .toFile(webpFilePath);
            console.log(`✓ Converted subfile: ${sub}/${file} -> ${sub}/${webpFileName}`);
            convertedCount++;
          } catch (e) {
            console.error(`✗ Subfile error ${file}:`, e.message);
          }
        }
      }
    }
  }

  console.log(`\n=== Done: Successfully converted ${convertedCount} images to WebP ===`);
}

convertJpgToWebp().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
