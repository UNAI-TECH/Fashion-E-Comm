const fs = require('fs');
const filePath = 'src/app/pages/admin/AdminAanyaPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const oldInterface = `interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    id: string; name: string; images?: string[]; image_url?: string;
  };
}`;

const newInterface = `interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  products?: {
    id: string; name: string; images?: string[]; image_url?: string;
  };
  [key: string]: any;
}`;

const norm = code.replace(/\r\n/g, '\n');
if (!norm.includes(oldInterface)) {
  console.error('Interface not found in code');
  process.exit(1);
}

const updated = norm.replace(oldInterface, newInterface).replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, updated, 'utf8');
console.log('Successfully updated OrderItem in AdminAanyaPage.tsx');
