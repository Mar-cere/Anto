/**
 * Cálculo y copy de días de trial para UI (ES/EN).
 */

export function computeTrialDaysRemaining(daysRemaining, trialEndDate, now = new Date()) {
  const fromApi = Number(daysRemaining);
  if (Number.isFinite(fromApi) && fromApi > 0) {
    return Math.max(0, Math.floor(fromApi));
  }

  if (!trialEndDate) return 0;

  const end = new Date(trialEndDate);
  const reference = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(end.getTime()) || Number.isNaN(reference.getTime()) || reference >= end) {
    return 0;
  }

  return Math.ceil((end.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatTrialStatusDescription(days, texts = {}) {
  const safeDays = Math.max(0, Number(days) || 0);

  if (safeDays === 1) {
    return (
      texts.DESCRIPTION_TRIAL_ONE ||
      texts.DESCRIPTION_TRIAL_TEMPLATE?.replace('{days}', '1') ||
      ''
    );
  }

  const template =
    texts.DESCRIPTION_TRIAL_MANY || texts.DESCRIPTION_TRIAL_TEMPLATE || '';
  return template.replace('{days}', String(safeDays));
}
