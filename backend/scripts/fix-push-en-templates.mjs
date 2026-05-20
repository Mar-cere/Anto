/**
 * Repara secciones EN rotas (taskReminder, taskOverdue, emergency live*, personalBest, fallbacks ES).
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { isSpanishish } from '../utils/pushCopyEnAudit.mjs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'services');
const cachePath = join(__dirname, 'push-copy-translation-cache.json');
const enPath = join(servicesDir, 'pushNotificationCopyPools.en.js');
const tmpPath = join(servicesDir, '.push-pools-es-temp.mjs');

const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
const DELAY_MS = 60;

async function translateEsToEn(text) {
  if (!text.trim()) return text;
  if (cache[text]) return cache[text];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
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

/** Extrae literales `...` respetando ${} y backticks internos en expresiones. */
function extractTemplateLiteralsFromFn(fn) {
  const src = fn.toString();
  const literals = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] !== '`') {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < src.length) {
      if (src[j] === '\\') {
        j += 2;
        continue;
      }
      if (src[j] === '$' && src[j + 1] === '{') {
        let depth = 1;
        j += 2;
        while (j < src.length && depth > 0) {
          if (src[j] === '{') depth += 1;
          else if (src[j] === '}') depth -= 1;
          j += 1;
        }
        continue;
      }
      if (src[j] === '`') break;
      j += 1;
    }
    const raw = src.slice(i + 1, j);
    literals.push(raw.replace(/\\`/g, '`').replace(/\\\$/g, '$'));
    i = j + 1;
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

function emitTemplateLiteralLine(s) {
  let out = '    `';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '$' && s[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < s.length && depth > 0) {
        if (s[j] === '{') depth += 1;
        else if (s[j] === '}') depth -= 1;
        j += 1;
      }
      out += s.slice(i, j);
      i = j;
    } else if (s[i] === '\\') {
      out += '\\\\';
      i += 1;
    } else if (s[i] === '`') {
      out += '\\`';
      i += 1;
    } else if (s[i] === '\n') {
      out += '\\n';
      i += 1;
    } else {
      out += s[i++];
    }
  }
  return `${out}\`,`;
}

function emitArrowArray(params, strings) {
  const lines = strings.map((s) => emitTemplateLiteralLine(s));
  return `(${params.join(', ')}) => [\n${lines.join('\n')}\n  ],`;
}

function replaceInObject(source, parent, child, newBlock, stopPattern) {
  const stop =
    stopPattern ||
    (child === 'testBodies'
      ? '\\n    liveTitles:'
      : child === 'liveBodies'
        ? '\\n  \\},\\n  [a-zA-Z_$]'
        : parent === 'taskOverdue' && child === 'bodies'
          ? '\\n  \\},\\n  taskDueSoon'
          : '\\n  \\},\\n  [a-zA-Z_$]');
  const re = new RegExp(
    `(${parent}:\\s*\\{[\\s\\S]*?${child}:\\s*)([\\s\\S]*?)(?=${stop})`,
    'm',
  );
  if (!re.test(source)) throw new Error(`No match ${parent}.${child}`);
  return source.replace(re, `$1${newBlock}`);
}

async function emitTaskOverdueBodies(esFn) {
  const literals = extractTemplateLiteralsFromFn(esFn);
  const enLits = await translateLiteralList(literals);
  const lines = enLits.map((s) => `      ${JSON.stringify(s)},`).join('\n');
  return `(taskTitle, daysOverdue) => {
    const d = daysOverdue > 1 ? \`\${daysOverdue} days ago\` : 'today';
    return [
${lines}
    ];
  }`;
}

