/**
 * Traduce cuerpos de funciones (plantillas con ${var}) que el generador deja en español.
 * Uso: node backend/scripts/patch-push-function-bodies.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'services');
const cachePath = join(__dirname, 'push-copy-translation-cache.json');
const outPath = join(servicesDir, 'pushNotificationCopyPools.en.js');
const tmpPath = join(servicesDir, '.push-pools-es-temp.mjs');

const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
const DELAY_MS = 80;

async function translateEsToEn(text) {
  if (cache[text]) return cache[text];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  const en = data[0].map((p) => p[0]).join('').trim();
  cache[text] = en;
  await new Promise((r) => setTimeout(r, DELAY_MS));
  return en;
}

function emitFnArray(name, params, strings, varName) {
  const paramList = params.join(', ');
  const lines = strings.map((s) => {
    const escaped = s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    return `    \`${escaped}\`,`;
  });
  return `${name}: (${paramList}) => [\n${lines.join('\n')}\n  ]`;
}

function emitTrialFn(name, esFn) {
  const d1 = esFn(1);
  const d3 = esFn(3);
  const en1 = d1.map((s) => translateEsToEn(s));
  const en3 = d3.map((s) => {
    const sample = s.replace(/3/g, '__DAYS__');
    return translateEsToEn(sample).then((t) => t.replace(/__DAYS__/g, '${days}').replace(/\b3\b/g, '${days}'));
  });
  return Promise.all([Promise.all(en1), Promise.all(en3)]).then(([a1, a3]) => {
    const b1 = a1.map((s) => `      ${JSON.stringify(s)},`).join('\n');
    const b3 = a3.map((s) => `      ${JSON.stringify(s)},`).join('\n');
    return `${name}: (d) => {
    const days = Number.isFinite(Number(d)) && Number(d) > 0 ? Math.min(365, Math.floor(Number(d))) : 1;
    if (days === 1) {
      return [
${b1}
      ];
    }
    return [
${b3}
    ];
  }`;
  });
}

let src = readFileSync(join(servicesDir, 'pushNotificationCopyPools.js'), 'utf8');
src = src.replace(/import \{[\s\S]*?\} from '\.\/pushNotificationCopyPools\.en\.js';\n\n/, '');
src = src.replace(/export function normalizeNotificationLanguage[\s\S]*?^export const PUSH_NOTIFICATION_COPY/m, 'export const PUSH_NOTIFICATION_COPY');
src = src.replace(/export function buildWeeklyProgressBody\([\s\S]*$/, '');
writeFileSync(tmpPath, src, 'utf8');
const { PUSH_NOTIFICATION_COPY: ES } = await import(pathToFileURL(tmpPath).href);

const patches = {};

// followUpWithHours
{
  const lines = [];
  for (const h of [2, 24, 48]) {
    for (const s of ES.followUpWithHours(h)) {
      lines.push(await translateEsToEn(s));
    }
  }
  const unique = [...new Set(ES.followUpWithHours(4))];
  const enStrings = [];
  for (const s of unique) {
    const sample = s.replace(/4/g, '__H__');
    let en = await translateEsToEn(sample);
    en = en.replace(/__H__/g, '${h}');
    enStrings.push(en);
  }
  patches.followUpWithHours = `(h) => [\n${enStrings.map((s) => `    ${JSON.stringify(s)},`).join('\n')}\n  ]`;
}

// habitReminder.bodies
{
  const sample = ES.habitReminder.bodies('__HABIT__');
  const enStrings = [];
  for (const s of sample) {
    const masked = s.replace(/__HABIT__/g, '___H___');
    let en = await translateEsToEn(masked);
    en = en.replace(/___H___/g, '${name}');
    enStrings.push(en);
  }
  patches['habitReminder.bodies'] = emitFnArray('bodies', ['name'], enStrings);
}

// habitMissed.bodies
{
  const sample = ES.habitMissed.bodies('__HABIT__', 5);
  const enStrings = [];
  for (const s of sample) {
    let masked = s.replace(/__HABIT__/g, '___H___').replace(/5/g, '__S__');
    let en = await translateEsToEn(masked);
    en = en.replace(/___H___/g, '${habitName}').replace(/__S__/g, '${streak}');
    enStrings.push(en);
  }
  patches['habitMissed.bodies'] = emitFnArray('bodies', ['habitName', 'streak'], enStrings);
}

// taskReminder.bodies
{
  const sample = ES.taskReminder.bodies('__TASK__');
  const enStrings = [];
  for (const s of sample) {
    let masked = s.replace(/__TASK__/g, '___T___');
    let en = await translateEsToEn(masked);
    en = en.replace(/___T___/g, '${taskTitle}');
    enStrings.push(en);
  }
  patches['taskReminder.bodies'] = emitFnArray('bodies', ['taskTitle'], enStrings);
}

writeFileSync(cachePath, JSON.stringify(cache), 'utf8');
console.log('Parches listos:', Object.keys(patches).join(', '));
console.log('Aplica manualmente o integra en generador. Cache actualizada:', Object.keys(cache).length);

unlinkSync(tmpPath);
