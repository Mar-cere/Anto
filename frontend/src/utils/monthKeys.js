/**
 * Claves de mes calendario (YYYY-MM) para informes mensuales.
 */

export function formatMonthKey(year, month1to12) {
  const y = Number(year);
  const m = Number(month1to12);
  if (!Number.isInteger(y) || y < 2000 || y > 2100 || !Number.isInteger(m) || m < 1 || m > 12) {
    return null;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function getPreviousMonthKey(date = new Date()) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return formatMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export function normalizeMonthKey(input, fallback = null) {
  const raw = String(input ?? '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const month = Number(raw.slice(5, 7));
    if (month >= 1 && month <= 12) return raw;
  }
  const flex = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (flex) {
    const normalized = formatMonthKey(Number(flex[1]), Number(flex[2]));
    if (normalized) return normalized;
  }
  return fallback;
}

export function resolveMonthlyInsightKey(rawMonthKey, { year, month } = {}) {
  const fromParam = normalizeMonthKey(rawMonthKey, null);
  if (fromParam) return fromParam;
  const fromParts = formatMonthKey(year, month);
  if (fromParts) return fromParts;
  return getPreviousMonthKey();
}
