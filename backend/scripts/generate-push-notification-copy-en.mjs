/**
 * Genera pushNotificationCopyPools.en.js con traducción ES→EN (Google Translate + caché).
 *
 * Uso: node backend/scripts/generate-push-notification-copy-en.mjs
 * Primera ejecución requiere red (~20 min). Siguientes usan push-copy-translation-cache.json.
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'services');
const scriptsDir = join(__dirname, '.');
const srcPath = join(servicesDir, 'pushNotificationCopyPools.js');
const outPath = join(servicesDir, 'pushNotificationCopyPools.en.js');
const tmpPath = join(servicesDir, '.push-pools-es-temp.mjs');
const cachePath = join(scriptsDir, 'push-copy-translation-cache.json');

const DELAY_MS = 80;
const MAX_SPANISH_PERCENT = 5;

const MANUAL_OVERRIDES = {
  '⚠️ Cuidado con tu bienestar': '⚠️ Take care of your wellbeing',
  'Detectamos que estás pasando por un momento difícil. ¿Quieres que te ayudemos con técnicas de regulación?':
    'We noticed you may be going through a difficult moment. Would you like help with regulation techniques?',
  '⚠️ Aquí puedes soltar peso': '⚠️ Here you can let go of some weight',
  'Si hoy solo puedes escribir “estoy mal”, ya es información suficiente para empezar.':
    'If today you can only write “I am not okay”, that is enough to get started.',
};

/** Correcciones post-traducción automática (falsos amigos / tono). */
const POLISH_EN = [
  [/Here you can lose weight/gi, 'Here you can let go of some weight'],
  [/I'm sick/gi, "I'm not okay"],
  [/asking for a witness is also careful/gi, 'asking for a witness is also care'],
  [/is also a good idea\./gi, 'is also an attempt.'],
  [/We can go step/gi, 'we can go step'],
  [/It loses a little/gi, 'it loses a little'],
  [/sigue abierta/gi, 'is still open'],
  [/¿"/g, '"'],
  [/Vence \$\{dueDate\}/g, 'Due ${dueDate}'],
];

let cache = {};
if (existsSync(cachePath)) {
  try {
    cache = JSON.parse(readFileSync(cachePath, 'utf8'));
  } catch (_) {
    cache = {};
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isSpanishish(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  return /(?:\b(qué|que|del|las|los|tus|tu|estás|esta|para|con|sin|hoy|mañana|hace)\b|ci[oó]n|mente\b|hábito|tarea|¿|¡)/i.test(
    text,
  );
}

function polishEn(text) {
  let s = text;
  for (const [re, rep] of POLISH_EN) {
    s = s.replace(re, rep);
  }
  return s;
}

async function translateEsToEn(text) {
  if (!text || typeof text !== 'string') return text;
  if (MANUAL_OVERRIDES[text]) return polishEn(MANUAL_OVERRIDES[text]);
  if (cache[text]) return polishEn(cache[text]);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate failed (${res.status}): ${text.slice(0, 60)}…`);
  const data = await res.json();
  const en = data[0]
    .map((p) => p[0])
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  cache[text] = polishEn(en);
  await sleep(DELAY_MS);
  return cache[text];
}

function maskTemplateVars(inner) {
  const vars = [];
  const masked = inner.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    const token = `__V${vars.length}__`;
    vars.push({ token, expr });
    return token;
  });
  return { masked, vars };
}

function sampleValueForExpr(expr) {
  const e = String(expr).trim();
  if (['name', 'habitName', 'taskTitle', 'technique', 'achievement'].includes(e)) return 'Morning walk';
  if (e === 'dueDate') return 'Friday';
  if (e === 'h') return '4';
  if (e === 'streak') return '5';
  if (e === 'days' || e === 'd') return '3';
  if (e === 'greeting') return 'Good morning';
  if (e === 'emotion') return 'anxiety';
  return 'Sample';
}

function unmaskTemplateVars(text, vars) {
  let out = text;
  for (const { token, expr } of vars) {
    out = out.split(token).join('${' + expr + '}');
  }
  return out;
}

async function translatePartPreservingSpaces(text) {
  if (!text || !text.trim()) return text;
  const lead = text.match(/^\s*/)[0];
  const trail = text.match(/\s*$/)[0];
  const core = text.trim();
  if (!core) return text;
  const en = await translateEsToEn(core);
  return `${lead}${en}${trail}`;
}

/** Traduce plantillas conservando ${variables} y espacios alrededor. */
async function translateTemplateInner(inner) {
  const cacheKey = `tpl:${inner}`;
  if (cache[cacheKey]) {
    return polishEn(cache[cacheKey]);
  }

  const parts = inner.split(/(\$\{[^}]+\})/);
  const out = [];
  for (const part of parts) {
    if (/^\$\{[^}]+\}$/.test(part)) {
      out.push(part);
    } else {
      out.push(await translatePartPreservingSpaces(part));
    }
  }
  const restored = polishEn(out.join(''));
  cache[cacheKey] = restored;
  return restored;
}

function parseFnParams(fn) {
  const src = fn.toString().trim();
  const arrow = src.match(/^(?:async\s*)?\(?([^)=]*)\)?\s*=>/);
  if (arrow) {
    return arrow[1]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  const classic = src.match(/^(?:async\s*)?function\s*\w*\s*\(([^)]*)\)/);
  if (classic) {
    return classic[1]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

function sampleArgsForParams(params) {
  return params.map((p) => sampleValueForExpr(p));
}

async function translateStringList(strings) {
  const out = [];
  for (const s of strings) {
    if (typeof s !== 'string') continue;
    out.push(await translateEsToEn(s));
  }
  return out;
}

function emitStringLiteral(s) {
  if (s.includes('${')) {
    const escaped = String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    return `\`${escaped}\``;
  }
  return JSON.stringify(s);
}

function emitArrowArray(params, strings, indent = 2) {
  const pad = '  '.repeat(indent);
  const inner = strings.map((s) => `${pad}  ${emitStringLiteral(s)}`).join(',\n');
  const sig = params.length ? `(${params.join(', ')})` : '()';
  return `${sig} => [\n${inner},\n${pad}]`;
}

function emitArrowBlock(params, bodySrc, indent = 2) {
  const pad = '  '.repeat(indent);
  const sig = params.length ? `(${params.join(', ')})` : '()';
  const body = bodySrc.trim().startsWith('{') ? bodySrc : `{ return ${bodySrc}; }`;
  return `${sig} => ${body}`;
}

/**
 * Extrae literales de plantilla/comilla simple del cuerpo de una función.
 */
function extractFnStringLiterals(fn) {
  const src = fn.toString();
  const templates = [...src.matchAll(/`((?:\\.|[^`\\])*)`/g)].map((m) =>
    m[1].replace(/\\`/g, '`').replace(/\\\\/g, '\\'),
  );
  if (templates.length > 0) return templates.filter((s) => s.trim());
  return [...src.matchAll(/'((?:\\.|[^'\\])*)'/g)]
    .map((m) => m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'))
    .filter((s) => s.trim());
}

