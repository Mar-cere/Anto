/**
 * Constantes del servicio de seguimiento post-crisis.
 * Extraído de crisisFollowUpService para mantener el servicio más manejable.
 */

export const FOLLOW_UP_INTERVALS = {
  FIRST: 24,   // Primera verificación a las 24 horas
  SECOND: 48,  // Segunda verificación a las 48 horas
  THIRD: 168   // Tercera verificación a los 7 días (168 horas)
};

export const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Cada hora

/** Horas para el primer seguimiento según nivel de riesgo */
export const FIRST_FOLLOW_UP_HOURS_BY_RISK = {
  HIGH: 12,    // Seguimiento más temprano para alto riesgo
  MEDIUM: 24,
  WARNING: 48  // Seguimiento más tardío para advertencias
};
