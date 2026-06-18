/**
 * Cliente API autorregistro ABC (#86 / #212).
 */
import { api, ENDPOINTS } from '../config/api';

const ALLOWED_PATTERN_KEYS = new Set([
  'situationSample',
  'count',
  'summary',
  'disclaimer',
  'avgEmotionIntensity',
  'cycle',
]);

const ALLOWED_CYCLE_KEYS = new Set(['trigger', 'thoughts', 'emotions', 'consequences']);

function sanitizeCycle(cycle) {
  if (!cycle || typeof cycle !== 'object') return null;
  const trigger = String(cycle.trigger || '').trim().slice(0, 120);
  const thoughts = (Array.isArray(cycle.thoughts) ? cycle.thoughts : [])
    .map((t) => String(t || '').trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 2);
  const emotions = (Array.isArray(cycle.emotions) ? cycle.emotions : [])
    .map((t) => String(t || '').trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 2);
  const consequences = (Array.isArray(cycle.consequences) ? cycle.consequences : [])
    .map((t) => String(t || '').trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 2);
  if (!trigger && !thoughts.length && !emotions.length && !consequences.length) {
    return null;
  }
  const safe = { trigger };
  if (thoughts.length) safe.thoughts = thoughts;
  if (emotions.length) safe.emotions = emotions;
  if (consequences.length) safe.consequences = consequences;
  for (const key of Object.keys(safe)) {
    if (!ALLOWED_CYCLE_KEYS.has(key)) delete safe[key];
  }
  return safe;
}

function sanitizePatternRow(row) {
  if (!row || typeof row !== 'object') return null;
  const situationSample = String(row.situationSample || '').trim().slice(0, 120);
  const summary = String(row.summary || '').trim().slice(0, 280);
  const count = Number(row.count) || 0;
  if (!situationSample || !summary || count < 2) return null;
  const safe = {
    situationSample,
    count,
    summary,
    disclaimer: String(row.disclaimer || 'pattern_observed').slice(0, 64),
  };
  const avg = Number(row.avgEmotionIntensity);
  if (Number.isFinite(avg) && avg >= 1 && avg <= 10) {
    safe.avgEmotionIntensity = avg;
  }
  const cycle = sanitizeCycle(row.cycle);
  if (cycle) safe.cycle = cycle;
  return safe;
}

export async function fetchAbcMacroPatterns({ startDate, endDate, limit = 80, detail = 'summary' } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 80, 100));
  const params = {};
  if (startDate) params.startDate = String(startDate).slice(0, 10);
  if (endDate) params.endDate = String(endDate).slice(0, 10);
  params.limit = String(safeLimit);
  if (String(detail).toLowerCase() === 'cycle') {
    params.detail = 'cycle';
  }

  const res = await api.get(ENDPOINTS.ABC_RECORDS_MACRO_PATTERNS, params);
  const data = res?.data ?? res;
  const patterns = (Array.isArray(data?.patterns) ? data.patterns : [])
    .map(sanitizePatternRow)
    .filter(Boolean)
    .map((row) => {
      const safe = {};
      for (const key of ALLOWED_PATTERN_KEYS) {
        if (row[key] != null) safe[key] = row[key];
      }
      return safe;
    });
  return {
    patterns,
    recordCount: Number(data?.recordCount) || 0,
  };
}

export default {
  fetchAbcMacroPatterns,
};
