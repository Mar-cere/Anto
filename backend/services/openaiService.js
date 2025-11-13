/**
 * Servicio de OpenAI - Gestiona la generación de respuestas con GPT-4 y análisis contextual
 */
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import TherapeuticRecord from '../models/TherapeuticRecord.js';
import contextAnalyzer from './contextAnalyzer.js';
import emotionalAnalyzer from './emotionalAnalyzer.js';
import goalTracker from './goalTracker.js';
import memoryService from './memoryService.js';
import personalizationService from './personalizationService.js';
import progressTracker from './progressTracker.js';
import responseGenerator from './responseGenerator.js';

dotenv.config();

// Validar que la API key esté configurada
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY no está configurada en las variables de entorno');
  console.error('💡 Configura OPENAI_API_KEY en tu archivo .env o en las variables de entorno de Render');
  console.error('💡 Puedes obtener tu API key en: https://platform.openai.com/account/api-keys');
}

// Cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Constantes de longitud de respuesta (tokens)
const RESPONSE_LENGTHS = {
  SHORT: 200,    // Mínimo para respuestas completas
  MEDIUM: 300,   // Para respuestas más elaboradas
  LONG: 400      // Para situaciones que requieren más detalle
};

const emotionalPatterns = {
  anxiety: {
    patterns: /(?:ansie(?:dad|oso)|nervios|inquiet(?:o|ud)|preocupa(?:do|ción)|angustia)/i,
    responses: {
      immediate: "técnicas de respiración y grounding",
      followUp: "exploración de desencadenantes",
      tools: ["respiración 4-7-8", "5-4-3-2-1 sensorial", "mindfulness rápido"]
    }
  },
  depression: {
    patterns: /(?:triste(?:za)?|deprimi(?:do|da)|sin energía|desánimo|desmotiva(?:do|da)|solo|soledad)/i,
    responses: {
      immediate: "validación y activación conductual",
      followUp: "estructura y rutinas diarias",
      tools: ["pequeñas metas", "registro de logros", "actividades placenteras"]
    }
  },
  anger: {
    patterns: /(?:enoja(?:do|da)|ira|rabia|molest(?:o|a)|frustrad(?:o|a)|impotencia)/i,
    responses: {
      immediate: "técnicas de regulación emocional",
      followUp: "análisis de disparadores",
      tools: ["tiempo fuera", "expresión regulada", "reencuadre"]
    }
  },
  crisis: {
    patterns: /(?:crisis|emergencia|suicid(?:a|o)|no puedo más|ayuda urgente|desesperado)/i,
    responses: {
      immediate: "contención inmediata y evaluación de riesgo",
      followUp: "plan de seguridad",
      tools: ["contactos de emergencia", "recursos inmediatos", "plan de crisis"]
    }
  }
};

const analyzeEmotionalContent = (message) => {
  const analysis = {
    primaryEmotion: null,
    intensity: 0,
    requiresUrgentCare: false,
    suggestedTools: [],
    followUpNeeded: false
  };

  for (const [emotion, data] of Object.entries(emotionalPatterns)) {
    if (data.patterns.test(message.content)) {
      analysis.primaryEmotion = emotion;
      analysis.suggestedTools = data.responses.tools;
      analysis.followUpNeeded = true;
      
      if (emotion === 'crisis') {
        analysis.requiresUrgentCare = true;
        analysis.intensity = 10;
      }
    }
  }

  return analysis;
};

