/**
 * Trial de app — fallback local si /api/health/app-config no responde.
 * Debe coincidir con el default de `APP_TRIAL_DAYS` en el backend.
 */
export const DEFAULT_APP_TRIAL_DAYS = 1;

/**
 * @param {number} days
 * @param {'es'|'en'|string} [locale]
 * @returns {string}
 */
export function formatTrialPeriodLabel(days, locale = 'es') {
  const n = Number.isFinite(days) && days >= 1 ? Math.floor(days) : DEFAULT_APP_TRIAL_DAYS;
  if (locale === 'en') {
    return n === 1 ? '1-day' : `${n}-day`;
  }
  return n === 1 ? '1 día' : `${n} días`;
}

/**
 * @param {Array<{ category: string, items: Array<{ question: string, answer: string }> }>} sections
 * @param {string} trialPeriodLabel
 */
export function applyTrialPeriodToFaq(sections, trialPeriodLabel) {
  const token = '{{TRIAL_PERIOD}}';
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      answer: item.answer.includes(token)
        ? item.answer.replaceAll(token, trialPeriodLabel)
        : item.answer,
    })),
  }));
}
