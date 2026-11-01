const fs = require('fs');
let code = fs.readFileSync('src/app/routes.ts', 'utf8');
const oldT = '{ path: "pos", Component: AdminAanyaPage },';
const newT = '{ path: "pos", Component: AdminAanyaPage },\n          { path: "canceled-orders", Component: AdminAanyaPage },';
const norm = code.replace(/\r\n/g, '\n');
const updated = norm.replace(oldT, newT).replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/routes.ts', updated, 'utf8');
console.log('Successfully updated routes.ts');

