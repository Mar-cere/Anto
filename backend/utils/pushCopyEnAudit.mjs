/**
 * Auditoría del pool push EN: español residual, fugas de muestra, placeholders y fallbacks || en español.
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SPANISH_IN_STRING =
  /(?:\b(qué|que|del|las|tus|estás|para|hace|mañana|pronto|tarea|hábito|avance|logro|paso|hoy|este|esta|tu|tus|una|celebra|comparte|insignia|veces|pendiente|plazo|esfuerzo|cuidado|proceso|hito|venza|cercano|cuando|olvides|sin fecha|no olvides|eliges)\b|ci[oó]n|mente\b|¿|¡)/i;

const BAD_PATTERNS = [
  { re: /lose weight/i, label: 'falso amigo (soltar peso)' },
  { re: /I'm sick/i, label: 'estoy mal mal traducido' },
  { re: /\b(Vence|sigue|mañana|hábito|tarea|¿|¡)\b/i, label: 'español residual' },
];

export function isSpanishish(text) {
  return SPANISH_IN_STRING.test(text);
}

export function extractArrowArrayLiterals(fn) {
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
    literals.push(src.slice(i + 1, j).replace(/\\`/g, '`').replace(/\\\$/g, '$'));
    i = j + 1;
  }
  return literals;
}

function collectFallbackLiterals(text, out, path) {
  const re = /\|\|\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  let m;
  while ((m = re.exec(text))) {
    const fb = m[1].replace(/\\'/g, "'");
    if (isSpanishish(fb)) {
      out.spanishFallbacks.push({ path, text: fb.slice(0, 80) });
    }
  }
}

function walk(v, path, out) {
  if (typeof v === 'string') {
    if (isSpanishish(v)) out.spanish.push({ path, text: v.slice(0, 120) });
    if (/\bSample\b/.test(v)) out.sampleLeak.push({ path, text: v.slice(0, 120) });
    if (/\b3 days\b/i.test(v) && path.includes('trialExpiring')) {
      out.hardcodedDays.push({ path, text: v.slice(0, 120) });
    }
    for (const { re, label } of BAD_PATTERNS) {
      if (re.test(v)) out.bad.push({ path, label, text: v.slice(0, 120) });
    }
    collectFallbackLiterals(v, out, path);
    return;
  }
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  else if (typeof v === 'function') {
    try {
      if (path.endsWith('followUpWithHours')) walk(v(12), `${path}(12)`, out);
      else if (path.endsWith('trialExpiringTitles') || path.endsWith('trialExpiringBodies')) {
        walk(v(1), `${path}(1)`, out);
        walk(v(5), `${path}(5)`, out);
      } else if (path.endsWith('techniqueBodies')) walk(v('T', 'e'), `${path}(t,e)`, out);
      else if (path.endsWith('testBodies') || path.endsWith('liveBodies')) walk(v(2, 5), `${path}(2,5)`, out);
      else if (path.endsWith('taskReminder.bodies')) walk(v('My task', 'Friday'), `${path}(sample)`, out);
      else if (path.endsWith('taskDueSoon.bodies')) walk(v('My task', 'soon'), `${path}(sample)`, out);
      else if (path.endsWith('taskOverdue.bodies')) walk(v('My task', 2), `${path}(sample)`, out);
      else walk(v('a', 'b', 1, 2), `${path}()`, out);
    } catch {
      // noop
    }
  } else if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) walk(val, path ? `${path}.${k}` : k, out);
  }
}

function placeholderIds(s) {
  return new Set(
    (s.match(/\$\{([a-zA-Z0-9_|.\s'"]+?)(?:\s*\|\|[^}]*)?\}/g) || []).map((m) => m[1].trim()),
  );
}

const PARAM_FN_KEYS = [
  'followUpWithHours',
  'techniqueBodies',
  'trialExpiringTitles',
  'trialExpiringBodies',
];

async function loadEsPool() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const servicesDir = join(__dirname, '..', 'services');
  let src = readFileSync(join(servicesDir, 'pushNotificationCopyPools.js'), 'utf8');
  src = src.replace(/import \{[\s\S]*?\} from '\.\/pushNotificationCopyPools\.en\.js';\n\n/, '');
  src = src.replace(
    /export function normalizeNotificationLanguage[\s\S]*?^export const PUSH_NOTIFICATION_COPY/m,
    'export const PUSH_NOTIFICATION_COPY',
  );
  src = src.replace(/export function buildWeeklyProgressBody\([\s\S]*$/, '');
  const tmp = join(servicesDir, '.audit-es-temp.mjs');
  writeFileSync(tmp, src, 'utf8');
  const mod = await import(pathToFileURL(tmp).href);
  unlinkSync(tmp);
  return mod.PUSH_NOTIFICATION_COPY;
}

/**
 * @returns {{ ok: boolean, report: object }}
 */
