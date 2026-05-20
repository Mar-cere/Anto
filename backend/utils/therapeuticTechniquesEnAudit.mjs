/**
 * Auditoría: catálogo EN de técnicas sin restos obvios en español.
 */
import { isSpanishish } from './pushCopyEnAudit.mjs';
import {
  IMMEDIATE_TECHNIQUES_EN,
  CBT_TECHNIQUES_EN,
  DBT_TECHNIQUES_EN,
  ACT_TECHNIQUES_EN,
} from '../constants/therapeuticTechniques.en.js';
import {
  MINDFULNESS_TECHNIQUES_EN,
  GROUNDING_TECHNIQUES_EN,
} from '../constants/mindfulnessTechniques.en.js';
import {
  IMMEDIATE_TECHNIQUES,
  CBT_TECHNIQUES,
  DBT_TECHNIQUES,
  ACT_TECHNIQUES,
} from '../constants/therapeuticTechniques.js';

function collectStrings(technique, out) {
  if (!technique || typeof technique !== 'object') return;
  for (const key of ['name', 'description', 'whenToUse']) {
    if (typeof technique[key] === 'string') out.push(technique[key]);
  }
  if (Array.isArray(technique.steps)) {
    for (const step of technique.steps) {
      if (typeof step === 'string') out.push(step);
    }
  }
}

function walkTechniques(catalog, out) {
  if (Array.isArray(catalog)) {
    for (const t of catalog) collectStrings(t, out);
    return;
  }
  if (catalog && typeof catalog === 'object') {
    for (const value of Object.values(catalog)) {
      if (value?.steps || value?.name) collectStrings(value, out);
      else walkTechniques(value, out);
    }
  }
}

export function runTherapeuticTechniquesEnAudit() {
  const issues = [];
  const strings = [];
  walkTechniques(IMMEDIATE_TECHNIQUES_EN, strings);
  walkTechniques(CBT_TECHNIQUES_EN, strings);
  walkTechniques(DBT_TECHNIQUES_EN, strings);
  walkTechniques(ACT_TECHNIQUES_EN, strings);
  walkTechniques(MINDFULNESS_TECHNIQUES_EN, strings);
  walkTechniques(GROUNDING_TECHNIQUES_EN, strings);

  for (const text of strings) {
    if (isSpanishish(text)) {
      issues.push({ kind: 'spanish_in_en', sample: text.slice(0, 120) });
    }
  }

  const esImmediateCount = Object.values(IMMEDIATE_TECHNIQUES).reduce(
    (n, list) => n + list.length,
    0,
  );
  const enImmediateCount = Object.values(IMMEDIATE_TECHNIQUES_EN).reduce(
    (n, list) => n + list.length,
    0,
  );
  if (enImmediateCount !== esImmediateCount) {
    issues.push({
      kind: 'immediate_count_mismatch',
      es: esImmediateCount,
      en: enImmediateCount,
    });
  }

  const esStructured =
    Object.keys(CBT_TECHNIQUES).length +
    Object.keys(DBT_TECHNIQUES).length +
    Object.keys(ACT_TECHNIQUES).length;
  const enStructured =
    Object.keys(CBT_TECHNIQUES_EN).length +
    Object.keys(DBT_TECHNIQUES_EN).length +
    Object.keys(ACT_TECHNIQUES_EN).length;
  if (enStructured !== esStructured) {
    issues.push({
      kind: 'structured_count_mismatch',
      es: esStructured,
      en: enStructured,
    });
  }

  const countInteractive = (catalog) => {
    let n = 0;
    const walk = (node) => {
      if (Array.isArray(node)) {
        node.forEach((t) => {
          if (t?.interactiveExercise) n += 1;
        });
        return;
      }
      if (node && typeof node === 'object') {
        Object.values(node).forEach(walk);
      }
    };
    walk(catalog);
    return n;
  };

  const esInteractive = countInteractive(IMMEDIATE_TECHNIQUES);
  const enInteractive = countInteractive(IMMEDIATE_TECHNIQUES_EN);
  if (esInteractive !== enInteractive) {
    issues.push({
      kind: 'interactive_exercise_mismatch',
      es: esInteractive,
      en: enInteractive,
    });
  }

  return { ok: issues.length === 0, issues, checked: strings.length };
}
