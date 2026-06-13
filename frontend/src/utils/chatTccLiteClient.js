/**
 * Helpers de cliente para payload TCC lite del turno de chat (#201).
 */

/** @returns {object|null} handoff AT solo tras completar el marco */
export function resolveTccLiteAtHandoffFromPayload(payload) {
  if (!payload?.tccLite?.atHandoff?.screen) return null;
  if (payload.tccLite.active) return null;
  if (!payload.tccLite.completed) return null;
  return payload.tccLite.atHandoff;
}

/** @returns {boolean} si un nuevo turno activo debe ocultar handoff previo */
export function shouldClearTccLiteHandoff(payload) {
  return payload?.tccLite?.active === true;
}
