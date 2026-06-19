/**
 * Constantes y rate limiters para rutas de chat.
 * Extraído de chatRoutes para mantener el archivo principal manejable.
 */
import { createRateLimiter } from '../../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../../utils/apiLanguage.js';
import { chatApiCopy } from '../../utils/chatApiCopy.js';

// Límites de mensajes y contexto
export const LIMITE_MENSAJES = 100;
/** @deprecated El historial para IA ya no filtra por tiempo; se usa solo HISTORIAL_LIMITE. Mantener por compat. */
export const VENTANA_CONTEXTO = 20 * 60 * 1000;
/** Últimos N mensajes de la misma conversación (sin ventana temporal) para contexto acotado. */
export const HISTORIAL_LIMITE = 24;

export const deleteConversationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: (req) =>
    chatApiCopy(resolveRequestLanguage(req)).rateLimitDeleteConversation,
  standardHeaders: true,
  legacyHeaders: false,
});

export const patchMessageLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => chatApiCopy(resolveRequestLanguage(req)).rateLimitPatchMessages,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Valoraciones pulgar arriba/abajo (independiente del PATCH de estado de entrega). */
export const messageFeedbackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: (req) => chatApiCopy(resolveRequestLanguage(req)).rateLimitFeedback,
  standardHeaders: true,
  legacyHeaders: false,
});

export const sendMessageLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: (req) => chatApiCopy(resolveRequestLanguage(req)).rateLimitSendMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/** Programación best-effort de continuidad del chat (#4 + #47); límite por usuario autenticado. */
export const scheduleSessionSummaryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: (req) =>
    chatApiCopy(resolveRequestLanguage(req)).rateLimitScheduleContinuity,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?._id ? String(req.user._id) : req.ip ?? 'unknown'),
});

/** WAI post-sesión (#98): submit/skip por usuario. */
export const sessionWaiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => chatApiCopy(resolveRequestLanguage(req)).rateLimitSessionWai,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?._id ? String(req.user._id) : req.ip ?? 'unknown'),
});
