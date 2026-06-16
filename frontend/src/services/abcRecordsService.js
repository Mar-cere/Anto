/**
 * Cliente API autorregistro ABC (#86 / #212).
 */
import { api, ENDPOINTS } from '../config/api';

const ALLOWED_PATTERN_KEYS = new Set(['situationSample', 'count', 'summary', 'disclaimer']);

function sanitizePatternRow(row) {
  if (!row || typeof row !== 'object') return null;
  const situationSample = String(row.situationSample || '').trim().slice(0, 120);
  const summary = String(row.summary || '').trim().slice(0, 280);
  const count = Number(row.count) || 0;
  if (!situationSample || !summary || count < 2) return null;
  return {
    situationSample,
    count,
    summary,
    disclaimer: String(row.disclaimer || 'pattern_observed').slice(0, 64),
  };
}

export async function fetchAbcMacroPatterns({ startDate, endDate, limit = 80 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 80, 100));
  const params = {};
  if (startDate) params.startDate = String(startDate).slice(0, 10);
  if (endDate) params.endDate = String(endDate).slice(0, 10);
  params.limit = String(safeLimit);

  const res = await api.get(ENDPOINTS.ABC_RECORDS_MACRO_PATTERNS, { params });
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
