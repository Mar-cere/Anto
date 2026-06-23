/**
 * Servicio de OpenAI - Gestiona la generación de respuestas con GPT-5 Mini y análisis contextual
 */
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { withTimeout } from '../utils/withTimeout.js';
import { CircuitBreaker, CircuitBreakerOpenError } from '../utils/circuitBreaker.js';
import {
    ANALYSIS_DIMENSIONS,
    DEFAULT_VALUES,
    EMOTIONAL_COHERENCE_PATTERNS,
    EMOTIONAL_COHERENCE_PHRASES,
    ERROR_MESSAGES,
    GENERIC_RESPONSE_PATTERNS,
    getRandomGreeting,
    MESSAGE_INTENTS,
    OPENAI_MODEL,
    PROMPT_CONFIG,
    getChatReasoningEffortForContext,
    resolveModelRoutingForContext,
    RESPONSE_LENGTHS,
    TEMPERATURES,
    THRESHOLDS,
    TIME_PERIODS,
    VALIDATION_LIMITS
} from '../constants/openai.js';
import {
  buildContextualizedPrompt,
  resolveChatLanguage,
} from './openai/openaiPromptBuilder.js';
import {
  adaptCachedResponse,
  generateResponseCacheKey,
  isCachedResponseValid,
  resolveLastAssistantSignature,
  shouldBypassResponseCache,
} from './openai/openaiResponseCache.js';
import { normalizeEmotionalAnalysis, validateMessage } from './openai/openaiValidation.js';
import {
    formatTechniqueForResponse,
    selectAppropriateTechnique
} from '../constants/therapeuticTechniques.js';
import {
  shouldSkipEmergencyPhoneNumbersInSafetyAppend,
  shouldUseCompactCrisisSafetyAppend,
  getStructuredCrisisProtocolCopy,
  hasStructuredCrisisProtocolElement,
  buildCrisisSafetyAppendText,
} from '../constants/crisis.js';
import { isLlmCrisisTherapeuticExtrasBlocked } from '../utils/chatObservationalContext.js';
import {
  shouldApplyCrisisResponseSafety,
  sanitizeCrisisLlmResponse,
  getCrisisSanitizeFallback,
} from '../utils/crisisResponseSafety.js';
import {
  formatEmergencyNumbers,
  resolveEmergencyInfoFromPreferences
} from '../constants/emergencyNumbers.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import OpenAITokenUsageDay from '../models/OpenAITokenUsageDay.js';
import TherapeuticRecord from '../models/TherapeuticRecord.js';
import cacheService from './cacheService.js';
import contextAnalyzer from './contextAnalyzer.js';
import emotionalAnalyzer from './emotionalAnalyzer.js';
import goalTracker from './goalTracker.js';
import memoryService from './memoryService.js';
import metricsService from './metricsService.js';
import personalizationService from './personalizationService.js';
import progressTracker from './progressTracker.js';
import sessionEmotionalMemory from './sessionEmotionalMemory.js';
import therapeuticProtocolService from './therapeuticProtocolService.js';
import therapeuticTemplateService from './therapeuticTemplateService.js';
import {
  buildOffScopeRedirectReply,
  detectOffScopeUserMessage,
  sanitizeOffScopeAssistantReply,
} from './chat/chatScopeGuardrails.js';
import { resolveResponseLengthLimits } from './chat/responseLengthPreference.js';
import {
  shouldOrientSessionClosure,
  stripPrematureSessionClosurePhrases,
  responseHasSessionClosureBridge,
  getSessionClosureBridge,
  resolveLanguageFromContext,
  shouldForceSessionClosureBridge
} from './sessionRetentionHints.js';

dotenv.config();

// Validar y crear cliente de OpenAI
const validateApiKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY no está configurada en las variables de entorno');
    console.error('💡 Configura OPENAI_API_KEY en tu archivo .env o en las variables de entorno de Render');
    console.error('💡 Puedes obtener tu API key en: https://platform.openai.com/account/api-keys');
    return false;
  }
  return true;
};

// Validar que la API key esté configurada al cargar el módulo
validateApiKey();

// Cliente de OpenAI (solo se crea si hay API key)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || '25000', 10);
const OPENAI_BREAKER_FAILURE_THRESHOLD = parseInt(process.env.OPENAI_BREAKER_FAILURE_THRESHOLD || '5', 10);
const OPENAI_BREAKER_COOLDOWN_MS = parseInt(process.env.OPENAI_BREAKER_COOLDOWN_MS || '20000', 10);
const OPENAI_BREAKER_SUCCESS_THRESHOLD = parseInt(process.env.OPENAI_BREAKER_SUCCESS_THRESHOLD || '1', 10);

const openaiBreaker = new CircuitBreaker({
  name: 'OpenAI',
  failureThreshold: Number.isFinite(OPENAI_BREAKER_FAILURE_THRESHOLD) ? OPENAI_BREAKER_FAILURE_THRESHOLD : 5,
  successThreshold: Number.isFinite(OPENAI_BREAKER_SUCCESS_THRESHOLD) ? OPENAI_BREAKER_SUCCESS_THRESHOLD : 1,
  cooldownMs: Number.isFinite(OPENAI_BREAKER_COOLDOWN_MS) ? OPENAI_BREAKER_COOLDOWN_MS : 20000,
  shouldCountFailure: (err) => {
    // No contar como falla “de proveedor” cuando es un error del cliente (bad request).
    const status = err?.status || err?.response?.status;
    if (status && status >= 400 && status < 500) {
      // 429 sí cuenta (rate limiting del proveedor)
      return status === 429;
    }
    // timeouts y 5xx cuentan
    const code = err?.code;
    if (code === 'TIMEOUT') return true;
    return true;
  }
});

// Helper: obtener período del día
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= TIME_PERIODS.MORNING_START && hour < TIME_PERIODS.MORNING_END) return 'mañana';
  if (hour >= TIME_PERIODS.AFTERNOON_START && hour < TIME_PERIODS.AFTERNOON_END) return 'tarde';
  if (hour >= TIME_PERIODS.EVENING_START && hour < TIME_PERIODS.EVENING_END) return 'noche';
  return 'noche';
};

// Helper: obtener período del día en inglés (para saludos)
const getTimeOfDayEnglish = () => {
  const hour = new Date().getHours();
  if (hour >= TIME_PERIODS.AFTERNOON_START && hour < TIME_PERIODS.AFTERNOON_END) return 'afternoon';
  if (hour >= TIME_PERIODS.EVENING_START && hour < TIME_PERIODS.EVENING_END) return 'evening';
  if (hour >= TIME_PERIODS.EVENING_END || hour < TIME_PERIODS.MORNING_START) return 'night';
  return 'morning';
};

class OpenAIService {
  constructor() {
    // Constantes de configuración
    this.RESPONSE_LENGTHS = RESPONSE_LENGTHS;
    this.ANALYSIS_DIMENSIONS = ANALYSIS_DIMENSIONS;
    
    // Estadísticas de uso de tokens (para determinar límites apropiados)
    this.tokenStats = {
      totalRequests: 0,
      withContent: 0,
      withoutContent: 0,
      completionTokens: [],
      reasoningTokens: [],
      actualContentTokens: [],
      promptTokens: [],
      finishReasons: {},
      lastReset: new Date()
    };

    /** @type {Record<string, { promptTokens: number, completionTokens: number, totalTokens: number, requests: number }>} Clave: YYYY-MM-DD (UTC) */
    this.tokenUsageByDay = {};

    this.defaultResponse = {
      content: ERROR_MESSAGES.INVALID_MESSAGE,
      context: {
        intent: MESSAGE_INTENTS.ERROR,
        confidence: 0,
        suggestions: []
      }
    };

    // Mapeo de preguntas y respuestas comunes
    this.respuestas = {
      'hola': [
        "¡Hola! ¿Cómo estás hoy?",
        "¡Hola! Me alegro de verte. ¿En qué puedo ayudarte?",
        "¡Bienvenido/a! ¿Qué tal tu día?"
      ],
      'que_haces': [
        "Estoy aquí para conversar contigo y ayudarte en lo que necesites. ¿Hay algo específico de lo que quieras hablar?",
        "En este momento estoy disponible para escucharte y apoyarte. ¿Qué te gustaría compartir?",
        "Mi función es acompañarte y brindarte apoyo. ¿Hay algo en particular que te preocupe?"
      ],
      'no_respuesta': [
        "Tienes razón, no respondí tu pregunta. Me preguntaste '{{pregunta}}'. ",
        "Disculpa, me desvié del tema. Volviendo a tu pregunta sobre '{{pregunta}}'. ",
        "Es cierto, no abordé tu pregunta sobre '{{pregunta}}'. "
      ]
    };
  }

  /**
   * Chat completion con reasoning_effort; si la API/SDK rechaza el parámetro, reintenta sin él.
   * @param {Record<string, unknown>} body - Argumentos de openai.chat.completions.create
   */
  async createChatCompletionResilient(body) {
    try {
      return await openaiBreaker.exec(() =>
        withTimeout(
          openai.chat.completions.create(body),
          OPENAI_TIMEOUT_MS,
          { label: 'OpenAI chat.completions.create' }
        )
      );
    } catch (err) {
      const msg = String(err?.message || '');
      // Si el breaker está abierto, fallar rápido con error distinguible
      if (err instanceof CircuitBreakerOpenError || err?.code === 'CIRCUIT_BREAKER_OPEN') {
        throw err;
      }
      const retriable =
        body.reasoning_effort != null &&
        (err?.status === 400 ||
          err?.code === 'unsupported_parameter' ||
          /reasoning|unsupported|unknown parameter/i.test(msg));
      if (retriable) {
        const { reasoning_effort: _ignored, ...rest } = body;
        console.warn('[OpenAI] reasoning_effort no aceptado; reintento sin él:', msg);
        return await openaiBreaker.exec(() =>
          withTimeout(
            openai.chat.completions.create(rest),
            OPENAI_TIMEOUT_MS,
            { label: 'OpenAI chat.completions.create (retry w/o reasoning_effort)' }
          )
        );
      }

      // Fallback de modelo: si el modelo seleccionado no está disponible, reintentar con el modelo base.
      const selectedModel = String(body?.model || '').trim();
      const shouldFallbackModel =
        selectedModel &&
        selectedModel !== OPENAI_MODEL &&
        (err?.status === 404 ||
          err?.code === 'model_not_found' ||
          /model.*not.*found|unknown model|does not exist/i.test(msg));
      if (shouldFallbackModel) {
        const fallbackBody = { ...body, model: OPENAI_MODEL };
        console.warn(`[OpenAI] Modelo "${selectedModel}" no disponible; reintento con modelo base "${OPENAI_MODEL}"`);
        return await openaiBreaker.exec(() =>
          withTimeout(
            openai.chat.completions.create(fallbackBody),
            OPENAI_TIMEOUT_MS,
            { label: 'OpenAI chat.completions.create (fallback model)' }
          )
        );
      }

      throw err;
    }
  }

  _buildOffScopeRedirectResponse(contenidoNormalizado, contexto = {}) {
    if (!detectOffScopeUserMessage({ currentMessage: contenidoNormalizado })) {
      return null;
    }
    const language = resolveChatLanguage(contexto);
    return {
      content: buildOffScopeRedirectReply(language),
      context: {
        emotional: contexto.emotional || { mainEmotion: 'neutral', intensity: 5 },
        contextual: contexto.contextual || {},
        offScopeRedirect: true,
      },
    };
  }

