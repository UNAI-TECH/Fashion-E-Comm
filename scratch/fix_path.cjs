const fs = require('fs');
let code = fs.readFileSync('src/app/pages/admin/AdminAanyaPage.tsx', 'utf8');
const oldLine = "if (path.endsWith('/orders')) return 'orders';";
const newLine = "if (path.endsWith('/orders')) return 'orders';\n    if (path.endsWith('/canceled-orders') || path.endsWith('/cancelled-orders')) return 'canceled-orders';";
const norm = code.replace(/\r\n/g, '\n');
const updated = norm.replace(oldLine, newLine).replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/pages/admin/AdminAanyaPage.tsx', updated, 'utf8');
console.log('Added canceled-orders path routing in AdminAanyaPage.tsx');