const analyzeConversationState = async (conversationHistory) => {
  try {
    // Estados de conversación predefinidos
    const conversationPhases = {
      INITIAL: 'inicial',
      EXPLORATION: 'exploración',
      INSIGHT: 'comprensión',
      TOOL_LEARNING: 'aprendizaje',
      PRACTICE: 'práctica',
      FOLLOW_UP: 'seguimiento'
    };

    // Si no hay historial suficiente, retornar estado inicial
    if (!conversationHistory || conversationHistory.length < 3) {
      return {
        phase: conversationPhases.INITIAL,
        recurringThemes: [],
        progress: 'iniciando',
        needsReframing: false,
        needsStabilization: false,
        needsResourceBuilding: true
      };
    }

    // Analizar últimos mensajes para identificar temas recurrentes
    const recentMessages = conversationHistory.slice(-5);
    const themes = new Set();
    let emotionalInstability = 0;
    let resourceMentions = 0;

    recentMessages.forEach(msg => {
      // Detectar temas emocionales
      if (/(?:ansie|triste|deprimi|angustia|miedo|preocupa)/i.test(msg.content)) {
        themes.add('emocional');
        emotionalInstability++;
      }
      // Detectar temas de relaciones
      if (/(?:familia|amigos|pareja|relación)/i.test(msg.content)) {
        themes.add('relaciones');
      }
      // Detectar temas de trabajo/estudio
      if (/(?:trabajo|estudio|escuela|universidad)/i.test(msg.content)) {
        themes.add('ocupacional');
      }
      // Detectar menciones de herramientas o técnicas
      if (/(?:respiración|meditación|ejercicio|técnica)/i.test(msg.content)) {
        resourceMentions++;
      }
    });

    // Determinar fase de la conversación
    let currentPhase;
    if (conversationHistory.length <= 3) {
      currentPhase = conversationPhases.INITIAL;
    } else if (themes.size >= 2) {
      currentPhase = conversationPhases.EXPLORATION;
    } else if (resourceMentions > 0) {
      currentPhase = conversationPhases.TOOL_LEARNING;
    } else {
      currentPhase = conversationPhases.FOLLOW_UP;
    }

    // Evaluar necesidades específicas
    const needsReframing = emotionalInstability > 2;
    const needsStabilization = emotionalInstability > 3;
    const needsResourceBuilding = resourceMentions < 2;

    // Determinar progreso
    let progress;
    if (resourceMentions > 2) {
      progress = 'aplicando herramientas';
    } else if (themes.size > 0) {
      progress = 'identificando patrones';
    } else {
      progress = 'explorando';
    }

    return {
      phase: currentPhase,
      recurringThemes: Array.from(themes),
      progress,
      needsReframing,
      needsStabilization,
      needsResourceBuilding
    };

  } catch (error) {
    console.error('Error analizando estado de conversación:', error);
    // Retornar estado por defecto en caso de error
    return {
      phase: 'inicial',
      recurringThemes: [],
      progress: 'iniciando',
      needsReframing: false,
      needsStabilization: false,
      needsResourceBuilding: true
    };
  }
};

const determineResponseLength = (messageIntent, emotionalContext) => {
  // Mensajes emocionales o de ayuda necesitan un poco más de espacio
  if (messageIntent.intent === 'EMOTIONAL_SUPPORT' || 
      messageIntent.intent === 'SEEKING_HELP') {
    return 'MEDIUM';
  }
  
  // Para crisis o situaciones urgentes
  if (messageIntent.intent === 'CRISIS') {
    return 'LONG';
  }

  // Por defecto, mantener respuestas cortas
  return 'SHORT';
};

const analyzeMessageContext = async (message, conversationHistory) => {
  try {
    const contextPrompt = {
      role: 'system',
      content: `Analiza el mensaje y responde con un objeto JSON simple.
      IMPORTANTE: SOLO devuelve el JSON, sin texto adicional.
      
      Formato requerido:
      {
        "emotion": "alegría|tristeza|enojo|neutral|preocupación|etc",
        "intensity": 1-10,
        "topic": "tema principal",
        "urgent": true|false
      }`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        contextPrompt,
        {
          role: 'user',
          content: message.content
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: "json_object" }
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completion.choices[0].message.content.trim());
    } catch (parseError) {
      console.error('Error en el parsing inicial:', completion.choices[0].message.content);
      return getDefaultContext();
    }

    // Validar y sanitizar la respuesta
    return {
      emotionalContext: {
        mainEmotion: String(parsedResponse.emotion || EMOTION_NEUTRAL),
        intensity: Number(parsedResponse.intensity) || INTENSITY_DEFAULT
      },
      topics: [String(parsedResponse.topic || TOPIC_GENERAL)],
      urgent: Boolean(parsedResponse.urgent)
    };

  } catch (error) {
    console.error('Error en análisis de contexto:', error);
    return getDefaultContext();
  }
};

