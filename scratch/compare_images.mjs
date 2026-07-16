import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';

function readChunks(buf) {
  const chunks = [];
  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type   = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data   = buf.slice(offset + 8, offset + 8 + length);
    chunks.push({ length, type, data });
    offset += 12 + length;
  }
  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function unfilter(rows, w, bpp) {
  const out = [];
  for (let y = 0; y < rows.length; y++) {
    const row     = rows[y];
    const prev    = y > 0 ? out[y - 1] : Buffer.alloc(w * bpp);
    const type    = row[0];
    const pixels  = row.slice(1);
    const result  = Buffer.alloc(w * bpp);
    for (let x = 0; x < w * bpp; x++) {
      const a = x >= bpp ? result[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      const raw = pixels[x];
      switch (type) {
        case 0: result[x] = raw; break;
        case 1: result[x] = (raw + a) & 0xFF; break;
        case 2: result[x] = (raw + b) & 0xFF; break;
        case 3: result[x] = (raw + Math.floor((a + b) / 2)) & 0xFF; break;
        case 4: result[x] = (raw + paeth(a, b, c)) & 0xFF; break;
        default: result[x] = raw;
      }
    }
    out.push(result);
  }
  return out;
}

function getPixels(filePath) {
  const buf = readFileSync(filePath);
  const chunks = readChunks(buf);
  const ihdr = chunks.find(c => c.type === 'IHDR').data;
  const w = ihdr.readUInt32BE(0);
  const h = ihdr.readUInt32BE(4);
  const colorType = ihdr[9];
  const bpp = colorType === 6 ? 4 : 3;
  const idatData = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
  const raw = inflateSync(idatData);
  const rowSize = 1 + w * bpp;
  const rows = [];
  for (let y = 0; y < h; y++) {
    rows.push(raw.slice(y * rowSize, (y + 1) * rowSize));
  }
  return { pixels: unfilter(rows, w, bpp), w, h, bpp };
}

const imgNew = getPixels('public/hero_new.png');
const imgGirl = getPixels('public/hero_girl_phone.png');

console.log(`Sizes: hero_new = ${imgNew.w}x${imgNew.h}, hero_girl_phone = ${imgGirl.w}x${imgGirl.h}`);

// Let's sample a few points in both images
let matchingPixels = 0;
let comparedPixels = 0;

for (let y = 0; y < imgNew.h; y += 10) {
  const rNew = imgNew.pixels[y];
  const rGirl = imgGirl.pixels[y];
  for (let x = 0; x < imgNew.w; x += 10) {
    const aGirl = imgGirl.bpp === 4 ? rGirl[x * imgGirl.bpp + 3] : 255;
    if (aGirl > 200) { // Opaque in girl image
      comparedPixels++;
      const diffR = Math.abs(rNew[x * imgNew.bpp] - rGirl[x * imgGirl.bpp]);
      const diffG = Math.abs(rNew[x * imgNew.bpp + 1] - rGirl[x * imgGirl.bpp + 1]);
      const diffB = Math.abs(rNew[x * imgNew.bpp + 2] - rGirl[x * imgGirl.bpp + 2]);
      if (diffR < 10 && diffG < 10 && diffB < 10) {
        matchingPixels++;
      }
    }
  }
}

console.log(`Matching opaque pixels percentage: ${(matchingPixels / comparedPixels * 100).toFixed(1)}% (sampled ${comparedPixels} pixels)`);
