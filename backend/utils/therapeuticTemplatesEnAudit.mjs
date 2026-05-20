/**
 * Auditoría: plantillas terapéuticas del chat EN.
 */
import { isSpanishish } from './pushCopyEnAudit.mjs';
import { THERAPEUTIC_TEMPLATES_ES } from '../constants/therapeuticTemplates.es.js';
import { THERAPEUTIC_TEMPLATES_EN } from '../constants/therapeuticTemplates.en.js';

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

function countLeaves(obj) {
  let n = 0;
  const walk = (node) => {
    if (typeof node === 'string') {
      n += 1;
      return;
    }
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(obj);
  return n;
}

export function runTherapeuticTemplatesEnAudit() {
  const issues = [];
  const strings = [];
  collectStrings(THERAPEUTIC_TEMPLATES_EN, strings);

  for (const text of strings) {
    if (isSpanishish(text)) {
      issues.push({ kind: 'spanish_in_en', sample: text.slice(0, 100) });
    }
  }

  const esCount = countLeaves(THERAPEUTIC_TEMPLATES_ES);
  const enCount = countLeaves(THERAPEUTIC_TEMPLATES_EN);
  if (esCount !== enCount) {
    issues.push({ kind: 'phrase_count_mismatch', es: esCount, en: enCount });
  }

  if (Object.keys(THERAPEUTIC_TEMPLATES_EN).length === 0) {
    issues.push({ kind: 'empty_en_catalog' });
  }

  return { ok: issues.length === 0, issues, checked: strings.length };
}