// Constantes de valores por defecto
const EMOTION_NEUTRAL = 'neutral';
const INTENSITY_DEFAULT = 5;
const TOPIC_GENERAL = 'general';

// Helper: obtener contexto por defecto
const getDefaultContext = () => ({
  emotionalContext: {
    mainEmotion: EMOTION_NEUTRAL,
    intensity: INTENSITY_DEFAULT
  },
  topics: [TOPIC_GENERAL],
  urgent: false
});

// Helper: obtener contexto emocional por defecto
const getDefaultEmotionalContext = () => ({
  mainEmotion: EMOTION_NEUTRAL,
  intensity: INTENSITY_DEFAULT,
  sentiment: EMOTION_NEUTRAL
});

// Helper: obtener contexto completo por defecto
const getDefaultFullContext = () => ({
  emotionalTrend: {
    latest: EMOTION_NEUTRAL,
    history: []
  },
  patterns: [],
  goals: []
});

const GREETING_VARIATIONS = {
  morning: [
    "¡Buenos días! ¿Cómo puedo ayudarte hoy?",
    "¡Hola! ¿Cómo amaneciste hoy?",
    "Buenos días, ¿cómo te sientes hoy?"
  ],
  afternoon: [
    "¡Hola! ¿Cómo va tu día?",
    "¡Buenas tardes! ¿En qué puedo ayudarte?",
    "¡Hola! ¿Cómo te sientes en este momento?"
  ],
  evening: [
    "¡Buenas tardes! ¿Cómo ha ido tu día?",
    "¡Hola! ¿Cómo te encuentras esta tarde?",
    "¡Hola! ¿Qué tal va todo?"
  ],
  night: [
    "¡Buenas noches! ¿Cómo te sientes?",
    "¡Hola! ¿Cómo ha ido tu día?",
    "¡Buenas noches! ¿En qué puedo ayudarte?"
  ]
};

const generateEnhancedResponse = async (message, context, strategy) => {
  try {
    // Obtener preferencias personalizadas
    const userPreferences = await personalizationService.getPersonalizedPrompt(context.userId);
    
    const promptTemplate = {
      supportive: `Eres Anto, un asistente terapéutico profesional y empático.
      
      CONTEXTO ACTUAL:
      - Momento del día: ${getTimeOfDay()}
      - Estado emocional previo: ${context.emotionalTrend?.latest || 'neutral'}
      - Preferencias del usuario: ${userPreferences.style}
      - Longitud preferida: ${userPreferences.responseLength}
      - Últimos temas tratados: ${context.topics?.join(', ') || 'ninguno'}
      
      DIRECTRICES DE RESPUESTA:
      1. NUNCA repitas exactamente la misma respuesta
      2. Adapta el tono según el contexto emocional
      3. Personaliza la respuesta según el momento del día
      4. Mantén continuidad con conversaciones previas
      5. Usa variedad en expresiones y estructura
      
      ESTRUCTURA REQUERIDA:
      1. Reconocimiento específico de la situación
      2. Elemento de apoyo o validación
      3. Pregunta exploratoria O sugerencia concreta
      
      EJEMPLOS DE VARIACIÓN:
      - "Veo que esto te está afectando profundamente. Es normal sentirse así y quiero que sepas que estoy aquí para escucharte. ¿Qué te ayudaría en este momento?"
      - "Entiendo tu frustración y es completamente válida. Me gustaría ayudarte a explorar esto con más profundidad. ¿Podrías contarme qué te llevó a sentirte así?"
      - "Gracias por compartir esto conmigo. Es importante expresar cómo nos sentimos y estoy aquí para escucharte. ¿Qué necesitas en este momento?"`,

      empathetic: `Eres Anto, profesional en apoyo emocional.
      
      CONTEXTO:
      - Hora del día: ${new Date().getHours()}
      - Emoción detectada: ${context.emotionalTrend?.latest || 'neutral'}
      
      REQUISITOS:
      1. Cada respuesta debe ser única
      2. Adaptar el lenguaje al estado emocional
      3. Incluir elementos de apoyo concretos
      4. Mantener un tono cálido pero profesional
      
      NO PERMITIDO:
      - Respuestas genéricas
      - Repetir exactamente frases anteriores
      - Ignorar el contexto emocional`,

      casual: `Eres Anto, asistente profesional.
      
      CONTEXTO:
      - Momento: ${getTimeOfDay()}
      - Interacción: ${context.lastInteraction ? 'seguimiento' : 'nueva'}
      
      ENFOQUE:
      1. Respuestas naturales y variadas
      2. Mantener profesionalismo
      3. Adaptar al contexto temporal
      4. Evitar repeticiones`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: promptTemplate[strategy.approach] || promptTemplate.casual
        },
        {
          role: 'user',
          content: message.content
        }
      ],
      temperature: 0.8, // Aumentado para más variabilidad
      max_tokens: RESPONSE_LENGTHS[strategy.responseLength] || RESPONSE_LENGTHS.SHORT,
      presence_penalty: 0.8, // Aumentado para evitar repeticiones
      frequency_penalty: 0.8 // Aumentado para favorecer variedad en el lenguaje
    });

    let response = completion.choices[0].message.content.trim();
    
    // Verificación de calidad de respuesta
    if (response.split(' ').length < 10 || 
        response === context.lastResponse || 
        isGenericResponse(response)) {
      return generateFallbackResponse(context);
    }

    return response;
  } catch (error) {
    console.error('Error en generateEnhancedResponse:', error);
    return generateFallbackResponse(context);
  }
};

