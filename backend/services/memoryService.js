/**
 * Servicio de Memoria - Gestiona el contexto, patrones e insights del usuario
 */
import mongoose from 'mongoose';
import UserInsight from '../models/UserInsight.js';

class MemoryService {
  constructor() {
    // Constantes de configuración
    this.INTENSITY_DEFAULT = 5;
    this.INTENSITY_HIGH_THRESHOLD = 7;
    this.INTENSITY_LOW_THRESHOLD = 4;
    this.EMOTION_NEUTRAL = 'neutral';
    this.INTERACTIONS_LIMIT = 50;
    this.DEFAULT_LIMIT = 10;
    
    // Períodos de interacción (24 horas)
    this.interactionPeriods = {
      MORNING: { start: 5, end: 11 },
      AFTERNOON: { start: 12, end: 17 },
      EVENING: { start: 18, end: 21 },
      NIGHT: { start: 22, end: 4 }
    };
    
    // Períodos de horario (en español)
    this.horarioPeriods = {
      mañana: { start: 5, end: 11 },
      tarde: { start: 12, end: 17 },
      noche: { start: 18, end: 21 },
      madrugada: { start: 22, end: 4 }
    };
  }
  
  // Helper: validar que el userId es válido
  isValidUserId(userId) {
    return userId && (
      typeof userId === 'string' || 
      userId instanceof mongoose.Types.ObjectId ||
      mongoose.Types.ObjectId.isValid(userId)
    );
  }
  
  // Helper: validar que el contenido es un string válido
  isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  
  // Helper: validar que es un array válido
  isValidArray(value) {
    return Array.isArray(value) && value.length > 0;
  }
  
  // Helper: validar que el mensaje tiene contenido válido
  isValidMessage(message) {
    return message && this.isValidString(message.content);
  }
  
  // Helper: obtener período del día desde una hora o timestamp
  getPeriodFromHour(hour, periods = this.interactionPeriods) {
    for (const [period, times] of Object.entries(periods)) {
      if (times.start <= times.end) {
        // Período normal (no cruza medianoche)
        if (hour >= times.start && hour <= times.end) {
          return period;
        }
      } else {
        // Período que cruza medianoche (ej: NIGHT: 22-4)
        if (hour >= times.start || hour <= times.end) {
          return period;
        }
      }
    }
    return 'NIGHT';
  }

  /**
   * Obtiene el contexto relevante para un usuario y mensaje
   * @param {string|ObjectId} userId - ID del usuario
   * @param {string} content - Contenido del mensaje
   * @param {Object} currentAnalysis - Análisis actual (opcional)
   * @returns {Promise<Object>} Contexto relevante con patrones, contexto actual e historial
   */
  async getRelevantContext(userId, content, currentAnalysis = {}) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      if (!this.isValidString(content)) {
        throw new Error('content válido es requerido');
      }
      
      const recentInteractions = await this.getRecentInteractions(userId);
      const interactionContext = this.analyzeInteractionContext(recentInteractions);
      const currentPeriod = this.getCurrentPeriod();