/**
 * Traduce funciones reconstruyendo arrays EN (preserva ${...} en plantillas).
 */
async function translateFunctionViaCache(fn, path = '') {
  const params = parseFnParams(fn);
  const args = sampleArgsForParams(params);

  const literals = extractFnStringLiterals(fn);
  const hasComplexTemplate = literals.some(
    (s) => /\$\{[^}]+\?/.test(s) || /\?[^:]*:/.test(s),
  );
  const prefersTemplates =
    !hasComplexTemplate &&
    params.some((p) => ['h', 'dueDate', 'habitName', 'taskTitle', 'daysOverdue', 'dueIn'].includes(p)) &&
    literals.some((s) => s.includes('${'));
  if ((literals.length >= 3 && !hasComplexTemplate) || (prefersTemplates && literals.length > 0)) {
    const enTemplates = [];
    for (const inner of literals) {
      let translated = inner.includes('${')
        ? await translateTemplateInner(inner)
        : await translateEsToEn(inner);
      const varsInInner = [...inner.matchAll(/\$\{([^}]+)\}/g)].map((m) => m[1].trim());
      for (const expr of varsInInner) {
        if (!translated.includes('${' + expr)) {
          delete cache[`tpl:${inner}`];
          translated = await translateTemplateInner(inner);
          break;
        }
      }
      enTemplates.push(translated);
    }
    return emitArrowArray(params, enTemplates);
  }

  try {
    const result = fn(...args);
    if (Array.isArray(result)) {
      const enStrings = await translateStringList(result);
      return emitArrowArray(params, enStrings);
    }
    if (typeof result === 'string') {
      const en = await translateEsToEn(result);
      return emitArrowArray(params, [en]).replace(' => [', ' => ').replace(/\n\s*\]$/, '');
    }
  } catch (_) {
    // noop — probar variantes
  }

  // Funciones con ramas (p. ej. taskOverdue): evaluar variantes conocidas
  if (path.endsWith('taskOverdue.bodies') && params.length >= 2) {
    const withDate = await translateStringList(fn('Pay bills', 'Friday'));
    const noDate = await translateStringList(fn('Pay bills', null));
    const body = `{
    const list = ${JSON.stringify(withDate)};
    if (dueDate) return list;
    return ${JSON.stringify(noDate)};
  }`;
    return emitArrowBlock(params, body);
  }

  if (path.endsWith('progressMilestones.bodies') && params.length >= 2) {
    const en = await translateStringList(fn('streak', 'habits'));
    return emitArrowArray(params, en);
  }

  if (path.includes('trialExpiring') && params.length === 1) {
    const en1 = await translateStringList(fn(2));
    const en2 = await translateStringList(fn(1));
    const merged = en1.length >= en2.length ? en1 : en2;
    return emitArrowArray(params, merged);
  }

  // Último recurso: traducir literales simples del fuente sin tocar plantillas
  let src = fn.toString();
  const tplFixes = [
    [/`\s*Vence\s*\$\{dueDate\}\s*`/g, '`Due ${dueDate}`'],
    [/`\s*Vence\s*\$\{dueDate\}\.\s*`/g, '`Due ${dueDate}.`'],
    [/`\s*Fecha límite:\s*\$\{dueDate\}\.\s*`/g, '`Deadline: ${dueDate}.`'],
    [/Han pasado \$\{h\}/g, '${h} hours have passed'],
    [/Llevas unas \$\{h\}/g, 'About ${h}'],
    [/Desde hace \$\{h\}/g, '${h} hours ago'],
    [/Ya van \$\{h\}/g, "It's been ${h}"],
  ];
  for (const [re, rep] of tplFixes) {
    src = src.replace(re, rep);
  }
  return polishEn(src);
}