  /**
   * Genera una respuesta contextualizada usando OpenAI GPT-5 Mini
   * @param {Object} mensaje - Mensaje del usuario con content, userId, conversationId
   * @param {Object} contexto - Contexto adicional (opcional)
   * @returns {Promise<Object>} Respuesta generada con content y context
   */
  async generarRespuesta(mensaje, contexto = {}) {
    try {
      const validation = validateMessage(mensaje);
      if (!validation.valid) throw new Error(validation.error);
      const contenidoNormalizado = validation.content;

      // Validar API key antes de continuar
      if (!validateApiKey() || !openai) {
        throw new Error('OPENAI_API_KEY no está configurada. Configura esta variable de entorno en Render.');
      }

      const offScopeEarly = this._buildOffScopeRedirectResponse(contenidoNormalizado, contexto);
      if (offScopeEarly) return offScopeEarly;

      // 1. Análisis Completo - Usar análisis del contexto si está disponible, sino hacerlo aquí
      let analisisEmocional = contexto.emotional;
      let analisisContextual = contexto.contextual;
      let perfilUsuario = contexto.profile;
      let registroTerapeutico = contexto.therapeutic;

      // Si no viene el análisis emocional, hacerlo
      if (!analisisEmocional) {
        analisisEmocional = await emotionalAnalyzer.analyzeEmotion(contenidoNormalizado);
      }

      // Si no viene el análisis contextual, hacerlo (pasar historial cuando esté disponible)
      if (!analisisContextual) {
        const history = contexto.history || [];
        analisisContextual = await contextAnalyzer.analizarMensaje(
          { ...mensaje, content: contenidoNormalizado },
          history.length > 0 ? history : null
        );
      }

      const isGuest = contexto.isGuest === true;

      // Si no viene el perfil, obtenerlo (invitados: perfil mínimo ya en contexto)
      if (!perfilUsuario && !isGuest) {
        perfilUsuario = await personalizationService.getUserProfile(mensaje.userId).catch(() => null);
      }
      if (isGuest && !perfilUsuario) {
        perfilUsuario = contexto.profile || { preferences: { responseStyle: 'empatico' } };
      }

      // Si no viene el registro terapéutico, obtenerlo
      if (!registroTerapeutico && !isGuest) {
        registroTerapeutico = await TherapeuticRecord.findOne({ userId: mensaje.userId }).catch(() => null);
      }
      if (isGuest) {
        registroTerapeutico = null;
      }

      // 2. Obtener Memoria y Contexto
      let memoriaContextual;
      if (contexto.memory && !isGuest) {
        memoriaContextual = contexto.memory;
      } else if (isGuest) {
        memoriaContextual = {
          lastInteraction: null,
          recurringThemes: [],
          patterns: []
        };
      } else {
        memoriaContextual = await memoryService.getRelevantContext(
          mensaje.userId,
          contenidoNormalizado,
          {
            emotional: analisisEmocional,
            contextual: analisisContextual
          }
        );
      }

      // 3. Construir Prompt Contextualizado (módulo openaiPromptBuilder)
      const sessionTrends = isGuest ? null : sessionEmotionalMemory.analyzeTrends(mensaje.userId);
      const prompt = await buildContextualizedPrompt(
        { ...mensaje, content: contenidoNormalizado },
        {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          profile: perfilUsuario,
          therapeutic: registroTerapeutico,
          memory: memoriaContextual,
          history: contexto.history || [],
          currentMessage: contenidoNormalizado,
          currentConversationId: contexto.currentConversationId,
          sessionTrends,
          conversationContext: contexto.conversationContext,
          depthPreference: contexto.depthPreference,
          inferredWritingStyle: contexto.inferredWritingStyle,
          preferredResponseLength: contexto.preferredResponseLength,
          forceShortMode: contexto.forceShortMode,
          forceFactualMode: contexto.forceFactualMode,
          crisis: contexto.crisis,
          isGuest,
          sessionRetention: contexto.sessionRetention,
          sessionIntention: contexto.sessionIntention,
          conversationPattern: contexto.conversationPattern
        }
      );

      // 4. Generar Respuesta con OpenAI

      const modelRouting = resolveModelRoutingForContext({
        content: contenidoNormalizado,
        emotional: analisisEmocional,
        contextual: analisisContextual,
        crisis: contexto?.crisis,
        sessionEmotionalIntensity: Math.max(
          Number(contexto?.sessionEmotionalIntensity ?? 0),
          Number(analisisEmocional?.intensity ?? 5)
        )
      });

      const skipResponseCacheForCrisis = shouldApplyCrisisResponseSafety({
        crisis: contexto?.crisis,
        contextual: analisisContextual,
        emotional: analisisEmocional,
      });

      // Caché solo para mensajes con contexto estable; afirmaciones cortas dependen del turno previo.
      let cachedResponse = null;
      /** Misma clave para get/set; debe vivir en este ámbito (antes estaba solo dentro del `if` y rompía el `set`). */
      let responseCacheKey = null;
      const historyForCache = contexto?.history || contexto?.safetyHistory || [];
      const cacheLanguage = perfilUsuario?.preferences?.language === 'en' ? 'en' : 'es';
      const canUseResponseCache =
        !isGuest &&
        !skipResponseCacheForCrisis &&
        !shouldBypassResponseCache(contenidoNormalizado);
      if (canUseResponseCache) {
        responseCacheKey = generateResponseCacheKey(
          contenidoNormalizado,
          analisisEmocional,
          analisisContextual,
          cacheLanguage,
          {
            conversationId: contexto?.currentConversationId || mensaje?.conversationId,
            lastAssistantSignature: resolveLastAssistantSignature(historyForCache),
          },
        );
        try {
          cachedResponse = await cacheService.get(responseCacheKey);
          if (
            cachedResponse &&
            isCachedResponseValid(cachedResponse, analisisContextual, historyForCache)
          ) {
            console.log('[OpenAI] ✅ Respuesta obtenida del caché');
            const adaptedResponse = adaptCachedResponse(
              cachedResponse.response,
              analisisContextual,
              contenidoNormalizado,
            );
            return {
              content: adaptedResponse,
              context: {
                emotional: analisisEmocional,
                contextual: analisisContextual,
                modelRouting: { ...modelRouting, reason: 'cache_hit' },
              },
            };
          }
        } catch (cacheError) {
          console.warn('[OpenAI] Error al obtener del caché, continuando sin caché:', cacheError.message);
        }
      }

      // Obtener responseStyle del perfil para ajustar longitud (ya obtenido arriba en línea 366)
      const userResponseStyle = perfilUsuario?.preferences?.responseStyle || 'balanced';
      const maxCompletionTokens = this.determinarLongitudRespuesta(
        analisisContextual,
        contenidoNormalizado,
        userResponseStyle
      );
      const promptLength = prompt.systemMessage.length;
      const contextMessagesCount = prompt.contextMessages?.length || 0;
      const userMessageLength = contenidoNormalizado.length;
      const selectedModel = modelRouting.model;
      console.log(`[OpenAI] Prompt length: ${promptLength} chars, Context messages: ${contextMessagesCount}, User message: ${userMessageLength} chars, Max completion tokens: ${maxCompletionTokens}, Response style: ${userResponseStyle}, Model: ${selectedModel}`);
      let completion;
      try {
        completion = await this.createChatCompletionResilient({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: prompt.systemMessage
            },
            ...prompt.contextMessages,
            {
              role: 'user',
              content: contenidoNormalizado
            }
          ],
          max_completion_tokens: maxCompletionTokens,
          reasoning_effort: getChatReasoningEffortForContext(contexto)
          // GPT-5 mini: menos reasoning_effort suele bajar latencia. OPENAI_CHAT_REASONING_EFFORT para override.
          // Crisis MEDIUM/HIGH → medium en getChatReasoningEffortForContext.
        });
      } catch (apiError) {
        // Circuit breaker abierto: fallback inmediato (mejor UX que esperar/reintentar)
        if (apiError instanceof CircuitBreakerOpenError || apiError?.code === 'CIRCUIT_BREAKER_OPEN') {
          console.warn('[OpenAI] Circuit breaker OPEN: usando fallback rápido');
          const fallback = this.generarRespuestaFallback(analisisEmocional, analisisContextual) || ERROR_MESSAGES.DEFAULT_FALLBACK;
          return {
            content: fallback,
            context: {
              emotional: analisisEmocional,
              contextual: analisisContextual,
              modelRouting,
              degraded: true,
              degradedReason: 'openai_breaker_open'
            }
          };
        }
        // Manejar errores específicos de autenticación
        if (apiError.status === 401 || apiError.code === 'invalid_api_key') {
          console.error('❌ ERROR DE AUTENTICACIÓN CON OPENAI:');
          console.error('   La API key proporcionada es incorrecta o ha expirado');
          console.error('   Verifica que OPENAI_API_KEY esté correctamente configurada en Render');
          console.error('   Puedes obtener una nueva API key en: https://platform.openai.com/account/api-keys');
          console.error('   Error completo:', apiError.message);
          throw new Error('Error de autenticación con OpenAI. Verifica tu API key en las variables de entorno de Render.');
        }
        // Re-lanzar otros errores
        throw apiError;
      }

      // Logging para debugging
      if (!completion) {
        console.error('❌ OpenAI no devolvió una respuesta (completion es null/undefined)');
        throw new Error('No se recibió respuesta de OpenAI');
      }

      if (!completion.choices || completion.choices.length === 0) {
        console.error('❌ OpenAI no devolvió choices en la respuesta:', JSON.stringify(completion, null, 2));
        throw new Error('La respuesta de OpenAI no contiene choices');
      }

      let respuestaGenerada = completion.choices[0]?.message?.content?.trim();
      
      // Capitalizar la primera letra de la respuesta
      if (respuestaGenerada && respuestaGenerada.length > 0) {
        respuestaGenerada = respuestaGenerada.charAt(0).toUpperCase() + respuestaGenerada.slice(1);
      }
      
      const finishReason = completion.choices[0]?.finish_reason;
      const usage = completion.usage || {};
      const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens || 0;
      const actualContentTokens = usage.completion_tokens - reasoningTokens;
      const promptTokens = usage.prompt_tokens || 0;
      const totalTokens = usage.total_tokens || 0;
      
      // MONITOREO: Registrar estadísticas de uso de tokens
      this.registrarEstadisticasTokens({
        maxCompletionTokens: maxCompletionTokens,
        totalCompletionTokens: usage.completion_tokens,
        reasoningTokens: reasoningTokens,
        actualContentTokens: actualContentTokens,
        promptTokens: promptTokens,
        totalTokens: totalTokens,
        finishReason: finishReason,
        hasContent: !!respuestaGenerada,
        contentLength: respuestaGenerada?.length || 0
      });

      // Validar que se generó una respuesta
      if (!respuestaGenerada) {
        console.error('❌ OpenAI devolvió una respuesta vacía:', {
          finishReason: finishReason,
          promptLength: prompt.systemMessage.length,
          contextMessagesCount: prompt.contextMessages?.length || 0,
          maxCompletionTokens: maxCompletionTokens,
          totalCompletionTokens: usage.completion_tokens,
          reasoningTokens: reasoningTokens,
          actualContentTokens: actualContentTokens,
          promptTokens: usage.prompt_tokens,
          totalTokens: usage.total_tokens
        });
        
        // Si el finish_reason es 'length' y hay reasoning tokens, el límite es muy bajo
        if (finishReason === 'length' && reasoningTokens > 0) {
          console.warn(`⚠️ Límite de tokens alcanzado. Se usaron ${reasoningTokens} tokens de reasoning (razonamiento interno) que no generan contenido visible. Considera aumentar max_completion_tokens.`);
        }
        
        // FALLBACK: Generar respuesta básica empática si OpenAI no responde
        console.warn('⚠️ Usando respuesta de fallback debido a respuesta vacía de OpenAI');
        respuestaGenerada = this.generarRespuestaFallback(analisisEmocional, analisisContextual);
        
        if (!respuestaGenerada) {
          throw new Error('No se pudo generar una respuesta válida desde OpenAI: la respuesta está vacía y el fallback falló');
        }
      }

      // 5. NUEVO: Verificar si hay un protocolo activo o si se debe iniciar uno
      let activeProtocol = therapeuticProtocolService.getActiveProtocol(mensaje.userId);
      let currentIntervention = null;
      
      const crisisTherapeuticExtrasBlocked = isLlmCrisisTherapeuticExtrasBlocked({
        riskLevel: contexto?.crisis?.riskLevel,
        userMessage: contenidoNormalizado,
      });

      if (!activeProtocol && !crisisTherapeuticExtrasBlocked) {
        // Verificar si se debe iniciar un protocolo
        const protocolToStart = therapeuticProtocolService.shouldStartProtocol(
          analisisEmocional,
          { ...analisisContextual, content: contenidoNormalizado }
        );
        if (protocolToStart) {
          activeProtocol = therapeuticProtocolService.startProtocol(mensaje.userId, protocolToStart);
          currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
          
          // NUEVO: Registrar métrica de protocolo iniciado
          metricsService.recordMetric('protocol', {
            action: 'start',
            protocolType: protocolToStart
          }, mensaje.userId);
        }
      } else if (activeProtocol) {
        // Obtener la intervención del paso actual
        currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
      }

      // 6. NUEVO: Obtener plantilla terapéutica si hay subtipo
      const appLanguage = resolveLanguageFromContext({ profile: perfilUsuario });
      const responseStyle = perfilUsuario?.preferences?.responseStyle || 'balanced';
      const therapeuticBase = therapeuticTemplateService.buildTherapeuticBase(
        analisisEmocional?.mainEmotion,
        analisisEmocional?.subtype,
        { style: responseStyle, language: appLanguage },
      );
      const therapeuticHint = therapeuticTemplateService.buildTherapeuticHint(
        analisisEmocional?.mainEmotion,
        analisisEmocional?.subtype,
        { maxLength: 180, language: appLanguage },
      );

      // NUEVO: Registrar métrica de uso de plantilla terapéutica
      if (therapeuticBase && analisisEmocional?.subtype) {
        metricsService.recordMetric('therapeutic_template', {
          emotion: analisisEmocional.mainEmotion,
          subtype: analisisEmocional.subtype,
          style: responseStyle
        }, mensaje.userId);
      }

