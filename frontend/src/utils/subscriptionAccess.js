/**
 * Acción de cancelación/gestión según proveedor de facturación (sin fallback de plataforma).
 * @param {object|null|undefined} status - Respuesta de getSubscriptionStatus
 * @returns {'none'|'app_store'|'api'|null} null = proveedor desconocido / sin dato
 */
export function getSubscriptionCancelAction(status) {
  if (!subscriptionLooksCurrentlyUsable(status)) return 'none';
  const provider = String(status?.billingProvider || '').toLowerCase();
  const st = String(status?.status || '').toLowerCase();
  if (
    provider === 'trial' ||
    status?.isInTrial === true ||
    st === 'trial' ||
    st === 'trialing'
  ) {
    return 'none';
  }
  if (provider === 'apple') return 'app_store';
  if (provider === 'mercadopago') return 'api';
  return null;
}

/**
 * Acción de UI definitiva: aplica fallback por plataforma y evita App Store fuera de iOS.
 * @param {object|null|undefined} status
 * @param {string} [platformOS]
 * @returns {'none'|'app_store'|'api'|'not_cancellable'}
 */
export function resolveSubscriptionCancelUiAction(status, platformOS = 'ios') {
  const os = String(platformOS || '').toLowerCase();
  const action = getSubscriptionCancelAction(status);
  if (action === 'none') return 'none';
  if (action === 'app_store') {
    return os === 'ios' ? 'app_store' : 'not_cancellable';
  }
  if (action === 'api') return 'api';
  // unknown / billingProvider ausente (p. ej. caché antigua)
  if (os === 'ios') return 'app_store';
  return 'api';
}

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
  return st === 'premium' || st === 'active' || st === 'trialing' || st === 'trial';
}

/**
 * @param {unknown} errorLike
 * @returns {boolean}
 */
export function isSubscriptionRequiredError(errorLike) {
  if (!errorLike || typeof errorLike !== 'object') return false;
  const code = String(errorLike.code || errorLike.errorCode || '').toUpperCase();
  if (code === 'SUBSCRIPTION_REQUIRED') return true;
  const response = errorLike.response;
  if (response?.status === 403 && response?.data?.requiresSubscription === true) return true;
  const msg = String(errorLike.message || '');
  return (
    msg.includes('suscripción') ||
    msg.includes('subscription') ||
    msg.includes('Se requiere suscripción activa')
  );
}
