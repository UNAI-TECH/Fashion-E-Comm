/**
 * Strips white/near-white pixels from a PNG, making them fully transparent.
 * Uses only Node.js built-in modules (no external dependencies).
 * Run with: node scripts/remove_logo_bg.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { inflateSync, deflateSync } from 'zlib';

const inputPath  = 'public/logo_aanya.png';
const outputPath = 'public/logo_aanya.png'; // overwrite in-place

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
  // CRC covers type + data
  let crc = 0xFFFFFFFF;
  for (const b of typeBuf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  for (const b of data)    crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  crc = (crc ^ 0xFFFFFFFF) >>> 0;
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Build CRC lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}

// Paeth predictor (PNG filter type 4)
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
  // Use filter type 0 (None) – simplest, always valid
  return rows.map(row => Buffer.concat([Buffer.from([0]), row]));
}

// ── Main ─────────────────────────────────────────────────────────────────────

const inputBuf = readFileSync(inputPath);

// Verify PNG signature
if (!inputBuf.slice(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error('Not a valid PNG file');
}

const chunks = readChunks(inputBuf);

// Parse IHDR
const ihdr = chunks.find(c => c.type === 'IHDR').data;
const width      = ihdr.readUInt32BE(0);
const height     = ihdr.readUInt32BE(4);
const bitDepth   = ihdr[8];
const colorType  = ihdr[9]; // 2 = RGB, 6 = RGBA

console.log(`Logo: ${width}x${height} px, bitDepth=${bitDepth}, colorType=${colorType}`);

if (bitDepth !== 8) throw new Error(`Only 8-bit PNG supported, got ${bitDepth}`);

const hasAlpha = colorType === 4 || colorType === 6;
const bppIn    = colorType === 2 ? 3 : colorType === 6 ? 4 : colorType === 0 ? 1 : 2;

// Concatenate all IDAT chunks and decompress
const idatData = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
const raw      = inflateSync(idatData);

// Split into rows (each row has 1 filter byte + width*bpp bytes)
const rowSize = 1 + width * bppIn;
const rows = [];
for (let y = 0; y < height; y++) rows.push(raw.slice(y * rowSize, (y + 1) * rowSize));

// Unfilter
const pixelRows = unfilter(rows, width, bppIn);

// Convert to RGBA and strip white background
const rgbaRows = pixelRows.map(row => {
  const rgba = Buffer.alloc(width * 4);
  for (let x = 0; x < width; x++) {
    let r, g, b, a;
    if (bppIn === 3) {       // RGB
      r = row[x * 3];
      g = row[x * 3 + 1];
      b = row[x * 3 + 2];
      a = 255;
    } else if (bppIn === 4) { // RGBA
      r = row[x * 4];
      g = row[x * 4 + 1];
      b = row[x * 4 + 2];
      a = row[x * 4 + 3];
    } else {                  // Greyscale
      r = g = b = row[x];
      a = 255;
    }

    // ── Background removal logic ──
    // Make near-white pixels (r,g,b all > 220) fully transparent.
    // Also partially transparent for anti-aliased edges.
    const whiteness = Math.min(r, g, b); // how white this pixel is
    if (whiteness > 220) {
      // Fully transparent
      a = 0;
    } else if (whiteness > 180) {
      // Partially transparent for smooth edges
      a = Math.round(a * (1 - (whiteness - 180) / 40));
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

// Pack into raw buffer
const newRaw = Buffer.concat(filteredRows);

// Compress
const compressed = deflateSync(newRaw, { level: 9 });

// Build new IHDR (force colorType = 6 = RGBA)
const newIhdr = Buffer.from(ihdr);
newIhdr[9] = 6; // RGBA

// Rebuild PNG
const parts = [
  PNG_SIGNATURE,
  writeChunk('IHDR', newIhdr),
  writeChunk('IDAT', compressed),
  writeChunk('IEND', Buffer.alloc(0)),
];

writeFileSync(outputPath, Buffer.concat(parts));
console.log(`✅ Saved transparent logo → ${outputPath}`);
