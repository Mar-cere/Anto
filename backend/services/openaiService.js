/**
 * Servicio de OpenAI - Gestiona la generación de respuestas con GPT-4 y análisis contextual
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
  PENALTIES,
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
import contextAnalyzer from './contextAnalyzer.js';
import emotionalAnalyzer from './emotionalAnalyzer.js';
import goalTracker from './goalTracker.js';
import memoryService from './memoryService.js';
import personalizationService from './personalizationService.js';
import progressTracker from './progressTracker.js';

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
   * Genera una respuesta contextualizada usando OpenAI GPT-4
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
          history: contexto.history || [] // Incluir historial de conversación si está disponible
        }
      );

      // 4. Generar Respuesta con OpenAI

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
          temperature: this.determinarTemperatura(analisisContextual),
          max_tokens: this.determinarLongitudRespuesta(analisisContextual),
          presence_penalty: PENALTIES.DEFAULT,
          frequency_penalty: PENALTIES.DEFAULT
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

      const respuestaGenerada = completion.choices[0]?.message?.content?.trim();

      // Validar que se generó una respuesta
      if (!respuestaGenerada) {
        throw new Error('No se pudo generar una respuesta válida desde OpenAI');
      }

      // 5. Seleccionar técnica terapéutica apropiada
      const selectedTechnique = selectAppropriateTechnique(
        analisisEmocional?.mainEmotion || DEFAULT_VALUES.EMOTION,
        analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY,
        registroTerapeutico?.currentPhase || DEFAULT_VALUES.PHASE,
        analisisContextual?.intencion?.tipo || null
      );

      // 6. Validar y Mejorar Respuesta
      const respuestaValidada = await this.validarYMejorarRespuesta(
        respuestaGenerada,
        {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          profile: perfilUsuario
        }
      );

      // 7. Agregar técnica terapéutica a la respuesta si es apropiado
      let respuestaFinal = respuestaValidada;
      if (selectedTechnique && this.shouldIncludeTechnique(analisisEmocional, analisisContextual)) {
        const techniqueText = formatTechniqueForResponse(selectedTechnique);
        // Agregar técnica al final de la respuesta, pero mantenerla concisa
        respuestaFinal = `${respuestaValidada}${techniqueText}`;
        
        // Si la respuesta final es demasiado larga, truncar la técnica
        if (respuestaFinal.length > THRESHOLDS.MAX_CHARACTERS_RESPONSE) {
          const maxLength = THRESHOLDS.MAX_CHARACTERS_RESPONSE - 100; // Dejar espacio para truncar
          respuestaFinal = respuestaValidada + '\n\n💡 **Técnica sugerida:** ' + selectedTechnique.name + 
            '\n\n' + (selectedTechnique.description || '') + 
            '\n\n*Puedes preguntarme más sobre esta técnica si te interesa.*';
        }
      }

      // 8. Actualizar Registros
      // Normalizar objeto emocional para asegurar compatibilidad con el esquema
      const emocionalNormalizado = this.normalizarAnalisisEmocional(analisisEmocional);
      
      // Primero crear y guardar el mensaje del asistente
      let assistantMessage;
      try {
        assistantMessage = new Message({
          userId: mensaje.userId,
          conversationId: mensaje.conversationId,
          content: respuestaFinal,
          role: 'assistant',
          metadata: {
            timestamp: new Date(),
            type: 'text',
            status: 'sent',
            context: {
              emotional: emocionalNormalizado,
              contextual: analisisContextual,
              therapeutic: selectedTechnique ? {
                technique: selectedTechnique.name,
                type: selectedTechnique.type,
                category: selectedTechnique.category
              } : undefined
            }
          }
        });
        await assistantMessage.save();
      } catch (saveError) {
        // Si hay error de validación del enum, intentar guardar sin el campo emocional problemático
        if (saveError.name === 'ValidationError' && saveError.errors?.['metadata.context.emotional.mainEmotion']) {
          console.warn('⚠️ Error de validación de enum emocional. Guardando sin contexto emocional:', saveError.message);
          assistantMessage = new Message({
            userId: mensaje.userId,
            conversationId: mensaje.conversationId,
            content: respuestaFinal,
            role: 'assistant',
            metadata: {
              timestamp: new Date(),
              type: 'text',
              status: 'sent',
              context: {
                emotional: {
                  mainEmotion: 'neutral',
                  intensity: emocionalNormalizado.intensity || DEFAULT_VALUES.INTENSITY
                },
                contextual: analisisContextual,
                therapeutic: selectedTechnique ? {
                  technique: selectedTechnique.name,
                  type: selectedTechnique.type,
                  category: selectedTechnique.category
                } : undefined
              }
            }
          });
          await assistantMessage.save();
        } else {
          throw saveError;
        }
      }

      // Luego actualizar los registros en paralelo
      await Promise.all([
        this.actualizarRegistros(mensaje.userId, {
          mensaje,
          respuesta: respuestaFinal,
          analisis: {
            emotional: analisisEmocional,
            contextual: analisisContextual
          }
        }),
        progressTracker.trackProgress(mensaje.userId, {
          message: mensaje,
          response: respuestaFinal,
          analysis: analisisEmocional
        }),
        goalTracker.updateProgress(mensaje.userId, {
          message: mensaje,
          response: respuestaFinal,
          context: analisisContextual
        }),
        Conversation.findByIdAndUpdate(mensaje.conversationId, { 
          lastMessage: assistantMessage._id 
        })
      ]);

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

    // Construir prompt personalizado usando la función helper
    let systemMessage = buildPersonalizedPrompt({
      emotion,
      intensity,
      phase,
      intent,
      communicationStyle,
      timeOfDay,
      recurringThemes,
      lastInteraction
    });

    // Si hay una crisis detectada, agregar el prompt de crisis al inicio
    if (contexto.crisis?.riskLevel) {
      const crisisPrompt = generateCrisisSystemPrompt(
        contexto.crisis.riskLevel,
        contexto.crisis.country || 'GENERAL'
      );
      systemMessage = `${crisisPrompt}\n\n---\n\n${systemMessage}`;
    }

    const contextMessages = await this.generarMensajesContexto(contexto);

    return {
      systemMessage,
      contextMessages
    };
  }

  /**
   * Genera mensajes de contexto adicionales para el prompt de OpenAI
   * @param {Object} contexto - Contexto completo del usuario
   * @returns {Promise<Array>} Array de mensajes de contexto
   */
  async generarMensajesContexto(contexto) {
    const messages = [];

    // Agregar historial de conversación reciente si está disponible
    if (contexto.history && Array.isArray(contexto.history) && contexto.history.length > 0) {
      // Tomar los últimos N mensajes del historial según el límite configurado
      const historialReciente = contexto.history.slice(-HISTORY_LIMITS.MESSAGES_IN_PROMPT);
      
      historialReciente.forEach(msg => {
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
   * @returns {number} Longitud en tokens
   */
  determinarLongitudRespuesta(contexto) {
    if (contexto.urgent || contexto.contextual?.urgencia === 'ALTA') {
      return RESPONSE_LENGTHS.LONG;
    }
    if (contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.GREETING) {
      return RESPONSE_LENGTHS.SHORT;
    }
    return RESPONSE_LENGTHS.MEDIUM;
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

    // Validar longitud máxima (caracteres y palabras)
    const caracteres = respuestaMejorada.length;
    const palabras = respuestaMejorada.split(/\s+/).filter(w => w.length > 0).length;
    
    if (caracteres > THRESHOLDS.MAX_CHARACTERS_RESPONSE || palabras > THRESHOLDS.MAX_WORDS_RESPONSE) {
      console.log(`📏 Respuesta demasiado larga (${caracteres} caracteres, ${palabras} palabras). Reduciendo...`);
      respuestaMejorada = this.reducirRespuesta(respuestaMejorada);
    }

    // Validar si es genérica
    if (this.esRespuestaGenerica(respuestaMejorada)) {
      respuestaMejorada = this.expandirRespuesta(respuestaMejorada);
    }
    
    // Validar y ajustar coherencia emocional
    if (!this.esCoherenteConEmocion(respuestaMejorada, contexto.emotional)) {
      respuestaMejorada = this.ajustarCoherenciaEmocional(respuestaMejorada, contexto.emotional);
    }
    
    // Validar longitud final después de ajustes
    const caracteresFinal = respuestaMejorada.length;
    const palabrasFinal = respuestaMejorada.split(/\s+/).filter(w => w.length > 0).length;
    
    if (caracteresFinal > THRESHOLDS.MAX_CHARACTERS_RESPONSE || palabrasFinal > THRESHOLDS.MAX_WORDS_RESPONSE) {
      console.log(`📏 Respuesta aún demasiado larga después de ajustes (${caracteresFinal} caracteres, ${palabrasFinal} palabras). Reduciendo nuevamente...`);
      respuestaMejorada = this.reducirRespuesta(respuestaMejorada);
    }
    
    return respuestaMejorada;
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

      const { mainEmotion, intensity } = contextoEmocional;
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
      if (intensity >= THRESHOLDS.INTENSITY_HIGH && !tieneReconocimiento) {
        respuesta = this.ajustarTonoAlta(respuesta);
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
   * @returns {string} Respuesta con tono más empático
   */
  ajustarTonoAlta(respuesta) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;
    
    const respuestaLower = respuesta.toLowerCase();
    
    // Verificar si ya tiene frases empáticas para evitar redundancia
    const tieneEmpatia = /(?:entiendo|comprendo|reconozco|veo|noto|siento|importante|difícil|complicado)/i.test(respuesta);
    
    // Asegurar un tono más empático y contenedor para emociones intensas
    if (!tieneEmpatia) {
      // Usar frases más variadas y naturales
      const frasesEmpaticas = [
        'Entiendo que esto es importante para ti.',
        'Comprendo que esto te afecta.',
        'Veo que estás pasando por un momento difícil.'
      ];
      const frase = frasesEmpaticas[Math.floor(Math.random() * frasesEmpaticas.length)];
      return `${frase} ${respuesta}`;
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
   * Determina si se debe incluir una técnica terapéutica en la respuesta
   * @param {Object} analisisEmocional - Análisis emocional del mensaje
   * @param {Object} analisisContextual - Análisis contextual del mensaje
   * @returns {boolean} true si se debe incluir la técnica
   */
  shouldIncludeTechnique(analisisEmocional, analisisContextual) {
    // No incluir técnicas en saludos simples
    if (analisisContextual?.intencion?.tipo === MESSAGE_INTENTS.GREETING) {
      return false;
    }

    // Incluir técnicas si la intensidad emocional es moderada o alta (5+)
    const intensity = analisisEmocional?.intensity || DEFAULT_VALUES.INTENSITY;
    if (intensity >= 5) {
      return true;
    }

    // Incluir técnicas si el usuario busca ayuda específica
    if (analisisContextual?.intencion?.tipo === MESSAGE_INTENTS.SEEKING_HELP || 
        analisisContextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS) {
      return true;
    }

    // No incluir técnicas si la emoción es neutral y la intensidad es baja
    const emotion = analisisEmocional?.mainEmotion || DEFAULT_VALUES.EMOTION;
    if (emotion === 'neutral' && intensity < 5) {
      return false;
    }

    // Por defecto, incluir técnicas para emociones negativas
    const negativeEmotions = ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'];
    return negativeEmotions.includes(emotion);
  }
}

export default new OpenAIService(); 