async function serialize(value, indent = 0, path = '') {
  const pad = '  '.repeat(indent);
  if (typeof value === 'string') {
    return JSON.stringify(await translateEsToEn(value));
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = [];
    for (const v of value) {
      items.push(`${pad}  ${await serialize(v, indent + 1, path)}`);
    }
    return `[\n${items.join(',\n')}\n${pad}]`;
  }
  if (typeof value === 'function') {
    return await translateFunctionViaCache(value, path);
  }
  if (value && typeof value === 'object') {
    const lines = [];
    for (const [k, v] of Object.entries(value)) {
      const childPath = path ? `${path}.${k}` : k;
      lines.push(`${pad}  ${k}: ${await serialize(v, indent + 1, childPath)}`);
    }
    return `{\n${lines.join(',\n')}\n${pad}}`;
  }
  return 'null';
}

function countSpanishInPools(obj) {
  let total = 0;
  let es = 0;
  function walk(v) {
    if (typeof v === 'string') {
      total++;
      if (isSpanishish(v)) es++;
      return;
    }
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'function') {
      try {
        walk(
          v('Habit', 'Task', 3, 2, 'morning', 'breathing', 'anxiety', 'win', 1),
        );
      } catch (_) {
        // noop
      }
    } else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  }
  walk(obj);
  return { total, es, pct: total ? (100 * es) / total : 0 };
}

