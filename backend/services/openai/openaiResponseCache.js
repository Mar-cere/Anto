/**
 * Caché de respuestas de OpenAI: generación de clave, validación y adaptación.
 * Extraído de openaiService para reducir su tamaño y separar responsabilidades.
 */
import cacheService from '../cacheService.js';
import { GENERIC_RESPONSE_PATTERNS } from '../../constants/openai.js';

const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Genera la clave de caché para una respuesta según mensaje y análisis.
 * @param {string} messageContent - Contenido del mensaje
 * @param {Object} emotionalAnalysis - Análisis emocional
 * @param {Object} contextualAnalysis - Análisis contextual
 * @returns {string} Clave de caché
 */
export function generateResponseCacheKey(messageContent, emotionalAnalysis, contextualAnalysis) {
  const normalizedMessage = messageContent.toLowerCase().trim().replace(/\s+/g, ' ');
  const emotion = emotionalAnalysis?.mainEmotion || 'neutral';
  const intent = contextualAnalysis?.intencion?.tipo || 'EMOTIONAL_SUPPORT';
  const topic = emotionalAnalysis?.topic || contextualAnalysis?.tema || 'general';
  const cacheData = {
    message: normalizedMessage.substring(0, 100),
    emotion,
    intent,
    topic
  };
  return cacheService.generateKey('response', cacheData);
}

/**
 * Comprueba si una respuesta cacheada sigue siendo válida (edad y coherencia emocional).
 * @param {Object} cachedResponse - Objeto cacheado { response, timestamp, emotional? }
 * @param {Object} currentContext - Contexto actual (emotional, etc.)
 * @returns {boolean}
 */
export function isCachedResponseValid(cachedResponse, currentContext) {
  if (!cachedResponse || !cachedResponse.response) return false;
  const age = Date.now() - (cachedResponse.timestamp || 0);
  if (age > CACHE_MAX_AGE_MS) return false;
  const cachedEmotion = cachedResponse.emotional?.mainEmotion;
  const currentEmotion = currentContext?.emotional?.mainEmotion || currentContext?.mainEmotion;
  if (cachedEmotion && currentEmotion && cachedEmotion !== currentEmotion) return false;
  return true;
}

function isGenericResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') return false;
  return GENERIC_RESPONSE_PATTERNS.some(patron => patron.test(responseText.trim()));
}

/**
 * Adapta una respuesta cacheada (string) al contexto actual.
 * @param {string} cachedResponseText - Texto de la respuesta cacheada
 * @param {Object} currentContext - Contexto actual (urgencia, etc.)
 * @param {string} currentMessage - Mensaje actual del usuario
 * @returns {string} Respuesta adaptada
 */
export function adaptCachedResponse(cachedResponseText, currentContext, currentMessage) {
  if (isGenericResponse(cachedResponseText)) return cachedResponseText;
  let adapted = cachedResponseText;
  const urgencia = currentContext?.contextual?.urgencia ?? currentContext?.urgencia;
  if (urgencia === 'ALTA') {
    const lower = adapted.toLowerCase();
    if (!lower.includes('importante') && !lower.includes('urgente')) {
      adapted = `Es importante que sepas: ${adapted}`;
    }
  }
  return adapted;
}
