/**
 * Mensajes de API de chat (es/en) — errores y respuestas visibles al usuario.
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    historyError: 'Error al obtener el historial de mensajes',
    sessionIntentionInvalid:
      'sessionIntention inválido o vacío. Valores: vent, organize, technique, plan',
    sessionIntentionSaveError: 'Error al guardar la intención de sesión',
    sessionIntentionTooLate:
      'La intención de sesión solo puede fijarse antes del primer mensaje tuyo en esta conversación.',
    conversationOrUserInvalid: 'ID de conversación o usuario inválido',
    conversationNotFound: 'Conversación no encontrada',
    proposalActionInvalid: 'action inválida. Valores: accepted|rejected',
    proposalFeedbackError: 'No se pudo guardar feedback de propuesta',
    sessionIntentionInvalidShort:
      'sessionIntention inválido. Valores: vent, organize, technique, plan',
    createConversationError: 'Error al crear la conversación',
    delayMinutesInvalid: 'delayMinutes debe ser un número entre 5 y 12',
    invalidIds: 'Identificadores inválidos',
    scheduleContinuityError: 'No se pudo programar la continuidad del chat',
    sessionInsightError: 'No se pudo generar el insight de sesión',
    sessionWaiNotEligible: 'Esta sesión no admite feedback de alianza',
    sessionWaiAlreadyRecorded: 'Ya registraste tu opinión sobre esta sesión',
    sessionWaiScoresInvalid: 'Cada puntuación debe ser un número del 1 al 5',
    sessionWaiSubmitError: 'No se pudo guardar tu feedback',
    sessionWaiSkipError: 'No se pudo registrar la omisión',
    conversationIdRequired: 'ID de conversación requerido',
    conversationIdInvalid: 'ID de conversación inválido',
    conversationForbidden: 'No tienes permiso para acceder a esta conversación',
    subscriptionRequired:
      'Se requiere suscripción activa o trial válido para usar el chat',
    contentRequired: 'El contenido del mensaje es requerido',
    messageLimit: (limit) =>
      `Límite de mensajes alcanzado (${limit} mensajes por conversación). Por favor, crea una nueva conversación para continuar.`,
    messageProcessing: 'Este mensaje ya se está procesando. Espera un momento.',
    streamError: 'Error en streaming',
    processMessageError: 'Error procesando el mensaje',
    assistantProcessingFallback:
      'Lo siento, ha ocurrido un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?',
    criticalProcessError: 'Error crítico al procesar el mensaje',
    messageIdInvalid: 'ID de mensaje inválido',
    helpfulRequired: 'Se requiere el campo helpful',
    helpfulInvalid: 'helpful debe ser "up", "down" o null',
    assistantMessageNotFound:
      'Mensaje no encontrado o no es un mensaje del asistente',
    ratingSaveError: 'Error al guardar la valoración',
    listConversationsError: 'Error al obtener las conversaciones',
    messageIdsRequired: 'Se requiere al menos un ID de mensaje',
    messageStatusInvalid: 'Estado de mensaje inválido',
    messageIdsInvalid: 'Algunos IDs de mensaje son inválidos',
    messagesNotOwned: 'Algunos mensajes no existen o no pertenecen al usuario',
    messagesUpdated: (n) => `${n} mensajes actualizados`,
    updateStatusError: 'Error al actualizar el estado de los mensajes',
    messagesDeletedSuccess: 'Mensajes eliminados exitosamente',
    deleteMessagesError: 'Error al eliminar los mensajes',
    searchMessagesError: 'Error al buscar mensajes',
    clearConversationError: 'Error al limpiar la conversación',
    deleteConversationError: 'Error al eliminar la conversación',
    rateLimitDeleteConversation:
      'Demasiadas eliminaciones de conversaciones. Por favor, intente más tarde.',
    rateLimitPatchMessages:
      'Demasiadas actualizaciones de mensajes. Por favor, intente más tarde.',
    rateLimitFeedback:
      'Demasiadas valoraciones seguidas. Espera un momento e inténtalo de nuevo.',
    rateLimitSendMessage:
      'Demasiados mensajes enviados. Por favor, espera un momento antes de intentar de nuevo.',
    rateLimitScheduleContinuity:
      'Demasiadas peticiones de programación. Intenta más tarde.',
    rateLimitSessionWai:
      'Demasiados envíos de feedback de sesión. Intenta más tarde.',
  },
  en: {
    historyError: 'Could not load message history',
    sessionIntentionInvalid:
      'Invalid or empty sessionIntention. Values: vent, organize, technique, plan',
    sessionIntentionSaveError: 'Could not save session intention',
    sessionIntentionTooLate:
      'Session intention can only be set before your first message in this conversation.',
    conversationOrUserInvalid: 'Invalid conversation or user ID',
    conversationNotFound: 'Conversation not found',
    proposalActionInvalid: 'Invalid action. Values: accepted|rejected',
    proposalFeedbackError: 'Could not save proposal feedback',
    sessionIntentionInvalidShort:
      'Invalid sessionIntention. Values: vent, organize, technique, plan',
    createConversationError: 'Could not create conversation',
    delayMinutesInvalid: 'delayMinutes must be a number between 5 and 12',
    invalidIds: 'Invalid identifiers',
    scheduleContinuityError: 'Could not schedule chat continuity',
    sessionInsightError: 'Could not generate session insight',
    sessionWaiNotEligible: 'This session does not accept alliance feedback',
    sessionWaiAlreadyRecorded: 'You already shared feedback for this session',
    sessionWaiScoresInvalid: 'Each rating must be a number from 1 to 5',
    sessionWaiSubmitError: 'Could not save your feedback',
    sessionWaiSkipError: 'Could not record skip',
    conversationIdRequired: 'Conversation ID is required',
    conversationIdInvalid: 'Invalid conversation ID',
    conversationForbidden: 'You do not have permission to access this conversation',
    subscriptionRequired:
      'An active subscription or valid trial is required to use chat',
    contentRequired: 'Message content is required',
    messageLimit: (limit) =>
      `Message limit reached (${limit} messages per conversation). Please start a new conversation to continue.`,
    messageProcessing: 'This message is already being processed. Please wait.',
    streamError: 'Streaming error',
    processMessageError: 'Error processing message',
    assistantProcessingFallback:
      'Sorry, an error occurred while processing your message. Could you try again?',
    criticalProcessError: 'Critical error processing message',
    messageIdInvalid: 'Invalid message ID',
    helpfulRequired: 'The helpful field is required',
    helpfulInvalid: 'helpful must be "up", "down", or null',
    assistantMessageNotFound:
      'Message not found or is not an assistant message',
    ratingSaveError: 'Could not save rating',
    listConversationsError: 'Could not load conversations',
    messageIdsRequired: 'At least one message ID is required',
    messageStatusInvalid: 'Invalid message status',
    messageIdsInvalid: 'Some message IDs are invalid',
    messagesNotOwned: 'Some messages do not exist or do not belong to you',
    messagesUpdated: (n) => `${n} messages updated`,
    updateStatusError: 'Could not update message status',
    messagesDeletedSuccess: 'Messages deleted successfully',
    deleteMessagesError: 'Could not delete messages',
    searchMessagesError: 'Could not search messages',
    clearConversationError: 'Could not clear conversation',
    deleteConversationError: 'Could not delete conversation',
    rateLimitDeleteConversation:
      'Too many conversation deletions. Please try again later.',
    rateLimitPatchMessages:
      'Too many message updates. Please try again later.',
    rateLimitFeedback:
      'Too many ratings in a row. Wait a moment and try again.',
    rateLimitSendMessage:
      'Too many messages sent. Please wait a moment before trying again.',
    rateLimitScheduleContinuity:
      'Too many scheduling requests. Try again later.',
    rateLimitSessionWai:
      'Too many session feedback submissions. Try again later.',
  },
};

export function chatApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
