/**
 * Genera therapeuticTemplates.en.js desde el catálogo ES.
 */
import { readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cachePath = join(__dirname, 'therapeutic-templates-translation-cache.json');
const outPath = join(__dirname, '../constants/therapeuticTemplates.en.js');
const esPath = join(__dirname, '../constants/therapeuticTemplates.es.js');

let cache = {};
try {
  cache = JSON.parse(readFileSync(cachePath, 'utf8'));
} catch {
  cache = {};
}

async function translateEsToEn(text) {
  if (typeof text !== 'string') return text;
  if (!text.trim()) return text;
  if (cache[text]) return cache[text];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  const en = data[0].map((p) => p[0]).join('').trim();
  cache[text] = en;
  await new Promise((r) => setTimeout(r, 80));
  return en;
}

async function translateNode(node) {
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) out.push(await translateEsToEn(item));
    return out;
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = await translateNode(value);
    }
    return out;
  }
  if (typeof node === 'string') {
    process.stderr.write('.');
    return translateEsToEn(node);
  }
  return node;
}

const { THERAPEUTIC_TEMPLATES_ES } = await import(pathToFileURL(esPath).href);
const THERAPEUTIC_TEMPLATES_EN = await translateNode(THERAPEUTIC_TEMPLATES_ES);

const body = `/**
 * Therapeutic chat templates (English). Generated from ES.
 */
export const THERAPEUTIC_TEMPLATES_EN = ${JSON.stringify(THERAPEUTIC_TEMPLATES_EN, null, 2)};
`;

writeFileSync(outPath, body, 'utf8');
writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log('\nWrote', outPath);
