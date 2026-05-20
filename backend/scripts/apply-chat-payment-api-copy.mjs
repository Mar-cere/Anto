/**
 * Sustituye mensajes en chatRoutes y paymentRoutes.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CHAT_REPLACEMENTS = [
  ["message: 'Error al obtener el historial de mensajes'", 'message: req.apiCopy.historyError'],
  [
    "message: 'sessionIntention inválido o vacío. Valores: vent, organize, technique, plan'",
    'message: req.apiCopy.sessionIntentionInvalid',
  ],
  ["message: 'Conversación no encontrada'", 'message: req.apiCopy.conversationNotFound'],
  ["message: 'Error al guardar la intención de sesión'", 'message: req.apiCopy.sessionIntentionSaveError'],
  [
    "message: 'action inválida. Valores: accepted|rejected'",
    'message: req.apiCopy.proposalActionInvalid',
  ],
  ["message: 'No se pudo guardar feedback de propuesta'", 'message: req.apiCopy.proposalFeedbackError'],
  [
    "message: 'sessionIntention inválido. Valores: vent, organize, technique, plan'",
    'message: req.apiCopy.sessionIntentionInvalidShort',
  ],
  ["message: 'Error al crear la conversación'", 'message: req.apiCopy.createConversationError'],
  [
    "message: 'delayMinutes debe ser un número entre 5 y 12'",
    'message: req.apiCopy.delayMinutesInvalid',
  ],
  ["message: 'Identificadores inválidos'", 'message: req.apiCopy.invalidIds'],
  ["message: 'No se pudo programar la continuidad del chat'", 'message: req.apiCopy.scheduleContinuityError'],
  ["message: 'ID de conversación requerido'", 'message: req.apiCopy.conversationIdRequired'],
  ["message: 'ID de conversación inválido'", 'message: req.apiCopy.conversationIdInvalid'],
  [
    "message: 'No tienes permiso para acceder a esta conversación'",
    'message: req.apiCopy.conversationForbidden',
  ],
  [
    "error: 'Se requiere suscripción activa o trial válido para usar el chat'",
    'error: req.apiCopy.subscriptionRequired',
  ],
  ["message: 'El contenido del mensaje es requerido'", 'message: req.apiCopy.contentRequired'],
  [
    "message: 'Este mensaje ya se está procesando. Espera un momento.'",
    'message: req.apiCopy.messageProcessing',
  ],
  ["message: 'Error procesando el mensaje'", 'message: req.apiCopy.processMessageError'],
  ["message: 'Error crítico al procesar el mensaje'", 'message: req.apiCopy.criticalProcessError'],
  ["message: 'ID de mensaje inválido'", 'message: req.apiCopy.messageIdInvalid'],
  ["message: 'Se requiere el campo helpful'", 'message: req.apiCopy.helpfulRequired'],
  [
    'message: \'helpful debe ser "up", "down" o null\'',
    'message: req.apiCopy.helpfulInvalid',
  ],
  [
    "message: 'Mensaje no encontrado o no es un mensaje del asistente'",
    'message: req.apiCopy.assistantMessageNotFound',
  ],
  ["message: 'Error al guardar la valoración'", 'message: req.apiCopy.ratingSaveError'],
  ["message: 'Error al obtener las conversaciones'", 'message: req.apiCopy.listConversationsError'],
  ["message: 'Se requiere al menos un ID de mensaje'", 'message: req.apiCopy.messageIdsRequired'],
  ["message: 'Estado de mensaje inválido'", 'message: req.apiCopy.messageStatusInvalid'],
  ["message: 'Algunos IDs de mensaje son inválidos'", 'message: req.apiCopy.messageIdsInvalid'],
  [
    "message: 'Algunos mensajes no existen o no pertenecen al usuario'",
    'message: req.apiCopy.messagesNotOwned',
  ],
  ["message: 'Error al actualizar el estado de los mensajes'", 'message: req.apiCopy.updateStatusError'],
  ["message: 'Mensajes eliminados exitosamente'", 'message: req.apiCopy.messagesDeletedSuccess'],
  ["message: 'Error al eliminar los mensajes'", 'message: req.apiCopy.deleteMessagesError'],
  ["message: 'Error al buscar mensajes'", 'message: req.apiCopy.searchMessagesError'],
];

const PAYMENT_REPLACEMENTS = [
  ["error: 'Error al obtener planes'", 'error: req.apiCopy.plansError'],
  ["error: 'Datos inválidos'", 'error: req.apiCopy.invalidData'],
  ["error: 'Error al obtener información del trial'", 'error: req.apiCopy.trialError'],
  ["error: 'Error al obtener transacciones'", 'error: req.apiCopy.transactionsError'],
  ["error: 'Error al obtener estadísticas'", 'error: req.apiCopy.statsError'],
  [
    "message: restore ? 'Compras restauradas correctamente' : 'Suscripción activada correctamente'",
    'message: restore ? req.apiCopy.receiptRestored : req.apiCopy.receiptActivated',
  ],
  ["error: 'Error interno'", 'error: req.apiCopy.webhookInternalError'],
];

function apply(filePath, replacements) {
  let content = readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    if (!content.includes(from)) {
      console.warn('MISSING:', from.slice(0, 55), 'in', filePath);
    } else {
      content = content.split(from).join(to);
    }
  }
  writeFileSync(filePath, content, 'utf8');
  console.log('Updated', filePath);
}

apply(join(__dirname, '../routes/chatRoutes.js'), CHAT_REPLACEMENTS);
apply(join(__dirname, '../routes/paymentRoutes.js'), PAYMENT_REPLACEMENTS);
