import { readFileSync, writeFileSync, existsSync } from 'fs';
import { inflateSync, deflateSync } from 'zlib';

const inputPath  = 'public/hero_new.png';
const backupPath = 'public/hero_new_backup.png';
const outputPath = 'public/hero_new.png';

// ── Create backup ────────────────────────────────────────────────────────────
if (!existsSync(backupPath)) {
  writeFileSync(backupPath, readFileSync(inputPath));
  console.log(`Backed up original hero image to ${backupPath}`);
}

// ── PNG binary helpers ────────────────────────────────────────────────────────
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readChunks(buf) {
  const chunks = [];
  let offset = 8; // skip signature
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type   = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data   = buf.slice(offset + 8, offset + 8 + length);
    chunks.push({ length, type, data });
    offset += 12 + length; // 4 len + 4 type + data + 4 crc
  }
  return chunks;
}

function writeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  
  let crc = 0xFFFFFFFF;
  for (const b of typeBuf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  for (const b of data)    crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  crc = (crc ^ 0xFFFFFFFF) >>> 0;
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
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

function refilter(rows, w, bpp) {
  return rows.map(row => Buffer.concat([Buffer.from([0]), row]));
}

// ── Main ─────────────────────────────────────────────────────────────────────
const inputBuf = readFileSync(inputPath);

if (!inputBuf.slice(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error('Not a valid PNG file');
}

const chunks = readChunks(inputBuf);
const ihdr = chunks.find(c => c.type === 'IHDR').data;
const width      = ihdr.readUInt32BE(0);
const height     = ihdr.readUInt32BE(4);
const bitDepth   = ihdr[8];
const colorType  = ihdr[9];

console.log(`Hero image: ${width}x${height} px, bitDepth=${bitDepth}, colorType=${colorType}`);

if (bitDepth !== 8) throw new Error(`Only 8-bit PNG supported, got ${bitDepth}`);

const bppIn = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 2;
const idatData = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
const raw = inflateSync(idatData);

const rowSize = 1 + width * bppIn;
const rows = [];
for (let y = 0; y < height; y++) {
  rows.push(raw.slice(y * rowSize, (y + 1) * rowSize));
}

const pixelRows = unfilter(rows, width, bppIn);

// ── Background detection and Flood Fill ──────────────────────────────────────
function isBackgroundColor(r, g, b) {
  return (
    r >= 240 && r <= 255 &&
    g >= 190 && g <= 238 &&
    b >= 200 && b <= 242 &&
    (r - g) >= 12 && (r - g) <= 60 &&
    (r - b) >= 8 && (r - b) <= 50
  );
}

function isProtectedZone(x, y) {
  // Protect the phone screen area
  return x >= 865 && x <= 965 && y >= 115 && y <= 405;
}

const visited = new Uint8Array(width * height);
const queue = [];

// Seed from borders
for (let x = 0; x < width; x++) {
  // Top border
  let idx = 0 * width + x;
  let row = pixelRows[0];
  if (!isProtectedZone(x, 0) && isBackgroundColor(row[x * bppIn], row[x * bppIn + 1], row[x * bppIn + 2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
  // Bottom border
  idx = (height - 1) * width + x;
  row = pixelRows[height - 1];
  if (!isProtectedZone(x, height - 1) && isBackgroundColor(row[x * bppIn], row[x * bppIn + 1], row[x * bppIn + 2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
}

for (let y = 1; y < height - 1; y++) {
  const row = pixelRows[y];
  // Left border
  let idx = y * width + 0;
  if (!isProtectedZone(0, y) && isBackgroundColor(row[0], row[1], row[2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
  // Right border
  idx = y * width + (width - 1);
  if (!isProtectedZone(width - 1, y) && isBackgroundColor(row[(width - 1) * bppIn], row[(width - 1) * bppIn + 1], row[(width - 1) * bppIn + 2])) {
    visited[idx] = 1;
    queue.push(idx);
  }
}

let head = 0;
const dx = [0, 0, 1, -1];
const dy = [1, -1, 0, 0];

while (head < queue.length) {
  const curr = queue[head++];
  const cx = curr % width;
  const cy = Math.floor(curr / width);

  for (let i = 0; i < 4; i++) {
    const nx = cx + dx[i];
    const ny = cy + dy[i];

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const nidx = ny * width + nx;
      if (visited[nidx] === 0 && !isProtectedZone(nx, ny)) {
        const row = pixelRows[ny];
        const r = row[nx * bppIn];
        const g = row[nx * bppIn + 1];
        const b = row[nx * bppIn + 2];

        if (isBackgroundColor(r, g, b)) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }
  }
}

// ── Rebuild into RGBA rows ───────────────────────────────────────────────────
const rgbaRows = pixelRows.map((row, y) => {
  const rgba = Buffer.alloc(width * 4);
  for (let x = 0; x < width; x++) {
    let r, g, b, a;
    if (bppIn === 3) {
      r = row[x * 3];
      g = row[x * 3 + 1];
      b = row[x * 3 + 2];
      a = 255;
    } else if (bppIn === 4) {
      r = row[x * 4];
      g = row[x * 4 + 1];
      b = row[x * 4 + 2];
      a = row[x * 4 + 3];
    } else {
      r = g = b = row[x];
      a = 255;
    }

    // If marked as background, set alpha to 0
    const idx = y * width + x;
    if (visited[idx] === 1) {
      a = 0;
    }

    rgba[x * 4]     = r;
    rgba[x * 4 + 1] = g;
    rgba[x * 4 + 2] = b;
    rgba[x * 4 + 3] = a;
  }
  return rgba;
});

// Re-filter (filter type 0 = None)
const filteredRows = refilter(rgbaRows, width, 4);
const newRaw = Buffer.concat(filteredRows);
const compressed = deflateSync(newRaw, { level: 9 });

const newIhdr = Buffer.from(ihdr);
newIhdr[9] = 6; // Set color type to 6 (RGBA)

const parts = [
  PNG_SIGNATURE,
  writeChunk('IHDR', newIhdr),
  writeChunk('IDAT', compressed),
  writeChunk('IEND', Buffer.alloc(0)),
];

writeFileSync(outputPath, Buffer.concat(parts));
console.log(`✅ Success! Background box removed from ${outputPath}`);
