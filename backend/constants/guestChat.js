/** Mensajes de usuario permitidos por sesión invitada (sin cuenta) */
export const GUEST_MAX_USER_MESSAGES = 5;

/** JWT invitado: duración */
export const GUEST_SESSION_HOURS = 24;

/** Longitud máxima por mensaje (invitado); alineado con el cliente para evitar abuso de tokens */
export const GUEST_MAX_CONTENT_LENGTH = 500;

/**
 * Rate limit HTTP para POST /session (invitado). En NODE_ENV=test el middleware no cuenta peticiones.
 */
export const GUEST_SESSION_CREATE_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000,
  max: 15,
};
