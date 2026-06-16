/**
 * Agregación macro de registros ABC (#212).
 */
import {
  sanitizeObservationalText,
  sanitizeObservationalSamples,
} from '../utils/clinicalContentGuardrails.js';
import AbcRecord from '../models/AbcRecord.js';

function normalizeKey(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 6)
    .join(' ');
}

function truncate(text, max = 100) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/**
 * @param {Array<object>} records
 * @returns {Array<object>}
 */
export function buildAbcMacroPatterns(records = [], { language = 'es' } = {}) {
  const lang = language === 'en' ? 'en' : 'es';
  const buckets = new Map();

  for (const record of records) {
    const situationKey = normalizeKey(record?.activatingEvent);
    if (!situationKey || situationKey.length < 3) continue;

    const bucket = buckets.get(situationKey) || {
      situationKey,
      situationSample:
        sanitizeObservationalText(record.activatingEvent, 120) ||
        sanitizeObservationalText(truncate(record.activatingEvent, 120), 120),
      count: 0,
      beliefSamples: [],
      emotionSamples: [],
      consequenceSamples: [],
      intensitySum: 0,
      intensityCount: 0,
    };

    bucket.count += 1;
    const belief = sanitizeObservationalText(record.beliefs, 100);
    if (belief && bucket.beliefSamples.length < 3) {
      bucket.beliefSamples.push(belief);
    }
    const emotion = sanitizeObservationalText(record.emotions, 60);
    if (emotion && bucket.emotionSamples.length < 3) {
      bucket.emotionSamples.push(emotion);
    }
    const consequence = sanitizeObservationalText(record.consequence, 100);
    if (consequence && bucket.consequenceSamples.length < 3) {
      bucket.consequenceSamples.push(consequence);
    }
    if (Number.isFinite(Number(record.emotionIntensity))) {
      bucket.intensitySum += Number(record.emotionIntensity);
      bucket.intensityCount += 1;
    }

    buckets.set(situationKey, bucket);
  }

  const patterns = [...buckets.values()]
    .filter((b) => b.count >= 2 && b.situationSample)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((b) => {
      const avgIntensity =
        b.intensityCount > 0
          ? Math.round((b.intensitySum / b.intensityCount) * 10) / 10
          : null;
      const summary =
        lang === 'en'
          ? `When "${b.situationSample}" appears (${b.count}×), similar thoughts and consequences repeat.`
          : `Cuando aparece «${b.situationSample}» (${b.count}×), se repiten pensamientos y consecuencias parecidas.`;
      const safeSummary = sanitizeObservationalText(summary, 280) || summary.slice(0, 280);
      return {
        situationKey: b.situationKey,
        situationSample: b.situationSample,
        count: b.count,
        avgEmotionIntensity: avgIntensity,
        beliefSamples: sanitizeObservationalSamples(b.beliefSamples),
        emotionSamples: sanitizeObservationalSamples(b.emotionSamples, 3, 60),
        consequenceSamples: sanitizeObservationalSamples(b.consequenceSamples),
        summary: safeSummary,
        disclaimer: 'pattern_observed',
      };
    });

  return patterns;
}

export async function fetchAbcMacroPatterns({
  userId,
  since,
  until,
  language = 'es',
  limit = 80,
} = {}) {
  if (!userId) return { patterns: [], recordCount: 0 };

  const safeLimit = Math.max(1, Math.min(Number(limit) || 80, 100));
  const records = await AbcRecord.findByUser(userId, {
    startDate: since,
    endDate: until,
    archived: false,
    limit: safeLimit,
    sortBy: 'entryDate',
    sortOrder: 'desc',
  });

  return {
    recordCount: records.length,
    patterns: buildAbcMacroPatterns(records, { language }),
  };
}

/** Versión reducida para API / informes (sin muestras de pensamientos). */
export function toClientAbcPatterns(patterns = []) {
  return (Array.isArray(patterns) ? patterns : [])
    .slice(0, 3)
    .map((p) => {
      const situationSample =
        sanitizeObservationalText(p?.situationSample, 120) ||
        sanitizeObservationalText(p?.summary, 80);
      const summary = sanitizeObservationalText(p?.summary, 280);
      const count = Number(p?.count) || 0;
      if (!situationSample || !summary || count < 2) return null;
      return {
        situationSample,
        count,
        summary,
        disclaimer: 'pattern_observed',
      };
    })
    .filter(Boolean);
}

export default {
  buildAbcMacroPatterns,
  fetchAbcMacroPatterns,
  toClientAbcPatterns,
};
