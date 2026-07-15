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

function analyzePng(filePath) {
  const buf = readFileSync(filePath);
  const chunks = readChunks(buf);
  const ihdr = chunks.find(c => c.type === 'IHDR').data;
  const w = ihdr.readUInt32BE(0);
  const h = ihdr.readUInt32BE(4);
  const idat = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
  const raw = inflateSync(idat);
  
  // Let's sample a few pixels on the left side (x=50, y=h/2)
  // PNG layout: 1 filter byte + w*bpp bytes per row. Let's assume 4 bpp (RGBA) or 3 bpp (RGB)
  const bpp = raw.length / h / w > 3.5 ? 4 : 3;
  const rowSize = 1 + w * bpp;
  
  const y = Math.floor(h / 2);
  const x = 50;
  const idx = y * rowSize + 1 + x * bpp;
  const r = raw[idx];
  const g = raw[idx+1];
  const b = raw[idx+2];
  
  console.log(`${filePath}: pixel at (50, ${y}) is RGB(${r},${g},${b})`);
}

analyzePng('public/hero_new.png');
analyzePng('public/hero_new_alt.png');
