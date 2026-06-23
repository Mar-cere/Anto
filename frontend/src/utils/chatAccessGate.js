/**
 * ¿Puede el cliente intentar abrir el chat sin recibir 403 de inmediato?
 * Alineado con interpretSubscriptionAccess + ventana de gracia de primera sesión (24 h).
 */
import paymentService from '../services/paymentService';
import { subscriptionLooksCurrentlyUsable } from './subscriptionAccess';

const FIRST_SESSION_GRACE_MS = 24 * 60 * 60 * 1000;

export { FIRST_SESSION_GRACE_MS };

export function accountWithinFirstSessionGrace(createdAt) {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  const ageMs = Date.now() - createdMs;
  return ageMs >= 0 && ageMs <= FIRST_SESSION_GRACE_MS;
}

export async function canAttemptChatAccess(userData = null) {
  try {
    const [status, trial] = await Promise.all([
      paymentService.getSubscriptionStatus(),
      paymentService.getTrialInfo(),
    ]);

    if (subscriptionLooksCurrentlyUsable(status)) {
      return true;
    }
    if (trial?.success && trial?.isInTrial) {
      return true;
    }
    if (accountWithinFirstSessionGrace(userData?.createdAt)) {
      return true;
    }
    return false;
  } catch (_) {
    return accountWithinFirstSessionGrace(userData?.createdAt);
  }
}
