/** Utilidades de presentación para chips y marcadores de escala (1–10, SUDS). */

export function scaleFillPercent(value, min = 1, max = 10) {
  const safeMin = Number(min);
  const safeMax = Number(max);
  const v = Number(value);
  if (!Number.isFinite(v) || safeMax <= safeMin) return 0;
  return Math.min(100, Math.max(0, ((v - safeMin) / (safeMax - safeMin)) * 100));
}

export function formatScaleDelta(delta) {
  const n = Number(delta);
  if (!Number.isFinite(n)) return '0';
  if (n > 0) return `+${n}`;
  return String(n);
}

/**
 * @param {'higher-is-better' | 'lower-is-better'} mode
 * @returns {'positive' | 'negative' | 'neutral'}
 */
export function getDeltaTone(delta, mode = 'higher-is-better') {
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return 'neutral';
  if (mode === 'lower-is-better') return n < 0 ? 'positive' : 'negative';
  return n > 0 ? 'positive' : 'negative';
}
