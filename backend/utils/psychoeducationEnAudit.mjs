/**
 * Auditoría: catálogo EN de psicoeducación sin restos obvios en español.
 */
import { isSpanishish } from './pushCopyEnAudit.mjs';
import { PSYCHOEDUCATION_MODULES } from '../constants/psychoeducation.js';
import { PSYCHOEDUCATION_MODULES_EN } from '../constants/psychoeducation.en.js';

function collectStrings(node, out) {
  if (typeof node === 'string') {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectStrings(item, out));
    return;
  }
  if (node && typeof node === 'object') {
    Object.values(node).forEach((value) => collectStrings(value, out));
  }
}

export function runPsychoeducationEnAudit() {
  const issues = [];
  const strings = [];
  collectStrings(PSYCHOEDUCATION_MODULES_EN, strings);

  for (const text of strings) {
    if (isSpanishish(text)) {
      issues.push({ kind: 'spanish_in_en', sample: text.slice(0, 120) });
    }
  }

  const esTopics = Object.keys(PSYCHOEDUCATION_MODULES);
  const enTopics = Object.keys(PSYCHOEDUCATION_MODULES_EN);
  if (esTopics.length !== enTopics.length) {
    issues.push({
      kind: 'topic_count_mismatch',
      es: esTopics.length,
      en: enTopics.length,
    });
  }
  for (const topic of esTopics) {
    if (!enTopics.includes(topic)) {
      issues.push({ kind: 'missing_topic', topic });
    }
  }

  if (enTopics.length === 0) {
    issues.push({ kind: 'empty_en_catalog' });
  }

  return { ok: issues.length === 0, issues, checked: strings.length };
}