      // 7. Seleccionar técnica terapéutica apropiada (si no hay protocolo activo)
      let selectedTechnique = null;
      if (!activeProtocol) {
        selectedTechnique = selectAppropriateTechnique(
          analisisEmocional?.mainEmotion || DEFAULT_VALUES.EMOTION,
          analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY,
          registroTerapeutico?.currentPhase || DEFAULT_VALUES.PHASE,
          analisisContextual?.intencion?.tipo || null,
          appLanguage,
        );
      }

      // 8. NUEVO: Mejorar respuesta con plantilla terapéutica si existe
      let respuestaMejorada = respuestaGenerada;
      if ((therapeuticBase || therapeuticHint) && !activeProtocol) {
        // Integrar la plantilla de forma más sutil para evitar efecto "respuesta de plantilla".
        respuestaMejorada = this.integrateTherapeuticBase(respuestaGenerada, {
          base: therapeuticBase,
          hint: therapeuticHint
        }, {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          history: contexto.history || [],
          crisis: contexto.crisis,
          userMessage: contenidoNormalizado,
        });
      }

      // 9. NUEVO: Si hay protocolo activo, adaptar respuesta según la intervención
      if (activeProtocol && currentIntervention) {
        // Adaptar la respuesta según el paso del protocolo
        respuestaMejorada = this.adaptResponseToProtocol(
          respuestaMejorada,
          currentIntervention,
          analisisEmocional
        );
      }

      // 10. Validar y Mejorar Respuesta
      const respuestaValidada = await this.validarYMejorarRespuesta(
        respuestaMejorada,
        {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          profile: perfilUsuario,
          userMessage: contenidoNormalizado, // Para validación de relevancia
          forceShortMode: contexto.forceShortMode,
          forceFactualMode: contexto.forceFactualMode,
          crisis: contexto.crisis,
          sessionRetention: contexto.sessionRetention,
          conversationPattern: contexto.conversationPattern,
          sessionEmotionalIntensity: contexto.sessionEmotionalIntensity,
          distress: contexto.distress
        }
      );

      // 11. Post-procesado unificado de crisis (seguridad + protocolo + saneamiento)
      const respuestaConSeguridad = this.applyCrisisResponseSafety(respuestaValidada, {
        crisis: contexto.crisis,
        emotional: analisisEmocional,
        contextual: analisisContextual,
        profile: perfilUsuario,
        userMessage: contenidoNormalizado,
        conversationHistory: contexto.safetyHistory || [],
        transport: this.resolveCrisisMetricTransport(contexto),
      });

      // 12. NUEVO: Agregar elecciones al final de la respuesta si es apropiado
      let respuestaConElecciones = respuestaConSeguridad;
      if (this.shouldAddChoices(analisisEmocional, analisisContextual, activeProtocol, {
        crisis: contexto.crisis,
        userMessage: contenidoNormalizado,
      })) {
        respuestaConElecciones = this.addResponseChoices(
          respuestaConSeguridad,
          analisisEmocional,
          analisisContextual,
          activeProtocol
        );
      }

      // 12.5. NUEVO: Las intervenciones para resistencia, recaídas, necesidades implícitas, etc.
      // ya están integradas en el prompt, así que el modelo de OpenAI las considerará automáticamente
      // al generar la respuesta. No necesitamos agregar texto adicional aquí.

      // 13. Agregar técnica terapéutica a la respuesta SOLO si el usuario la solicita explícitamente (y no hay protocolo)
      let respuestaFinal = respuestaConElecciones;
      const lengthLimitsForTechnique = this.resolveLengthLimitsFromContext({
        forceShortMode: contexto.forceShortMode,
        forceFactualMode: contexto.forceFactualMode,
        crisis: contexto.crisis,
        emotional: analisisEmocional,
        contextual: analisisContextual,
        userMessage: contenidoNormalizado,
        sessionEmotionalIntensity: contexto.sessionEmotionalIntensity,
        distress: contexto.distress
      });
      if (selectedTechnique && !activeProtocol && this.shouldIncludeTechnique(analisisEmocional, analisisContextual, mensaje, {
        crisis: contexto.crisis,
        userMessage: contenidoNormalizado,
      })) {
        // Calcular espacio disponible para la técnica
        const espacioDisponible = lengthLimitsForTechnique.maxChars - respuestaConElecciones.length;
        const necesitaFormatoCompacto = espacioDisponible < 300; // Menos de 300 caracteres disponibles
        
        // Formatear técnica (compacta si hay poco espacio)
        const techniqueText = formatTechniqueForResponse(selectedTechnique, {
          compact: necesitaFormatoCompacto,
          maxSteps: necesitaFormatoCompacto ? 2 : 4
        });
        
        // Agregar técnica al final de la respuesta (sobre texto ya saneado en crisis)
        respuestaFinal = `${respuestaConElecciones}${techniqueText}`;
        
        // Si aún es demasiado larga, usar formato muy compacto
        if (respuestaFinal.length > lengthLimitsForTechnique.maxChars) {
          const veryCompactText = formatTechniqueForResponse(selectedTechnique, {
            compact: true,
            maxSteps: 1,
            language: appLanguage,
          });
          respuestaFinal = `${respuestaConElecciones}${veryCompactText}`;
          
          // Si aún es muy larga, solo nombre y descripción breve
          if (respuestaFinal.length > lengthLimitsForTechnique.maxChars) {
            respuestaFinal = respuestaConElecciones + 
              `\n\n💡 ${selectedTechnique.name}\n` +
              `${selectedTechnique.description ? selectedTechnique.description.substring(0, 150) + '...' : ''}\n\n` +
              `Puedes preguntarme más sobre esta técnica si te interesa.`;
          }
        }
      }

      // MEJORA: Guardar respuesta en caché para futuras consultas similares (nunca en crisis)
      if (responseCacheKey && canUseResponseCache) {
        try {
          await cacheService.set(responseCacheKey, {
            response: respuestaFinal,
            emotional: analisisEmocional,
            contextual: analisisContextual,
            timestamp: Date.now()
          }, 1800); // Cachear por 30 minutos
          console.log('[OpenAI] ✅ Respuesta guardada en caché');
        } catch (cacheError) {
          console.warn('[OpenAI] Error al guardar en caché, continuando:', cacheError.message);
        }
      }

      // MEJORA: Análisis de sentimiento asíncrono (no bloquea la respuesta)
      this.analyzeUserSentiment(mensaje.userId, contenidoNormalizado, respuestaFinal, analisisEmocional).catch(err => {
        console.warn('[OpenAI] Error en análisis de sentimiento (asíncrono):', err.message);
      });

      // NOTA: El guardado del mensaje del asistente se hace en chatRoutes.js
      // para evitar duplicados. Aquí solo retornamos la respuesta y el contexto.

      return {
        content: respuestaFinal,
        context: {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          therapeutic: selectedTechnique ? {
            technique: selectedTechnique.name,
            type: selectedTechnique.type,
            category: selectedTechnique.category
          } : undefined,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error generando respuesta:', error);
      return await this.manejarError(error, mensaje);
    }
  }

