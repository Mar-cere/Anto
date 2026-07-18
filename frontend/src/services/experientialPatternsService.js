/**
 * Cliente API — memoria del proceso / patrones experienciales (#203 / #211).
 */
import { api, ENDPOINTS } from '../config/api';

const OBJECTID_PATTERN = /^[a-f\d]{24}$/i;
const VALID_FOLLOW_UP = new Set([
  'pending',
  'acknowledged',
  'changed',
  'unchanged',
  'skipped',
  'archived',
]);

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[<>{}]/g, '')
    .trim();
}

export async function fetchExperientialPatternsConsent() {
  const res = await api.get(ENDPOINTS.EXPERIENTIAL_PATTERNS_CONSENT);
  return res.data?.consent || { enabled: false, enabledAt: null };
}

export async function setExperientialPatternsConsent(enabled) {
  const res = await api.patch(ENDPOINTS.EXPERIENTIAL_PATTERNS_CONSENT, {
    enabled: enabled === true,
  });
  return res.data?.consent || { enabled: enabled === true, enabledAt: null };
}

export async function fetchExperientialPatterns({ activeOnly = true, limit = 20 } = {}) {
  const res = await api.get(ENDPOINTS.EXPERIENTIAL_PATTERNS, {
    params: { activeOnly: activeOnly !== false, limit: Math.min(50, Math.max(1, limit || 20)) },
  });
  const list = res.data?.patterns;
  return Array.isArray(list) ? list : [];
}

export async function updateExperientialPattern(id, patch = {}) {
  const patternId = String(id || '').trim();
  if (!OBJECTID_PATTERN.test(patternId)) {
    throw new Error('Invalid pattern id');
  }
  const body = {};
  if (patch.followUpStatus != null) {
    if (!VALID_FOLLOW_UP.has(patch.followUpStatus)) {
      throw new Error('Invalid followUpStatus');
    }
    body.followUpStatus = patch.followUpStatus;
  }
  if (patch.archive === true || patch.isActive === false) body.archive = true;
  if (patch.statement != null) {
    const statement = sanitizeText(patch.statement);
    if (statement.length < 5) throw new Error('Statement too short');
    body.statement = statement.slice(0, 160);
  }
  if (patch.userConfirmed === true) body.userConfirmed = true;
  const res = await api.patch(ENDPOINTS.EXPERIENTIAL_PATTERN_BY_ID(patternId), body);
  return res.data?.pattern || null;
}

export async function archiveExperientialPattern(id) {
  const patternId = String(id || '').trim();
  if (!OBJECTID_PATTERN.test(patternId)) {
    throw new Error('Invalid pattern id');
  }
  const res = await api.delete(ENDPOINTS.EXPERIENTIAL_PATTERN_BY_ID(patternId));
  return res.data?.pattern || null;
}

export default {
  fetchExperientialPatternsConsent,
  setExperientialPatternsConsent,
  fetchExperientialPatterns,
  updateExperientialPattern,
  archiveExperientialPattern,
};
