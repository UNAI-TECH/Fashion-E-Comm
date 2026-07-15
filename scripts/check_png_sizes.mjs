import { readFileSync } from 'fs';

function getPngDimensions(filePath) {
  const buf = readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  console.log(`${filePath}: ${width}x${height}`);
}

getPngDimensions('public/hero_new.png');
getPngDimensions('public/hero_new_alt.png');
