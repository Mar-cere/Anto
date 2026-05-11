/**
 * Regla única de acceso premium/trial, alineada con
 * paymentServiceMercadoPago.getSubscriptionStatus (misma fuente que GET /subscription-status).
 *
 * No usar en paralelo el virtual `subscription.isActive` de Mongoose ni duplicar fechas
 * desde el documento Subscription: evita 403 con UI “activa” o al revés.
 */

/**
 * @param {object|null|undefined} apiStatus - Resultado de getSubscriptionStatus(userId)
 * @param {boolean} allowTrial
 * @returns {{ allowed: boolean, isActive: boolean, isInTrial: boolean, status: string, plan: string|null }}
 */
export function interpretSubscriptionAccess(apiStatus, allowTrial) {
  if (!apiStatus) {
    return {
      allowed: false,
      isActive: false,
      isInTrial: false,
      status: 'free',
      plan: null,
    };
  }

  const st = String(apiStatus.status || 'free').toLowerCase();
  if (
    st === 'expired' ||
    st === 'canceled' ||
    st === 'cancelled' ||
    st === 'past_due' ||
    st === 'unpaid' ||
    st === 'incomplete' ||
    st === 'incomplete_expired'
  ) {
    return {
      allowed: false,
      isActive: false,
      isInTrial: false,
      status: st,
      plan: apiStatus.plan ?? null,
    };
  }

  const now = new Date();

  const premiumOk =
    apiStatus.status === 'premium' &&
    apiStatus.subscriptionEndDate &&
    new Date(apiStatus.subscriptionEndDate) >= now;

  const trialOk =
    allowTrial &&
    apiStatus.status === 'trial' &&
    apiStatus.trialEndDate &&
    new Date(apiStatus.trialEndDate) >= now;

  const fromServiceFlags =
    apiStatus.isActive === true || (allowTrial && apiStatus.isInTrial === true);

  const allowed = Boolean(fromServiceFlags || premiumOk || trialOk);
  const isActive = apiStatus.isActive === true || premiumOk;
  const isInTrial = apiStatus.isInTrial === true || trialOk;

  return {
    allowed,
    isActive,
    isInTrial,
    status: apiStatus.status,
    plan: apiStatus.plan ?? null,
  };
}
