/**
 * Genera therapeuticTechniques.en.js desde el catálogo ES (traducción con caché).
 * Uso: node backend/scripts/generate-therapeutic-techniques-en.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cachePath = join(__dirname, 'therapeutic-techniques-translation-cache.json');
const outPath = join(__dirname, '../constants/therapeuticTechniques.en.js');
const esPath = join(__dirname, '../constants/therapeuticTechniques.js');

let cache = {};
try {
  cache = JSON.parse(readFileSync(cachePath, 'utf8'));
} catch {
  cache = {};
}

async function translateEsToEn(text) {
  if (!text?.trim()) return text;
  if (cache[text]) return cache[text];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  const en = data[0].map((p) => p[0]).join('').trim();
  cache[text] = en;
  await new Promise((r) => setTimeout(r, 80));
  return en;
}

async function translateTechnique(t) {
  const steps = [];
  for (const s of t.steps || []) steps.push(await translateEsToEn(s));
  return {
    name: await translateEsToEn(t.name),
    description: t.description ? await translateEsToEn(t.description) : t.description,
    whenToUse: t.whenToUse ? await translateEsToEn(t.whenToUse) : t.whenToUse,
    steps,
    type: t.type,
    emotions: t.emotions,
    interactiveExercise: t.interactiveExercise,
  };
}

// Importar solo catálogo ES (therapeuticTechniques.en.js puede ser stub vacío).
const esModule = await import(pathToFileURL(esPath).href);
const {
  IMMEDIATE_TECHNIQUES,
  CBT_TECHNIQUES,
  DBT_TECHNIQUES,
  ACT_TECHNIQUES,
} = esModule;

const IMMEDIATE_EN = {};
for (const [emotion, list] of Object.entries(IMMEDIATE_TECHNIQUES)) {
  IMMEDIATE_EN[emotion] = [];
  for (const t of list) {
    IMMEDIATE_EN[emotion].push(await translateTechnique(t));
    process.stderr.write('.');
  }
}

const CBT_EN = {};
for (const [key, t] of Object.entries(CBT_TECHNIQUES)) {
  CBT_EN[key] = await translateTechnique(t);
  process.stderr.write('.');
}

const DBT_EN = {};
for (const [key, t] of Object.entries(DBT_TECHNIQUES)) {
  DBT_EN[key] = await translateTechnique(t);
  process.stderr.write('.');
}

const ACT_EN = {};
for (const [key, t] of Object.entries(ACT_TECHNIQUES)) {
  ACT_EN[key] = await translateTechnique(t);
  process.stderr.write('.');
}

function serialize(obj, indent = 2) {
  return JSON.stringify(obj, null, indent)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")
    .replace(/'(\[|\{)/g, '"$1')
    .replace(/(\]|\})'/g, '$1"');
}

// Safer: emit as JSON module
const body = `/**
 * Therapeutic techniques catalog (English). Generated from ES; re-run generate-therapeutic-techniques-en.mjs after ES edits.
 */
export const IMMEDIATE_TECHNIQUES_EN = ${JSON.stringify(IMMEDIATE_EN, null, 2)};

export const CBT_TECHNIQUES_EN = ${JSON.stringify(CBT_EN, null, 2)};

export const DBT_TECHNIQUES_EN = ${JSON.stringify(DBT_EN, null, 2)};

export const ACT_TECHNIQUES_EN = ${JSON.stringify(ACT_EN, null, 2)};
`;

writeFileSync(outPath, body, 'utf8');
writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log('\nWrote', outPath);
