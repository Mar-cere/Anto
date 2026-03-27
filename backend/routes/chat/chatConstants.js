/**
 * Constantes y rate limiters para rutas de chat.
 * Extraído de chatRoutes para mantener el archivo principal manejable.
 */
import rateLimit from 'express-rate-limit';

// Límites de mensajes y contexto
export const LIMITE_MENSAJES = 100;
/** @deprecated El historial para IA ya no filtra por tiempo; se usa solo HISTORIAL_LIMITE. Mantener por compat. */
export const VENTANA_CONTEXTO = 20 * 60 * 1000;
/** Últimos N mensajes de la misma conversación (sin ventana temporal) para contexto acotado. */
export const HISTORIAL_LIMITE = 24;

export const deleteConversationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiadas eliminaciones de conversaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

export const patchMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiadas actualizaciones de mensajes. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

export const sendMessageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: 'Demasiados mensajes enviados. Por favor, espera un momento antes de intentar de nuevo.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});
