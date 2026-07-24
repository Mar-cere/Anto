/**
 * Constantes del servicio de seguimiento post-crisis.
 * Alineado a soft landing #225 (ventana ~48 h).
 */

export const FOLLOW_UP_INTERVALS = {
  FIRST: 48, // Primera verificación alineada a soft landing
  SECOND: 96, // Segunda verificación
  THIRD: 168, // Tercera verificación a los 7 días
};

export const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Cada hora

/** Horas para el primer seguimiento según nivel de riesgo (mín. 48 h salvo HIGH) */
export const FIRST_FOLLOW_UP_HOURS_BY_RISK = {
  HIGH: 48,
  MEDIUM: 48,
  WARNING: 48,
};
