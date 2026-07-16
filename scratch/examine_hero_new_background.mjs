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

const { pixels, w, h, bpp } = getPixels('public/hero_new.png');

console.log(`Analyzing hero_new.png (${w}x${h}):`);
// Sample row y = 100, 200, 300 at x = 0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000
const ys = [100, 200, 300];
const xs = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1023];

ys.forEach(y => {
  console.log(`y = ${y}:`);
  const row = pixels[y];
  let rowStr = '';
  xs.forEach(x => {
    const r = row[x * bpp];
    const g = row[x * bpp + 1];
    const b = row[x * bpp + 2];
    rowStr += `x=${x}:RGB(${r},${g},${b})  `;
  });
  console.log(`  ${rowStr}`);
});
