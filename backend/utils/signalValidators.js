/**
 * Validadores compartidos para rutas / servicios de señales (#215–#217).
 */

const ISO_WEEK_KEY_RE = /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/;
const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const FORBIDDEN_TELEMETRY_KEYS = new Set([
  'content',
  'text',
  'message',
  'body',
  'draft',
  'input',
  'messageText',
  'userContent',
]);

/** Fuentes que solo el servidor o un job nativo verificado puede marcar. */
const TRUSTED_PHENOTYPE_SOURCES = new Set(['healthkit', 'health_connect', 'google_fit']);
const CLIENT_PHENOTYPE_SOURCES = new Set(['manual', 'stub']);

export function isValidIsoWeekKey(weekKey) {
  return ISO_WEEK_KEY_RE.test(String(weekKey || '').trim());
}

export function isValidDayKey(dayKey) {
  return DAY_KEY_RE.test(String(dayKey || '').trim());
}

export function normalizeIsoWeekKey(weekKey, fallback = null) {
  const key = String(weekKey || '').trim();
  return isValidIsoWeekKey(key) ? key : fallback;
}

/**
 * Rechaza payloads que intenten colar texto del mensaje (#215).
 */
export function extractTypingMetricsPayload(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const raw = body.metrics && typeof body.metrics === 'object' ? body.metrics : body;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_TELEMETRY_KEYS.has(key)) return null;
    const val = raw[key];
    if (typeof val === 'string' && val.length > 64) return null;
  }
  return raw;
}

/**
 * Restringe source de fenotipo en requests cliente.
 */
export function resolveClientPhenotypeSource(source) {
  const s = String(source || 'stub').trim().toLowerCase();
  if (TRUSTED_PHENOTYPE_SOURCES.has(s)) return 'stub';
  return CLIENT_PHENOTYPE_SOURCES.has(s) ? s : 'stub';
}

export function isTrustedPhenotypeSource(source) {
  return TRUSTED_PHENOTYPE_SOURCES.has(String(source || '').trim().toLowerCase());
}

export default {
  isValidIsoWeekKey,
  isValidDayKey,
  normalizeIsoWeekKey,
  extractTypingMetricsPayload,
  resolveClientPhenotypeSource,
  isTrustedPhenotypeSource,
};
