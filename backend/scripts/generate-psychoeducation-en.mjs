/**
 * Genera psychoeducation.en.js desde el catálogo ES.
 * Uso: node backend/scripts/generate-psychoeducation-en.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cachePath = join(__dirname, 'psychoeducation-translation-cache.json');
const outPath = join(__dirname, '../constants/psychoeducation.en.js');
const esPath = join(__dirname, '../constants/psychoeducation.js');

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
      if (typeof value === 'string') process.stderr.write('.');
    }
    return out;
  }
  if (typeof node === 'string') {
    process.stderr.write('.');
    return translateEsToEn(node);
  }
  return node;
}

const { PSYCHOEDUCATION_MODULES } = await import(pathToFileURL(esPath).href);

const PSYCHOEDUCATION_MODULES_EN = await translateNode(PSYCHOEDUCATION_MODULES);

const body = `/**
 * Psychoeducation modules (English). Generated from ES; re-run generate-psychoeducation-en.mjs after ES edits.
 */
export const PSYCHOEDUCATION_MODULES_EN = ${JSON.stringify(PSYCHOEDUCATION_MODULES_EN, null, 2)};
`;

writeFileSync(outPath, body, 'utf8');
writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log('\nWrote', outPath);
