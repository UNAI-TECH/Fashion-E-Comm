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

function getAverageRGB(filePath) {
  const buf = readFileSync(filePath);
  const chunks = readChunks(buf);
  const idat = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
  const raw = inflateSync(idat);
  
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  // Let's sample raw bytes directly
  for (let i = 0; i < raw.length; i += 100) {
    rSum += raw[i];
    if (i+1 < raw.length) gSum += raw[i+1];
    if (i+2 < raw.length) bSum += raw[i+2];
    count++;
  }
  
  console.log(`${filePath}: avg R=${Math.round(rSum/count)}, G=${Math.round(gSum/count)}, B=${Math.round(bSum/count)}`);
}

getAverageRGB('public/hero_new.png');
getAverageRGB('public/hero_new_alt.png');
