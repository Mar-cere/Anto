/**
 * Mensajes de API del chat invitado (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    rateLimitSessionCreate:
      'Demasiadas sesiones de invitado. Intenta más tarde o crea una cuenta.',
    rateLimitMessages: 'Demasiados mensajes. Espera un momento e inténtalo de nuevo.',
    rateLimitRequests: 'Demasiadas peticiones. Espera un momento.',
    sessionStartError: 'No se pudo iniciar el chat de invitado',
    conversationIdInvalid: 'Identificador de conversación no válido',
    conversationNotAllowed: 'Conversación no permitida para esta sesión',
    loadMessagesError: 'Error al cargar mensajes',
    messagesDeletedSuccess: 'Mensajes eliminados exitosamente',
    deleteMessagesError: 'Error al eliminar mensajes',
    bodyFieldsRequired: 'conversationId y content (texto) son requeridos',
    conversationMismatch: 'Conversación no permitida',
    processMessageError: 'Error al procesar el mensaje',
    guestTokenRequired: 'Token de invitado requerido',
    guestTokenInvalid: 'Token de invitado inválido',
    guestSessionNotFound: 'Sesión invitada no encontrada',
    guestSessionExpired: 'Sesión invitada expirada',
  },
  en: {
    rateLimitSessionCreate:
      'Too many guest sessions. Try again later or create an account.',
    rateLimitMessages: 'Too many messages. Wait a moment and try again.',
    rateLimitRequests: 'Too many requests. Wait a moment.',
    sessionStartError: 'Could not start guest chat',
    conversationIdInvalid: 'Invalid conversation ID',
    conversationNotAllowed: 'Conversation not allowed for this session',
    loadMessagesError: 'Could not load messages',
    messagesDeletedSuccess: 'Messages deleted successfully',
    deleteMessagesError: 'Could not delete messages',
    bodyFieldsRequired: 'conversationId and content (text) are required',
    conversationMismatch: 'Conversation not allowed',
    processMessageError: 'Could not process message',
    guestTokenRequired: 'Guest token required',
    guestTokenInvalid: 'Invalid guest token',
    guestSessionNotFound: 'Guest session not found',
    guestSessionExpired: 'Guest session expired',
  },
};

export function guestChatApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