  /**
   * Genera la respuesta por streaming (chunks). Misma lógica que generarRespuesta hasta la llamada a OpenAI;
   * con stream: true se envían fragmentos y al final se aplica post-procesado (validación, técnica, etc.).
   * @param {Object} mensaje - Mensaje del usuario
   * @param {Object} contexto - Contexto (emotional, contextual, profile, history, etc.)
   * @returns {AsyncGenerator<{ type: 'chunk', content: string } | { type: 'done', content: string, context: Object }>}
   */
  async *generarRespuestaStream(mensaje, contexto = {}) {
    const validation = validateMessage(mensaje);
    if (!validation.valid) throw new Error(validation.error);
    const contenidoNormalizado = validation.content;

    if (!validateApiKey() || !openai) {
      throw new Error('OPENAI_API_KEY no está configurada.');
    }

    const offScopeEarly = this._buildOffScopeRedirectResponse(contenidoNormalizado, contexto);
    if (offScopeEarly) {
      yield { type: 'chunk', content: offScopeEarly.content };
      yield { type: 'done', content: offScopeEarly.content, context: offScopeEarly.context };
      return;
    }

    let analisisEmocional = contexto.emotional;
    let analisisContextual = contexto.contextual;
    let perfilUsuario = contexto.profile;
    let registroTerapeutico = contexto.therapeutic;

    if (!analisisEmocional) {
      analisisEmocional = await emotionalAnalyzer.analyzeEmotion(contenidoNormalizado);
    }
    if (!analisisContextual) {
      const history = contexto.history || [];
      analisisContextual = await contextAnalyzer.analizarMensaje(
        { ...mensaje, content: contenidoNormalizado },
        history.length > 0 ? history : null
      );
    }
    if (!perfilUsuario) {
      perfilUsuario = await personalizationService.getUserProfile(mensaje.userId).catch(() => null);
    }
    if (!registroTerapeutico) {
      registroTerapeutico = await TherapeuticRecord.findOne({ userId: mensaje.userId }).catch(() => null);
    }

    const memoriaContextual = contexto.memory
      ? contexto.memory
      : await memoryService.getRelevantContext(mensaje.userId, contenidoNormalizado, {
          emotional: analisisEmocional,
          contextual: analisisContextual
        });

    const sessionTrends = sessionEmotionalMemory.analyzeTrends(mensaje.userId);
    const prompt = await buildContextualizedPrompt(
      { ...mensaje, content: contenidoNormalizado },
      {
        emotional: analisisEmocional,
        contextual: analisisContextual,
        profile: perfilUsuario,
        therapeutic: registroTerapeutico,
        memory: memoriaContextual,
        history: contexto.history || [],
        currentMessage: contenidoNormalizado,
        currentConversationId: contexto.currentConversationId,
        sessionTrends,
        conversationContext: contexto.conversationContext,
        depthPreference: contexto.depthPreference,
        inferredWritingStyle: contexto.inferredWritingStyle,
        preferredResponseLength: contexto.preferredResponseLength,
        forceShortMode: contexto.forceShortMode,
        forceFactualMode: contexto.forceFactualMode,
        crisis: contexto.crisis,
        isGuest: contexto.isGuest === true,
        sessionRetention: contexto.sessionRetention,
        sessionIntention: contexto.sessionIntention,
        conversationPattern: contexto.conversationPattern
      }
    );

    const maxTokens = this.determinarLongitudRespuesta(analisisContextual, contenidoNormalizado, perfilUsuario?.preferences?.responseStyle || 'balanced');
    const modelRouting = resolveModelRoutingForContext({
      content: contenidoNormalizado,
      emotional: analisisEmocional,
      contextual: analisisContextual,
      crisis: contexto?.crisis,
      sessionEmotionalIntensity: Math.max(
        Number(contexto?.sessionEmotionalIntensity ?? 0),
        Number(analisisEmocional?.intensity ?? 5)
      )
    });
    const selectedModel = modelRouting.model;

    let stream;
    try {
      stream = await this.createChatCompletionResilient({
        model: selectedModel,
        messages: [
          { role: 'system', content: prompt.systemMessage },
          ...prompt.contextMessages,
          { role: 'user', content: contenidoNormalizado }
        ],
        max_completion_tokens: maxTokens,
        reasoning_effort: getChatReasoningEffortForContext(contexto),
        stream: true,
        stream_options: { include_usage: true }
      });
    } catch (apiError) {
      // Circuit breaker abierto: responder rápido con fallback (sin streaming real).
      if (apiError instanceof CircuitBreakerOpenError || apiError?.code === 'CIRCUIT_BREAKER_OPEN') {
        const fallback = this.generarRespuestaFallback(analisisEmocional, analisisContextual) || ERROR_MESSAGES.DEFAULT_FALLBACK;
        const result = await this._postProcessStreamedContent(fallback, {
          mensaje,
          contenidoNormalizado,
          analisisEmocional,
          analisisContextual,
          perfilUsuario,
          registroTerapeutico,
          conversationHistory: contexto.safetyHistory || [],
          crisis: contexto.crisis,
          forceShortMode: contexto.forceShortMode,
          forceFactualMode: contexto.forceFactualMode,
          sessionRetention: contexto.sessionRetention,
          conversationPattern: contexto.conversationPattern,
          sessionEmotionalIntensity: contexto.sessionEmotionalIntensity,
          distress: contexto.distress,
          crisisMetricTransport: this.resolveCrisisMetricTransport(contexto),
        });
        yield {
          type: 'done',
          content: result.content,
          context: { ...result.context, modelRouting, degraded: true, degradedReason: 'openai_breaker_open' }
        };
        return;
      }
      if (apiError.status === 401 || apiError.code === 'invalid_api_key') {
        throw new Error('Error de autenticación con OpenAI. Verifica tu API key.');
      }
      throw apiError;
    }

    let buffer = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        buffer += delta;
        yield { type: 'chunk', content: delta };
      }
      if (chunk.usage) {
        const usage = chunk.usage;
        const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens || 0;
        const actualContentTokens = (usage.completion_tokens || 0) - reasoningTokens;
        this.registrarEstadisticasTokens({
          maxCompletionTokens: maxTokens,
          totalCompletionTokens: usage.completion_tokens || 0,
          reasoningTokens,
          actualContentTokens,
          promptTokens: usage.prompt_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          finishReason: chunk.choices?.[0]?.finish_reason || 'stop',
          hasContent: buffer.trim().length > 0,
          contentLength: buffer.length
        });
      }
    }

    const rawContent = buffer.trim();
    if (!rawContent) {
      const fallback = this.generarRespuestaFallback(analisisEmocional, analisisContextual);
      const result = await this._postProcessStreamedContent(fallback || ERROR_MESSAGES.DEFAULT_FALLBACK, {
        mensaje,
        contenidoNormalizado,
        analisisEmocional,
        analisisContextual,
        perfilUsuario,
        registroTerapeutico,
        conversationHistory: contexto.safetyHistory || [],
        crisis: contexto.crisis,
        forceShortMode: contexto.forceShortMode,
        forceFactualMode: contexto.forceFactualMode,
        sessionRetention: contexto.sessionRetention,
        conversationPattern: contexto.conversationPattern,
        crisisMetricTransport: this.resolveCrisisMetricTransport(contexto),
      });
      yield { type: 'done', content: result.content, context: { ...result.context, modelRouting } };
      return;
    }

    const result = await this._postProcessStreamedContent(rawContent, {
      mensaje,
      contenidoNormalizado,
      analisisEmocional,
      analisisContextual,
      perfilUsuario,
      registroTerapeutico,
      conversationHistory: contexto.safetyHistory || [],
      crisis: contexto.crisis,
      forceShortMode: contexto.forceShortMode,
      forceFactualMode: contexto.forceFactualMode,
      sessionRetention: contexto.sessionRetention,
      conversationPattern: contexto.conversationPattern,
      sessionEmotionalIntensity: contexto.sessionEmotionalIntensity,
      distress: contexto.distress,
      crisisMetricTransport: this.resolveCrisisMetricTransport(contexto),
    });
    yield { type: 'done', content: result.content, context: { ...result.context, modelRouting } };
  }

  /**
   * Post-procesa el contenido generado por streaming (validación, técnica, seguridad, etc.).
   * @private
   */
  async _postProcessStreamedContent(respuestaGenerada, {
    mensaje,
    contenidoNormalizado,
    analisisEmocional,
    analisisContextual,
    perfilUsuario,
    registroTerapeutico,
    conversationHistory = [],
    crisis = null,
    forceShortMode = false,
    forceFactualMode = false,
    sessionRetention = null,
    conversationPattern = null,
    sessionEmotionalIntensity = null,
    distress = null,
    crisisMetricTransport = 'unknown',
  }) {
    let activeProtocol = therapeuticProtocolService.getActiveProtocol(mensaje.userId);
    let currentIntervention = null;

    const crisisTherapeuticExtrasBlocked = isLlmCrisisTherapeuticExtrasBlocked({
      riskLevel: crisis?.riskLevel,
      userMessage: contenidoNormalizado,
    });

    if (!activeProtocol && !crisisTherapeuticExtrasBlocked) {
      const protocolToStart = therapeuticProtocolService.shouldStartProtocol(
        analisisEmocional,
        { ...analisisContextual, content: contenidoNormalizado }
      );
      if (protocolToStart) {
        activeProtocol = therapeuticProtocolService.startProtocol(mensaje.userId, protocolToStart);
        currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
      }
    } else if (activeProtocol) {
      currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
    }

    const appLanguage = resolveLanguageFromContext({ profile: perfilUsuario });
    const responseStyle = perfilUsuario?.preferences?.responseStyle || 'balanced';
    const therapeuticBase = therapeuticTemplateService.buildTherapeuticBase(
      analisisEmocional?.mainEmotion,
      analisisEmocional?.subtype,
      { style: responseStyle, language: appLanguage },
    );
    const therapeuticHint = therapeuticTemplateService.buildTherapeuticHint(
      analisisEmocional?.mainEmotion,
      analisisEmocional?.subtype,
      { maxLength: 180, language: appLanguage },
    );
    let selectedTechnique = null;
    if (!activeProtocol) {
      selectedTechnique = selectAppropriateTechnique(
        analisisEmocional?.mainEmotion || DEFAULT_VALUES.EMOTION,
        analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY,
        registroTerapeutico?.currentPhase || DEFAULT_VALUES.PHASE,
        analisisContextual?.intencion?.tipo || null,
        appLanguage,
      );
    }

    let respuestaMejorada = respuestaGenerada;
    if ((therapeuticBase || therapeuticHint) && !activeProtocol) {
      respuestaMejorada = this.integrateTherapeuticBase(respuestaGenerada, {
        base: therapeuticBase,
        hint: therapeuticHint
      }, {
        emotional: analisisEmocional,
        contextual: analisisContextual,
        crisis,
        userMessage: contenidoNormalizado,
      });
    }
    if (activeProtocol && currentIntervention) {
      respuestaMejorada = this.adaptResponseToProtocol(respuestaMejorada, currentIntervention, analisisEmocional);
    }

    const respuestaValidada = await this.validarYMejorarRespuesta(respuestaMejorada, {
      emotional: analisisEmocional,
      contextual: analisisContextual,
      profile: perfilUsuario,
      userMessage: contenidoNormalizado,
      forceShortMode,
      forceFactualMode,
      crisis,
      sessionRetention,
      conversationPattern,
      sessionEmotionalIntensity,
      distress
    });

    const respuestaConSeguridad = this.applyCrisisResponseSafety(respuestaValidada, {
      crisis,
      emotional: analisisEmocional,
      contextual: analisisContextual,
      profile: perfilUsuario,
      userMessage: contenidoNormalizado,
      conversationHistory,
      transport: crisisMetricTransport,
    });

    let respuestaConElecciones = respuestaConSeguridad;
    if (this.shouldAddChoices(analisisEmocional, analisisContextual, activeProtocol, {
      crisis,
      userMessage: contenidoNormalizado,
    })) {
      respuestaConElecciones = this.addResponseChoices(respuestaConSeguridad, analisisEmocional, analisisContextual, activeProtocol);
    }

    let respuestaFinal = respuestaConElecciones;
    const lengthLimitsForTechnique = this.resolveLengthLimitsFromContext({
      forceShortMode,
      forceFactualMode,
      crisis,
      emotional: analisisEmocional,
      contextual: analisisContextual,
      userMessage: contenidoNormalizado,
      sessionEmotionalIntensity,
      distress
    });
    if (selectedTechnique && !activeProtocol && this.shouldIncludeTechnique(analisisEmocional, analisisContextual, mensaje, {
      crisis,
      userMessage: contenidoNormalizado,
    })) {
      const espacioDisponible = lengthLimitsForTechnique.maxChars - respuestaConElecciones.length;
      const techniqueText = formatTechniqueForResponse(selectedTechnique, {
        compact: espacioDisponible < 300,
        maxSteps: espacioDisponible < 300 ? 2 : 4,
        language: appLanguage,
      });
      respuestaFinal = `${respuestaConElecciones}${techniqueText}`;
      if (respuestaFinal.length > lengthLimitsForTechnique.maxChars) {
        const veryCompact = formatTechniqueForResponse(selectedTechnique, {
          compact: true,
          maxSteps: 1,
          language: appLanguage,
        });
        respuestaFinal = `${respuestaConElecciones}${veryCompact}`;
      }
    }

    const context = {
      emotional: analisisEmocional,
      contextual: analisisContextual,
      therapeutic: selectedTechnique ? {
        technique: selectedTechnique.name,
        type: selectedTechnique.type,
        category: selectedTechnique.category
      } : undefined,
      timestamp: new Date()
    };

    return { content: respuestaFinal, context };
  }

  shouldRequireStructuredCrisisProtocol({ crisis, contextual, emotional }) {
    const riskLevel = String(crisis?.riskLevel || '').toUpperCase();
    if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') return true;
    if (riskLevel === 'WARNING') {
      const intensity = Number(emotional?.intensity || 0);
      if (intensity >= 7) return true;
      if (contextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS && intensity >= 6) return true;
    }
    const intent = contextual?.intencion?.tipo;
    const intensity = Number(emotional?.intensity || 0);
    return intent === MESSAGE_INTENTS.CRISIS && intensity >= 8;
  }

  resolveCrisisMetricTransport(contexto = {}) {
    if (typeof contexto.crisisMetricTransport === 'string' && contexto.crisisMetricTransport.trim()) {
      return contexto.crisisMetricTransport.trim();
    }
    const source = String(contexto._promptTelemetry?.source || '').toLowerCase();
    if (source === 'socket') return 'socket';
    if (source === 'guest') return 'guest';
    if (source === 'http') return 'http';
    return 'unknown';
  }

  applyCrisisResponseSafety(
    respuesta,
    {
      crisis = null,
      emotional = null,
      contextual = null,
      profile = null,
      userMessage = '',
      conversationHistory = [],
      transport = 'unknown',
    } = {},
  ) {
    if (!shouldApplyCrisisResponseSafety({ crisis, contextual, emotional })) {
      return respuesta;
    }

    let result = respuesta;
    const intent = contextual?.intencion?.tipo;
    const riskLevel = String(crisis?.riskLevel || 'LOW').toUpperCase();
    const shouldAppendSafetyChecks =
      intent === MESSAGE_INTENTS.CRISIS ||
      ['WARNING', 'MEDIUM', 'HIGH'].includes(riskLevel);

    if (shouldAppendSafetyChecks) {
      result = this.addSafetyChecks(result, emotional, contextual, userMessage, {
        profile,
        conversationHistory,
        language: profile?.preferences?.language,
      });
    }

    result = this.enforceStructuredCrisisProtocol(result, {
      crisis,
      emotional,
      contextual,
      profile,
      userMessage,
      conversationHistory,
    });

    const sanitized = sanitizeCrisisLlmResponse(result);
    if (sanitized.wasSanitized) {
      metricsService
        .recordMetric('crisis_llm_sanitized', {
          riskLevel,
          hits: sanitized.hits,
          transport,
        })
        .catch(() => {});
    }
    result = sanitized.text;
    if (!result || result.trim().length < 20) {
      result = getCrisisSanitizeFallback(profile?.preferences?.language);
    }

    return result;
  }

  hasCrisisElement(text, regex) {
    if (!text) return false;
    return regex.test(text);
  }

  enforceStructuredCrisisProtocol(
    respuesta,
    {
      crisis = null,
      contextual = null,
      emotional = null,
      profile = null,
      userMessage = '',
      conversationHistory = []
    } = {}
  ) {
    if (!this.shouldRequireStructuredCrisisProtocol({ crisis, contextual, emotional })) {
      return respuesta;
    }

    const riskLevel = String(crisis?.riskLevel || '').toUpperCase();
    const response = String(respuesta || '').trim();
    const language = profile?.preferences?.language || 'es';
    const copy = getStructuredCrisisProtocolCopy(language);
    const additions = [];

    if (!hasStructuredCrisisProtocolElement(response, 'safety')) {
      additions.push(copy.safetyQuestion);
    }

    if (
      riskLevel === 'HIGH' &&
      !hasStructuredCrisisProtocolElement(response, 'meansOfHarm')
    ) {
      additions.push(copy.meansOfHarmQuestion);
    }

    if (!hasStructuredCrisisProtocolElement(response, 'trustedContact')) {
      additions.push(copy.trustedContact);
    }

    const isWarning = riskLevel === 'WARNING';
    if (!isWarning && !hasStructuredCrisisProtocolElement(response, 'immediateStep')) {
      additions.push(copy.immediateStep);
    }

    const skipHeavyPhones = shouldSkipEmergencyPhoneNumbersInSafetyAppend(userMessage);
    if (
      (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') &&
      !skipHeavyPhones &&
      !hasStructuredCrisisProtocolElement(response, 'emergencyResources')
    ) {
      const emergencyInfo = resolveEmergencyInfoFromPreferences(profile?.preferences, profile?.phone || null);
      const emergencyLines = formatEmergencyNumbers(emergencyInfo, language);
      additions.push(`${copy.emergencyResourcesHeader}\n${emergencyLines}`);
    }

    if (additions.length === 0) return response;

    const blockTitle =
      riskLevel === 'HIGH'
        ? copy.blockTitle.high
        : isWarning
          ? copy.blockTitle.warning
          : copy.blockTitle.default;
    const block = `${blockTitle}:\n- ${additions.join('\n- ')}`;
    return response ? `${response}\n\n${block}` : block;
  }

  /**
   * Determina la temperatura óptima para la generación basada en el contexto
   * @param {Object} contexto - Contexto del mensaje
   * @returns {number} Temperatura (0.1 - 0.8)
   */
  determinarTemperatura(contexto) {
    if (contexto.urgent || contexto.contextual?.urgencia === 'ALTA') {
      return TEMPERATURES.URGENT;
    }
    if (contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.EMOTIONAL_SUPPORT) {
      return TEMPERATURES.EMPATHETIC;
    }
    return TEMPERATURES.BALANCED;
  }

  /**
   * Integra una base terapéutica sin forzar una respuesta "enlatada".
   * - Si el modelo ya contiene validación empática, evitamos duplicar.
   * - En contexto no crítico, agregamos solo una línea breve de la base.
   * - En alta intensidad, permitimos una guía un poco más completa.
   */
  integrateTherapeuticBase(modelResponse, templateInput, context = {}) {
    if (
      isLlmCrisisTherapeuticExtrasBlocked({
        riskLevel: context?.crisis?.riskLevel,
        userMessage: context?.userMessage,
      })
    ) {
      return modelResponse;
    }

    const therapeuticBase =
      typeof templateInput === 'string' ? templateInput : templateInput?.base || templateInput?.hint || '';
    const therapeuticHint = typeof templateInput === 'object' ? templateInput?.hint : '';
    if (!therapeuticBase && !therapeuticHint) return modelResponse;

    const safeModel = (modelResponse || '').trim();
    const safeBase = (therapeuticBase || '').trim();
    const safeHint = (therapeuticHint || '').trim();
    const preferredSnippet = safeHint || safeBase;
    if (!preferredSnippet) return safeModel;
    if (!safeModel) return preferredSnippet;

    const lowerModel = safeModel.toLowerCase();
    const lowerBase = preferredSnippet.toLowerCase();

    // Si la respuesta ya trae una parte sustancial de la plantilla, no repetir.
    const baseLead = lowerBase.slice(0, 70).trim();
    if (baseLead && lowerModel.includes(baseLead)) {
      return safeModel;
    }

    // Si la respuesta ya inicia con validación empática, evitamos superponer otra validación fuerte.
    const hasEmpathicLead = /^(?:entiendo|comprendo|veo|es\s+válido|lamento|siento)\b/i.test(safeModel);

    const intensity = context?.emotional?.intensity || 0;
    const isHighIntensity = intensity >= 8 || context?.emotional?.requiresAttention;
    const isHelpIntent =
      context?.contextual?.intencion?.tipo === MESSAGE_INTENTS.SEEKING_HELP ||
      context?.contextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS;

    const recentAssistantTexts = this.extractRecentAssistantTexts(context?.history, 3);
    const isTemplateRecentlyUsed = recentAssistantTexts.some((txt) =>
      this.areTextsTooSimilar(txt, preferredSnippet)
    );
    if (isTemplateRecentlyUsed && !isHighIntensity && !isHelpIntent) {
      return safeModel;
    }

    if (hasEmpathicLead && !isHighIntensity && !isHelpIntent) {
      return safeModel;
    }

    // Tomar una pieza corta para no "pisar" la voz del modelo.
    const shortBase = preferredSnippet.split(/\n+/)[0].trim();
    const compactBase = shortBase.length > 170 ? `${shortBase.slice(0, 167).trim()}...` : shortBase;

    if (isHighIntensity || isHelpIntent) {
      return `${compactBase}\n\n${safeModel}`;
    }

    return `${safeModel}\n\n${compactBase}`;
  }

  extractRecentAssistantTexts(history, limit = 3) {
    if (!Array.isArray(history) || history.length === 0) return [];

    const texts = [];
    for (let i = history.length - 1; i >= 0 && texts.length < limit; i--) {
      const msg = history[i];
      const role = msg?.role || msg?.sender || '';
      const isAssistant = role === 'assistant' || role === 'bot' || role === 'system';
      if (!isAssistant) continue;
      const content = msg?.content || msg?.text || '';
      if (typeof content === 'string' && content.trim().length > 0) {
        texts.push(content.trim());
      }
    }
    return texts;
  }

  areTextsTooSimilar(a = '', b = '') {
    const normalize = (v) =>
      (v || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const aNorm = normalize(a);
    const bNorm = normalize(b);
    if (!aNorm || !bNorm) return false;
    if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return true;

    const aSet = new Set(aNorm.split(' ').filter((w) => w.length >= 4));
    const bSet = new Set(bNorm.split(' ').filter((w) => w.length >= 4));
    if (aSet.size === 0 || bSet.size === 0) return false;

    let overlap = 0;
    for (const w of aSet) {
      if (bSet.has(w)) overlap++;
    }
    const ratio = overlap / Math.min(aSet.size, bSet.size);
    return ratio >= 0.7;
  }

  /**
   * Determina la longitud óptima de respuesta basada en el contexto
   * @param {Object} contexto - Contexto del mensaje
   * @param {string} userMessage - Mensaje del usuario (opcional, para ajuste dinámico)
   * @param {string} responseStyle - Estilo de respuesta preferido ('brief', 'balanced', 'deep')
   * @returns {number} Longitud en tokens
   */
  determinarLongitudRespuesta(contexto, userMessage = '', responseStyle = 'balanced') {
    const LEGACY_RS = { calido: 'empatico', profesional: 'estructurado', directo: 'brief' };
    const style = LEGACY_RS[responseStyle] || responseStyle;
    // Ajuste dinámico basado en longitud del mensaje del usuario
    const userMessageLength = userMessage.length;
    let baseLength;
    
    // Determinar longitud base según urgencia e intención
    if (contexto.urgent || contexto.contextual?.urgencia === 'ALTA') {
      baseLength = RESPONSE_LENGTHS.LONG;
    } else if (contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.GREETING) {
      baseLength = RESPONSE_LENGTHS.SHORT;
    } else {
      baseLength = RESPONSE_LENGTHS.MEDIUM;
    }
    
    // Ajustar según el estilo de respuesta preferido del usuario
    if (style === 'brief') {
      baseLength = Math.min(baseLength, RESPONSE_LENGTHS.SHORT);
    } else if (style === 'deep' || style === 'estructurado') {
      baseLength = Math.max(baseLength, RESPONSE_LENGTHS.MEDIUM);
      if (baseLength === RESPONSE_LENGTHS.MEDIUM) {
        baseLength = RESPONSE_LENGTHS.LONG;
      }
    } else if (style === 'empatico') {
      baseLength = Math.max(baseLength, RESPONSE_LENGTHS.MEDIUM);
    }
    // balanced mantiene la longitud calculada
    
    // Ajustar según longitud del mensaje del usuario (respuestas proporcionales)
    if (userMessageLength > 0) {
      if (userMessageLength < 50) {
        // Mensaje corto = respuesta más corta
        baseLength = Math.min(baseLength, RESPONSE_LENGTHS.SHORT);
      } else if (userMessageLength > 200) {
        // Mensaje largo = respuesta más larga (pero no excesiva)
        baseLength = Math.min(baseLength + 100, RESPONSE_LENGTHS.MAX_SAFETY_LIMIT);
      }
    }
    
    // Ajustar según intensidad emocional (mayor intensidad = más cuidado, no necesariamente más largo)
    const intensity = contexto.emotional?.intensity || 5;
    if (intensity >= 8) {
      // Alta intensidad: respuestas más cuidadosas, permitir más tokens para reasoning
      baseLength = Math.max(baseLength, RESPONSE_LENGTHS.MEDIUM);
    }

    const capRaw = process.env.CHAT_MAX_COMPLETION_TOKENS;
    if (capRaw !== undefined && String(capRaw).trim() !== '') {
      const cap = parseInt(capRaw, 10);
      if (Number.isFinite(cap) && cap >= 400) {
        baseLength = Math.min(baseLength, cap);
      }
    }

    return baseLength;
  }

  /**
   * Valida si la respuesta responde directamente a la pregunta del usuario
   * @param {string} respuesta - Respuesta a validar
   * @param {string} mensajeUsuario - Mensaje original del usuario
   * @returns {boolean} true si la respuesta es relevante
   */
  esRespuestaRelevante(respuesta, mensajeUsuario) {
    if (!respuesta || !mensajeUsuario) return true;
    
    const respuestaLower = respuesta.toLowerCase();
    const mensajeLower = mensajeUsuario.toLowerCase();
    
    // Extraer palabras clave del mensaje del usuario (palabras de 4+ caracteres)
    const palabrasClave = mensajeLower.split(/\s+/).filter(p => p.length >= 4);
    
    // Verificar si la respuesta menciona al menos una palabra clave importante
    const menciones = palabrasClave.filter(palabra => respuestaLower.includes(palabra)).length;
    const ratioMenciones = palabrasClave.length > 0 ? menciones / palabrasClave.length : 1;
    
    // Si hay menos del 30% de menciones, puede no ser relevante
    if (palabrasClave.length > 0 && ratioMenciones < 0.3) {
      // Verificar si es una pregunta directa
      const esPregunta = /[¿?]/.test(mensajeUsuario);
      if (esPregunta && !/[¿?]/.test(respuesta) && ratioMenciones < 0.2) {
        return false; // Pregunta sin respuesta relevante
      }
    }
    
    return true;
  }

  resolveLengthLimitsFromContext(contexto = {}) {
    return resolveResponseLengthLimits({
      forceShortMode: contexto?.forceShortMode,
      crisis: contexto?.crisis,
      emotional: contexto?.emotional,
      contextual: contexto?.contextual,
      userMessage: contexto?.userMessage || '',
      sessionEmotionalIntensity: contexto?.sessionEmotionalIntensity,
      distressTheme: contexto?.distress?.theme || null
    });
  }

  /**
   * Valida y mejora la respuesta generada por OpenAI
   * @param {string} respuesta - Respuesta generada
   * @param {Object} contexto - Contexto emocional y de perfil
   * @returns {Promise<string>} Respuesta validada y mejorada
   */
  async validarYMejorarRespuesta(respuesta, contexto) {
    if (!respuesta || typeof respuesta !== 'string') {
      return ERROR_MESSAGES.DEFAULT_FALLBACK;
    }

    const lengthLimits = this.resolveLengthLimitsFromContext(contexto);

    let respuestaMejorada = respuesta.trim();

    // MEJORA: Validar relevancia directa con el mensaje del usuario
    if (contexto.userMessage && !this.esRespuestaRelevante(respuestaMejorada, contexto.userMessage)) {
      console.log('⚠️ Respuesta puede no ser directamente relevante. Ajustando...');
      // Agregar reconocimiento del mensaje del usuario si falta
      const mensajeLower = contexto.userMessage.toLowerCase();
      const palabrasClave = mensajeLower.split(/\s+/).filter(p => p.length >= 4).slice(0, 2);
      if (palabrasClave.length > 0 && !palabrasClave.some(p => respuestaMejorada.toLowerCase().includes(p))) {
        // La respuesta no menciona palabras clave, agregar reconocimiento
        respuestaMejorada = `Entiendo. ${respuestaMejorada}`;
      }
    }

    // Validar longitud máxima (caracteres y palabras)
    const caracteres = respuestaMejorada.length;
    const palabras = respuestaMejorada.split(/\s+/).filter(w => w.length > 0).length;
    
    if (caracteres > lengthLimits.maxChars || palabras > lengthLimits.maxWords) {
      console.log(`📏 Respuesta demasiado larga (${caracteres} caracteres, ${palabras} palabras). Reduciendo...`);
      respuestaMejorada = this.reducirRespuesta(respuestaMejorada, lengthLimits);
    }

    // Validar si es genérica (solo si es muy genérica, no sobre-ajustar)
    if (this.esRespuestaGenerica(respuestaMejorada)) {
      // Solo expandir si es realmente genérica, no sobre-modificar
      const expanded = this.expandirRespuesta(respuestaMejorada);
      // Solo usar la expandida si es significativamente mejor
      if (expanded.length > respuestaMejorada.length * 1.2) {
        respuestaMejorada = expanded;
      }
    }
    
    // Validar y ajustar coherencia emocional (solo si es claramente incoherente)
    // No sobre-ajustar respuestas que ya son coherentes
    const esClaramenteIncoherente = !this.esCoherenteConEmocion(respuestaMejorada, contexto.emotional) &&
                                     contexto.emotional?.mainEmotion &&
                                     contexto.emotional.mainEmotion !== 'neutral';
    
    if (esClaramenteIncoherente) {
      const ajustada = this.ajustarCoherenciaEmocional(respuestaMejorada, contexto.emotional);
      // Solo usar la ajustada si realmente mejora la coherencia
      // Verificar que no esté agregando redundancia
      if (ajustada !== respuestaMejorada && !ajustada.toLowerCase().includes(respuestaMejorada.toLowerCase().substring(0, 20))) {
        respuestaMejorada = ajustada;
      }
    }
    
    // Validar longitud final después de ajustes
    const caracteresFinal = respuestaMejorada.length;
    const palabrasFinal = respuestaMejorada.split(/\s+/).filter(w => w.length > 0).length;
    
    if (caracteresFinal > lengthLimits.maxChars || palabrasFinal > lengthLimits.maxWords) {
      console.log(`📏 Respuesta aún demasiado larga después de ajustes (${caracteresFinal} caracteres, ${palabrasFinal} palabras). Reduciendo nuevamente...`);
      respuestaMejorada = this.reducirRespuesta(respuestaMejorada, lengthLimits);
    }

    // Guardrail de calidad: evitar más de una pregunta por turno.
    respuestaMejorada = this.enforceSingleQuestion(respuestaMejorada);

    // Guardrail de brevedad explícita: 1-2 frases y límite de caracteres fuera de crisis.
    const shouldForceShort =
      contexto?.forceShortMode === true &&
      !['MEDIUM', 'HIGH'].includes(String(contexto?.crisis?.riskLevel || '').toUpperCase());
    if (shouldForceShort) {
      respuestaMejorada = this.enforceShortResponseQuality(respuestaMejorada);
    }

    // Guardrail factual: si la consulta parece factual, agregar cautela explícita si falta.
    if (contexto?.forceFactualMode === true) {
      respuestaMejorada = this.enforceFactualCaution(respuestaMejorada);
    }

    // Guardrail de calidad: reducir densidad de frases empáticas repetitivas.
    respuestaMejorada = this.reduceStockEmpathyDensity(respuestaMejorada);

    // Cierre de tramo: quitar puentes prematuros y solo reforzar cuando el hilo lo permite.
    respuestaMejorada = stripPrematureSessionClosurePhrases(respuestaMejorada, contexto);
    respuestaMejorada = this.enforceSessionClosureBridge(respuestaMejorada, contexto);

    respuestaMejorada = sanitizeOffScopeAssistantReply(
      respuestaMejorada,
      contexto.userMessage || '',
      resolveChatLanguage(contexto),
    );

    // NUNCA reemplazar por mensaje genérico si tenemos contenido válido (evitar pérdida de información)
    if (!respuestaMejorada || respuestaMejorada.trim().length < 5) {
      const truncado = (respuesta || '').trim();
      if (truncado.length > 0) {
        const maxC = lengthLimits.maxChars - 3;
        respuestaMejorada = truncado.length <= maxC ? truncado : truncado.substring(0, maxC).trim() + '…';
      }
    }
    
    // Asegurar que la respuesta siempre comience con mayúscula
    if (respuestaMejorada && respuestaMejorada.length > 0) {
      respuestaMejorada = respuestaMejorada.charAt(0).toUpperCase() + respuestaMejorada.slice(1);
    }
    
    return respuestaMejorada;
  }

  enforceSingleQuestion(respuesta = '') {
    if (!respuesta) return respuesta;
    const questionMatches = respuesta.match(/[?]/g) || [];
    if (questionMatches.length <= 1) return respuesta;

    let firstQuestionSeen = false;
    let normalized = '';
    for (const ch of respuesta) {
      if (ch === '?') {
        if (!firstQuestionSeen) {
          firstQuestionSeen = true;
          normalized += ch;
        } else {
          normalized += '.';
        }
      } else if (ch === '¿' && firstQuestionSeen) {
        normalized += ' ';
      } else {
        normalized += ch;
      }
    }
    return normalized.replace(/\s{2,}/g, ' ').trim();
  }

  enforceShortResponseQuality(respuesta = '') {
    if (!respuesta) return respuesta;
    const maxChars = Number(process.env.CHAT_SHORT_MODE_MAX_CHARS || 180);
    const sentences = respuesta.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    let compact = sentences.slice(0, 2).join(' ').trim() || respuesta.trim();
    if (compact.length > maxChars) {
      const truncated = compact.slice(0, maxChars);
      const lastSpace = truncated.lastIndexOf(' ');
      compact = `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
    }
    return compact;
  }

  enforceFactualCaution(respuesta = '') {
    if (!respuesta) return respuesta;
    const alreadyCautious =
      /no\s+tengo\s+suficiente\s+certeza|no\s+estoy\s+segur[oa]|podr[ií]a\s+estar\s+equivocad[oa]|si\s+quieres,\s+lo\s+verifico|puedo\s+verificar/i.test(
        respuesta
      );
    if (alreadyCautious) return respuesta;
    const suffix = ' Si quieres, puedo verificar este dato para confirmarlo con más precisión.';
    if (respuesta.length >= THRESHOLDS.MAX_CHARACTERS_RESPONSE - suffix.length) return respuesta;
    return `${respuesta}${suffix}`;
  }

  reduceStockEmpathyDensity(respuesta = '') {
    if (!respuesta) return respuesta;

    const stockMarkers = [
      'entiendo',
      'comprendo',
      'es válido',
      'es normal que',
      'lo siento',
      'lamento',
      'estoy aquí contigo'
    ];

    const lower = respuesta.toLowerCase();
    const matches = stockMarkers.filter((marker) => lower.includes(marker)).length;
    if (matches <= 1) return respuesta;

    // Si hay muchas fórmulas de empatía en cadena, limpiamos la apertura
    // para mantener contención sin sonar mecánico.
    let cleaned = respuesta
      .replace(/^(entiendo\.?\s*)+/i, '')
      .replace(/^(comprendo\.?\s*)+/i, '')
      .replace(/^(lo siento\.?\s*)+/i, '')
      .replace(/^(lamento\.?\s*)+/i, '')
      .trim();

    // Evitar duplicación literal tipo "es válido, es válido..."
    cleaned = cleaned
      .replace(/(es válido[,.]?\s*){2,}/gi, 'Es válido. ')
      .replace(/(estoy aquí contigo[,.]?\s*){2,}/gi, 'Estoy aquí contigo. ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleaned) return respuesta;
    return cleaned;
  }

  shouldApplySessionClosure(contexto = {}) {
    return shouldForceSessionClosureBridge(contexto);
  }

  enforceSessionClosureBridge(respuesta = '', contexto = {}) {
    if (!respuesta || !this.shouldApplySessionClosure(contexto)) return respuesta;
    if (responseHasSessionClosureBridge(respuesta)) return respuesta;

    const likelyFarewell = contexto?.sessionRetention?.likelyFarewell === true;
    if (!likelyFarewell && /\?/.test(respuesta)) {
      return respuesta;
    }

    const language = resolveLanguageFromContext(contexto);
    const bridge = getSessionClosureBridge(language, likelyFarewell);

    // En cierre, evitar terminar con doble pregunta abierta.
    let base = this.enforceSingleQuestion(respuesta);
    if (likelyFarewell) {
      base = base.replace(/[?]/g, '.').replace(/[¿]/g, '');
    }
    if (base.length >= THRESHOLDS.MAX_CHARACTERS_RESPONSE - bridge.length) {
      return base;
    }
    return `${base}${bridge}`;
  }

  /**
   * Analiza el sentimiento del usuario sobre la respuesta (asíncrono)
   * @param {string} userId - ID del usuario
   * @param {string} userMessage - Mensaje del usuario
   * @param {string} assistantResponse - Respuesta del asistente
   * @param {Object} emotionalAnalysis - Análisis emocional
   * @returns {Promise<void>}
   */
  async analyzeUserSentiment(userId, userMessage, assistantResponse, emotionalAnalysis) {
    try {
      // Este análisis se hace de forma asíncrona y no bloquea la respuesta
      // Se puede expandir en el futuro para:
      // - Detectar si el usuario continúa la conversación (satisfacción)
      // - Detectar si cambia de tema abruptamente (insatisfacción)
      // - Ajustar preferencias del usuario basándose en patrones
      
      // Por ahora, solo logueamos para análisis futuro
      // En el futuro, se puede consultar el siguiente mensaje del usuario
      // para determinar si la respuesta fue satisfactoria
      
      console.log('[OpenAIService] Análisis de sentimiento registrado (asíncrono)', {
        userId,
        messageLength: userMessage.length,
        responseLength: assistantResponse.length,
        emotion: emotionalAnalysis?.mainEmotion
      });
      
      // TODO: Implementar tracking de satisfacción cuando el usuario responda
      // Esto se puede hacer consultando el siguiente mensaje del usuario
      // y analizando si continúa el tema o cambia abruptamente
    } catch (error) {
      // No lanzar error, solo loguear
      console.warn('[OpenAIService] Error en análisis de sentimiento:', error.message);
    }
  }

  /**
   * Verifica si una respuesta es demasiado genérica
   * @param {string} respuesta - Respuesta a validar
   * @returns {boolean} true si es genérica
   */
  esRespuestaGenerica(respuesta) {
    if (!respuesta || typeof respuesta !== 'string') return false;
    return GENERIC_RESPONSE_PATTERNS.some(patron => patron.test(respuesta.trim()));
  }

  /**
   * Verifica si la respuesta es coherente con la emoción detectada
   * @param {string} respuesta - Respuesta a validar
   * @param {Object} contextoEmocional - Contexto emocional del mensaje
   * @returns {boolean} true si es coherente
   */
  esCoherenteConEmocion(respuesta, contextoEmocional) {
    if (!respuesta || !contextoEmocional) return true;
    
    const emocion = contextoEmocional?.mainEmotion?.toLowerCase();
    if (!emocion || emocion === DEFAULT_VALUES.EMOTION) return true;

    return EMOTIONAL_COHERENCE_PATTERNS[emocion]?.test(respuesta) ?? true;
  }

  /**
   * Ajusta la respuesta para que sea coherente con la emoción detectada
   * @param {string} respuesta - Respuesta original
   * @param {Object} contextoEmocional - Contexto emocional con mainEmotion e intensity
   * @returns {string} Respuesta ajustada
   */
  ajustarCoherenciaEmocional(respuesta, contextoEmocional) {
    try {
      if (!respuesta || !contextoEmocional) {
        return respuesta || ERROR_MESSAGES.DEFAULT_FALLBACK;
      }

      const { mainEmotion, intensity, category } = contextoEmocional;
      const respuestaLower = respuesta.toLowerCase();

      // Verificar si ya tiene reconocimiento emocional para evitar redundancia
      const tieneReconocimiento = /(?:entiendo|comprendo|reconozco|veo|noto|siento).*(?:tristeza|ansiedad|enojo|alegría|miedo|emoción|sentimiento|situación)/i.test(respuesta);

      // Si la emoción principal está presente, asegurar que la respuesta sea coherente
      if (mainEmotion && EMOTIONAL_COHERENCE_PHRASES[mainEmotion] && !tieneReconocimiento) {
        const frasesClave = EMOTIONAL_COHERENCE_PHRASES[mainEmotion];
        const tieneCoherencia = frasesClave.some(frase => 
          respuestaLower.includes(frase.toLowerCase())
        );

        if (!tieneCoherencia) {
          // Ajustar la respuesta para incluir reconocimiento emocional (solo si no está ya presente)
          const fraseInicial = frasesClave[Math.floor(Math.random() * frasesClave.length)];
          respuesta = `${fraseInicial}. ${respuesta}`;
        }
      }

      // Ajustar tono según intensidad emocional (solo si no se agregó ya una frase)
      // IMPORTANTE: Pasar el contexto emocional completo para distinguir entre positivas y negativas
      if (intensity >= THRESHOLDS.INTENSITY_HIGH && !tieneReconocimiento) {
        respuesta = this.ajustarTonoAlta(respuesta, contextoEmocional);
      } else if (intensity <= THRESHOLDS.INTENSITY_LOW) {
        respuesta = this.ajustarTonoBaja(respuesta);
      }

      return respuesta;
    } catch (error) {
      console.error('Error ajustando coherencia emocional:', error);
      return respuesta; // Devolver respuesta original si hay error
    }
  }

  /**
   * Ajusta el tono de la respuesta para emociones de alta intensidad
   * @param {string} respuesta - Respuesta original
   * @param {Object} contextoEmocional - Contexto emocional con mainEmotion, category e intensity
   * @returns {string} Respuesta con tono más empático
   */
  ajustarTonoAlta(respuesta, contextoEmocional = {}) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;
    
    const respuestaLower = respuesta.toLowerCase();
    const { mainEmotion, category } = contextoEmocional;
    
    // Verificar si ya tiene frases empáticas para evitar redundancia
    const tieneEmpatia = /(?:entiendo|comprendo|reconozco|veo|noto|siento|importante|difícil|complicado|alegr|feliz|genial|comparto)/i.test(respuesta);
    
    // Asegurar un tono más empático y contenedor para emociones intensas
    if (!tieneEmpatia) {
      // Distinguir entre emociones positivas y negativas
      if (category === 'positive' || mainEmotion === 'alegria' || mainEmotion === 'esperanza') {
        // Frases para emociones positivas de alta intensidad
        const frasesPositivas = [
          'Me alegra mucho escuchar eso.',
          'Qué bueno que te sientas así.',
          'Comparto tu alegría.',
          'Es genial que encuentres cosas que te gustan.'
        ];
        const frase = frasesPositivas[Math.floor(Math.random() * frasesPositivas.length)];
        return `${frase} ${respuesta}`;
      } else if (category === 'negative' || !category) {
        // Frases para emociones negativas de alta intensidad (solo si es negativa)
        const frasesEmpaticas = [
          'Entiendo que esto es importante para ti.',
          'Comprendo que esto te afecta.',
          'Veo que estás pasando por un momento difícil.'
        ];
        const frase = frasesEmpaticas[Math.floor(Math.random() * frasesEmpaticas.length)];
        return `${frase} ${respuesta}`;
      } else {
        // Para emociones neutrales o desconocidas, usar frases neutras
        return `Entiendo que esto es importante para ti. ${respuesta}`;
      }
    }
    return respuesta;
  }

  /**
   * Ajusta el tono de la respuesta para emociones de baja intensidad
   * @param {string} respuesta - Respuesta original
   * @returns {string} Respuesta con tono más exploratorio
   */
  ajustarTonoBaja(respuesta) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;
    
    // Mantener un tono más ligero y exploratorio para emociones de baja intensidad
    if (!respuesta.includes('Me gustaría')) {
      return `Me gustaría explorar esto contigo. ${respuesta}`;
    }
    return respuesta;
  }

  /**
   * Expande respuestas genéricas o muy cortas
   * @param {string} respuesta - Respuesta original
   * @returns {string} Respuesta expandida
   */
  expandirRespuesta(respuesta) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;
    return `${respuesta} ¿Te gustaría que exploremos esto con más detalle?`;
  }

  /**
   * Reduce respuestas muy largas manteniendo las primeras oraciones más importantes.
   * NUNCA reemplaza con mensaje genérico: siempre devuelve contenido de la respuesta original.
   * @param {string} respuesta - Respuesta original
   * @param {Object} [limits] - Límites dinámicos de longitud
   * @returns {string} Respuesta reducida (siempre basada en el contenido original)
   */
  reducirRespuesta(respuesta, limits = null) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;

    const maxCharsLimit = limits?.maxChars ?? THRESHOLDS.MAX_CHARACTERS_RESPONSE;
    const maxSentences = limits?.maxSentencesReduce ?? VALIDATION_LIMITS.MAX_SENTENCES_REDUCE;
    const maxChars = maxCharsLimit - PROMPT_CONFIG.TRUNCATE_BUFFER;

    // Dividir en oraciones
    const oraciones = respuesta.split(/[.!?]+/).filter(s => s.trim());

    // Si tiene pocas oraciones y está dentro del límite, retornar tal cual
    if (oraciones.length <= maxSentences && respuesta.length <= maxCharsLimit) {
      return respuesta;
    }

    // Tomar las primeras oraciones para conservar información relevante
    const oracionesReducidas = oraciones.slice(0, maxSentences);
    let respuestaReducida = oracionesReducidas.join('. ').trim();
    respuestaReducida = this.trimDanglingResponseTail(respuestaReducida);

    // Si al unir oraciones quedó vacío (ej. solo puntuación), truncar desde el original
    if (!respuestaReducida || respuestaReducida.length < 20) {
      const truncado = respuesta.substring(0, maxChars);
      const ultimoEspacio = truncado.lastIndexOf(' ');
      respuestaReducida = ultimoEspacio > 0 ? truncado.substring(0, ultimoEspacio).trim() : truncado.trim();
      respuestaReducida = this.trimDanglingResponseTail(respuestaReducida);
      if (!respuestaReducida.endsWith('.') && !respuestaReducida.endsWith('!') && !respuestaReducida.endsWith('?')) {
        respuestaReducida += PROMPT_CONFIG.TRUNCATE_ELLIPSIS;
      }
      return respuestaReducida || respuesta.substring(0, maxCharsLimit).trim();
    }

    // Si aún es muy larga, truncar por caracteres de forma inteligente
    if (respuestaReducida.length > maxCharsLimit) {
      const truncado = respuestaReducida.substring(0, maxChars);
      const ultimoEspacio = truncado.lastIndexOf(' ');
      respuestaReducida = ultimoEspacio > 0
        ? truncado.substring(0, ultimoEspacio).trim()
        : truncado.trim();
      respuestaReducida = this.trimDanglingResponseTail(respuestaReducida);

      if (!respuestaReducida.endsWith('.') && !respuestaReducida.endsWith('!') && !respuestaReducida.endsWith('?')) {
        respuestaReducida += PROMPT_CONFIG.TRUNCATE_ELLIPSIS;
      }
    } else {
      if (!respuestaReducida.endsWith('.') && !respuestaReducida.endsWith('!') && !respuestaReducida.endsWith('?')) {
        respuestaReducida += '.';
      }
    }

    return respuestaReducida;
  }

  /**
   * Quita colas incompletas (condicionales, conjunciones) antes de publicar.
   * @param {string} respuesta
   * @returns {string}
   */
  trimDanglingResponseTail(respuesta = '') {
    let text = String(respuesta || '').trim();
    if (!text) return text;

    const danglingTailPatterns = [
      /\b(sobre todo|especialmente|o|y|pero)\s+si\s*$/i,
      /\b(sobre todo|especialmente|o|y|pero)\s*$/i,
      /,\s*$/,
      /\b(?:si|que|qué)\s*$/i
    ];

    for (let i = 0; i < 3; i += 1) {
      if (!danglingTailPatterns.some((pattern) => pattern.test(text))) break;
      const parts = text.split(/(?<=[.!?])\s+/).filter((part) => part.trim());
      if (parts.length <= 1) {
        text = text
          .replace(/\b(?:sobre todo|especialmente|o|y|pero)\s+si\s*$/i, '')
          .replace(/,\s*$/, '')
          .trim();
        break;
      }
      text = parts.slice(0, -1).join(' ').trim();
    }

    return text;
  }

  /**
   * Obtiene una respuesta por defecto cuando hay errores
   * @returns {string} Mensaje de respuesta por defecto
   */
  getDefaultResponse() {
    return ERROR_MESSAGES.DEFAULT_FALLBACK;
  }

  /**
   * Actualiza los registros terapéuticos del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} data - Datos del mensaje, respuesta y análisis
   * @returns {Promise<void>}
   */
  async actualizarRegistros(userId, data) {
    try {
      if (!userId || !data?.analisis) {
        console.warn('⚠️ Datos insuficientes para actualizar registros');
        return;
      }

      await TherapeuticRecord.findOneAndUpdate(
        { userId },
        {
          $push: {
            sessions: {
              timestamp: new Date(),
              emotion: data.analisis.emotional,
              content: {
                message: data.mensaje?.content || '',
                response: data.respuesta || ''
              },
              analysis: data.analisis
            }
          },
          $set: {
            'currentStatus.emotion': data.analisis.emotional?.mainEmotion || DEFAULT_VALUES.EMOTION
            // Mongoose timestamps maneja updatedAt automáticamente
          }
        },
        { upsert: true, runValidators: true }
      );
    } catch (error) {
      console.error('❌ Error actualizando registros terapéuticos:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Maneja errores de manera centralizada y retorna respuesta apropiada
   * @param {Error} error - Error capturado
   * @param {Object} mensaje - Mensaje original que causó el error
   * @returns {Promise<Object>} Respuesta de error con content y context
   */
  async manejarError(error, mensaje) {
    console.error('❌ Error en OpenAI Service:', {
      message: error.message,
      stack: error.stack,
      userId: mensaje?.userId,
      conversationId: mensaje?.conversationId
    });
    
    // Mensaje de error más específico según el tipo
    let errorMessage = ERROR_MESSAGES.DEFAULT;
    
    if (error.status === 401 || error.code === 'invalid_api_key') {
      errorMessage = ERROR_MESSAGES.AUTH;
      console.error('❌ Error de autenticación: La API key de OpenAI es incorrecta o no está configurada');
    } else if (error.status === 429) {
      errorMessage = ERROR_MESSAGES.RATE_LIMIT;
      console.warn('⚠️ Rate limit alcanzado en OpenAI API');
    } else if (error.status >= 500) {
      errorMessage = ERROR_MESSAGES.SERVER_ERROR;
      console.error('❌ Error del servidor de OpenAI:', error.status);
    } else if (error.message?.includes('Mensaje inválido')) {
      errorMessage = ERROR_MESSAGES.INVALID_MESSAGE;
    }
    
    return {
      content: errorMessage,
      context: {
        error: true,
        errorType: error.name || 'UnknownError',
        errorCode: error.code || error.status || 'UNKNOWN',
        errorMessage: error.message || 'Error desconocido',
        timestamp: new Date()
      }
    };
  }

  /**
   * Obtiene el período del día actual
   * @returns {string} Período del día (mañana, tarde, noche)
   */
  getTimeOfDay() {
    return getTimeOfDay();
  }

  /**
   * Normaliza el objeto de análisis emocional para asegurar compatibilidad con el esquema de Message
   * @param {Object} analisisEmocional - Objeto de análisis emocional
   * @returns {Object} Objeto emocional normalizado
   */
  normalizarAnalisisEmocional(analisisEmocional) {
    return normalizeEmotionalAnalysis(analisisEmocional);
  }

  /**
   * Genera un saludo personalizado según el momento del día
   * @param {Object} userPreferences - Preferencias del usuario (opcional, no usado actualmente)
   * @returns {string} Saludo personalizado
   */
  generarSaludoPersonalizado(userPreferences = {}) {
    const language = userPreferences?.language === 'en' ? 'en' : 'es';
    const timeOfDay = getTimeOfDayEnglish();
    return getRandomGreeting(timeOfDay, language);
  }

  /**
   * Determina si se deben agregar elecciones de respuesta al final
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @param {Object} analisisContextual - Análisis contextual del mensaje
   * @param {Object} activeProtocol - Protocolo activo (opcional)
   * @returns {boolean} true si se deben agregar elecciones
   */
  shouldAddChoices(analisisEmocional, analisisContextual, activeProtocol, extras = {}) {
    if (
      isLlmCrisisTherapeuticExtrasBlocked({
        riskLevel: extras.crisis?.riskLevel,
        userMessage: extras.userMessage,
      })
    ) {
      return false;
    }

    // No agregar elecciones si hay un protocolo activo
    if (activeProtocol) {
      return false;
    }

    // No agregar elecciones en saludos simples
    if (analisisContextual?.intencion?.tipo === MESSAGE_INTENTS.GREETING) {
      return false;
    }

    // Agregar elecciones si la intensidad emocional es moderada o alta (5+)
    const intensity = analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY;
    if (intensity >= 5) {
      return true;
    }

    // Agregar elecciones si el usuario busca ayuda específica
    if (analisisContextual?.intencion?.tipo === MESSAGE_INTENTS.SEEKING_HELP || 
        analisisContextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS) {
      return true;
    }

    // Por defecto, no agregar elecciones
    return false;
  }

  /**
   * Agrega chequeos de seguridad a la respuesta cuando la intensidad emocional es alta
   * @param {string} respuesta - Respuesta base
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @param {Object} analisisContextual - Análisis contextual del mensaje
   * @returns {string} Respuesta con chequeos de seguridad agregados
   */
  addSafetyChecks(
    respuesta,
    analisisEmocional,
    analisisContextual,
    userMessageContent = '',
    options = {}
  ) {
    const intensity = analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY;
    const profile = options.profile || null;
    const conversationHistory = options.conversationHistory || [];

    // Importante: NO sobreactivar crisis por intensidad alta sola.
    // Solo agregamos bloque de seguridad/recursos cuando la intención es CRISIS.
    const intent = analisisContextual?.intencion?.tipo;
    if (intent !== MESSAGE_INTENTS.CRISIS) {
      return respuesta;
    }

    const skipHeavyPhones = shouldSkipEmergencyPhoneNumbersInSafetyAppend(userMessageContent);
    const compact = shouldUseCompactCrisisSafetyAppend(userMessageContent, conversationHistory);
    const emergencyInfo = resolveEmergencyInfoFromPreferences(profile?.preferences, profile?.phone || null);
    const lang = options.language || profile?.preferences?.language || 'es';
    const emergencyLines = formatEmergencyNumbers(emergencyInfo, lang);

    const safetyText = buildCrisisSafetyAppendText({
      language: lang,
      intensity,
      compact,
      skipHeavyPhones,
      emergencyLines,
    });

    return respuesta + safetyText;
  }

  /**
   * Agrega elecciones de respuesta al final del mensaje
   * @param {string} respuesta - Respuesta base
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @param {Object} analisisContextual - Análisis contextual del mensaje
   * @param {Object} activeProtocol - Protocolo activo (opcional)
   * @returns {string} Respuesta con elecciones agregadas
   */
  addResponseChoices(respuesta, analisisEmocional, analisisContextual, activeProtocol) {
    // Por ahora, retornar la respuesta sin modificar
    // Esta funcionalidad puede ser implementada más adelante
    return respuesta;
  }

  /**
   * Determina si se debe incluir una técnica terapéutica en la respuesta
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @param {Object} analisisContextual - Análisis contextual del mensaje
   * @returns {boolean} true si se debe incluir la técnica
   */
  /**
   * Genera una respuesta de fallback cuando OpenAI no responde
   * @param {Object} analisisEmocional - Análisis emocional
   * @param {Object} analisisContextual - Análisis contextual
   * @returns {string} Respuesta de fallback empática
   */
  generarRespuestaFallback(analisisEmocional, analisisContextual) {
    const emotion = analisisEmocional?.mainEmotion || 'neutral';
    const intensity = analisisEmocional?.intensity || 5;
    const intent = analisisContextual?.intencion?.tipo || MESSAGE_INTENTS.EMOTIONAL_SUPPORT;
    const content = (analisisContextual?.content || '').toLowerCase().trim();

    // Fuera de ámbito: redirigir sin LLM ni trivia.
    if (detectOffScopeUserMessage({ currentMessage: content })) {
      return buildOffScopeRedirectReply('es');
    }

    // Detectar preguntas sobre el sistema
    const isSystemQuestion = /(?:quien.*eres|qué.*haces|qué.*es|qué.*sos|como.*funciona|para.*qué.*sirve|qué.*puedes.*hacer|qué.*ofreces)/i.test(content);
    if (isSystemQuestion) {
      return 'Soy Anto, tu asistente terapéutico. Estoy aquí para brindarte apoyo emocional, escucharte y ayudarte a navegar tus emociones. ¿En qué puedo ayudarte hoy?';
    }

    // Fuera de ámbito solo en casos claros (tecnología, cultura general sin bienestar).
    const offTopicPatterns = [
      /(?:qué|que) es\s+(?:react|react native|un framework)/i,
      /react\s*native|programación|framework\s+de|tecnología\s+(?:de|para)/i,
      /^cuál es la capital\s/i
    ];
    const wellnessKeywords = /(?:emoción|sentir|ansiedad|tristeza|estrés|bienestar|terapia|apoyo|miedo|enojo|depresión|preocupación|me hace|me siento|estoy)/i;
    const looksLikeOffTopic = offTopicPatterns.some(p => p.test(content));
    const hasWellnessContext = wellnessKeywords.test(content);
    if (looksLikeOffTopic && !hasWellnessContext) {
      return buildOffScopeRedirectReply('es');
    }

    // Detectar saludos
    const isGreeting = /^(hola|hi|hello|buenos.*d[ií]as|buenas.*tardes|buenas.*noches|qué.*tal)$/i.test(content);
    if (isGreeting) {
      return '¡Hola! Soy Anto, tu asistente terapéutico. Estoy aquí para escucharte y apoyarte. ¿Cómo puedo ayudarte hoy?';
    }
    
    // Respuestas empáticas básicas según emoción
    const fallbackResponses = {
      tristeza: intensity >= 7 
        ? 'Entiendo que estás pasando por un momento difícil. Estoy aquí contigo. ¿Quieres contarme más sobre lo que estás sintiendo?'
        : 'Comprendo que te sientes triste. Es válido sentirse así. ¿Hay algo específico que te gustaría compartir?',
      ansiedad: intensity >= 7
        ? 'Veo que estás experimentando mucha ansiedad. Respira profundo. Estoy aquí contigo. ¿Qué te está generando esta ansiedad?'
        : 'Entiendo que sientes ansiedad. Es normal sentirse así a veces. ¿Quieres hablar sobre qué la está causando?',
      enojo: 'Entiendo que estás enojado. Es válido sentir enojo. ¿Quieres contarme qué te está molestando?',
      miedo: 'Veo que sientes miedo. Es normal tener miedos. ¿Quieres compartir qué te está asustando?',
      neutral: intent === MESSAGE_INTENTS.GREETING
        ? '¡Hola! ¿Cómo puedo ayudarte hoy?'
        : 'Te escucho. ¿Quieres contarme más sobre lo que estás pensando?'
    };
    
    return fallbackResponses[emotion] || fallbackResponses.neutral;
  }

  /**
   * Registra estadísticas de uso de tokens para análisis
   * @param {Object} stats - Estadísticas de tokens
   */
  registrarEstadisticasTokens(stats) {
    this.tokenStats.totalRequests++;
    
    if (stats.hasContent) {
      this.tokenStats.withContent++;
    } else {
      this.tokenStats.withoutContent++;
    }
    
    this.tokenStats.completionTokens.push(stats.totalCompletionTokens);
    this.tokenStats.reasoningTokens.push(stats.reasoningTokens);
    this.tokenStats.actualContentTokens.push(stats.actualContentTokens);
    this.tokenStats.promptTokens.push(stats.promptTokens);

    this._accumulateTokenUsageForDay(stats);
    
    // Contar finish reasons
    const reason = stats.finishReason || 'unknown';
    this.tokenStats.finishReasons[reason] = (this.tokenStats.finishReasons[reason] || 0) + 1;
    
    // Log cada 10 requests o si hay un problema
    if (this.tokenStats.totalRequests % 10 === 0 || !stats.hasContent) {
      this.logEstadisticasTokens();
    }
  }

  /**
   * Agrega tokens al bucket del día UTC (informe diario por correo).
   * @private
   */
  _accumulateTokenUsageForDay(stats) {
    const dayKey = new Date().toISOString().slice(0, 10);
    if (!this.tokenUsageByDay[dayKey]) {
      this.tokenUsageByDay[dayKey] = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        requests: 0
      };
    }
    const b = this.tokenUsageByDay[dayKey];
    b.promptTokens += stats.promptTokens || 0;
    b.completionTokens += stats.totalCompletionTokens || 0;
    b.totalTokens += stats.totalTokens || 0;
    b.requests += 1;
    this._pruneTokenUsageByDay(45);

    void OpenAITokenUsageDay.incrementForDay(dayKey, {
      promptTokens: stats.promptTokens || 0,
      completionTokens: stats.totalCompletionTokens || 0,
      totalTokens: stats.totalTokens || 0
    }).catch((err) => {
      console.warn('[OpenAI] Persistencia uso diario (Mongo):', err.message);
    });
  }

  /**
   * @param {number} keepDays
   * @private
   */
  _pruneTokenUsageByDay(keepDays) {
    const keys = Object.keys(this.tokenUsageByDay).sort();
    if (keys.length <= keepDays) return;
    const toDrop = keys.slice(0, keys.length - keepDays);
    for (const k of toDrop) delete this.tokenUsageByDay[k];
  }

  /**
   * Uso agregado para un día UTC (YYYY-MM-DD): primero documento en Mongo; si no existe, bucket en memoria.
   * @param {string} dayKey
   * @returns {Promise<{ promptTokens: number, completionTokens: number, totalTokens: number, requests: number } | null>}
   */
  async getTokenUsageForUtcDay(dayKey) {
    try {
      const doc = await OpenAITokenUsageDay.findOne({ dayKey }).lean();
      if (doc) {
        return {
          promptTokens: doc.promptTokens,
          completionTokens: doc.completionTokens,
          totalTokens: doc.totalTokens,
          requests: doc.requests
        };
      }
    } catch (e) {
      console.warn('[OpenAI] Lectura uso diario (Mongo):', e.message);
    }
    const row = this.tokenUsageByDay[dayKey];
    return row ? { ...row } : null;
  }
  
  /**
   * Log de estadísticas de tokens
   */
  logEstadisticasTokens() {
    const stats = this.tokenStats;
    const avgCompletion = this.calcularPromedio(stats.completionTokens);
    const avgReasoning = this.calcularPromedio(stats.reasoningTokens);
    const avgContent = this.calcularPromedio(stats.actualContentTokens);
    const avgPrompt = this.calcularPromedio(stats.promptTokens);
    const maxCompletion = Math.max(...stats.completionTokens, 0);
    const maxReasoning = Math.max(...stats.reasoningTokens, 0);
    const maxContent = Math.max(...stats.actualContentTokens, 0);
    
    console.log('\n📊 [TOKEN STATS] Estadísticas de uso de tokens:');
    console.log(`   Total requests: ${stats.totalRequests}`);
    console.log(`   Con contenido: ${stats.withContent} (${((stats.withContent/stats.totalRequests)*100).toFixed(1)}%)`);
    console.log(`   Sin contenido: ${stats.withoutContent} (${((stats.withoutContent/stats.totalRequests)*100).toFixed(1)}%)`);
    console.log(`   Promedio completion tokens: ${avgCompletion.toFixed(0)} (máx: ${maxCompletion})`);
    console.log(`   Promedio reasoning tokens: ${avgReasoning.toFixed(0)} (máx: ${maxReasoning})`);
    console.log(`   Promedio contenido tokens: ${avgContent.toFixed(0)} (máx: ${maxContent})`);
    console.log(`   Promedio prompt tokens: ${avgPrompt.toFixed(0)}`);
    console.log(`   Finish reasons:`, stats.finishReasons);
    console.log(`   Último reset: ${stats.lastReset.toISOString()}\n`);
    
    // Recomendación de límite basada en percentil 95
    if (stats.completionTokens.length >= 10) {
      const sorted = [...stats.completionTokens].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const recommendedLimit = Math.ceil(p95 * 1.1); // 10% de margen
      console.log(`💡 Recomendación de límite (percentil 95 + 10%): ${recommendedLimit} tokens\n`);
    }
  }
  
  /**
   * Calcula el promedio de un array
   */
  calcularPromedio(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  
  /**
   * Resetea las estadísticas de tokens
   */
  resetTokenStats() {
    this.tokenStats = {
      totalRequests: 0,
      withContent: 0,
      withoutContent: 0,
      completionTokens: [],
      reasoningTokens: [],
      actualContentTokens: [],
      promptTokens: [],
      finishReasons: {},
      lastReset: new Date()
    };
    console.log('📊 [TOKEN STATS] Estadísticas reseteadas');
  }

  shouldIncludeTechnique(analisisEmocional, analisisContextual, mensaje, extras = {}) {
    if (
      isLlmCrisisTherapeuticExtrasBlocked({
        riskLevel: extras.crisis?.riskLevel,
        userMessage: extras.userMessage ?? mensaje?.content,
      })
    ) {
      return false;
    }

    const contenido = (mensaje?.content || '').toLowerCase();
    const intent = analisisContextual?.intencion?.tipo;
    const topicCategory = analisisContextual?.tema?.categoria;

    // Evitar insertar técnicas en tareas "utilitarias" (p. ej. traducción/estudio) si no hay contexto de bienestar.
    const looksLikeUtilityTask = /(?:ingl[eé]s|traduc|traducci[oó]n|revisar\s+texto|gram[aá]tica|vocabulario|tarea|homework)/i.test(contenido);
    const wellnessKeywords = /(?:ansiedad|estr[eé]s|triste|enojo|miedo|culpa|verg[uü]enza|bienestar|calmar|relajar|respira|ataque\s+de\s+p[aá]nico|me\s+siento|me\s+pone|me\s+da)/i;
    const hasWellnessContext = wellnessKeywords.test(contenido);
    if ((topicCategory === 'TRABAJO_ESTUDIO' || looksLikeUtilityTask) && !hasWellnessContext) {
      return false;
    }

    // Solo incluir técnicas si:
    // - el usuario las pide explícitamente (técnica/ejercicio/etc.) y el tema es bienestar, o
    // - la intención del analizador es ayuda emocional (no "conversación general" sin señales).
    const explicitTechniqueAsk = /(?:técnica|tecnica|herramienta|estrategia|método|metodo|ejercicio|actividad|respiraci[oó]n|mindfulness)/i.test(contenido);
    const explicitWellnessHelpAsk =
      /(?:qu[eé]\s+puedo\s+hacer|c[oó]mo\s+puedo|necesito\s+ayuda|ay[úu]dame|dame\s+un\s+consejo|recomiendame|sugerime)/i.test(contenido) &&
      hasWellnessContext;

    const intentAllowsTechnique =
      intent === MESSAGE_INTENTS.SEEKING_HELP ||
      intent === MESSAGE_INTENTS.EMOTIONAL_SUPPORT ||
      intent === MESSAGE_INTENTS.CRISIS;

    return (explicitTechniqueAsk && (hasWellnessContext || intentAllowsTechnique)) || explicitWellnessHelpAsk || intentAllowsTechnique;
  }

  /**
   * Adapta la respuesta según el protocolo terapéutico activo
   * @param {string} respuesta - Respuesta original generada
   * @param {Object} intervention - Intervención actual del protocolo
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @returns {string} Respuesta adaptada al protocolo
   */
  adaptResponseToProtocol(respuesta, intervention, analisisEmocional) {
    if (!intervention || !respuesta) {
      return respuesta;
    }

    // Si la intervención tiene instrucciones específicas, seguirlas
    // Por ahora, simplemente retornar la respuesta original
    // En el futuro, se puede agregar lógica más específica aquí
    // para adaptar la respuesta según el tipo de intervención
    
    return respuesta;
  }
}

export default new OpenAIService(); 