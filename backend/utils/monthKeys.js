/**
 * Claves de mes calendario (YYYY-MM) para informes mensuales de patrones.
 */

export function formatMonthKey(year, month1to12) {
  const y = Number(year);
  const m = Number(month1to12);
  if (!Number.isInteger(y) || y < 2000 || y > 2100 || !Number.isInteger(m) || m < 1 || m > 12) {
    return null;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function getMonthWindowFromKey(monthKey) {
  const match = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const since = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const until = new Date(year, month, 1, 0, 0, 0, 0);
  return { since, until, monthKey: formatMonthKey(year, month) };
}

export function getPreviousMonthKey(date = new Date()) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return formatMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export function normalizeMonthKey(input, fallback = null) {
  const raw = String(input || '').trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) return fallback;
  const month = Number(raw.slice(5, 7));
  if (month < 1 || month > 12) return fallback;
  return raw;
}
