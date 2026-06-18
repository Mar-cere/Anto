/**
 * Rango por defecto para patrones macro ABC (#212) — últimos 90 días.
 */
export function getDefaultAbcMacroDateRange(referenceDate = new Date()) {
  const end = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const start = new Date(end.getTime());
  start.setUTCDate(start.getUTCDate() - 90);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
