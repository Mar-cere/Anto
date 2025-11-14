/**
 * Servicio de OpenAI - Gestiona la generación de respuestas con GPT-4 y análisis contextual
 */
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
  DEFAULT_VALUES,
  EMOTIONAL_COHERENCE_PATTERNS,
  EMOTIONAL_COHERENCE_PHRASES,
  ERROR_MESSAGES,
  GENERIC_RESPONSE_PATTERNS,
  GREETING_VARIATIONS,
  MESSAGE_INTENTS,
  OPENAI_MODEL,
  PENALTIES,
  RESPONSE_LENGTHS,
  TEMPERATURES,
  THRESHOLDS,
  TIME_PERIODS
} from '../constants/openai.js';
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

    // Dimensiones de análisis terapéutico
    this.ANALYSIS_DIMENSIONS = {
      EMOTIONAL: ['reconocimiento', 'regulación', 'expresión'],
      COGNITIVE: ['pensamientos', 'creencias', 'sesgos'],
      BEHAVIORAL: ['patrones', 'estrategias', 'cambios'],
      RELATIONAL: ['vínculos', 'comunicación', 'límites']
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

      if (contenidoNormalizado.length > 2000) {
        throw new Error('Mensaje inválido: el contenido excede el límite de 2000 caracteres');
      }

      // Validar API key antes de continuar
      if (!validateApiKey() || !openai) {
        throw new Error('OPENAI_API_KEY no está configurada. Configura esta variable de entorno en Render.');
      }

      // 1. Análisis Completo (en paralelo para optimizar rendimiento)
      const [
        analisisEmocional,
        analisisContextual,
        perfilUsuario,
        registroTerapeutico
      ] = await Promise.all([
        emotionalAnalyzer.analyzeEmotion(contenidoNormalizado),
        contextAnalyzer.analizarMensaje({ ...mensaje, content: contenidoNormalizado }),
        personalizationService.getUserProfile(mensaje.userId).catch(() => null),
        TherapeuticRecord.findOne({ userId: mensaje.userId }).catch(() => null)
      ]);

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
          memory: memoriaContextual
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

      // 5. Validar y Mejorar Respuesta
      const respuestaValidada = await this.validarYMejorarRespuesta(
        respuestaGenerada,
        {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          profile: perfilUsuario
        }
      );

      // 6. Actualizar Registros
      // Primero crear y guardar el mensaje del asistente
      const assistantMessage = new Message({
        userId: mensaje.userId,
        conversationId: mensaje.conversationId,
        content: respuestaValidada,
        role: 'assistant',
        metadata: {
          timestamp: new Date(),
          type: 'text',
          status: 'sent',
          context: {
            emotional: analisisEmocional,
            contextual: analisisContextual
          }
        }
      });
      await assistantMessage.save();

      // Luego actualizar los registros en paralelo
      await Promise.all([
        this.actualizarRegistros(mensaje.userId, {
          mensaje,
          respuesta: respuestaValidada,
          analisis: {
            emotional: analisisEmocional,
            contextual: analisisContextual
          }
        }),
        progressTracker.trackProgress(mensaje.userId, {
          message: mensaje,
          response: respuestaValidada,
          analysis: analisisEmocional
        }),
        goalTracker.updateProgress(mensaje.userId, {
          message: mensaje,
          response: respuestaValidada,
          context: analisisContextual
        }),
        Conversation.findByIdAndUpdate(mensaje.conversationId, { 
          lastMessage: assistantMessage._id 
        })
      ]);

      return {
        content: respuestaValidada,
        context: {
          emotional: analisisEmocional,
          contextual: analisisContextual,
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
    const userStyle = contexto.profile?.communicationPreferences || DEFAULT_VALUES.COMMUNICATION_STYLE;

    const systemMessage = `Eres Anto, un asistente terapéutico profesional y empático.

CONTEXTO ACTUAL:
- Momento del día: ${timeOfDay}
      - Estado emocional: ${contexto.emotional?.mainEmotion || DEFAULT_VALUES.EMOTION} (intensidad: ${contexto.emotional?.intensity || DEFAULT_VALUES.INTENSITY})
- Temas recurrentes: ${contexto.memory?.recurringThemes?.join(', ') || 'ninguno'}
- Estilo comunicativo preferido: ${userStyle}
- Fase terapéutica: ${contexto.therapeutic?.currentPhase || DEFAULT_VALUES.PHASE}
- Última interacción: ${contexto.memory?.lastInteraction || 'ninguna'}

DIRECTRICES:
1. Mantén un tono ${userStyle} y profesional
2. Adapta la respuesta al estado emocional actual
3. Considera el historial y contexto previo
4. Evita repeticiones exactas de respuestas anteriores
5. Prioriza la validación emocional cuando sea apropiado
6. Incluye elementos de apoyo concretos y sugerencias útiles

ESTRUCTURA DE RESPUESTA:
1. Reconocimiento específico de la situación/emoción
2. Validación o normalización cuando sea apropiado
3. Elemento de apoyo o sugerencia concreta
4. Pregunta exploratoria o invitación a profundizar`;

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

    // Agregar última interacción si existe
    if (contexto.memory?.lastInteraction) {
      messages.push({
        role: 'assistant',
        content: contexto.memory.lastInteraction
      });
    }

    // Agregar alerta de crisis si es necesario
    if (contexto.emotional?.requiresUrgentCare || contexto.contextual?.intencion?.tipo === MESSAGE_INTENTS.CRISIS) {
      messages.push({
        role: 'system',
        content: 'IMPORTANTE: Usuario en posible estado de crisis. Priorizar contención y seguridad.'
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

    // Validar si es genérica
    if (this.esRespuestaGenerica(respuestaMejorada)) {
      respuestaMejorada = this.expandirRespuesta(respuestaMejorada);
    }
    
    // Validar y ajustar coherencia emocional
    if (!this.esCoherenteConEmocion(respuestaMejorada, contexto.emotional)) {
      respuestaMejorada = this.ajustarCoherenciaEmocional(respuestaMejorada, contexto.emotional);
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

      // Si la emoción principal está presente, asegurar que la respuesta sea coherente
      if (mainEmotion && EMOTIONAL_COHERENCE_PHRASES[mainEmotion]) {
        const frasesClave = EMOTIONAL_COHERENCE_PHRASES[mainEmotion];
        const tieneCoherencia = frasesClave.some(frase => 
          respuesta.toLowerCase().includes(frase.toLowerCase())
        );

        if (!tieneCoherencia) {
          // Ajustar la respuesta para incluir reconocimiento emocional
          const fraseInicial = frasesClave[Math.floor(Math.random() * frasesClave.length)];
          respuesta = `${fraseInicial}. ${respuesta}`;
        }
      }

      // Ajustar tono según intensidad emocional
      if (intensity >= THRESHOLDS.INTENSITY_HIGH) {
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
    
    // Asegurar un tono más empático y contenedor para emociones intensas
    if (!respuesta.includes('Entiendo que')) {
      return `Entiendo que esto es importante para ti. ${respuesta}`;
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
   * Reduce respuestas muy largas manteniendo las primeras oraciones
   * @param {string} respuesta - Respuesta original
   * @returns {string} Respuesta reducida
   */
  reducirRespuesta(respuesta) {
    if (!respuesta) return ERROR_MESSAGES.DEFAULT_FALLBACK;
    
    const oraciones = respuesta.split(/[.!?]+/).filter(s => s.trim());
    if (oraciones.length <= 3) return respuesta;
    
    return oraciones.slice(0, 3).join('. ').trim() + '.';
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
}

export default new OpenAIService(); 