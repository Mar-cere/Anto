/**
 * Criterio de UI / cliente alineado con la intención de `interpretSubscriptionAccess` en el backend.
 * Usar con la respuesta de `getSubscriptionStatus` (objeto con `success`).
 *
 * @param {object|null|undefined} status
 * @returns {boolean}
 */
export function subscriptionLooksCurrentlyUsable(status) {
  if (!status?.success || !status?.hasSubscription) return false;
  if (status.isActive === false) return false;
  const st = String(status.status || '').toLowerCase();
  if (
    st === 'expired' ||
    st === 'canceled' ||
    st === 'cancelled' ||
    st === 'past_due' ||
    st === 'unpaid' ||
    st === 'incomplete' ||
    st === 'incomplete_expired'
  ) {
    return false;
  }
  const endMs = status.subscriptionEndDate ? new Date(status.subscriptionEndDate).getTime() : NaN;
  const periodEnded = Number.isFinite(endMs) && endMs < Date.now();
  if ((st === 'premium' || st === 'active') && periodEnded) return false;
  const trialEndMs = status.trialEndDate ? new Date(status.trialEndDate).getTime() : NaN;
  const trialEnded = Number.isFinite(trialEndMs) && trialEndMs < Date.now();
  if ((st === 'trialing' || st === 'trial') && (status.isInTrial === false || trialEnded)) return false;
  return st === 'premium' || st === 'active' || st === 'trialing';
}
