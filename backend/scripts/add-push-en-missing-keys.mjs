/**
 * Añade wellbeingCheckIn y techniqueTitles al pool EN desde ES.
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isSpanishish } from '../utils/pushCopyEnAudit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'services');
const cachePath = join(__dirname, 'push-copy-translation-cache.json');
const enPath = join(servicesDir, 'pushNotificationCopyPools.en.js');
const tmpPath = join(servicesDir, '.push-pools-es-temp.mjs');
const cache = JSON.parse(readFileSync(cachePath, 'utf8'));

async function translateEsToEn(text) {
  if (!text.trim()) return text;
  if (cache[text]) return cache[text];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  const en = data[0].map((p) => p[0]).join('').trim();
  cache[text] = en;
  await new Promise((r) => setTimeout(r, 60));
  return en;
}

async function translateList(arr) {
  const out = [];
  for (const s of arr) out.push(await translateEsToEn(s));
  return out;
}

let src = readFileSync(join(servicesDir, 'pushNotificationCopyPools.js'), 'utf8');
src = src.replace(/import \{[\s\S]*?\} from '\.\/pushNotificationCopyPools\.en\.js';\n\n/, '');
src = src.replace(
  /export function normalizeNotificationLanguage[\s\S]*?^export const PUSH_NOTIFICATION_COPY/m,
  'export const PUSH_NOTIFICATION_COPY',
);
src = src.replace(/export function buildWeeklyProgressBody\([\s\S]*$/, '');
writeFileSync(tmpPath, src, 'utf8');
const { PUSH_NOTIFICATION_COPY: ES } = await import(pathToFileURL(tmpPath).href);
unlinkSync(tmpPath);

const titles = await translateList(ES.wellbeingCheckIn.titles);
const bodies = await translateList(ES.wellbeingCheckIn.bodies);
const techTitles = await translateList(ES.techniqueTitles);

const block = `  wellbeingCheckIn: {
    titles: [
${titles.map((t) => `      ${JSON.stringify(t)},`).join('\n')}
    ],
    bodies: [
${bodies.map((t) => `      ${JSON.stringify(t)},`).join('\n')}
    ],
  },
  techniqueTitles: [
${techTitles.map((t) => `    ${JSON.stringify(t)},`).join('\n')}
  ],
`;

let enFile = readFileSync(enPath, 'utf8');
if (enFile.includes('wellbeingCheckIn:')) {
  console.log('wellbeingCheckIn ya existe; omitiendo.');
} else {
  enFile = enFile.replace(
    /(\],\n)(  techniqueBodies:)/,
    `$1${block}$2`,
  );
  writeFileSync(enPath, enFile, 'utf8');
  console.log('Añadidos wellbeingCheckIn y techniqueTitles.');
}

writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
