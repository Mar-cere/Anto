/**
 * Servicio de OpenAI - Gestiona la generación de respuestas con GPT-5 Mini y análisis contextual
 */
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
    generateCrisisMessage,
    generateCrisisSystemPrompt
} from '../constants/crisis.js';
import {
    ANALYSIS_DIMENSIONS,
    buildPersonalizedPrompt,
    DEFAULT_VALUES,
    EMOTIONAL_COHERENCE_PATTERNS,
    EMOTIONAL_COHERENCE_PHRASES,
    ERROR_MESSAGES,
    GENERIC_RESPONSE_PATTERNS,
    GREETING_VARIATIONS,
    HISTORY_LIMITS,
    MESSAGE_INTENTS,
    OPENAI_MODEL,
    PROMPT_CONFIG,
    RESPONSE_LENGTHS,
    TEMPERATURES,
    THRESHOLDS,
    TIME_PERIODS,
    VALIDATION_LIMITS
} from '../constants/openai.js';
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
      // Validar mensaje
      if (!mensaje?.content) {
        throw new Error('Mensaje inválido: falta el contenido');
      }

      // Normalizar y validar contenido
      const contenidoNormalizado = mensaje.content.trim();
      if (!contenidoNormalizado) {
        throw new Error('Mensaje inválido: el contenido está vacío');
      }

      if (contenidoNormalizado.length > VALIDATION_LIMITS.MAX_INPUT_CHARACTERS) {
        throw new Error(`Mensaje inválido: el contenido excede el límite de ${VALIDATION_LIMITS.MAX_INPUT_CHARACTERS} caracteres`);
      }

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

      // Si no viene el análisis contextual, hacerlo
      if (!analisisContextual) {
        analisisContextual = await contextAnalyzer.analizarMensaje({ ...mensaje, content: contenidoNormalizado });
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

      // 3. Construir Prompt Contextualizado
      const prompt = await this.construirPromptContextualizado(
        { ...mensaje, content: contenidoNormalizado },
        {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          profile: perfilUsuario,
          therapeutic: registroTerapeutico,
          memory: memoriaContextual,
          history: contexto.history || [], // Incluir historial de conversación si está disponible
          currentMessage: contenidoNormalizado, // Para selección inteligente de historial
          currentConversationId: contexto.currentConversationId // NUEVO: Para referencias a conversaciones anteriores
        }
      );

      // 4. Generar Respuesta con OpenAI

      // MEJORA: Intentar obtener respuesta del caché si existe
      const cacheKey = this.generateResponseCacheKey(contenidoNormalizado, analisisEmocional, analisisContextual);
      let cachedResponse = null;
      try {
        cachedResponse = await cacheService.get(cacheKey);
        if (cachedResponse && this.isCachedResponseValid(cachedResponse, analisisContextual)) {
          console.log('[OpenAI] ✅ Respuesta obtenida del caché');
          // Adaptar respuesta cacheada al contexto actual
          const adaptedResponse = this.adaptCachedResponse(cachedResponse.response, analisisContextual, contenidoNormalizado);
          return adaptedResponse;
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
   * Construye un prompt contextualizado para OpenAI basado en el mensaje y contexto del usuario
   * @param {Object} mensaje - Mensaje del usuario
   * @param {Object} contexto - Contexto completo (emotional, contextual, profile, therapeutic, memory)
   * @returns {Promise<Object>} Objeto con systemMessage y contextMessages
   */
  async construirPromptContextualizado(mensaje, contexto) {
    const timeOfDay = this.getTimeOfDay();
    
    // Extraer valores del contexto con valores por defecto
    const emotion = contexto.emotional?.mainEmotion || DEFAULT_VALUES.EMOTION;
    const intensity = contexto.emotional?.intensity || DEFAULT_VALUES.INTENSITY;
    const phase = contexto.therapeutic?.currentPhase || DEFAULT_VALUES.PHASE;
    const intent = contexto.contextual?.intencion?.tipo || MESSAGE_INTENTS.EMOTIONAL_SUPPORT;
    const communicationStyle = contexto.profile?.communicationPreferences || DEFAULT_VALUES.COMMUNICATION_STYLE;
    const recurringThemes = contexto.memory?.recurringThemes || [];
    const lastInteraction = contexto.memory?.lastInteraction || 'ninguna';

    // NUEVO: Obtener tendencias de sesión
    const sessionTrends = sessionEmotionalMemory.analyzeTrends(mensaje.userId);
    
    // NUEVO: Obtener estilo de respuesta del usuario
    const responseStyle = contexto.profile?.preferences?.responseStyle || 'balanced';
    
    // Construir prompt personalizado usando la función helper
    let systemMessage = buildPersonalizedPrompt({
      emotion,
      intensity,
      phase,
      intent,
      communicationStyle,
      timeOfDay,
      recurringThemes,
      lastInteraction,
      // NUEVOS PARÁMETROS
      subtype: contexto.emotional?.subtype,
      topic: contexto.emotional?.topic,
      sessionTrends: sessionTrends,
      responseStyle: responseStyle,
      // NUEVOS: Análisis psicológicos adicionales
      resistance: contexto.contextual?.resistance || null,
      relapseSigns: contexto.contextual?.relapseSigns || null,
      implicitNeeds: contexto.contextual?.implicitNeeds || null,
      strengths: contexto.contextual?.strengths || null,
      selfEfficacy: contexto.contextual?.selfEfficacy || null,
      socialSupport: contexto.contextual?.socialSupport || null,
      // NUEVO: Distorsiones cognitivas
      cognitiveDistortions: contexto.contextual?.cognitiveDistortions || null,
      primaryDistortion: contexto.contextual?.primaryDistortion || null,
      distortionIntervention: contexto.contextual?.distortionIntervention || null
    });

    // OPTIMIZACIÓN: Agregar resumen del contexto conversacional (más conciso)
    const contextMessages = await this.generarMensajesContexto({
      ...contexto,
      currentMessage: mensaje.content
    });
    
    if (contextMessages.length > 0) {
      const conversationSummary = this.generateConversationSummary(contextMessages, contexto);
      // OPTIMIZACIÓN: Resumen más conciso (máximo 100 caracteres)
      const conciseSummary = conversationSummary.length > 100 
        ? conversationSummary.substring(0, 97) + '...'
        : conversationSummary;
      systemMessage += `\n\nCONTEXTO: ${conciseSummary}`;
      
      // Agregar instrucción solo si hay suficiente contexto
      if (contextMessages.length >= 2) {
        systemMessage += `\nRef: Usa referencias naturales cuando sea relevante.`;
      }
    }

    // OPTIMIZACIÓN: Agregar contexto de largo plazo solo si es relevante (más conciso)
    const longTermContext = await this.generateLongTermContext(mensaje.userId, {
      ...contexto,
      currentConversationId: contexto.currentConversationId || mensaje.conversationId
    });
    if (longTermContext && longTermContext.length > 0) {
      // Limitar contexto de largo plazo a 200 caracteres (aumentado para incluir referencias)
      const conciseLongTerm = longTermContext.length > 200
        ? longTermContext.substring(0, 197) + '...'
        : longTermContext;
      systemMessage += `\nMEMORIA: ${conciseLongTerm}`;
    }

    // Respuestas del onboarding inicial: usarlas para personalizar tono y enfoque del chat
    const onboarding = contexto.profile?.onboardingAnswers;
    if (onboarding && (onboarding.whatExpectFromApp || onboarding.whatToImproveOrWorkOn || onboarding.typeOfSpecialist)) {
      const parts = [];
      if (onboarding.whatExpectFromApp) parts.push(`Qué espera de la app: ${onboarding.whatExpectFromApp}`);
      if (onboarding.whatToImproveOrWorkOn) parts.push(`Qué le gustaría mejorar o trabajar: ${onboarding.whatToImproveOrWorkOn}`);
      if (onboarding.typeOfSpecialist) parts.push(`Tipo de apoyo que busca: ${onboarding.typeOfSpecialist}`);
      if (parts.length > 0) {
        systemMessage += `\n\nINFORMACIÓN QUE EL USUARIO COMPARTIÓ AL INICIO (úsala para personalizar tu tono y enfoque):\n${parts.join('\n')}`;
      }
    }

    // Si hay una crisis detectada, agregar el prompt de crisis al inicio
    if (contexto.crisis?.riskLevel) {
      const crisisPrompt = generateCrisisSystemPrompt(
        contexto.crisis.riskLevel,
        contexto.crisis.country || 'GENERAL'
      );
      systemMessage = `${crisisPrompt}\n\n---\n\n${systemMessage}`;
    }

    return {
      systemMessage,
      contextMessages
    };
  }

  /**
   * Selecciona mensajes relevantes del historial basándose en el contexto actual
   * @param {Array} history - Historial completo de mensajes
   * @param {Object} currentContext - Contexto actual (emotional, contextual)
   * @returns {Array} Mensajes seleccionados (máximo HISTORY_LIMITS.MESSAGES_IN_PROMPT)
   */
  selectRelevantHistory(history, currentContext) {
    if (!history || history.length === 0) return [];
    
    const currentEmotion = currentContext?.emotional?.mainEmotion;
    const currentTopic = currentContext?.emotional?.topic || currentContext?.contextual?.tema;
    const currentContent = currentContext?.currentMessage?.toLowerCase() || '';
    const currentIntensity = currentContext?.emotional?.intensity || 5;
    
    // OPTIMIZACIÓN: Extraer palabras clave más inteligentes (sustantivos y verbos importantes)
    const stopWords = new Set(['que', 'qué', 'como', 'cómo', 'para', 'por', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante', 'mediante', 'según', 'ante', 'bajo', 'contra', 'hacia', 'tras', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'tengo', 'tiene', 'tienes', 'tenemos', 'tienen', 'estoy', 'está', 'estás', 'estamos', 'están', 'soy', 'es', 'eres', 'somos', 'son', 'fue', 'fueron', 'ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber', 'poder', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'hablar', 'llevar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'convertir', 'ganar', 'formar', 'traer', 'partir', 'morir', 'aceptar', 'realizar', 'suponer', 'comprender', 'lograr', 'explicar', 'preguntar', 'tocar', 'reconocer', 'estudiar', 'terminar', 'alcanzar', 'nacer', 'dirigir', 'correr', 'utilizar', 'pagar', 'ayudar', 'gustar', 'jugar', 'escuchar', 'cumplir', 'ofrecer', 'descubrir', 'levantar', 'intentar', 'usar', 'dejar', 'continuar', 'acabar', 'comprobar', 'vender', 'construir', 'elegir', 'actuar', 'lograr', 'ocurrir', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'convertir', 'ganar', 'formar', 'traer', 'partir', 'morir', 'aceptar', 'realizar', 'suponer', 'comprender', 'lograr', 'explicar', 'preguntar', 'tocar', 'reconocer', 'estudiar', 'terminar', 'alcanzar', 'nacer', 'dirigir', 'correr', 'utilizar', 'pagar', 'ayudar', 'gustar', 'jugar', 'escuchar', 'cumplir', 'ofrecer', 'descubrir', 'levantar', 'intentar', 'usar', 'dejar', 'continuar', 'acabar', 'comprobar', 'vender', 'construir', 'elegir', 'actuar']);
    const keywords = currentContent
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()))
      .slice(0, 10); // Limitar a 10 palabras clave más relevantes
    
    // OPTIMIZACIÓN: Calcular relevancia mejorada
    const scoredMessages = history.map((msg, index) => {
      let score = 0;
      const msgContent = (msg.content || '').toLowerCase();
      const recencyWeight = 1 - (index / history.length); // Más reciente = mayor peso
      
      // Priorizar mensajes más recientes (peso exponencial)
      score += recencyWeight * 2;
      
      // Priorizar mensajes del usuario (más importantes para contexto)
      if (msg.role === 'user') {
        score += 3;
      }
      
      // Priorizar mensajes con misma emoción (muy relevante)
      if (currentEmotion) {
        const emotionMatch = msgContent.includes(currentEmotion.toLowerCase());
        if (emotionMatch) {
          score += 5;
          // Bonus si la intensidad también es similar
          const msgIntensity = msg.metadata?.context?.emotional?.intensity || 5;
          if (Math.abs(msgIntensity - currentIntensity) <= 2) {
            score += 2;
          }
        }
      }
      
      // Priorizar mensajes con mismo tema (muy relevante)
      if (currentTopic) {
        const topicMatch = msgContent.includes(currentTopic.toLowerCase());
        if (topicMatch) {
          score += 4;
        }
      }
      
      // Priorizar mensajes con palabras clave similares (coincidencias exactas)
      const matchingKeywords = keywords.filter(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(msgContent);
      }).length;
      score += matchingKeywords * 1.5;
      
      // Priorizar mensajes que mencionan temas relacionados (coincidencias contextuales)
      const relatedTerms = ['trabajo', 'familia', 'relación', 'amigo', 'pareja', 'estudio', 'salud', 'ansiedad', 'tristeza', 'enojo', 'miedo', 'alegría', 'problema', 'situación', 'momento', 'día', 'semana', 'tiempo'];
      const matchingTerms = relatedTerms.filter(term => {
        const currentHasTerm = new RegExp(`\\b${term}\\b`, 'i').test(currentContent);
        const msgHasTerm = new RegExp(`\\b${term}\\b`, 'i').test(msgContent);
        return currentHasTerm && msgHasTerm;
      }).length;
      score += matchingTerms * 2;
      
      // Penalizar mensajes muy cortos (menos informativos)
      if (msgContent.length < 20) {
        score -= 1;
      }
      
      // Bonus para mensajes que son preguntas/respuestas relacionadas
      if ((currentContent.includes('?') && msgContent.includes('?')) ||
          (currentContent.includes('?') && msg.role === 'assistant')) {
        score += 1.5;
      }
      
      return { ...msg, _relevanceScore: score };
    });
    
    // Ordenar por relevancia y tomar los mejores
    const selected = scoredMessages
      .sort((a, b) => b._relevanceScore - a._relevanceScore)
      .slice(0, HISTORY_LIMITS.MESSAGES_IN_PROMPT)
      .sort((a, b) => {
        // Mantener orden cronológico dentro de los seleccionados
        const indexA = history.findIndex(m => m === a);
        const indexB = history.findIndex(m => m === b);
        return indexA - indexB;
      })
      .map(({ _relevanceScore, ...msg }) => msg); // Remover score temporal
    
    // Asegurar que siempre incluimos el último mensaje del asistente si existe (para coherencia)
    const lastAssistant = history.filter(m => m.role === 'assistant').pop();
    if (lastAssistant && !selected.some(m => m === lastAssistant)) {
      selected.pop(); // Remover el menos relevante
      selected.push(lastAssistant);
      selected.sort((a, b) => {
        const indexA = history.findIndex(m => m === a);
        const indexB = history.findIndex(m => m === b);
        return indexA - indexB;
      });
    }
    
    return selected;
  }

  /**
   * Genera contexto de largo plazo basado en el perfil del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} contexto - Contexto actual
   * @returns {Promise<string>} Resumen del contexto a largo plazo
   */
  async generateLongTermContext(userId, contexto) {
    try {
      if (!userId) return null;

      // Obtener perfil del usuario (usar el que ya está en contexto si está disponible)
      let userProfile = contexto.profile;
      if (!userProfile) {
        userProfile = await personalizationService.getUserProfile(userId).catch(() => null);
      }

      if (!userProfile) return null;

      const contextParts = [];
      
      // NUEVO: Información de género para tratamiento personalizado
      const gender = userProfile.personalInfo?.gender;
      const pronouns = userProfile.personalInfo?.preferredPronouns;
      if (gender && gender !== 'prefer_not_to_say' && gender !== null) {
        const genderMap = {
          'male': 'masculino',
          'female': 'femenino',
          'other': 'otro'
        };
        const pronounMap = {
          'he/him': 'él',
          'she/her': 'ella',
          'they/them': 'elle',
          'other': 'otro'
        };
        const genderText = genderMap[gender] || gender;
        const pronounText = pronouns ? pronounMap[pronouns] || pronouns : null;
        if (pronounText) {
          contextParts.push(`Tratamiento: Usa pronombres ${pronounText} (${genderText}).`);
        } else {
          contextParts.push(`Tratamiento: Género ${genderText}.`);
        }
      } else {
        // Si no hay género definido, usar lenguaje neutro
        contextParts.push(`Tratamiento: Usa lenguaje neutro si no conoces el género. Evita asumir género.`);
      }
      
      // NUEVO: Referencias a conversaciones anteriores (última conversación previa)
      try {
        const Message = (await import('../models/Message.js')).default;
        const Conversation = (await import('../models/Conversation.js')).default;
        
        // Obtener la conversación actual
        const currentConversationId = contexto.currentConversationId;
        
        if (currentConversationId) {
          // Buscar la última conversación previa (diferente a la actual)
          const previousConversation = await Conversation.findOne({
            userId,
            _id: { $ne: currentConversationId }
          })
          .sort({ updatedAt: -1 })
          .lean();
          
          if (previousConversation) {
            // Obtener el último mensaje del usuario de esa conversación anterior
            const lastUserMessage = await Message.findOne({
              conversationId: previousConversation._id,
              role: 'user'
            })
            .select('content metadata.context.emotional createdAt')
            .sort({ createdAt: -1 })
            .lean();
            
            if (lastUserMessage && lastUserMessage.metadata?.context?.emotional) {
              const prevEmotion = lastUserMessage.metadata.context.emotional.mainEmotion;
              const prevIntensity = lastUserMessage.metadata.context.emotional.intensity || 5;
              const daysAgo = Math.floor((Date.now() - new Date(lastUserMessage.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              
              // Solo incluir si fue reciente (últimos 7 días) y había estado emocional negativo
              if (daysAgo <= 7 && prevIntensity >= 5 && ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'].includes(prevEmotion)) {
                const emotionMap = {
                  'tristeza': 'triste',
                  'ansiedad': 'ansioso',
                  'enojo': 'enojado',
                  'miedo': 'asustado',
                  'verguenza': 'avergonzado',
                  'culpa': 'culpable'
                };
                const emotionText = emotionMap[prevEmotion] || prevEmotion;
                contextParts.push(`Última conversación (hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}): estaba ${emotionText} (intensidad ${prevIntensity}/10). Puedes hacer referencia natural si es relevante.`);
              }
            }
          }
        }
      } catch (error) {
        console.warn('[OpenAIService] Error obteniendo conversaciones anteriores:', error);
        // Continuar sin referencias a conversaciones anteriores
      }

      // Temas recurrentes
      const recurringTopics = [];
      if (userProfile.commonTopics && Array.isArray(userProfile.commonTopics)) {
        const topTopics = userProfile.commonTopics
          .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
          .slice(0, 3)
          .map(t => t.topic);
        if (topTopics.length > 0) {
          recurringTopics.push(...topTopics);
        }
      }
      // También verificar en patrones.temas
      if (userProfile.patrones?.temas && Array.isArray(userProfile.patrones.temas)) {
        const patternTopics = userProfile.patrones.temas
          .sort((a, b) => (b.frecuencia || 0) - (a.frecuencia || 0))
          .slice(0, 3)
          .map(t => t.tema);
        patternTopics.forEach(topic => {
          if (!recurringTopics.includes(topic)) {
            recurringTopics.push(topic);
          }
        });
      }
      if (recurringTopics.length > 0) {
        contextParts.push(`El usuario frecuentemente menciona: ${recurringTopics.slice(0, 3).join(', ')}.`);
      }

      // Preferencias de comunicación
      const commStyle = userProfile.preferences?.communicationStyle || 
                       userProfile.communicationPreferences || 
                       'neutral';
      if (commStyle !== 'neutral') {
        contextParts.push(`Prefiere un estilo de comunicación: ${commStyle}.`);
      }

      // Progreso terapéutico
      if (userProfile.metadata?.progresoGeneral) {
        const progress = userProfile.metadata.progresoGeneral;
        if (progress > 0) {
          contextParts.push(`Ha mostrado progreso general: ${progress}%.`);
        }
      }

      // Estrategias de afrontamiento efectivas
      if (userProfile.copingStrategies && Array.isArray(userProfile.copingStrategies)) {
        const effectiveStrategies = userProfile.copingStrategies
          .filter(s => s.effectiveness >= 7 && s.usageCount > 0)
          .sort((a, b) => b.effectiveness - a.effectiveness)
          .slice(0, 2)
          .map(s => s.strategy);
        if (effectiveStrategies.length > 0) {
          contextParts.push(`Estrategias que le han funcionado bien: ${effectiveStrategies.join(', ')}.`);
        }
      }

      // Emociones predominantes
      if (userProfile.emotionalPatterns?.predominantEmotions && 
          Array.isArray(userProfile.emotionalPatterns.predominantEmotions)) {
        const topEmotions = userProfile.emotionalPatterns.predominantEmotions
          .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
          .slice(0, 2)
          .map(e => e.emotion);
        if (topEmotions.length > 0) {
          contextParts.push(`Emociones que experimenta frecuentemente: ${topEmotions.join(', ')}.`);
        }
      }

      return contextParts.length > 0 ? contextParts.join(' ') : null;
    } catch (error) {
      console.error('[OpenAIService] Error generando contexto de largo plazo:', error);
      return null;
    }
  }

  /**
   * Genera un resumen del contexto conversacional actual
   * @param {Array} history - Historial de mensajes seleccionados
   * @param {Object} contexto - Contexto completo
   * @returns {string} Resumen del contexto conversacional
   */
  generateConversationSummary(history, contexto) {
    if (!history || history.length === 0) {
      return 'Conversación nueva.';
    }
    
    // OPTIMIZACIÓN: Resumen más conciso y eficiente
    const userMessages = history.filter(m => m.role === 'user');
    const assistantMessages = history.filter(m => m.role === 'assistant');
    
    // Detectar tema principal
    const currentTopic = contexto.emotional?.topic || contexto.contextual?.tema || 'general';
    const currentEmotion = contexto.emotional?.mainEmotion || 'neutral';
    const intensity = contexto.emotional?.intensity || 5;
    
    // Determinar progreso de la conversación (más conciso)
    let progress = history.length >= 8 ? 'profundo' : history.length >= 4 ? 'explorando' : 'inicio';
    
    // Detectar si el usuario está repitiendo un tema
    const topics = userMessages.map(m => m.content?.toLowerCase() || '').join(' ');
    const topicWords = topics.split(/\s+/).filter(w => w.length > 4);
    const topicCounts = {};
    topicWords.forEach(word => {
      topicCounts[word] = (topicCounts[word] || 0) + 1;
    });
    const repeatedTopics = Object.entries(topicCounts)
      .filter(([_, count]) => count >= 2)
      .map(([word]) => word)
      .slice(0, 2);
    
    // OPTIMIZACIÓN: Resumen más conciso (máximo 100 caracteres)
    let summary = `${progress}|${currentTopic}|${currentEmotion}(${intensity})`;
    
    if (repeatedTopics.length > 0) {
      summary += `|${repeatedTopics.join(',')}`;
    }
    
    // Limitar longitud total
    if (summary.length > 100) {
      summary = summary.substring(0, 97) + '...';
    }
    
    return summary;
  }

  /**
   * Genera mensajes de contexto adicionales para el prompt de OpenAI
   * @param {Object} contexto - Contexto completo del usuario
   * @returns {Promise<Array>} Array de mensajes de contexto
   */
  async generarMensajesContexto(contexto) {
    const messages = [];

    // Agregar historial de conversación con selección inteligente
    if (contexto.history && Array.isArray(contexto.history) && contexto.history.length > 0) {
      // Seleccionar mensajes relevantes en lugar de solo los últimos
      const historialRelevante = this.selectRelevantHistory(contexto.history, {
        emotional: contexto.emotional,
        contextual: contexto.contextual,
        currentMessage: contexto.currentMessage
      });
      
      historialRelevante.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
    }

    // Agregar última interacción si existe y no está ya en el historial
    if (contexto.memory?.lastInteraction && !messages.some(m => m.content === contexto.memory.lastInteraction)) {
      messages.push({
        role: 'assistant',
        content: contexto.memory.lastInteraction
      });
    }

    // Agregar alerta de crisis si es necesario
    if (contexto.emotional?.requiresUrgentCare || contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS || contexto.crisis?.riskLevel) {
      const riskLevel = contexto.crisis?.riskLevel || 'MEDIUM';
      const country = contexto.crisis?.country || 'GENERAL';
      const crisisMessage = generateCrisisMessage(riskLevel, country);
      
      messages.push({
        role: 'system',
        content: `🚨 SITUACIÓN DE CRISIS DETECTADA (Nivel: ${riskLevel})\n\n${crisisMessage}\n\nIMPORTANTE: Prioriza la seguridad del usuario. Proporciona recursos de emergencia de forma clara y directa.`
      });
    }

    return messages;
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
    
    // Asegurar que la respuesta siempre comience con mayúscula
    if (respuestaMejorada && respuestaMejorada.length > 0) {
      respuestaMejorada = respuestaMejorada.charAt(0).toUpperCase() + respuestaMejorada.slice(1);
    }
    
    return respuestaMejorada;
  }

  /**
   * Genera una clave de caché para respuestas basada en el mensaje y contexto
   * @param {string} messageContent - Contenido del mensaje
   * @param {Object} emotionalAnalysis - Análisis emocional
   * @param {Object} contextualAnalysis - Análisis contextual
   * @returns {string} Clave de caché
   */
  generateResponseCacheKey(messageContent, emotionalAnalysis, contextualAnalysis) {
    // Normalizar mensaje (minúsculas, sin espacios extra)
    const normalizedMessage = messageContent.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Extraer características clave para el caché
    const emotion = emotionalAnalysis?.mainEmotion || 'neutral';
    const intent = contextualAnalysis?.intencion?.tipo || 'EMOTIONAL_SUPPORT';
    const topic = emotionalAnalysis?.topic || contextualAnalysis?.tema || 'general';
    
    // Crear hash simple basado en características
    const cacheData = {
      message: normalizedMessage.substring(0, 100), // Primeros 100 caracteres
      emotion,
      intent,
      topic
    };
    
    return cacheService.generateKey('response', cacheData);
  }

  /**
   * Valida si una respuesta cacheada sigue siendo apropiada
   * @param {Object} cachedResponse - Respuesta cacheada
   * @param {Object} currentContext - Contexto actual
   * @returns {boolean} true si es válida
   */
  isCachedResponseValid(cachedResponse, currentContext) {
    if (!cachedResponse || !cachedResponse.response) return false;
    
    // Verificar que no sea muy antigua (máximo 30 minutos)
    const age = Date.now() - (cachedResponse.timestamp || 0);
    if (age > 1800000) return false; // 30 minutos
    
    // Verificar que el contexto emocional sea similar
    const cachedEmotion = cachedResponse.emotional?.mainEmotion;
    const currentEmotion = currentContext?.emotional?.mainEmotion || currentContext?.mainEmotion;
    if (cachedEmotion && currentEmotion && cachedEmotion !== currentEmotion) {
      // Si la emoción cambió significativamente, no usar caché
      return false;
    }
    
    return true;
  }

  /**
   * Adapta una respuesta cacheada al contexto actual
   * @param {string} cachedResponse - Respuesta cacheada
   * @param {Object} currentContext - Contexto actual
   * @param {string} currentMessage - Mensaje actual del usuario
   * @returns {string} Respuesta adaptada
   */
  adaptCachedResponse(cachedResponse, currentContext, currentMessage) {
    // Si la respuesta cacheada es muy genérica, usarla tal cual
    if (this.esRespuestaGenerica(cachedResponse)) {
      return cachedResponse;
    }
    
    // Adaptar ligeramente si es necesario
    let adapted = cachedResponse;
    
    // Si el contexto tiene urgencia alta, asegurar que la respuesta refleje eso
    if (currentContext?.urgencia === 'ALTA') {
      if (!adapted.toLowerCase().includes('importante') && !adapted.toLowerCase().includes('urgente')) {
        adapted = `Es importante que sepas: ${adapted}`;
      }
    }
    
    return adapted;
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
   * Reduce respuestas muy largas manteniendo las primeras oraciones más importantes
   * @param {string} respuesta - Respuesta original
   * @returns {string} Respuesta reducida
   */
  reducirRespuesta(respuesta) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;
    
    // Dividir en oraciones
    const oraciones = respuesta.split(/[.!?]+/).filter(s => s.trim());
    
    // Si tiene 2 o menos oraciones y está dentro del límite, retornar tal cual
    if (oraciones.length <= VALIDATION_LIMITS.MAX_SENTENCES_REDUCE && respuesta.length <= THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
      return respuesta;
    }
    
    // Tomar solo las primeras N oraciones (más importantes)
    const oracionesReducidas = oraciones.slice(0, VALIDATION_LIMITS.MAX_SENTENCES_REDUCE);
    let respuestaReducida = oracionesReducidas.join('. ').trim();
    
    // Si aún es muy larga, truncar por caracteres de forma inteligente
    if (respuestaReducida.length > THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
      // Truncar en el último espacio antes del límite para no cortar palabras
      const truncado = respuestaReducida.substring(0, THRESHOLDS.MAX_CHARACTERS_RESPONSE - PROMPT_CONFIG.TRUNCATE_BUFFER);
      const ultimoEspacio = truncado.lastIndexOf(' ');
      respuestaReducida = ultimoEspacio > 0 
        ? truncado.substring(0, ultimoEspacio).trim()
        : truncado.trim();
      
      // Asegurar que termine correctamente
      if (!respuestaReducida.endsWith('.') && !respuestaReducida.endsWith('!') && !respuestaReducida.endsWith('?')) {
        respuestaReducida += PROMPT_CONFIG.TRUNCATE_ELLIPSIS;
      }
    } else {
      // Agregar punto final si no lo tiene
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
    if (!analisisEmocional || typeof analisisEmocional !== 'object') {
      return {
        mainEmotion: DEFAULT_VALUES.EMOTION,
        intensity: DEFAULT_VALUES.INTENSITY
      };
    }

    // Valores válidos del enum según el modelo Message
    const emocionesValidas = ['tristeza', 'ansiedad', 'enojo', 'alegria', 'miedo', 'verguenza', 'culpa', 'esperanza', 'neutral'];
    
    // Normalizar mainEmotion
    let mainEmotion = analisisEmocional.mainEmotion || DEFAULT_VALUES.EMOTION;
    if (!emocionesValidas.includes(mainEmotion)) {
      console.warn(`⚠️ Emoción no válida detectada: "${mainEmotion}". Usando valor por defecto: "${DEFAULT_VALUES.EMOTION}"`);
      mainEmotion = DEFAULT_VALUES.EMOTION;
    }

    // Normalizar intensity
    let intensity = analisisEmocional.intensity;
    if (typeof intensity !== 'number' || isNaN(intensity)) {
      intensity = DEFAULT_VALUES.INTENSITY;
    } else {
      // Asegurar que esté en el rango válido
      intensity = Math.max(VALIDATION_LIMITS.INTENSITY_MIN, Math.min(VALIDATION_LIMITS.INTENSITY_MAX, intensity));
    }

    // Construir objeto normalizado
    const normalizado = {
      mainEmotion,
      intensity
    };

    // Agregar campos opcionales si existen
    if (Array.isArray(analisisEmocional.secondary)) {
      normalizado.secondary = analisisEmocional.secondary;
    }
    if (analisisEmocional.category) {
      normalizado.category = analisisEmocional.category;
    }
    if (typeof analisisEmocional.confidence === 'number') {
      normalizado.confidence = analisisEmocional.confidence;
    }
    if (typeof analisisEmocional.requiresAttention === 'boolean') {
      normalizado.requiresAttention = analisisEmocional.requiresAttention;
    }

    return normalizado;
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
    const content = analisisContextual?.content || '';
    
    // Detectar preguntas sobre el sistema
    const isSystemQuestion = /(?:quien.*eres|qué.*haces|qué.*es|qué.*sos|como.*funciona|para.*qué.*sirve|qué.*puedes.*hacer|qué.*ofreces)/i.test(content);
    if (isSystemQuestion) {
      return 'Soy Anto, tu asistente terapéutico. Estoy aquí para brindarte apoyo emocional, escucharte y ayudarte a navegar tus emociones. ¿En qué puedo ayudarte hoy?';
    }
    
    // Detectar saludos
    const isGreeting = /^(hola|hi|hello|buenos.*d[ií]as|buenas.*tardes|buenas.*noches|qué.*tal)$/i.test(content.trim());
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