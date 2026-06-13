/**
 * Utilidades para respuestas de error seguras en producción.
 */

export function isDevEnvironment() {
  return (process.env.NODE_ENV || 'development') !== 'production';
}

export function safeErrorMessage(error) {
  return isDevEnvironment() ? error?.message : undefined;
}

/** Escapa caracteres especiales de regex para búsquedas literales en MongoDB. */
export function escapeRegexForMongo(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function clampInt(value, { min = 1, max = 100, fallback = min } = {}) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
