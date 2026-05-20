/**
 * Paridad de claves es/en en todos los *ApiCopy del backend.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const utilsDir = path.join(__dirname, '../../../utils');

function flattenKeys(obj, prefix = '') {
  const out = new Set();
  for (const [key, value] of Object.entries(obj || {})) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'function') {
      out.add(pathKey);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const k of flattenKeys(value, pathKey)) out.add(k);
    } else {
      out.add(pathKey);
    }
  }
  return out;
}

async function loadCopy(factoryName, file) {
  const mod = await import(pathToFileURL(path.join(utilsDir, file)).href);
  const factory = mod[factoryName];
  if (typeof factory !== 'function') {
    throw new Error(`Missing export ${factoryName} in ${file}`);
  }
  return { es: factory('es'), en: factory('en') };
}

describe('ApiCopy parity (es/en)', () => {
  const factories = fs
    .readdirSync(utilsDir)
    .filter((f) => f.endsWith('ApiCopy.js'))
    .map((f) => ({
      file: f,
      factory: f.replace('.js', '').replace(/^./, (c) => c),
    }))
    .map(({ file }) => ({
      file,
      factory: file.replace(/\.js$/, ''),
    }));

  it.each(factories)('$file tiene las mismas claves en es y en', async ({ file, factory }) => {
    const { es, en } = await loadCopy(factory, file);
    const esKeys = [...flattenKeys(es)].sort();
    const enKeys = [...flattenKeys(en)].sort();
    expect(enKeys).toEqual(esKeys);
  });
});
