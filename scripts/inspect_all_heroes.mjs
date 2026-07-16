import { readFileSync, readdirSync } from 'fs';
import { inflateSync } from 'zlib';
import { join } from 'path';

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

function inspectPng(filePath) {
  try {
    const buf = readFileSync(filePath);
    if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      console.log(`${filePath}: Not a PNG`);
      return;
    }
    const chunks = readChunks(buf);
    const ihdr = chunks.find(c => c.type === 'IHDR').data;
    const w = ihdr.readUInt32BE(0);
    const h = ihdr.readUInt32BE(4);
    const colorType = ihdr[9];
    const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 2;
    const colorTypeName = colorType === 6 ? 'RGBA' : colorType === 2 ? 'RGB' : colorType === 0 ? 'Greyscale' : 'Indexed';
    
    // Concatenate all IDAT chunks and decompress
    const idatData = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
    const raw = inflateSync(idatData);
    
    // Split into rows (each row has 1 filter byte + width*bpp bytes)
    const rowSize = 1 + w * bpp;
    const rows = [];
    for (let y = 0; y < h; y++) {
      rows.push(raw.slice(y * rowSize, (y + 1) * rowSize));
    }
    
    // Unfilter
    const pixelRows = unfilter(rows, w, bpp);
    
    // Let's check some corners and the middle
    // Corner pixel
    const topLeftRow = pixelRows[0];
    const tlR = topLeftRow[0];
    const tlG = topLeftRow[1];
    const tlB = topLeftRow[2];
    const tlA = bpp === 4 ? topLeftRow[3] : 255;
    
    // Center pixel
    const centerRow = pixelRows[Math.floor(h / 2)];
    const cIdx = Math.floor(w / 2) * bpp;
    const cR = centerRow[cIdx];
    const cG = centerRow[cIdx+1];
    const cB = centerRow[cIdx+2];
    const cA = bpp === 4 ? centerRow[cIdx+3] : 255;

    // Count transparent pixels vs solid pixels
    let transparentCount = 0;
    let solidCount = 0;
    for (let y = 0; y < h; y++) {
      const row = pixelRows[y];
      for (let x = 0; x < w; x++) {
        const a = bpp === 4 ? row[x * bpp + 3] : 255;
        if (a === 0) {
          transparentCount++;
        } else {
          solidCount++;
        }
      }
    }
    const transparencyPct = (transparentCount / (w * h) * 100).toFixed(1);

    console.log(`${filePath}: ${w}x${h} (${colorTypeName}), TL-pixel=RGBA(${tlR},${tlG},${tlB},${tlA}), C-pixel=RGBA(${cR},${cG},${cB},${cA}), Transp=${transparencyPct}%`);
  } catch (e) {
    console.error(`Error inspecting ${filePath}:`, e.message);
  }
}

const dir = 'public';
const files = readdirSync(dir).filter(f => f.startsWith('hero_') && f.endsWith('.png'));
for (const f of files) {
  inspectPng(join(dir, f));
}
