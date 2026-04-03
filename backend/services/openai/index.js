/**
 * Módulos extraídos de openaiService para mantener el servicio más manejable.
 * - openaiValidation: validación de mensajes y normalización de análisis emocional
 * - openaiResponseCache: clave de caché, validación y adaptación de respuestas cacheadas
 * - openaiPromptBuilder: construcción del prompt contextualizado (system + context messages)
 */
export { validateMessage, normalizeEmotionalAnalysis } from './openaiValidation.js';
export { generateResponseCacheKey, isCachedResponseValid, adaptCachedResponse } from './openaiResponseCache.js';
export {
  buildContextualizedPrompt,
  buildHistoryForPromptFromMessages,
  computeHistorySelectionForPrompt,
  selectHistoryForPrompt,
  selectRelevantHistory,
  generateConversationSummary,
  buildAntiEchoHint,
  generateLongTermContext,
  generarMensajesContexto
} from './openaiPromptBuilder.js';
