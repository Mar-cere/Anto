/**
 * Regenera funciones paramétricas del pool EN preservando ${...} desde el pool ES.
 * Uso: node backend/scripts/apply-push-en-parametric-patches.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'services');
const cachePath = join(__dirname, 'push-copy-translation-cache.json');
const enPath = join(servicesDir, 'pushNotificationCopyPools.en.js');
const tmpPath = join(servicesDir, '.push-pools-es-temp.mjs');

const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
const DELAY_MS = 80;

async function translateEsToEn(text) {
  if (!text.trim()) return text;
  if (cache[text]) return cache[text];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate HTTP ${res.status}`);
  const data = await res.json();
  const en = data[0].map((p) => p[0]).join('').trim();
  cache[text] = en;
  await new Promise((r) => setTimeout(r, DELAY_MS));
  return en;
}

function maskTemplateExpressions(str) {
  const exprs = [];
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '$' && str[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < str.length && depth > 0) {
        if (str[j] === '{') depth += 1;
        else if (str[j] === '}') depth -= 1;
        j += 1;
      }
      const expr = str.slice(i, j);
      const key = `__E${exprs.length}__`;
      exprs.push({ key, expr });
      result += key;
      i = j;
    } else {
      result += str[i++];
    }
  }
  return { masked: result, exprs };
}

function translateSpanishStringLiteralsInExpr(expr) {
  return expr.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (full, inner) => {
    if (!/[áéíóúñ¿¡]|\\b(de|que|para|con|sin|una|tus)\\b/i.test(inner)) return full;
    const en = cache[inner] || null;
    if (en) return `'${en.replace(/'/g, "\\'")}'`;
    return full;
  });
}

async function translateTemplateLiteral(esStr) {
  const { masked, exprs } = maskTemplateExpressions(esStr);
  let en = await translateEsToEn(masked);
  for (const { key, expr } of exprs) {
    let enExpr = expr;
    const innerMatches = [...expr.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)];
    for (const m of innerMatches) {
      const inner = m[1];
      if (/[áéíóúñ¿¡]|\b(de|que|para|con|sin|mañana|olvides|olvida)\b/i.test(inner)) {
        const enInner = await translateEsToEn(inner);
        enExpr = enExpr.replace(`'${inner}'`, `'${enInner.replace(/'/g, "\\'")}'`);
      }
    }
    en = en.split(key).join(enExpr);
  }
  return en;
}

function extractArrowArrayLiterals(fn) {
  const src = fn.toString();
  const literals = [];
  const re = /`((?:\\.|[^`\\])*)`/g;
  let m;
  while ((m = re.exec(src))) {
    literals.push(m[1].replace(/\\`/g, '`').replace(/\\\$/g, '$'));
  }
  return literals;
}

async function translateLiteralList(esLiterals) {
  const out = [];
  for (const lit of esLiterals) {
    out.push(await translateTemplateLiteral(lit));
  }
  return out;
}

function emitArrowArray(params, strings) {
  const paramList = params.join(', ');
  const lines = strings.map((s) => `    ${JSON.stringify(s)},`);
  return `(${paramList}) => [\n${lines.join('\n')}\n  ]`;
}

async function emitTrialFn(name, esFn) {
  const en1 = [];
  for (const lit of esFn(1)) {
    en1.push(await translateTemplateLiteral(String(lit)));
  }
  const en3 = [];
  for (const lit of esFn(3)) {
    const sample = String(lit).replace(/\$\{days\}/g, '__DAYS__').replace(/\b3\b/g, '__DAYS__');
    let en = await translateTemplateLiteral(sample);
    en = en.replace(/__DAYS__/g, '${days}');
    en3.push(en);
  }
  const b1 = en1.map((s) => `      \`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`).join('\n');
  const b3 = en3.map((s) => `      \`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`).join('\n');
  return `(d) => {
    const days =
      Number.isFinite(Number(d)) && Number(d) > 0 ? Math.min(365, Math.floor(Number(d))) : 1;
    if (days === 1) {
      return [
${b1}
      ];
    }
    return [
${b3}
    ];
  }`;
}

async function emitTaskOverdueBodies(esFn) {
  const withOverdue = await translateLiteralList(extractArrowArrayLiterals(esFn));
  const esSrc = esFn.toString();
  const dLine = esSrc.match(/const d = daysOverdue[^;]+;/);
  const dEn = dLine
    ? dLine[0]
        .replace('hace ${daysOverdue} días', '${daysOverdue} days ago')
        .replace("'hoy'", "'today'")
    : "const d = daysOverdue > 1 ? `${daysOverdue} days ago` : 'today';";
  const lines = withOverdue.map((s) => `      \`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`).join('\n');
  return `bodies: (taskTitle, daysOverdue) => {
    ${dEn}
    return [
${lines}
    ];
  }`;
}

async function emitPersonalBestBodies(esFn) {
  const trackEn = await translateEsToEn('tu seguimiento');
  const keepEn = await translateEsToEn('¡sigue así!');
  const mConst = `const m = metric || '${trackEn.replace(/'/g, "\\'")}';`;
  const vConst = `const v = value ?? '${keepEn.replace(/'/g, "\\'")}';`;
  const literals = extractArrowArrayLiterals(esFn);
  const enLits = await translateLiteralList(literals);
  const lines = enLits.map((s) => `      \`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`).join('\n');
  return `bodies: (metric, value) => {
    ${mConst}
    ${vConst}
    return [
${lines}
    ];
  }`;
}

function replaceNestedBlock(source, path, newInner) {
  const [parent, child] = path.includes('.') ? path.split('.') : [null, path];
  if (parent) {
    const parentRe = new RegExp(
      `(${parent}:\\s*\\{[\\s\\S]*?${child}:\\s*)([\\s\\S]*?)(\\n  \\},\\n  [a-zA-Z_$])`,
      'm',
    );
    if (!parentRe.test(source)) throw new Error(`No se encontró ${path}`);
    return source.replace(parentRe, `$1${newInner}$3`);
  }
  const re = new RegExp(`(${child}:\\s*)([\\s\\S]*?)(\\n  [a-zA-Z_$][a-zA-Z0-9_$]*:)`, 'm');
  if (!re.test(source)) throw new Error(`No se encontró ${child}`);
  return source.replace(re, `$1${newInner}$3`);
}

function saveEn(enFile) {
  writeFileSync(enPath, enFile, 'utf8');
  writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

function replaceTopLevelFn(source, name, newFn) {
  const re = new RegExp(`(${name}:\\s*)([\\s\\S]*?)(\\n  [a-zA-Z_$][a-zA-Z0-9_$]*:)`, 'm');
  if (!re.test(source)) throw new Error(`No se encontró ${name}`);
  return source.replace(re, `$1${newFn}$3`);
}

let src = readFileSync(join(servicesDir, 'pushNotificationCopyPools.js'), 'utf8');
src = src.replace(/import \{[\s\S]*?\} from '\.\/pushNotificationCopyPools\.en\.js';\n\n/, '');
src = src.replace(/export function normalizeNotificationLanguage[\s\S]*?^export const PUSH_NOTIFICATION_COPY/m, 'export const PUSH_NOTIFICATION_COPY');
src = src.replace(/export function buildWeeklyProgressBody\([\s\S]*$/, '');
writeFileSync(tmpPath, src, 'utf8');
const { PUSH_NOTIFICATION_COPY: ES } = await import(pathToFileURL(tmpPath).href);
unlinkSync(tmpPath);

let enFile = readFileSync(enPath, 'utf8');
console.log('Traduciendo funciones paramétricas...');

const patches = [
  ['followUpWithHours', () => translateLiteralList(extractArrowArrayLiterals(ES.followUpWithHours)).then((l) => emitArrowArray(['h'], l))],
  ['techniqueBodies', () => translateLiteralList(extractArrowArrayLiterals(ES.techniqueBodies)).then((l) => emitArrowArray(['technique', 'emotion'], l))],
  ['trialExpiringTitles', () => emitTrialFn('trialExpiringTitles', ES.trialExpiringTitles)],
  ['trialExpiringBodies', () => emitTrialFn('trialExpiringBodies', ES.trialExpiringBodies)],
];

for (const [name, build] of patches) {
  const block = await build();
  enFile = replaceTopLevelFn(enFile, name, block);
  saveEn(enFile);
  console.log('  ✓', name);
}

const nested = [
  ['progressPositive.bodies', ['achievement'], ES.progressPositive.bodies],
  ['habitReminder.bodies', ['name'], ES.habitReminder.bodies],
  ['habitMissed.bodies', ['habitName', 'streak'], ES.habitMissed.bodies],
  ['taskReminder.bodies', ['taskTitle', 'dueDate'], ES.taskReminder.bodies],
  ['taskDueSoon.bodies', ['taskTitle', 'dueIn'], ES.taskDueSoon.bodies],
  ['dailyCheckIn.titles', ['greeting'], ES.dailyCheckIn.titles],
  ['achievement.bodies', ['name', 'description'], ES.achievement.bodies],
  ['streak.bodies', ['streak', 'typeText'], ES.streak.bodies],
  ['emergencySent.testBodies', ['ok', 'total'], ES.emergencySent.testBodies],
  ['emergencySent.liveBodies', ['ok', 'total'], ES.emergencySent.liveBodies],
  ['emergencyContactUpdated.bodiesWithName', ['name'], ES.emergencyContactUpdated.bodiesWithName],
];

for (const [path, params, esFn] of nested) {
  const lits = await translateLiteralList(extractArrowArrayLiterals(esFn));
  const block = emitArrowArray(params, lits);
  enFile = replaceNestedBlock(enFile, path, block);
  saveEn(enFile);
  console.log('  ✓', path);
}

enFile = replaceNestedBlock(
  enFile,
  'taskOverdue.bodies',
  await emitTaskOverdueBodies(ES.taskOverdue.bodies),
);
saveEn(enFile);
console.log('  ✓ taskOverdue.bodies');

enFile = replaceNestedBlock(
  enFile,
  'personalBest.bodies',
  await emitPersonalBestBodies(ES.personalBest.bodies),
);
saveEn(enFile);
console.log('  ✓ personalBest.bodies');

console.log('Listo:', enPath);
