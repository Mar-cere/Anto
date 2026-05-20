/**
 * Días calendario restantes hasta una fecha de fin (trial o periodo).
 */
export function calculateDaysRemainingUntil(endDate, now = new Date()) {
  if (endDate == null || endDate === '') return 0;

  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const reference = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(end.getTime()) || Number.isNaN(reference.getTime())) {
    return 0;
  }

  if (reference >= end) return 0;

  return Math.ceil((end.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}