      return {
        patterns: {
          timing: interactionContext.timing || {},
          frequency: interactionContext.frequency || {},
          topics: interactionContext.topics || []
        },
        currentContext: {
          period: currentPeriod,
          analysis: currentAnalysis,
          recentTopics: this.extractRecentTopics(recentInteractions)
        },
        history: {
          lastInteraction: recentInteractions[0] || null,
          commonPatterns: this.findCommonPatterns(recentInteractions)
        }
      };
    } catch (error) {
      console.error('[MemoryService] Error obteniendo contexto:', error, { userId, content });
      return this.getDefaultContext();
    }
  }

  /**
   * Obtiene el período actual del día
   * @returns {string} Período actual (MORNING, AFTERNOON, EVENING, NIGHT)
   */
  getCurrentPeriod() {
    const hour = new Date().getHours();
    return this.getPeriodFromHour(hour);
  }

  /**
   * Obtiene las interacciones recientes de un usuario
   * @param {string|ObjectId} userId - ID del usuario
   * @param {number} limit - Límite de interacciones (opcional, por defecto 10)
   * @returns {Promise<Array>} Lista de interacciones ordenadas por timestamp descendente
   */
  async getRecentInteractions(userId, limit = this.DEFAULT_LIMIT) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      // Obtener interacciones del modelo UserInsight
      const userInsight = await UserInsight.findOne({ userId })
        .select('interactions')
        .lean();
      
      if (!userInsight || !this.isValidArray(userInsight.interactions)) {
        return [];
      }
      
      // Ordenar por timestamp descendente y limitar
      return userInsight.interactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('[MemoryService] Error obteniendo interacciones recientes:', error, { userId });
      return [];
    }
  }

  /**
   * Analiza el contexto de las interacciones (timing, frecuencia, temas)
   * @param {Array} interactions - Lista de interacciones
   * @returns {Object} Contexto analizado con timing, frecuencia y temas
   */
  analyzeInteractionContext(interactions) {
    const context = {
      timing: {},
      frequency: {
        daily: 0,
        weekly: 0
      },
      topics: []
    };

    if (!this.isValidArray(interactions)) {
      return context;
    }

    interactions.forEach(interaction => {
      if (interaction?.timestamp) {
        const hour = new Date(interaction.timestamp).getHours();
        const period = this.getPeriodFromHour(hour);
        context.timing[period] = (context.timing[period] || 0) + 1;
      }
    });

    return context;
  }

  /**
   * Extrae los temas recientes de las interacciones
   * @param {Array} interactions - Lista de interacciones
   * @returns {Array} Temas recientes únicos
   */
  extractRecentTopics(interactions) {
    const topics = new Set();
    
    if (!this.isValidArray(interactions)) {
      return [];
    }
    
    interactions.forEach(interaction => {
      if (interaction?.metadata?.topics && Array.isArray(interaction.metadata.topics)) {
        interaction.metadata.topics.forEach(topic => topics.add(topic));
      }
    });

    return Array.from(topics);
  }

  findCommonPatterns(interactions) {
    return {
      timePatterns: this.analyzeTimePatterns(interactions),
      topicPatterns: this.analyzeTopicPatterns(interactions),
      emotionalPatterns: this.analyzeEmotionalPatterns(interactions)
    };
  }

  /**
   * Analiza patrones de tiempo en las interacciones
   * @param {Array} interactions - Lista de interacciones
   * @returns {Object} Patrones de tiempo por hora
   */
  analyzeTimePatterns(interactions) {
    const patterns = {};
    
    if (!this.isValidArray(interactions)) {
      return patterns;
    }
    
    interactions.forEach(interaction => {
      if (interaction?.timestamp) {
        const hour = new Date(interaction.timestamp).getHours();
        patterns[hour] = (patterns[hour] || 0) + 1;
      }
    });

    return patterns;
  }

  /**
   * Analiza patrones de temas en las interacciones
   * @param {Array} interactions - Lista de interacciones
   * @returns {Object} Patrones de temas con frecuencia
   */
  analyzeTopicPatterns(interactions) {
    const topics = {};
    
    if (!this.isValidArray(interactions)) {
      return topics;
    }
    
    interactions.forEach(interaction => {
      if (interaction?.metadata?.topics && Array.isArray(interaction.metadata.topics)) {
        interaction.metadata.topics.forEach(topic => {
          topics[topic] = (topics[topic] || 0) + 1;
        });
      }
    });

    return topics;
  }

  /**
   * Analiza patrones emocionales en las interacciones
   * @param {Array} interactions - Lista de interacciones
   * @returns {Object} Patrones emocionales con frecuencia
   */
  analyzeEmotionalPatterns(interactions) {
    const emotions = {};
    
    if (!this.isValidArray(interactions)) {
      return emotions;
    }
    
    interactions.forEach(interaction => {
      if (interaction?.metadata?.emotional?.mainEmotion) {
        const emotion = interaction.metadata.emotional.mainEmotion;
        emotions[emotion] = (emotions[emotion] || 0) + 1;
      }
    });

    return emotions;
  }

  getDefaultContext() {
    return {
      patterns: {
        timing: {},
        frequency: {
          daily: 0,
          weekly: 0
        },
        topics: []
      },
      currentContext: {
        period: this.getCurrentPeriod(),
        analysis: {},
        recentTopics: []
      },
      history: {
        lastInteraction: null,
        commonPatterns: {
          timePatterns: {},
          topicPatterns: {},
          emotionalPatterns: {}
        }
      }
    };
  }

  /**
   * Actualiza los insights del usuario con una nueva interacción
   * @param {string|ObjectId} userId - ID del usuario
   * @param {Object} message - Mensaje del usuario
   * @param {Object} analysis - Análisis del mensaje
   * @returns {Promise<Object|null>} Documento actualizado o null si hay error
   */
  async updateUserInsights(userId, message, analysis) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      if (!this.isValidMessage(message)) {
        throw new Error('El mensaje debe tener contenido válido');
      }
      
      const timestamp = new Date();
      const hora = timestamp.getHours();
      const emotionalIntensity = analysis?.emotionalContext?.intensity || this.INTENSITY_DEFAULT;
      
      // Crear interacción (según estructura del modelo UserInsight)
      const interaction = {
        timestamp,
        emotion: analysis?.emotionalContext?.mainEmotion || this.EMOTION_NEUTRAL,
        intensity: emotionalIntensity,
        patterns: analysis?.patterns || {},
        goals: analysis?.goals || {}
      };

      // Actualizar (Mongoose timestamps maneja updatedAt automáticamente)
      const update = await UserInsight.findOneAndUpdate(
        { userId },
        {
          $push: {
            interactions: {
              $each: [interaction],
              $slice: -this.INTERACTIONS_LIMIT
            }
          }
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return update;
    } catch (error) {
      console.error('[MemoryService] Error actualizando insights:', error, { userId, message, analysis });
      return null;
    }
  }

  /**
   * Categoriza el horario del día en español
   * @param {number} hora - Hora del día (0-23)
   * @returns {string} Período del día (mañana, tarde, noche, madrugada)
   */
  categorizarHorario(hora) {
    return this.getPeriodFromHour(hora, this.horarioPeriods);
  }

  /**
   * Analiza la tendencia emocional en las interacciones
   * @param {Array} interactions - Lista de interacciones
   * @returns {Object} Tendencia emocional con última emoción, historial y patrones
   */
  analyzeEmotionalTrend(interactions) {
    if (!this.isValidArray(interactions)) {
      return {
        latest: this.EMOTION_NEUTRAL,
        history: [],
        patterns: {}
      };
    }
    
    const emotions = interactions.map(i => ({
      emotion: i.emotion || this.EMOTION_NEUTRAL,
      intensity: i.intensity || this.INTENSITY_DEFAULT,
      timestamp: i.timestamp
    }));

    return {
      latest: emotions[emotions.length - 1]?.emotion || this.EMOTION_NEUTRAL,
      history: emotions,
      patterns: this.detectEmotionalPatterns(emotions)
    };
  }

  /**
   * Detecta patrones emocionales en una lista de emociones
   * @param {Array} emotions - Lista de emociones con intensidad
   * @returns {Object} Patrones detectados (intensidad, fluctuación, emociones dominantes)
   */
  detectEmotionalPatterns(emotions) {
    const patterns = {
      intensidad: {
        alta: 0,
        baja: 0
      },
      fluctuación: [],
      emocionesDominantes: new Map()
    };

    if (!this.isValidArray(emotions)) {
      return patterns;
    }

    emotions.forEach(e => {
      // Contar intensidades altas y bajas
      if (e.intensity > this.INTENSITY_HIGH_THRESHOLD) {
        patterns.intensidad.alta++;
      }
      if (e.intensity < this.INTENSITY_LOW_THRESHOLD) {
        patterns.intensidad.baja++;
      }

      // Contar emociones dominantes
      const emotion = e.emotion || this.EMOTION_NEUTRAL;
      patterns.emocionesDominantes.set(
        emotion,
        (patterns.emocionesDominantes.get(emotion) || 0) + 1
      );

      // Detectar fluctuaciones (cambios de emoción)
      if (patterns.fluctuación.length > 0) {
        const lastEmotion = patterns.fluctuación[patterns.fluctuación.length - 1];
        if (lastEmotion !== emotion) {
          patterns.fluctuación.push(emotion);
        }
      } else {
        patterns.fluctuación.push(emotion);
      }
    });

    return patterns;
  }

  /**
   * Analiza el historial cognitivo de las interacciones
   * @param {Array} interactions - Lista de interacciones
   * @returns {Object} Patrones cognitivos por categoría
   */
  analyzeCognitiveHistory(interactions) {
    if (!this.isValidArray(interactions)) {
      return {};
    }
    
    return interactions.reduce((patterns, interaction) => {
      if (interaction.patterns && typeof interaction.patterns === 'object') {
        Object.entries(interaction.patterns).forEach(([category, categoryPatterns]) => {
          if (!patterns[category]) {
            patterns[category] = [];
          }
          if (typeof categoryPatterns === 'object') {
            patterns[category].push(...Object.keys(categoryPatterns));
          }
        });
      }
      return patterns;
    }, {});
  }
}

export default new MemoryService();