async function emitPersonalBestBodies(esFn) {
  const trackEn = await translateEsToEn('tu seguimiento');
  const keepEn = await translateEsToEn('¡sigue así!');
  const literals = extractTemplateLiteralsFromFn(esFn);
  const enLits = await translateLiteralList(literals);
  const lines = enLits.map((s) => emitTemplateLiteralLine(s).replace(/^    /, '      ')).join('\n');
  return `(metric, value) => {
    const m = metric || '${trackEn.replace(/'/g, "\\'")}';
    const v = value ?? '${keepEn.replace(/'/g, "\\'")}';
    return [
${lines}
    ];
  }`;
}

const LIVE_TITLES = [
  '🚨 Emergency Alert Sent',
  '🚨 Contacts notified',
  '🚨 Alert activated',
  '🚨 Notice sent',
  '🚨 Emergency: notice issued',
  '🚨 Alert in progress',
  '🚨 Contacts notified',
  '🚨 Emergency signal',
  '🚨 Risk notice',
  '🚨 Support network alerted',
  '🚨 Notice in progress',
  '🚨 Team alerted',
  '🚨 Emergency in progress',
  '🚨 Contacts on the way',
  '🚨 Signal sent',
  '🚨 Help on the way',
  '🚨 Alert with network',
  '🚨 Contacts activated',
  '🚨 Maximum priority',
  '🚨 Your security',
  '🚨 Priority notice',
  '🚨 Network mobilized',
  '🚨 Priority signal',
  '🚨 Support notified',
  '🚨 Emergency attended',
];

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

const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const runSection = (name) => !ONLY || ONLY.has(name);

let enFile = readFileSync(enPath, 'utf8');

const NESTED_BACKTICK_WORD_MAP = [
  ['Fecha límite:', 'Deadline:'],
  ['Fecha límite', 'Deadline'],
  ['Toca antes de', 'Due before'],
  ['Antes de', 'Before'],
  ['Recuerda:', 'Remember:'],
  ['Recuerda', 'Remember'],
  ['Vence', 'Due'],
  ['Fecha', 'Date'],
  ['fecha', 'date'],
  ['Plazo', 'Deadline'],
  ['Toca', 'Due'],
  ['Para', 'By'],
];

function translateNestedBackticksInExpr(expr) {
  return expr.replace(/`([^`\\]|\\.)*`/g, (match) => {
    let en = match.slice(1, -1);
    for (const [es, enW] of NESTED_BACKTICK_WORD_MAP) {
      en = en.split(es).join(enW);
    }
    return `\`${en}\``;
  });
}

