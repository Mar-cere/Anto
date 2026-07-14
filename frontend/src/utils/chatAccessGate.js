/**
 * ¿Puede el cliente intentar abrir el chat sin recibir 403 de inmediato?
 * Alineado con interpretSubscriptionAccess + ventana de gracia de primera sesión (24 h).
 */
import paymentService from '../services/paymentService';
import { subscriptionLooksCurrentlyUsable } from './subscriptionAccess';

const FIRST_SESSION_GRACE_MS = 24 * 60 * 60 * 1000;

export function accountWithinFirstSessionGrace(createdAt) {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  const ageMs = Date.now() - createdMs;
  return ageMs >= 0 && ageMs <= FIRST_SESSION_GRACE_MS;
}

export { FIRST_SESSION_GRACE_MS };

export function resolveChatAccess({ subscriptionStatus = null, trialInfo = null, userData = null } = {}) {
  if (subscriptionLooksCurrentlyUsable(subscriptionStatus)) {
    return true;
  }
  if (trialInfo?.success && trialInfo?.isInTrial) {
    return true;
  }
  if (accountWithinFirstSessionGrace(userData?.createdAt)) {
    return true;
  }
  return false;
}

export async function canAttemptChatAccess(userData = null, opts = {}) {
  try {
    const hasPreloadedStatus = opts.subscriptionStatus != null;
    const hasPreloadedTrial = opts.trialInfo != null;

    if (hasPreloadedStatus || hasPreloadedTrial) {
      return resolveChatAccess({
        subscriptionStatus: opts.subscriptionStatus,
        trialInfo: opts.trialInfo,
        userData,
      });
    }

    const [status, trial] = await Promise.all([
      paymentService.getSubscriptionStatus(),
      paymentService.getTrialInfo(),
    ]);

    return resolveChatAccess({
      subscriptionStatus: status,
      trialInfo: trial,
      userData,
    });
  } catch (_) {
    return accountWithinFirstSessionGrace(userData?.createdAt);
  }
}

/**
 * Lanza SUBSCRIPTION_REQUIRED si el cliente no debería llamar al chat aún.
 * @param {object|null|undefined} userData
 */
export async function assertChatAccessOrThrow(userData = null) {
  const allowed = await canAttemptChatAccess(userData);
  if (allowed) return;
  const err = new Error('Se requiere suscripción activa o trial válido para usar el chat');
  err.code = 'SUBSCRIPTION_REQUIRED';
  err.response = { status: 403, data: { requiresSubscription: true } };
  throw err;
}
