/** Meses facturados por plan (solo UI; precios vienen del plan existente). */
export const PLAN_BILLING_MONTHS = {
  monthly: 1,
  quarterly: 3,
  semestral: 6,
  yearly: 12,
};

export const PLAN_DURATION_LABEL_KEYS = {
  monthly: 'PAYWALL_DURATION_MONTH',
  quarterly: 'PAYWALL_DURATION_QUARTER',
  semestral: 'PAYWALL_DURATION_SEMESTER',
  yearly: 'PAYWALL_DURATION_YEAR',
};

/**
 * @param {number} amount
 * @param {string} [currency='CLP']
 */
export function formatPlanMoney(amount, currency = 'CLP') {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  if (currency === 'CLP') {
    return `$${Math.round(n).toLocaleString('es-CL')}`;
  }
  return `$${n.toFixed(2)} ${currency}`;
}

/**
 * @param {{ id: string, amount?: number, currency?: string }} plan
 * @param {{ id: string, amount?: number } | null | undefined} monthlyPlan
 */
export function computePaywallPlanPricing(plan, monthlyPlan) {
  const months = PLAN_BILLING_MONTHS[plan?.id] || 1;
  const total = Number(plan?.amount) || 0;
  const currency = plan?.currency || 'CLP';
  const perMonth = months > 0 ? total / months : total;
  const monthlyRef = Number(monthlyPlan?.amount) || perMonth;
  const percentSave =
    monthlyRef > 0 && months > 1
      ? Math.max(0, Math.round((1 - perMonth / monthlyRef) * 100))
      : 0;

  return {
    months,
    total,
    currency,
    perMonth,
    formattedTotal: plan?.formattedAmount || formatPlanMoney(total, currency),
    formattedPerMonth: formatPlanMoney(perMonth, currency),
    monthlyReference: monthlyRef,
    formattedMonthlyReference: formatPlanMoney(monthlyRef, currency),
    percentSave,
  };
}