// --- main ---
let src = readFileSync(srcPath, 'utf8');
src = src.replace(
  /import \{[\s\S]*?\} from '\.\/pushNotificationCopyPools\.en\.js';\n\n/,
  '',
);
src = src.replace(
  /export function normalizeNotificationLanguage[\s\S]*?^export const PUSH_NOTIFICATION_COPY/m,
  'export const PUSH_NOTIFICATION_COPY',
);
src = src.replace(/export function buildWeeklyProgressBody\([\s\S]*$/, '');

writeFileSync(tmpPath, src, 'utf8');
const { PUSH_NOTIFICATION_COPY: ES } = await import(pathToFileURL(tmpPath).href);

console.log('Generando EN (caché:', Object.keys(cache).length, 'entradas)…');
const enSerialized = await serialize(ES);
writeFileSync(cachePath, JSON.stringify(cache), 'utf8');

const out = `/**
 * Push notification copy pools (English).
 * Generated by scripts/generate-push-notification-copy-en.mjs
 * Re-run after editing pushNotificationCopyPools.js (Spanish source).
 */

export function pickRandom(arr, fallback = '') {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const v = arr[Math.floor(Math.random() * arr.length)];
  if (v === undefined || v === null) return fallback;
  return v;
}

export const PUSH_NOTIFICATION_COPY_EN = ${enSerialized};

export function buildWeeklyProgressBodyEn(completedHabits, completedTasks, emotionalTrend) {
  const hn = Number(completedHabits);
  const tn = Number(completedTasks);
  const h = Number.isFinite(hn) ? Math.max(0, Math.min(99999, Math.floor(hn))) : 0;
  const t = Number.isFinite(tn) ? Math.max(0, Math.min(99999, Math.floor(tn))) : 0;
  const openings = [
    \`This week you completed \${h} habits and \${t} tasks.\`,
    \`Weekly balance: \${h} habits and \${t} tasks done.\`,
    \`In numbers: \${h} habits and \${t} tasks closed this week.\`,
    \`Quick summary: \${h} habits and \${t} tasks checked off. That counts as care too.\`,
    \`Your week left \${h} habits completed and \${t} tasks resolved.\`,
    \`Between \${h} habits and \${t} tasks, the balance shows where you put your energy.\`,
    \`Week logged: \${h} habits and \${t} tasks. That deserves a pause too.\`,
    \`Weekly log: \${h} habits and \${t} tasks.\`,
    \`This week: \${h} habits completed and \${t} tasks done.\`,
    \`Quick read: \${h} habits and \${t} tasks in your recent history.\`,
    \`Week in numbers: \${h} habits and \${t} tasks done.\`,
    \`Honest balance: \${h} habits and \${t} tasks logged.\`,
  ];
  let body = openings[Math.floor(Math.random() * openings.length)];
  if (emotionalTrend === 'improving') {
    const improving = [
      ' Your emotional wellbeing is improving.',
      ' There is a favorable shift in how you feel.',
      ' The emotional trend is rising: notice the pace.',
    ];
    body += improving[Math.floor(Math.random() * improving.length)];
  } else if (emotionalTrend === 'stable') {
    const stable = [
      ' Your emotional wellbeing is holding steady.',
      ' Your mood is on a sustainable plateau.',
      ' Steady weeks are valid progress too.',
    ];
    body += stable[Math.floor(Math.random() * stable.length)];
  } else if (emotionalTrend) {
    const needsCare = [
      ' Your emotional wellbeing needs a bit more care.',
      ' The emotional climate asked for more support this week.',
      ' If your mood dipped, adjust the load, not your worth.',
    ];
    body += needsCare[Math.floor(Math.random() * needsCare.length)];
  }
  return body;
}
`;

writeFileSync(outPath, out, 'utf8');
try {
  unlinkSync(tmpPath);
} catch (_) {
  // noop
}

let mod;
try {
  mod = await import(pathToFileURL(outPath).href);
} catch (e) {
  console.error('Syntax error in generated file:', e.message);
  process.exit(1);
}

const { PUSH_NOTIFICATION_COPY_EN } = mod;
const stats = countSpanishInPools(PUSH_NOTIFICATION_COPY_EN);
console.log('OK', outPath);
console.log('crisisWarning[0]:', PUSH_NOTIFICATION_COPY_EN.crisisWarning.titles[0]);
console.log('midday count:', PUSH_NOTIFICATION_COPY_EN.motivational?.midday?.length);
console.log(`Spanish-like: ${stats.es}/${stats.total} (${stats.pct.toFixed(1)}%)`);

if (stats.pct > MAX_SPANISH_PERCENT) {
  console.warn(`WARN: ${stats.pct.toFixed(1)}% strings look Spanish (umbral ${MAX_SPANISH_PERCENT}%)`);
}
