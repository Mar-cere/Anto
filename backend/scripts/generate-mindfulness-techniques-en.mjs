/**
 * Genera mindfulnessTechniques.en.js desde el catálogo ES.
 */
import { readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cachePath = join(__dirname, 'mindfulness-techniques-translation-cache.json');
const outPath = join(__dirname, '../constants/mindfulnessTechniques.en.js');
const esPath = join(__dirname, '../constants/mindfulnessTechniques.js');

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

async function translateTechniqueLeaf(technique) {
  const steps = [];
  for (const s of technique.steps || []) steps.push(await translateEsToEn(s));
  return {
    name: await translateEsToEn(technique.name),
    description: technique.description
      ? await translateEsToEn(technique.description)
      : technique.description,
    steps,
  };
}

async function translateNode(node) {
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) out.push(await translateEsToEn(item));
    return out;
  }
  if (node && typeof node === 'object') {
    if (Array.isArray(node.steps) && typeof node.name === 'string') {
      process.stderr.write('.');
      return translateTechniqueLeaf(node);
    }
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = await translateNode(value);
    }
    return out;
  }
  return node;
}

const { MINDFULNESS_TECHNIQUES, GROUNDING_TECHNIQUES } = await import(
  pathToFileURL(esPath).href
);

const MINDFULNESS_EN = await translateNode(MINDFULNESS_TECHNIQUES);
const GROUNDING_EN = await translateNode(GROUNDING_TECHNIQUES);

const body = `/**
 * Mindfulness / grounding catalog (English). Generated from ES.
 */
export const MINDFULNESS_TECHNIQUES_EN = ${JSON.stringify(MINDFULNESS_EN, null, 2)};

export const GROUNDING_TECHNIQUES_EN = ${JSON.stringify(GROUNDING_EN, null, 2)};
`;

writeFileSync(outPath, body, 'utf8');
writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log('\nWrote', outPath);
