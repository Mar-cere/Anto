/**
 * Detección de enlaces al resumen de actividad (correo semanal, CTAs con esquema anto).
 * Soporta tanto `anto:///weekly-summary` (path) como `anto://weekly-summary` (host), por compatibilidad.
 */

const ACTIVITY_SUMMARY_SEGMENTS = new Set(['weekly-summary', 'activity-summary', 'resumen']);

/**
 * @param {string | null | undefined} url
 * @returns {boolean}
 */
export function shouldOpenActivitySummaryFromUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!/^anto:\/\//i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    const host = (u.hostname || '').toLowerCase();
    if (ACTIVITY_SUMMARY_SEGMENTS.has(host)) return true;
    const rawPath = (u.pathname || '/').replace(/^\/+|\/+$/g, '');
    const first = rawPath.split('/').filter(Boolean)[0]?.toLowerCase() || '';
    if (first && ACTIVITY_SUMMARY_SEGMENTS.has(first)) return true;
  } catch {
    return false;
  }
  return false;
}