async function translateTemplateLiteral(esStr) {
  const { masked, exprs } = maskTemplateExpressions(esStr);
  let en = await translateEsToEn(masked);
  for (const { key, expr } of exprs) {
    let enExpr = translateNestedBackticksInExpr(expr);
    const innerMatches = [...enExpr.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)];
    for (const m of innerMatches) {
      const inner = m[1].replace(/\\'/g, "'");
      if (isSpanishish(inner)) {
        const enInner = await translateEsToEn(inner);
        enExpr = enExpr.replace(m[0], `'${enInner.replace(/'/g, "\\'")}'`);
      }
    }
    enExpr = enExpr.replace(/\\\\'/g, "\\'");
    en = en.split(key).join(enExpr);
  }
  return en;
}

if (runSection('taskReminder')) console.log('Reparando taskReminder.bodies...');
if (runSection('taskReminder')) {
const tr = await translateLiteralList(extractTemplateLiteralsFromFn(ES.taskReminder.bodies));
enFile = replaceInObject(
  enFile,
  'taskReminder',
  'bodies',
  emitArrowArray(['taskTitle', 'dueDate'], tr),
  '\\n  \\},\\n  taskOverdue',
);
writeFileSync(enPath, enFile, 'utf8');
}

if (runSection('taskOverdue')) console.log('Reparando taskOverdue.bodies...');
if (runSection('taskOverdue')) {
enFile = replaceInObject(
  enFile,
  'taskOverdue',
  'bodies',
  await emitTaskOverdueBodies(ES.taskOverdue.bodies),
  '\\n  \\},\\n  taskDueSoon',
);
writeFileSync(enPath, enFile, 'utf8');
}

if (runSection('personalBest')) console.log('Reparando personalBest.bodies...');
if (runSection('personalBest')) {
enFile = replaceInObject(
  enFile,
  'personalBest',
  'bodies',
  await emitPersonalBestBodies(ES.personalBest.bodies),
  '\\n  \\},\\n  weeklyProgress',
);
writeFileSync(enPath, enFile, 'utf8');
}

if (runSection('emergencySent')) console.log('Restaurando emergencySent.liveTitles + liveBodies...');
if (runSection('emergencySent')) {
const liveLits = await translateLiteralList(extractTemplateLiteralsFromFn(ES.emergencySent.liveBodies));
const liveTitlesBlock = `liveTitles: [\n${LIVE_TITLES.map((t) => `      ${JSON.stringify(t)},`).join('\n')}\n    ]`;
const liveBodiesBlock = `liveBodies: ${emitArrowArray(['ok', 'total'], liveLits)}`;
enFile = enFile.replace(
  /(testBodies: \(ok, total\) => \[[\s\S]*?\n  \])\n  \},\n  crisisResources:/,
  `$1,\n    ${liveTitlesBlock},\n    ${liveBodiesBlock}\n  },\n  crisisResources:`,
);
// Si liveBodies quedó sin etiqueta (reparación incremental)
enFile = enFile.replace(/\n    \(ok, total\) => \[\n    `We have detected a risk/s, '\n    liveBodies: (ok, total) => [\n    `We have detected a risk');

console.log('Reparando techniqueBodies fallbacks...');
const tech = await translateLiteralList(extractTemplateLiteralsFromFn(ES.techniqueBodies));
enFile = enFile.replace(
  /techniqueBodies: \(technique, emotion\) => \[[\s\S]*?\n  \],/,
  `techniqueBodies: ${emitArrowArray(['technique', 'emotion'], tech)},`,
);
}

if (runSection('progressPositive')) console.log('Reparando progressPositive.bodies...');
if (runSection('progressPositive')) {
const pp = await translateLiteralList(extractTemplateLiteralsFromFn(ES.progressPositive.bodies));
enFile = replaceInObject(
  enFile,
  'progressPositive',
  'bodies',
  emitArrowArray(['achievement'], pp),
  '\\n  \\},\\n  habitReminder',
);
writeFileSync(enPath, enFile, 'utf8');
}

if (runSection('taskDueSoon')) console.log('Reparando taskDueSoon.bodies...');
if (runSection('taskDueSoon')) {
const tds = await translateLiteralList(extractTemplateLiteralsFromFn(ES.taskDueSoon.bodies));
enFile = replaceInObject(
  enFile,
  'taskDueSoon',
  'bodies',
  emitArrowArray(['taskTitle', 'dueIn'], tds),
  '\\n  \\},\\n  dailyCheckIn',
);
writeFileSync(enPath, enFile, 'utf8');
}

if (runSection('achievement')) console.log('Reparando achievement.bodies...');
if (runSection('achievement')) {
const ach = await translateLiteralList(extractTemplateLiteralsFromFn(ES.achievement.bodies));
enFile = replaceInObject(
  enFile,
  'achievement',
  'bodies',
  emitArrowArray(['name', 'description'], ach),
  '\\n  \\},\\n  streak',
);
writeFileSync(enPath, enFile, 'utf8');
}

if (runSection('emergencyContactUpdated')) console.log('Reparando emergencyContactUpdated.bodiesWithName...');
if (runSection('emergencyContactUpdated')) {
const bn = await translateLiteralList(
  extractTemplateLiteralsFromFn(ES.emergencyContactUpdated.bodiesWithName),
);
enFile = replaceInObject(
  enFile,
  'emergencyContactUpdated',
  'bodiesWithName',
  emitArrowArray(['name'], bn),
  '\\n    bodiesGeneric',
);
}

writeFileSync(enPath, enFile, 'utf8');
writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log('Listo.');
