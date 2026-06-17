/**
 * Helpers de cliente para payload TCC lite del turno de chat (#201).
 */

/** @returns {object} metadata del mensaje asistente con pie TCC lite si aplica */
export function buildAssistantMetadataFromTurnPayload(payload, baseMetadata = {}) {
  const meta = { ...(baseMetadata || {}) };
  const lite = payload?.tccLite;
  if (!lite || typeof lite !== 'object') return meta;

  if (lite.active && lite.step) {
    meta.tccLite = {
      step: lite.step,
      stepIndex: lite.stepIndex,
      stepTotal: lite.stepTotal,
      stepShort: lite.stepShort,
      frameLabel: lite.kicker || lite.frameLabel,
      distortionType: lite.distortionType || null,
      distortionLabel: lite.distortionLabel || null,
      completed: lite.completed === true,
    };
  } else if (lite.completed) {
    meta.tccLite = {
      step: lite.step || 'wrap_up',
      completed: true,
      stepIndex: lite.stepIndex,
      stepTotal: lite.stepTotal,
    };
  }
  return meta;
}

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
