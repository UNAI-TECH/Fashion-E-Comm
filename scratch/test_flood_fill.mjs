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

// Helper to check if a pixel is background color
function isBackgroundColor(r, g, b) {
  return (
    r >= 240 && r <= 255 &&
    g >= 190 && g <= 238 &&
    b >= 200 && b <= 242 &&
    (r - g) >= 12 && (r - g) <= 60 &&
    (r - b) >= 8 && (r - b) <= 50
  );
}

const visited = new Uint8Array(w * h);
const queue = [];

// Seed from borders
for (let x = 0; x < w; x++) {
  // Top border
  let idx = 0 * w + x;
  let row = pixels[0];
  if (isBackgroundColor(row[x * bpp], row[x * bpp + 1], row[x * bpp + 2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
  // Bottom border
  idx = (h - 1) * w + x;
  row = pixels[h - 1];
  if (isBackgroundColor(row[x * bpp], row[x * bpp + 1], row[x * bpp + 2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
}

for (let y = 1; y < h - 1; y++) {
  const row = pixels[y];
  // Left border
  let idx = y * w + 0;
  if (isBackgroundColor(row[0], row[1], row[2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
  // Right border
  idx = y * w + (w - 1);
  if (isBackgroundColor(row[(w - 1) * bpp], row[(w - 1) * bpp + 1], row[(w - 1) * bpp + 2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
}

// BFS Flood Fill
let head = 0;
const dx = [0, 0, 1, -1];
const dy = [1, -1, 0, 0];

while (head < queue.length) {
  const curr = queue[head++];
  const cx = curr % w;
  const cy = Math.floor(curr / w);

  for (let i = 0; i < 4; i++) {
    const nx = cx + dx[i];
    const ny = cy + dy[i];

    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const nidx = ny * w + nx;
      if (visited[nidx] === 0) {
        const row = pixels[ny];
        const r = row[nx * bpp];
        const g = row[nx * bpp + 1];
        const b = row[nx * bpp + 2];

        if (isBackgroundColor(r, g, b)) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }
  }
}

// Analyze the results
let bgCount = 0;
let fgCount = 0;
let minFgX = w, maxFgX = 0, minFgY = h, maxFgY = 0;

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = y * w + x;
    if (visited[idx] === 1) {
      bgCount++;
    } else {
      fgCount++;
      if (x < minFgX) minFgX = x;
      if (x > maxFgX) maxFgX = x;
      if (y < minFgY) minFgY = y;
      if (y > maxFgY) maxFgY = y;
    }
  }
}

console.log(`Flood Fill results:`);
console.log(`  Background pixels: ${bgCount} (${(bgCount / (w * h) * 100).toFixed(1)}%)`);
console.log(`  Foreground pixels: ${fgCount} (${(fgCount / (w * h) * 100).toFixed(1)}%)`);
console.log(`  Foreground Bounding Box: [${minFgX}, ${minFgY}] to [${maxFgX}, ${maxFgY}]`);

// Test if phone screen pixels were marked (x: 880-920, y: 200-300)
let phoneMarked = 0;
for (let y = 200; y <= 300; y++) {
  for (let x = 880; x <= 920; x++) {
    const idx = y * w + x;
    if (visited[idx] === 1) {
      phoneMarked++;
    }
  }
}
console.log(`  Phone screen pixels accidentally marked: ${phoneMarked} / ${(101 * 41)}`);
