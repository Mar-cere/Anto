#!/usr/bin/env node
/**
 * Verifica que no haya imports duplicados en los archivos del proyecto.
 * Ejecutar antes de build: npm run check:imports
 */
const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && !f.includes('node_modules') && !f.includes('__mocks__') && !f.includes('coverage')) {
      walk(p, files);
    } else if (/\.(js|jsx|ts|tsx)$/.test(f)) {
      files.push(p);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walk(srcDir);
let hasErrors = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const importMatches = [...content.matchAll(/import\s*\{([^}]+)\}\s*from/g)];
  for (const m of importMatches) {
    const items = m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    const seen = {};
    for (const item of items) {
      if (seen[item]) {
        console.error(`ERROR ${file}: import duplicado "${item}"`);
        hasErrors = true;
      }
      seen[item] = true;
    }
  }
}

if (hasErrors) {
  process.exit(1);
}
console.log('✓ No se encontraron imports duplicados');
