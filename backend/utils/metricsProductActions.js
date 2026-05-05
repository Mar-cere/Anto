/**
 * Telemetría §8 CONTRATO_CHAT_ACCIONES_V1 — creación / fallo desde flujo con chatOrigin persistido.
 */
import metricsService from '../services/metricsService.js';

function toUserIdString(userId) {
  if (!userId) return '';
  return typeof userId === 'string' ? userId : userId.toString();
}

/**
 * Tras 201 o replay 200: solo si el documento persistido incluye chatOrigin.
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {'task'|'habit'} resource
 * @param {{ chatOrigin?: unknown }} doc
 * @param {boolean} idempotentReplay
 */
export async function recordProductActionCreatedFromDoc(userId, resource, doc, idempotentReplay) {
  if (!doc?.chatOrigin) return;
  const uid = toUserIdString(userId);
  if (!uid) return;
  await metricsService.recordMetric(
    'product_action_created',
    { resource, fromChat: true, idempotentReplay: Boolean(idempotentReplay) },
    uid
  );
}

/**
 * Fallo de creación con intención desde chat (body con chatOrigin).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {'task'|'habit'} resource
 */
export async function recordProductActionCreateFailed(userId, resource) {
  const uid = toUserIdString(userId);
  if (!uid) return;
  await metricsService.recordMetric(
    'product_action_create_failed',
    { fromChat: true, resource },
    uid
  );
}
