/**
 * Utilidades compartidas para la pantalla de historial de alertas.
 */

const MAX_DISPLAY_INT = 1_000_000_000;

/** Entero >= 0 acotado para totales, badges y gráficos (evita NaN, Infinity, negativos). */
export function safeNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;
  return Math.min(Math.floor(n), MAX_DISPLAY_INT);
}

/** Longitud segura del array de historial. */
export function safeHistoryLength(history) {
  return Array.isArray(history) ? history.length : 0;
}

/**
 * Alertas en el periodo de patrones (misma lógica que PatternsTab / backend).
 * Tolera respuestas parciales o tipos inesperados.
 */
export function countPatternPeriodAlerts(patterns) {
  if (patterns == null || typeof patterns !== 'object' || Array.isArray(patterns)) {
    return 0;
  }
  const wp = patterns.timePatterns?.weekendVsWeekday;
  if (wp == null || typeof wp !== 'object' || Array.isArray(wp)) {
    return 0;
  }
  const a = safeNonNegativeInt(wp.weekend, 0);
  const b = safeNonNegativeInt(wp.weekday, 0);
  return Math.min(a + b, MAX_DISPLAY_INT);
}