export async function runPushEnAudit(enPool) {
  const ES = await loadEsPool();
  const out = {
    spanish: [],
    bad: [],
    sampleLeak: [],
    hardcodedDays: [],
    hardcodedHours: [],
    spanishFallbacks: [],
    missingDaysBranch: false,
    placeholderMismatches: [],
    missingKeys: [],
  };

  walk(enPool, '', out);

  const enTrialSrc = enPool.trialExpiringTitles.toString();
  if (!enTrialSrc.includes('days === 1') && !enTrialSrc.includes('days===1')) {
    out.missingDaysBranch = true;
  }

  for (const key of PARAM_FN_KEYS) {
    const esFn = ES[key];
    const enFn = enPool[key];
    if (!esFn || !enFn) continue;
    const esLits = extractArrowArrayLiterals(esFn);
    const enLits = extractArrowArrayLiterals(enFn);
    for (const lit of enLits) {
      if (/\b[0-9]+\s+hours?\b/i.test(lit) && !/\$\{h\}/.test(lit)) {
        out.hardcodedHours.push({ path: `${key} (source)`, text: lit.slice(0, 120) });
      }
    }
    const esIds = placeholderIds(esLits.join(' '));
    const enIds = placeholderIds(enLits.join(' '));
    for (const id of esIds) {
      if (!enIds.has(id)) out.placeholderMismatches.push({ key, missing: `\${${id}}` });
    }
  }

  for (const lit of extractArrowArrayLiterals(enPool.progressPositive?.bodies || (() => []))) {
    collectFallbackLiterals(lit, out, 'progressPositive.bodies');
  }
  for (const lit of extractArrowArrayLiterals(enPool.taskDueSoon?.bodies || (() => []))) {
    collectFallbackLiterals(lit, out, 'taskDueSoon.bodies');
  }

  const esKeys = Object.keys(ES).sort();
  const enKeys = Object.keys(enPool).sort();
  for (const k of esKeys) {
    if (!enKeys.includes(k)) out.missingKeys.push(k);
  }
  // buildWeeklyProgressBody vive en pushNotificationCopyPools.js, no en el objeto pool
  out.missingKeys = out.missingKeys.filter((k) => k !== 'buildWeeklyProgressBody');

  const issueCount =
    out.spanish.length +
    out.bad.length +
    out.sampleLeak.length +
    out.hardcodedDays.length +
    out.hardcodedHours.length +
    out.spanishFallbacks.length +
    (out.missingDaysBranch ? 1 : 0) +
    out.placeholderMismatches.length +
    out.missingKeys.length;

  return {
    ok: issueCount === 0,
    report: {
      ...out,
      issueCount,
      counts: {
        spanish: out.spanish.length,
        bad: out.bad.length,
        sampleLeak: out.sampleLeak.length,
        hardcodedDays: out.hardcodedDays.length,
        hardcodedHours: out.hardcodedHours.length,
        spanishFallbacks: out.spanishFallbacks.length,
        missingDaysBranch: out.missingDaysBranch,
        placeholderMismatches: out.placeholderMismatches.length,
        missingKeys: out.missingKeys.length,
      },
    },
  };
}
