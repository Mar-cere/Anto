/**
 * Servicio de OpenAI - Gestiona la generación de respuestas con GPT-5 Mini y análisis contextual
 */
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
    ANALYSIS_DIMENSIONS,
    DEFAULT_VALUES,
    EMOTIONAL_COHERENCE_PATTERNS,
    EMOTIONAL_COHERENCE_PHRASES,
    ERROR_MESSAGES,
    GENERIC_RESPONSE_PATTERNS,
    GREETING_VARIATIONS,
    MESSAGE_INTENTS,
    OPENAI_MODEL,
    PROMPT_CONFIG,
    RESPONSE_LENGTHS,
    TEMPERATURES,
    THRESHOLDS,
    TIME_PERIODS,
    VALIDATION_LIMITS
} from '../constants/openai.js';
import { buildContextualizedPrompt } from './openai/openaiPromptBuilder.js';
import { adaptCachedResponse, generateResponseCacheKey, isCachedResponseValid } from './openai/openaiResponseCache.js';
import { normalizeEmotionalAnalysis, validateMessage } from './openai/openaiValidation.js';
import {
    formatTechniqueForResponse,
    selectAppropriateTechnique
} from '../constants/therapeuticTechniques.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
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

      // Si no viene el perfil, obtenerlo
      if (!perfilUsuario) {
        perfilUsuario = await personalizationService.getUserProfile(mensaje.userId).catch(() => null);
      }

      // Si no viene el registro terapéutico, obtenerlo
      if (!registroTerapeutico) {
        registroTerapeutico = await TherapeuticRecord.findOne({ userId: mensaje.userId }).catch(() => null);
      }

      // 2. Obtener Memoria y Contexto
      const memoriaContextual = await memoryService.getRelevantContext(
        mensaje.userId,
        contenidoNormalizado,
        {
          emotional: analisisEmocional,
          contextual: analisisContextual
        }
      );

      // 3. Construir Prompt Contextualizado (módulo openaiPromptBuilder)
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
          crisis: contexto.crisis
        }
      );

      // 4. Generar Respuesta con OpenAI

      // MEJORA: Intentar obtener respuesta del caché si existe (módulo openaiResponseCache)
      const cacheKey = generateResponseCacheKey(contenidoNormalizado, analisisEmocional, analisisContextual);
      let cachedResponse = null;
      try {
        cachedResponse = await cacheService.get(cacheKey);
        if (cachedResponse && isCachedResponseValid(cachedResponse, analisisContextual)) {
          console.log('[OpenAI] ✅ Respuesta obtenida del caché');
          const adaptedResponse = adaptCachedResponse(cachedResponse.response, analisisContextual, contenidoNormalizado);
          return { content: adaptedResponse, context: { emotional: analisisEmocional, contextual: analisisContextual } };
        }
      } catch (cacheError) {
        console.warn('[OpenAI] Error al obtener del caché, continuando sin caché:', cacheError.message);
      }

      // Obtener responseStyle del perfil para ajustar longitud (ya obtenido arriba en línea 366)
      const userResponseStyle = perfilUsuario?.preferences?.responseStyle || 'balanced';
      
      // Logging del prompt para debugging
      const maxTokens = this.determinarLongitudRespuesta(analisisContextual, contenidoNormalizado, userResponseStyle);
      const promptLength = prompt.systemMessage.length;
      const contextMessagesCount = prompt.contextMessages?.length || 0;
      const userMessageLength = contenidoNormalizado.length;
      console.log(`[OpenAI] Prompt length: ${promptLength} chars, Context messages: ${contextMessagesCount}, User message: ${userMessageLength} chars, Max completion tokens: ${maxTokens}, Response style: ${userResponseStyle}`);

      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
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
          max_completion_tokens: this.determinarLongitudRespuesta(analisisContextual, contenidoNormalizado, userResponseStyle)
          // Nota: GPT-5 Mini solo soporta:
          // - temperature: valor por defecto (1) - no se puede especificar otro valor
          // - max_completion_tokens: sí soportado
          // - presence_penalty y frequency_penalty: no soportados
        });
      } catch (apiError) {
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
        maxCompletionTokens: this.determinarLongitudRespuesta(analisisContextual, contenidoNormalizado, userResponseStyle),
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
          maxCompletionTokens: this.determinarLongitudRespuesta(analisisContextual, contenidoNormalizado, userResponseStyle),
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
      
      if (!activeProtocol) {
        // Verificar si se debe iniciar un protocolo
        const protocolToStart = therapeuticProtocolService.shouldStartProtocol(
          analisisEmocional,
          analisisContextual
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
      } else {
        // Obtener la intervención del paso actual
        currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
      }

      // 6. NUEVO: Obtener plantilla terapéutica si hay subtipo
      const responseStyle = perfilUsuario?.preferences?.responseStyle || 'balanced';
      const therapeuticBase = therapeuticTemplateService.buildTherapeuticBase(
        analisisEmocional?.mainEmotion,
        analisisEmocional?.subtype,
        { style: responseStyle }
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
          analisisContextual?.intencion?.tipo || null
        );
      }

      // 8. NUEVO: Mejorar respuesta con plantilla terapéutica si existe
      let respuestaMejorada = respuestaGenerada;
      if (therapeuticBase && !activeProtocol) {
        // Si hay una base terapéutica, usarla para guiar la respuesta
        // La respuesta de OpenAI se puede usar como complemento
        respuestaMejorada = `${therapeuticBase}\n\n${respuestaGenerada}`;
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
          userMessage: contenidoNormalizado // Para validación de relevancia
        }
      );

      // 11. NUEVO: Agregar chequeos de seguridad si la intensidad es alta
      let respuestaConSeguridad = respuestaValidada;
      if (analisisEmocional?.intensity >= 8 || analisisEmocional?.requiresAttention) {
        respuestaConSeguridad = this.addSafetyChecks(
          respuestaValidada,
          analisisEmocional,
          analisisContextual
        );
      }

      // 12. NUEVO: Agregar elecciones al final de la respuesta si es apropiado
      let respuestaConElecciones = respuestaConSeguridad;
      if (this.shouldAddChoices(analisisEmocional, analisisContextual, activeProtocol)) {
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
      if (selectedTechnique && !activeProtocol && this.shouldIncludeTechnique(analisisEmocional, analisisContextual, mensaje)) {
        // Calcular espacio disponible para la técnica
        const espacioDisponible = THRESHOLDS.MAX_CHARACTERS_RESPONSE - respuestaValidada.length;
        const necesitaFormatoCompacto = espacioDisponible < 300; // Menos de 300 caracteres disponibles
        
        // Formatear técnica (compacta si hay poco espacio)
        const techniqueText = formatTechniqueForResponse(selectedTechnique, {
          compact: necesitaFormatoCompacto,
          maxSteps: necesitaFormatoCompacto ? 2 : 4
        });
        
        // Agregar técnica al final de la respuesta
        respuestaFinal = `${respuestaValidada}${techniqueText}`;
        
        // Si aún es demasiado larga, usar formato muy compacto
        if (respuestaFinal.length > THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
          const veryCompactText = formatTechniqueForResponse(selectedTechnique, {
            compact: true,
            maxSteps: 1
          });
          respuestaFinal = `${respuestaValidada}${veryCompactText}`;
          
          // Si aún es muy larga, solo nombre y descripción breve
          if (respuestaFinal.length > THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
            respuestaFinal = respuestaValidada + 
              `\n\n💡 ${selectedTechnique.name}\n` +
              `${selectedTechnique.description ? selectedTechnique.description.substring(0, 150) + '...' : ''}\n\n` +
              `Puedes preguntarme más sobre esta técnica si te interesa.`;
          }
        }
      }

      // MEJORA: Guardar respuesta en caché para futuras consultas similares
      try {
        await cacheService.set(cacheKey, {
          response: respuestaFinal,
          emotional: analisisEmocional,
          contextual: analisisContextual,
          timestamp: Date.now()
        }, 1800); // Cachear por 30 minutos
        console.log('[OpenAI] ✅ Respuesta guardada en caché');
      } catch (cacheError) {
        console.warn('[OpenAI] Error al guardar en caché, continuando:', cacheError.message);
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

    const memoriaContextual = await memoryService.getRelevantContext(
      mensaje.userId,
      contenidoNormalizado,
      { emotional: analisisEmocional, contextual: analisisContextual }
    );

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
        crisis: contexto.crisis
      }
    );

    const maxTokens = this.determinarLongitudRespuesta(analisisContextual, contenidoNormalizado, perfilUsuario?.preferences?.responseStyle || 'balanced');

    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: prompt.systemMessage },
          ...prompt.contextMessages,
          { role: 'user', content: contenidoNormalizado }
        ],
        max_completion_tokens: maxTokens,
        stream: true
      });
    } catch (apiError) {
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
        registroTerapeutico
      });
      yield { type: 'done', content: result.content, context: result.context };
      return;
    }

    const result = await this._postProcessStreamedContent(rawContent, {
      mensaje,
      contenidoNormalizado,
      analisisEmocional,
      analisisContextual,
      perfilUsuario,
      registroTerapeutico
    });
    yield { type: 'done', content: result.content, context: result.context };
  }

  /**
   * Post-procesa el contenido generado por streaming (validación, técnica, seguridad, etc.).
   * @private
   */
  async _postProcessStreamedContent(respuestaGenerada, { mensaje, contenidoNormalizado, analisisEmocional, analisisContextual, perfilUsuario, registroTerapeutico }) {
    let activeProtocol = therapeuticProtocolService.getActiveProtocol(mensaje.userId);
    let currentIntervention = null;

    if (!activeProtocol) {
      const protocolToStart = therapeuticProtocolService.shouldStartProtocol(analisisEmocional, analisisContextual);
      if (protocolToStart) {
        activeProtocol = therapeuticProtocolService.startProtocol(mensaje.userId, protocolToStart);
        currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
      }
    } else {
      currentIntervention = therapeuticProtocolService.getCurrentIntervention(mensaje.userId);
    }

    const responseStyle = perfilUsuario?.preferences?.responseStyle || 'balanced';
    const therapeuticBase = therapeuticTemplateService.buildTherapeuticBase(
      analisisEmocional?.mainEmotion,
      analisisEmocional?.subtype,
      { style: responseStyle }
    );

    let selectedTechnique = null;
    if (!activeProtocol) {
      selectedTechnique = selectAppropriateTechnique(
        analisisEmocional?.mainEmotion || DEFAULT_VALUES.EMOTION,
        analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY,
        registroTerapeutico?.currentPhase || DEFAULT_VALUES.PHASE,
        analisisContextual?.intencion?.tipo || null
      );
    }

    let respuestaMejorada = respuestaGenerada;
    if (therapeuticBase && !activeProtocol) {
      respuestaMejorada = `${therapeuticBase}\n\n${respuestaGenerada}`;
    }
    if (activeProtocol && currentIntervention) {
      respuestaMejorada = this.adaptResponseToProtocol(respuestaMejorada, currentIntervention, analisisEmocional);
    }

    const respuestaValidada = await this.validarYMejorarRespuesta(respuestaMejorada, {
      emotional: analisisEmocional,
      contextual: analisisContextual,
      profile: perfilUsuario,
      userMessage: contenidoNormalizado
    });

    let respuestaConSeguridad = respuestaValidada;
    if (analisisEmocional?.intensity >= 8 || analisisEmocional?.requiresAttention) {
      respuestaConSeguridad = this.addSafetyChecks(respuestaValidada, analisisEmocional, analisisContextual);
    }

    let respuestaConElecciones = respuestaConSeguridad;
    if (this.shouldAddChoices(analisisEmocional, analisisContextual, activeProtocol)) {
      respuestaConElecciones = this.addResponseChoices(respuestaConSeguridad, analisisEmocional, analisisContextual, activeProtocol);
    }

    let respuestaFinal = respuestaConElecciones;
    if (selectedTechnique && !activeProtocol && this.shouldIncludeTechnique(analisisEmocional, analisisContextual, mensaje)) {
      const espacioDisponible = THRESHOLDS.MAX_CHARACTERS_RESPONSE - respuestaValidada.length;
      const techniqueText = formatTechniqueForResponse(selectedTechnique, {
        compact: espacioDisponible < 300,
        maxSteps: espacioDisponible < 300 ? 2 : 4
      });
      respuestaFinal = `${respuestaValidada}${techniqueText}`;
      if (respuestaFinal.length > THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
        const veryCompact = formatTechniqueForResponse(selectedTechnique, { compact: true, maxSteps: 1 });
        respuestaFinal = `${respuestaValidada}${veryCompact}`;
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
   * Determina la longitud óptima de respuesta basada en el contexto
   * @param {Object} contexto - Contexto del mensaje
   * @param {string} userMessage - Mensaje del usuario (opcional, para ajuste dinámico)
   * @param {string} responseStyle - Estilo de respuesta preferido ('brief', 'balanced', 'deep')
   * @returns {number} Longitud en tokens
   */
  determinarLongitudRespuesta(contexto, userMessage = '', responseStyle = 'balanced') {
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
    if (responseStyle === 'brief' || responseStyle === 'directo') {
      // Respuestas breves/directas: reducir la longitud base
      baseLength = Math.min(baseLength, RESPONSE_LENGTHS.SHORT);
    } else if (responseStyle === 'deep' || responseStyle === 'estructurado') {
      // Respuestas profundas/estructuradas: aumentar la longitud base
      baseLength = Math.max(baseLength, RESPONSE_LENGTHS.MEDIUM);
      if (baseLength === RESPONSE_LENGTHS.MEDIUM) {
        baseLength = RESPONSE_LENGTHS.LONG;
      }
    } else if (responseStyle === 'empatico' || responseStyle === 'profesional' || responseStyle === 'calido') {
      // Respuestas empáticas/profesionales/cálidas: longitud media-alta
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
    
    if (caracteres > THRESHOLDS.MAX_CHARACTERS_RESPONSE || palabras > THRESHOLDS.MAX_WORDS_RESPONSE) {
      console.log(`📏 Respuesta demasiado larga (${caracteres} caracteres, ${palabras} palabras). Reduciendo...`);
      respuestaMejorada = this.reducirRespuesta(respuestaMejorada);
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
    
    if (caracteresFinal > THRESHOLDS.MAX_CHARACTERS_RESPONSE || palabrasFinal > THRESHOLDS.MAX_WORDS_RESPONSE) {
      console.log(`📏 Respuesta aún demasiado larga después de ajustes (${caracteresFinal} caracteres, ${palabrasFinal} palabras). Reduciendo nuevamente...`);
      respuestaMejorada = this.reducirRespuesta(respuestaMejorada);
    }

    // NUNCA reemplazar por mensaje genérico si tenemos contenido válido (evitar pérdida de información)
    if (!respuestaMejorada || respuestaMejorada.trim().length < 5) {
      const truncado = (respuesta || '').trim();
      if (truncado.length > 0) {
        const maxC = THRESHOLDS.MAX_CHARACTERS_RESPONSE - 3;
        respuestaMejorada = truncado.length <= maxC ? truncado : truncado.substring(0, maxC).trim() + '…';
      }
    }
    
    // Asegurar que la respuesta siempre comience con mayúscula
    if (respuestaMejorada && respuestaMejorada.length > 0) {
      respuestaMejorada = respuestaMejorada.charAt(0).toUpperCase() + respuestaMejorada.slice(1);
    }
    
    return respuestaMejorada;
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
   * @returns {string} Respuesta reducida (siempre basada en el contenido original)
   */
  reducirRespuesta(respuesta) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;

    const maxChars = THRESHOLDS.MAX_CHARACTERS_RESPONSE - PROMPT_CONFIG.TRUNCATE_BUFFER;

    // Dividir en oraciones
    const oraciones = respuesta.split(/[.!?]+/).filter(s => s.trim());

    // Si tiene 2 o menos oraciones y está dentro del límite, retornar tal cual
    if (oraciones.length <= VALIDATION_LIMITS.MAX_SENTENCES_REDUCE && respuesta.length <= THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
      return respuesta;
    }

    // Tomar las primeras oraciones para conservar información relevante
    const oracionesReducidas = oraciones.slice(0, VALIDATION_LIMITS.MAX_SENTENCES_REDUCE);
    let respuestaReducida = oracionesReducidas.join('. ').trim();

    // Si al unir oraciones quedó vacío (ej. solo puntuación), truncar desde el original
    if (!respuestaReducida || respuestaReducida.length < 20) {
      const truncado = respuesta.substring(0, maxChars);
      const ultimoEspacio = truncado.lastIndexOf(' ');
      respuestaReducida = ultimoEspacio > 0 ? truncado.substring(0, ultimoEspacio).trim() : truncado.trim();
      if (!respuestaReducida.endsWith('.') && !respuestaReducida.endsWith('!') && !respuestaReducida.endsWith('?')) {
        respuestaReducida += PROMPT_CONFIG.TRUNCATE_ELLIPSIS;
      }
      return respuestaReducida || respuesta.substring(0, THRESHOLDS.MAX_CHARACTERS_RESPONSE).trim();
    }

    // Si aún es muy larga, truncar por caracteres de forma inteligente
    if (respuestaReducida.length > THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
      const truncado = respuestaReducida.substring(0, maxChars);
      const ultimoEspacio = truncado.lastIndexOf(' ');
      respuestaReducida = ultimoEspacio > 0
        ? truncado.substring(0, ultimoEspacio).trim()
        : truncado.trim();

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
    const timeOfDay = getTimeOfDayEnglish();
    const greetings = GREETING_VARIATIONS[timeOfDay] || GREETING_VARIATIONS.morning;
    
    if (!greetings || greetings.length === 0) {
      return GREETING_VARIATIONS.morning[0] || '¡Hola! ¿Cómo puedo ayudarte hoy?';
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Determina si se deben agregar elecciones de respuesta al final
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @param {Object} analisisContextual - Análisis contextual del mensaje
   * @param {Object} activeProtocol - Protocolo activo (opcional)
   * @returns {boolean} true si se deben agregar elecciones
   */
  shouldAddChoices(analisisEmocional, analisisContextual, activeProtocol) {
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
  addSafetyChecks(respuesta, analisisEmocional, analisisContextual) {
    const intensity = analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY;
    let safetyText = '';

    // Si la intensidad es >= 8, agregar preguntas de seguridad
    if (intensity >= 8) {
      safetyText += '\n\n💙 **Preguntas de seguridad:**\n';
      safetyText += '• ¿Estás a salvo en este momento?\n';
      safetyText += '• ¿Hay alguien contigo o puedes contactar a alguien de confianza?\n';
      safetyText += '• ¿Has pensado en hacerte daño a ti mismo o a otros?\n';
    }

    // Si la intensidad es >= 9, agregar recursos de emergencia
    if (intensity >= 9) {
      safetyText += '\n\n🚨 **Recursos de emergencia disponibles:**\n';
      safetyText += '• **Línea de crisis:** 911 (Emergencias)\n';
      safetyText += '• **Línea de prevención del suicidio:** 988 (24/7)\n';
      safetyText += '• **Contactos de emergencia:** Puedes activar tus contactos de emergencia desde la app\n';
      safetyText += '\nRecuerda que no estás solo/a. Hay personas que pueden ayudarte.';
    }

    // Mensaje de apoyo general para intensidades altas
    if (intensity >= 8) {
      safetyText += '\n\n💚 **Recuerda:** Es importante que busques apoyo profesional si estos sentimientos persisten o empeoran.';
    }

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

    // Detectar preguntas sobre el sistema
    const isSystemQuestion = /(?:quien.*eres|qué.*haces|qué.*es|qué.*sos|como.*funciona|para.*qué.*sirve|qué.*puedes.*hacer|qué.*ofreces)/i.test(content);
    if (isSystemQuestion) {
      return 'Soy Anto, tu asistente terapéutico. Estoy aquí para brindarte apoyo emocional, escucharte y ayudarte a navegar tus emociones. ¿En qué puedo ayudarte hoy?';
    }

    // Fuera de ámbito solo en casos claros: preguntas puramente informativas o tecnología.
    // No ser estricto: si mezcla tema externo con cómo se siente, el modelo ya responde con naturalidad.
    const offTopicPatterns = [
      /(?:qué|que) es\s+(?:react|react native|un framework)/i,
      /react\s*native|programación|framework\s+de|tecnología\s+(?:de|para)/i,
      /^cuál es la capital\s/i
    ];
    const wellnessKeywords = /(?:emoción|sentir|ansiedad|tristeza|estrés|bienestar|terapia|apoyo|miedo|enojo|depresión|preocupación|me hace|me siento|estoy)/i;
    const looksLikeOffTopic = offTopicPatterns.some(p => p.test(content));
    const hasWellnessContext = wellnessKeywords.test(content);
    if (looksLikeOffTopic && !hasWellnessContext) {
      return 'Ese tema no es en lo que mejor te acompaño; mi espacio es cómo te sientes y tu bienestar. ¿Cómo estás hoy o qué te gustaría compartir?';
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
    
    // Contar finish reasons
    const reason = stats.finishReason || 'unknown';
    this.tokenStats.finishReasons[reason] = (this.tokenStats.finishReasons[reason] || 0) + 1;
    
    // Log cada 10 requests o si hay un problema
    if (this.tokenStats.totalRequests % 10 === 0 || !stats.hasContent) {
      this.logEstadisticasTokens();
    }
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

  shouldIncludeTechnique(analisisEmocional, analisisContextual, mensaje) {
    // Solo incluir técnicas si el usuario las solicita explícitamente
    const contenido = mensaje?.content?.toLowerCase() || '';
    
    // Patrones que indican solicitud explícita de técnicas
    const solicitudTecnica = /(?:técnica|tecnica|herramienta|estrategia|método|metodo|ejercicio|actividad|qué.*puedo.*hacer|como.*puedo|ayuda.*con|quiero.*aprender|enseñame|muestrame|dame.*una|recomiendame|sugerime|necesito.*una|puedes.*darme|ayudame.*con)/i.test(contenido);
    
    // Solo incluir si hay solicitud explícita
    return solicitudTecnica;
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