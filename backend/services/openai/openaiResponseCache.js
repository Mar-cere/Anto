/**
 * Caché de respuestas de OpenAI: generación de clave, validación y adaptación.
 * Extraído de openaiService para reducir su tamaño y separar responsabilidades.
 */
import cacheService from '../cacheService.js';
import { GENERIC_RESPONSE_PATTERNS } from '../../constants/openai.js';

const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutos
const MIN_CACHEABLE_MESSAGE_LENGTH = 20;

const SHORT_AFFIRMATION =
  /^(?:s[ií]|yes|yeah|yep|ok|okay|vale|claro|exacto|cierto|correcto|afirmativo|de\s+acuerdo|así\s+es)[.!?,…]*$/iu;

/**
 * Mensajes cortos o afirmaciones dependen del turno inmediato; no cachear.
 * @param {string} messageContent
 */
export function shouldBypassResponseCache(messageContent) {
  const normalized = String(messageContent || '').trim();
  if (!normalized) return true;
  if (normalized.length < MIN_CACHEABLE_MESSAGE_LENGTH) return true;
  if (SHORT_AFFIRMATION.test(normalized)) return true;
  return false;
}

/**
 * @param {Array<{ role?: string, content?: string }>} historyMessages
 */
export function resolveLastAssistantSignature(historyMessages) {
  const list = Array.isArray(historyMessages) ? historyMessages : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.role === 'assistant') {
      return String(list[i].content || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 80);
    }
  }
  return '';
}

/**
 * Evita reutilizar una respuesta que ya apareció en el hilo actual.
 * @param {string} cachedResponseText
 * @param {Array<{ role?: string, content?: string }>} historyMessages
 */
export function isCachedResponseDuplicateInThread(cachedResponseText, historyMessages) {
  const candidate = String(cachedResponseText || '').trim();
  if (!candidate) return false;
  const recentAssistants = (historyMessages || [])
    .filter((m) => m?.role === 'assistant')
    .map((m) => String(m.content || '').trim())
    .filter(Boolean)
    .slice(-5);
  return recentAssistants.some((text) => text === candidate);
}

/**
 * Genera la clave de caché para una respuesta según mensaje, análisis y hilo.
 * @param {string} messageContent
 * @param {Object} emotionalAnalysis
 * @param {Object} contextualAnalysis
 * @param {'es'|'en'} [language='es']
 * @param {{ conversationId?: string, lastAssistantSignature?: string }} [options]
 */
export function generateResponseCacheKey(
  messageContent,
  emotionalAnalysis,
  contextualAnalysis,
  language = 'es',
  options = {},
) {
  const normalizedMessage = messageContent.toLowerCase().trim().replace(/\s+/g, ' ');
  const emotion = emotionalAnalysis?.mainEmotion || 'neutral';
  const intent = contextualAnalysis?.intencion?.tipo || 'EMOTIONAL_SUPPORT';
  const topic = emotionalAnalysis?.topic || contextualAnalysis?.tema || 'general';
  const conversationId = options.conversationId
    ? String(options.conversationId).slice(0, 32)
    : 'none';
  const lastAssistantSignature = options.lastAssistantSignature
    ? String(options.lastAssistantSignature).slice(0, 80)
    : 'none';
  const cacheData = {
    message: normalizedMessage.substring(0, 100),
    emotion,
    intent,
    topic,
    language: language === 'en' ? 'en' : 'es',
    conversationId,
    lastAssistantSignature,
  };
  return cacheService.generateKey('response', cacheData);
}

/**
 * @param {Object} cachedResponse
 * @param {Object} currentContext
 * @param {Array<{ role?: string, content?: string }>} [historyMessages]
 */
export function isCachedResponseValid(cachedResponse, currentContext, historyMessages = []) {
  if (!cachedResponse || !cachedResponse.response) return false;
  const age = Date.now() - (cachedResponse.timestamp || 0);
  if (age > CACHE_MAX_AGE_MS) return false;
  const cachedEmotion = cachedResponse.emotional?.mainEmotion;
  const currentEmotion = currentContext?.emotional?.mainEmotion || currentContext?.mainEmotion;
  if (cachedEmotion && currentEmotion && cachedEmotion !== currentEmotion) return false;
  if (isCachedResponseDuplicateInThread(cachedResponse.response, historyMessages)) return false;
  return true;
}

function isGenericResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') return false;
  return GENERIC_RESPONSE_PATTERNS.some((patron) => patron.test(responseText.trim()));
}

/**
 * @param {string} cachedResponseText
 * @param {Object} currentContext
 * @param {string} currentMessage
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