// Función auxiliar para verificar si una respuesta es demasiado genérica
const isGenericResponse = (response) => {
  const genericPatterns = [
    /^(Entiendo|Comprendo) (como|cómo) te sientes/i,
    /^(Me gustaría|Quisiera) (saber|entender) más/i,
    /^¿Podrías contarme más\??$/i
  ];
  
  return genericPatterns.some(pattern => pattern.test(response));
};

// Función para generar respuestas de respaldo variadas
const generateFallbackResponse = (context) => {
  return responseGenerator.generateResponse(context, 'fallback');
};

// Helper: obtener período del día
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'mañana';
  if (hour >= 12 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 22) return 'noche';
  return 'noche';
};

const updateTherapeuticRecord = async (userId, sessionData) => {
  try {
    const newSession = {
      timestamp: new Date(),
      emotion: {
        name: sessionData.emotion?.name || EMOTION_NEUTRAL,
        intensity: sessionData.emotion?.intensity || INTENSITY_DEFAULT
      },
      tools: [],
      progress: 'en_curso'
    };

    // Solución: Usar $setOnInsert para valores iniciales
    const updateResult = await TherapeuticRecord.findOneAndUpdate(
      { userId },
      {
        $push: { sessions: newSession },
          $set: {
            'currentStatus.emotion': sessionData.emotion?.name || EMOTION_NEUTRAL
            // Mongoose timestamps maneja updatedAt automáticamente
          },
        $setOnInsert: {
          userId,
          activeTools: [],
            progressMetrics: {
            emotionalStability: INTENSITY_DEFAULT,
            toolMastery: 1,
            engagementLevel: INTENSITY_DEFAULT
          }
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    // Agregar seguimiento de progreso
    await progressTracker.trackProgress(userId, sessionData);
    
    return updateResult;
  } catch (error) {
    console.error('Error en updateTherapeuticRecord:', error);
    return null;
  }
};

const generateAIResponse = async (message, conversationHistory, userId) => {
  try {
    const emotionalAnalysis = await emotionalAnalyzer.analyzeEmotion(message);
    const userContext = await memoryService.getRelevantContext(userId, message.content);
    const conversationState = await contextAnalyzer.analyzeMessageIntent(message, conversationHistory);
    const userPreferences = await personalizationService.getPersonalizedPrompt(userId);
    
    const response = await generateEnhancedResponse(message, {
      ...userContext,
      ...conversationState,
      preferences: userPreferences
    }, {
      approach: emotionalAnalysis?.emotion ? 'empathetic' : 'casual',
      responseLength: userPreferences.responseLength || 'MEDIUM'
    });

    // Actualizar progreso y objetivos
    await Promise.all([
      progressTracker.trackProgress(userId, message),
      goalTracker.updateGoalProgress(userId, message, emotionalAnalysis),
      updateTherapeuticRecord(userId, {
        emotion: emotionalAnalysis,
        tools: emotionalAnalysis?.responses?.tools || [],
        progress: conversationState.progress
      })
    ]);

    // Validar y ajustar coherencia emocional (se hace en validarYMejorarRespuesta)

    // 1. Crear y guardar el mensaje del asistente
    const assistantMessage = new Message({
      userId: userId,
      conversationId: message.conversationId,
      content: response,
      role: 'assistant',
      metadata: {
        timestamp: new Date(),
        type: 'text',
        status: 'sent',
        context: {
          emotional: emotionalAnalysis,
          contextual: conversationState
        }
      }
    });
    await assistantMessage.save();

    // 2. Actualizar la conversación con el _id del mensaje
    await Conversation.findByIdAndUpdate(
      message.conversationId,
      { lastMessage: assistantMessage._id }
    );

    return {
      content: response,
      context: {
        ...userContext,
        emotionalContext: emotionalAnalysis
      }
    };
  } catch (error) {
    console.error('Error en generateAIResponse:', error);
    return {
      content: await responseGenerator.generateFallbackResponse(),
      context: getDefaultFullContext()
    };
  }
};

class OpenAIService {
  constructor() {
    // Constantes de configuración
    this.RESPONSE_LENGTHS = RESPONSE_LENGTHS;
    this.EMOTION_NEUTRAL = EMOTION_NEUTRAL;
    this.INTENSITY_DEFAULT = INTENSITY_DEFAULT;

    // Dimensiones de análisis terapéutico
    this.ANALYSIS_DIMENSIONS = {
      EMOTIONAL: ['reconocimiento', 'regulación', 'expresión'],
      COGNITIVE: ['pensamientos', 'creencias', 'sesgos'],
      BEHAVIORAL: ['patrones', 'estrategias', 'cambios'],
      RELATIONAL: ['vínculos', 'comunicación', 'límites']
    };

    this.defaultResponse = {
      content: "Lo siento, hubo un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?",
      context: {
        intent: "ERROR",
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

  async generarRespuesta(mensaje, contexto = {}) {
    try {
      if (!mensaje?.content) {
        throw new Error('Mensaje inválido o vacío');
      }

      // 1. Análisis Completo
      const [
        analisisEmocional,
        analisisContextual,
        perfilUsuario,
        registroTerapeutico
      ] = await Promise.all([
        emotionalAnalyzer.analyzeEmotion(mensaje.content),
        contextAnalyzer.analizarMensaje(mensaje),
        personalizationService.getUserProfile(mensaje.userId),
        TherapeuticRecord.findOne({ userId: mensaje.userId })
      ]);

      // 2. Obtener Memoria y Contexto
      const memoriaContextual = await memoryService.getRelevantContext(
        mensaje.userId,
        mensaje.content,
        {
          emotional: analisisEmocional,
          contextual: analisisContextual
        }
      );

      // 3. Construir Prompt Contextualizado
      const prompt = await this.construirPromptContextualizado(
        mensaje,
        {
          emotional: analisisEmocional,
          contextual: analisisContextual,
          profile: perfilUsuario,
          therapeutic: registroTerapeutico,
          memory: memoriaContextual
        }
      );

      // 4. Generar Respuesta con OpenAI
      // Validar API key antes de hacer la petición
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY no está configurada. Configura esta variable de entorno en Render.');
      }

      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: prompt.systemMessage
            },
            ...prompt.contextMessages,
            {
              role: 'user',
              content: mensaje.content
            }
          ],
          temperature: this.determinarTemperatura(analisisContextual),
          max_tokens: this.determinarLongitudRespuesta(analisisContextual),
          presence_penalty: 0.6,
          frequency_penalty: 0.6
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

      const respuestaGenerada = completion.choices[0].message.content;

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

  async construirPromptContextualizado(mensaje, contexto) {
    const timeOfDay = this.getTimeOfDay();
    const userStyle = contexto.profile?.communicationPreferences || 'neutral';

    const systemMessage = `Eres Anto, un asistente terapéutico profesional y empático.

CONTEXTO ACTUAL:
- Momento del día: ${timeOfDay}
      - Estado emocional: ${contexto.emotional?.mainEmotion || EMOTION_NEUTRAL} (intensidad: ${contexto.emotional?.intensity || INTENSITY_DEFAULT})
- Temas recurrentes: ${contexto.memory?.recurringThemes?.join(', ') || 'ninguno'}
- Estilo comunicativo preferido: ${userStyle}
- Fase terapéutica: ${contexto.therapeutic?.currentPhase || 'inicial'}
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

  async generarMensajesContexto(contexto) {
    const messages = [];

    if (contexto.memory?.lastInteraction) {
      messages.push({
        role: 'assistant',
        content: contexto.memory.lastInteraction
      });
    }

    if (contexto.emotional?.requiresUrgentCare) {
      messages.push({
        role: 'system',
        content: 'IMPORTANTE: Usuario en posible estado de crisis. Priorizar contención y seguridad.'
      });
    }

    return messages;
  }

  determinarTemperatura(contexto) {
    if (contexto.urgent) return 0.3; // Más preciso para situaciones urgentes
    if (contexto.intent === 'EMOTIONAL_SUPPORT') return 0.7; // Más empático
    return 0.5; // Valor por defecto
  }

  determinarLongitudRespuesta(contexto) {
    if (contexto.urgent) return this.RESPONSE_LENGTHS.LONG;
    if (contexto.intent === 'GREETING') return this.RESPONSE_LENGTHS.SHORT;
    return this.RESPONSE_LENGTHS.MEDIUM;
  }

  async validarYMejorarRespuesta(respuesta, contexto) {
    // Validar si es genérica
    if (this.esRespuestaGenerica(respuesta)) {
      respuesta = this.expandirRespuesta(respuesta);
    }
    
    // Validar y ajustar coherencia emocional
    if (!this.esCoherenteConEmocion(respuesta, contexto.emotional)) {
      respuesta = this.ajustarCoherenciaEmocional(respuesta, contexto.emotional);
    }
    
    return respuesta;
  }

  esRespuestaGenerica(respuesta) {
    const patronesGenericos = [
      /^(Entiendo|Comprendo) (como|cómo) te sientes\.?$/i,
      /^¿Podrías contarme más\??$/i,
      /^Me gustaría saber más\.?$/i
    ];

    return patronesGenericos.some(patron => patron.test(respuesta));
  }

  esCoherenteConEmocion(respuesta, contextoEmocional) {
    const emocion = contextoEmocional?.mainEmotion?.toLowerCase();
    if (!emocion || emocion === 'neutral') return true;

    const patronesEmocion = {
      tristeza: /(acompaño|entiendo tu tristeza|momento difícil)/i,
      ansiedad: /(respira|un paso a la vez|manejar esta ansiedad)/i,
      enojo: /(frustración|válido sentirse así|entiendo tu molestia)/i
    };

    return patronesEmocion[emocion]?.test(respuesta) ?? true;
  }

  ajustarCoherenciaEmocional(respuesta, contextoEmocional) {
    try {
      if (!respuesta || !contextoEmocional) {
        return respuesta;
      }

      const { mainEmotion, intensity } = contextoEmocional;
      
      // Verificar coherencia emocional básica
      const coherenciaEmocional = {
        tristeza: ['comprendo tu tristeza', 'entiendo que te sientas así', 'es normal sentirse triste'],
        ansiedad: ['entiendo tu preocupación', 'es normal sentirse ansioso', 'respiremos juntos'],
        enojo: ['entiendo tu frustración', 'es válido sentirse enojado', 'hablemos de lo que te molesta'],
        alegría: ['me alegro por ti', 'es genial escuchar eso', 'comparto tu alegría'],
        neutral: ['entiendo', 'te escucho', 'cuéntame más']
      };

      // Si la emoción principal está presente, asegurar que la respuesta sea coherente
      if (mainEmotion && coherenciaEmocional[mainEmotion]) {
        const frasesClave = coherenciaEmocional[mainEmotion];
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
      if (intensity >= 7) {
        respuesta = this.ajustarTonoAlta(respuesta);
      } else if (intensity <= 3) {
        respuesta = this.ajustarTonoBaja(respuesta);
      }

      return respuesta;
    } catch (error) {
      console.error('Error ajustando coherencia emocional:', error);
      return respuesta; // Devolver respuesta original si hay error
    }
  }

  ajustarTonoAlta(respuesta) {
    // Asegurar un tono más empático y contenedor para emociones intensas
    if (!respuesta.includes('Entiendo que')) {
      respuesta = `Entiendo que esto es importante para ti. ${respuesta}`;
    }
    return respuesta;
  }

  ajustarTonoBaja(respuesta) {
    // Mantener un tono más ligero y exploratorio para emociones de baja intensidad
    if (!respuesta.includes('Me gustaría')) {
      respuesta = `Me gustaría explorar esto contigo. ${respuesta}`;
    }
    return respuesta;
  }

  expandirRespuesta(respuesta) {
    // Expandir respuestas muy cortas
    return `${respuesta} ¿Te gustaría que exploremos esto con más detalle?`;
  }

  reducirRespuesta(respuesta) {
    // Reducir respuestas muy largas
    const oraciones = respuesta.split(/[.!?]+/);
    return oraciones.slice(0, 3).join('. ') + '.';
  }

  getDefaultResponse() {
    return "Entiendo. ¿Podrías contarme más sobre eso?";
  }

  async actualizarRegistros(userId, data) {
    try {
      await TherapeuticRecord.findOneAndUpdate(
        { userId },
        {
          $push: {
            sessions: {
              timestamp: new Date(),
              emotion: data.analisis.emotional,
              content: {
                message: data.mensaje.content,
                response: data.respuesta
              },
              analysis: data.analisis
            }
          },
          $set: {
            'currentStatus.emotion': data.analisis.emotional.mainEmotion
            // Mongoose timestamps maneja updatedAt automáticamente
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error actualizando registros:', error);
    }
  }

  async manejarError(error, mensaje) {
    console.error('Error en OpenAI Service:', error);
    
    // Mensaje de error más específico según el tipo
    let errorMessage = "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo o contacta a soporte si el problema persiste.";
    
    if (error.status === 401 || error.code === 'invalid_api_key') {
      errorMessage = "Error de configuración del servicio. Por favor, contacta a soporte.";
      console.error('❌ Error de autenticación: La API key de OpenAI es incorrecta o no está configurada');
    } else if (error.status === 429) {
      errorMessage = "El servicio está temporalmente ocupado. Por favor, intenta de nuevo en unos momentos.";
    } else if (error.status >= 500) {
      errorMessage = "El servicio está experimentando problemas técnicos. Por favor, intenta de nuevo más tarde.";
    }
    
    return {
      content: errorMessage,
      context: {
        error: true,
        errorType: error.name,
        errorCode: error.code || error.status,
        errorMessage: error.message,
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
   * @param {Object} userPreferences - Preferencias del usuario (opcional)
   * @returns {string} Saludo personalizado
   */
  async generarSaludoPersonalizado(userPreferences = {}) {
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    
    if (hour >= 12 && hour < 18) {
      timeOfDay = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      timeOfDay = 'evening';
    } else if (hour >= 22 || hour < 5) {
      timeOfDay = 'night';
    }

    const greetings = GREETING_VARIATIONS[timeOfDay] || GREETING_VARIATIONS.morning;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

export default new OpenAIService(); 