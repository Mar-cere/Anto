/**
 * Módulos extraídos de chatRoutes para mantener el archivo de rutas manejable.
 * - chatConstants: límites, ventanas de contexto y rate limiters
 * - chatMiddleware: validación de conversationId y conversación
 * - chatContextAnalysis: detección de escalada, rechazo de ayuda, riesgo y factores protectores
 */

export {
  LIMITE_MENSAJES,
  VENTANA_CONTEXTO,
  HISTORIAL_LIMITE,
  deleteConversationLimiter,
  patchMessageLimiter,
  sendMessageLimiter
} from './chatConstants.js';

export { isValidObjectId, validarConversationId, validarConversacion } from './chatMiddleware.js';

export {
  detectEmotionalEscalation,
  detectHelpRejection,
  detectAbruptToneChange,
  analyzeMessageFrequency,
  calculateAverageTimeDiff,
  detectSilenceAfterNegative,
  shouldShowActionSuggestions,
  calculateRiskScore,
  extractRiskFactors,
  extractProtectiveFactors
} from './chatContextAnalysis.js';
