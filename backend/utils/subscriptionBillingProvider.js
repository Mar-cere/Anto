/**
 * Resuelve el proveedor de facturación efectivo para UI y cancelación.
 * Solo marca `apple` con evidencia explícita; premium/active sin MP ni Apple → `unknown`
 * (el cliente decide por plataforma; el backend no inventa App Store).
 *
 * @param {object|null|undefined} subscription - Documento Subscription (lean o mongoose)
 * @param {object|null|undefined} userSub - user.subscription
 * @param {Date} [now]
 * @returns {'mercadopago'|'apple'|'trial'|'unknown'|'none'}
 */
export function resolveBillingProvider(subscription, userSub, now = new Date()) {
  if (subscription?.mercadopagoSubscriptionId) {
    return 'mercadopago';
  }

  const meta =
    subscription?.metadata && typeof subscription.metadata === 'object'
      ? subscription.metadata
      : null;
  const appleHint =
    Boolean(meta?.appleOriginalTransactionId) ||
    Boolean(meta?.appleTransactionId) ||
    (typeof meta?.productId === 'string' && meta.productId.startsWith('com.anto.app'));

  if (appleHint) {
    return 'apple';
  }

  const trialFromSubscription =
    subscription?.status === 'trialing' &&
    subscription?.trialEnd &&
    !Number.isNaN(new Date(subscription.trialEnd).getTime()) &&
    new Date(subscription.trialEnd) >= now;

  const trialFromUser =
    userSub?.status === 'trial' &&
    userSub?.trialEndDate &&
    !Number.isNaN(new Date(userSub.trialEndDate).getTime()) &&
    new Date(userSub.trialEndDate) >= now;

  if (trialFromSubscription || trialFromUser) {
    return 'trial';
  }

  const premiumActive =
    userSub?.status === 'premium' &&
    userSub?.subscriptionEndDate &&
    !Number.isNaN(new Date(userSub.subscriptionEndDate).getTime()) &&
    new Date(userSub.subscriptionEndDate) >= now;

  if (premiumActive || subscription?.status === 'active') {
    return 'unknown';
  }

  return 'none';
}
