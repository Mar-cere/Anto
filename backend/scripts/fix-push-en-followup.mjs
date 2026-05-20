/**
 * Corrige followUpWithHours en pushNotificationCopyPools.en.js preservando ${h}.
 * Traduce solo los segmentos de texto entre variables de plantilla.
 */
import { readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'services');
const { PUSH_NOTIFICATION_COPY } = await import(
  pathToFileURL(join(servicesDir, 'pushNotificationCopyPools.js')).href
);

const fn = PUSH_NOTIFICATION_COPY.followUpWithHours;
const literals = [...fn.toString().matchAll(/`((?:\\.|[^`\\])*)`/g)].map((m) =>
  m[1].replace(/\\`/g, '`').replace(/\\\\/g, '\\'),
);

const DELAY_MS = 80;

async function translatePart(text) {
  if (!text || !text.trim()) return text;
  const lead = text.match(/^\s*/)[0];
  const trail = text.match(/\s*$/)[0];
  const core = text.trim();
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(core)}`;
  const res = await fetch(url);
  const data = await res.json();
  await new Promise((r) => setTimeout(r, DELAY_MS));
  const en = data[0].map((p) => p[0]).join('').trim();
  return `${lead}${en}${trail}`;
}

async function translateTplPreserveVars(inner) {
  const parts = inner.split(/(\$\{[^}]+\})/);
  const out = [];
  for (const part of parts) {
    if (/^\$\{[^}]+\}$/.test(part)) {
      out.push(part);
    } else {
      out.push(await translatePart(part));
    }
  }
  return out.join('');
}

const enLines = [];
for (const inner of literals) {
  enLines.push(await translateTplPreserveVars(inner));
}

const body = enLines
  .map((s) => `    \`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`)
  .join('\n');
const block = `  followUpWithHours: (h) => [\n${body}\n  ],`;

let enFile = readFileSync(join(servicesDir, 'pushNotificationCopyPools.en.js'), 'utf8');
enFile = enFile.replace(/  followUpWithHours: \(h\) => \[[\s\S]*?\n  \],/, block);
writeFileSync(join(servicesDir, 'pushNotificationCopyPools.en.js'), enFile);
console.log('OK followUpWithHours', enLines.length);
console.log(enLines[0]);
