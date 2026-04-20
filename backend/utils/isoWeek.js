/**
 * Semana ISO 8601 en UTC (alineada con programación del servidor en UTC).
 * @see https://en.wikipedia.org/wiki/ISO_week_date
 */

/**
 * @param {Date} [date]
 * @returns {{ isoWeekYear: number, isoWeek: number, yearWeekKey: string }}
 */
export function getUtcIsoWeekParts(date = new Date()) {
  const x = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7;
  const thursday = new Date(x);
  thursday.setUTCDate(x.getUTCDate() - day + 3);
  const isoWeekYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoWeekYear, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day);
  const diffDays = Math.floor((thursday.getTime() - week1Monday.getTime()) / 86400000);
  const isoWeek = 1 + Math.floor(diffDays / 7);
  const clamped = Math.min(53, Math.max(1, isoWeek));
  const yearWeekKey = `${isoWeekYear}-W${String(clamped).padStart(2, '0')}`;
  return { isoWeekYear, isoWeek: clamped, yearWeekKey };
}

/**
 * Número de semana ISO (1–53) para rotar plantillas (p. ej. `weekNumber % n`).
 * @param {Date} [date]
 * @returns {number}
 */
export function getUtcIsoWeekNumber(date = new Date()) {
  return getUtcIsoWeekParts(date).isoWeek;
}
