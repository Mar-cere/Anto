/**
 * Servicio de Perfil de Usuario - Gestiona el perfil, patrones y preferencias del usuario
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import Message from '../models/Message.js';
import UserProfile from '../models/UserProfile.js';
import emotionalAnalyzer from './emotionalAnalyzer.js';
import cacheService from './cacheService.js';
import {
  DEFAULT_COMMUNICATION_STYLE,
  DEFAULT_RESPONSE_LENGTH,
  DEFAULT_EMOTION,
  DEFAULT_INTENSITY,
  DEFAULT_TENDENCY,
  HOURS_FOR_INSIGHT,
  INTENSITY_THRESHOLD,
  SESSIONS_FOR_INSIGHT,
  DAYS_FOR_PATTERNS,
  DAYS_FOR_INSIGHTS,
  INTENSITY_DIFF_THRESHOLD,
  HISTORY_LIMIT,
  INTENSITY_HIGH,
  INTENSITY_MEDIUM,
  PERIODOS,
  DIAS_SEMANA,
  DIMENSIONES_ANALISIS
} from './userProfile/index.js';

dotenv.config();

// Cliente de OpenAI para generación de insights
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class UserProfileService {
  // Helper: validar userId
  isValidUserId(userId) {
    return userId && (typeof userId === 'string' || userId instanceof mongoose.Types.ObjectId);
  }
  
  // Helper: obtener estructura de perfil por defecto
  getDefaultProfileStructure(userId) {
    return {
      userId,
      preferences: {
        communicationStyle: DEFAULT_COMMUNICATION_STYLE,
        responseStyle: 'balanced',
        responseLength: DEFAULT_RESPONSE_LENGTH,
        topicsOfInterest: [],
        triggerTopics: []
      },
      patrones: {
        emocionales: [],
        conexion: [],
        temas: []
      },
      metadata: {
        ultimaInteraccion: new Date(),
        sesionesCompletadas: 0,
        progresoGeneral: 0
      }
    };
  }
  
  // Helper: obtener perfil por defecto simplificado (para errores)
  getDefaultProfileFallback(userId) {
    return {
      userId,
      preferences: {
        communicationStyle: DEFAULT_COMMUNICATION_STYLE,
        responseStyle: 'balanced',
        responseLength: DEFAULT_RESPONSE_LENGTH
      },
      patrones: {
        emocionales: [],
        conexion: [],
        temas: []
      }
    };
  }

  /**
   * Obtiene o crea el perfil de usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Perfil de usuario
   */
  async getOrCreateProfile(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      const cacheKey = cacheService.generateKey('profile', userId);
      
      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      let userProfile = await UserProfile.findOne({ userId }).lean();
      
      if (!userProfile) {
        const newProfile = await UserProfile.create(this.getDefaultProfileStructure(userId));
        userProfile = newProfile.toObject();
      }

      // Guardar en caché por 1 hora
      await cacheService.set(cacheKey, userProfile, 3600);

      return userProfile;
    } catch (error) {
      console.error('[UserProfileService] Error en getOrCreateProfile:', error, { userId });
      return this.getDefaultProfileFallback(userId);
    }
  }

  /**
   * Actualiza el perfil del usuario con un nuevo mensaje y análisis
   * @param {string} userId - ID del usuario
   * @param {Object} mensaje - Mensaje recibido
   * @param {Object} analisis - Análisis del mensaje (emotional, contextual)
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async actualizarPerfil(userId, mensaje, analisis) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      if (!mensaje || typeof mensaje !== 'object') {
        throw new Error('mensaje válido es requerido');
      }
      
      const actualizacion = {
        $push: {
          'patrones.emocionales': {
            emocion: analisis?.emotional?.mainEmotion || DEFAULT_EMOTION,
            intensidad: analisis?.emotional?.intensity || DEFAULT_INTENSITY,
            timestamp: new Date()
          }
        },
        $set: {
          'metadata.ultimaInteraccion': new Date(),
          'metadata.ultimoContexto': analisis?.contextual || {}
        },
        $inc: {
          'metadata.sesionesCompletadas': 1
        }
      };

      return await UserProfile.findOneAndUpdate(
        { userId },
        actualizacion,
        { 
          new: true, 
          upsert: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (error) {
      console.error('[UserProfileService] Error actualizando perfil:', error, { userId, mensaje, analisis });
      return null;
    }
  }

  /**
   * Obtiene el prompt personalizado basado en las preferencias del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Objeto con estilo, longitud, temas e intereses
   */
  async getPersonalizedPrompt(userId) {
    try {
      const perfil = await this.getOrCreateProfile(userId);
      
      return {
        style: perfil.preferences?.communicationStyle || DEFAULT_COMMUNICATION_STYLE,
        responseStyle: perfil.preferences?.responseStyle || 'balanced',
        responseLength: perfil.preferences?.responseLength || DEFAULT_RESPONSE_LENGTH,
        topics: perfil.preferences?.topicsOfInterest || [],
        triggers: perfil.preferences?.triggerTopics || []
      };
    } catch (error) {
      console.error('[UserProfileService] Error obteniendo prompt personalizado:', error);
      return {
        style: DEFAULT_COMMUNICATION_STYLE,
        responseStyle: 'balanced',
        responseLength: DEFAULT_RESPONSE_LENGTH,
        topics: [],
        triggers: []
      };
    }
  }

  /**
   * Actualiza el perfil a largo plazo a partir de una interacción de chat (temas, emociones recurrentes).
   * Se llama después de cada respuesta del asistente para que el contexto del chat mejore con el tiempo.
   * @param {string} userId - ID del usuario
   * @param {Object} payload - { emotionalAnalysis, contextualAnalysis }
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async updateLongTermProfileFromConversation(userId, payload) {
    try {
      if (!this.isValidUserId(userId) || !payload) return null;

      const emotionalAnalysis = payload.emotionalAnalysis || {};
      const contextualAnalysis = payload.contextualAnalysis || {};
      const topicRaw = contextualAnalysis?.tema?.categoria || emotionalAnalysis?.topic || 'general';
      const topic = (typeof topicRaw === 'string' ? topicRaw : topicRaw?.categoria || 'general').toLowerCase().trim() || 'general';
      const emotion = (emotionalAnalysis?.mainEmotion || 'neutral').toLowerCase().trim();

      const profile = await UserProfile.findOne({ userId }).lean();
      if (!profile) return null;

      const now = new Date();
      const MAX_TOPICS = 15;
      const MAX_EMOTIONS = 10;
      const MAX_LAST_INTERACTIONS = 10;
      const MAX_TOPICS_INTEREST = 20;

      // commonTopics: add or increment topic
      let commonTopics = Array.isArray(profile.commonTopics) ? [...profile.commonTopics] : [];
      const topicIdx = commonTopics.findIndex(t => (t.topic || '').toLowerCase() === topic);
      if (topicIdx >= 0) {
        commonTopics[topicIdx] = {
          ...commonTopics[topicIdx],
          frequency: (commonTopics[topicIdx].frequency || 0) + 1,
          lastDiscussed: now
        };
      } else {
        commonTopics.push({ topic, frequency: 1, lastDiscussed: now, associatedEmotions: [] });
      }
      commonTopics = commonTopics.sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, MAX_TOPICS);

      // emotionalPatterns.predominantEmotions
      const predominantEmotions = Array.isArray(profile.emotionalPatterns?.predominantEmotions) ? [...profile.emotionalPatterns.predominantEmotions] : [];
      const emotionIdx = predominantEmotions.findIndex(e => (e.emotion || '').toLowerCase() === emotion);
      if (emotionIdx >= 0) {
        predominantEmotions[emotionIdx] = {
          ...predominantEmotions[emotionIdx],
          frequency: (predominantEmotions[emotionIdx].frequency || 0) + 1
        };
      } else {
        predominantEmotions.push({ emotion, frequency: 1, timePattern: {} });
      }
      // emotionalTriggers: tema + emoción recurrente -> trigger emocional
      let emotionalTriggers = Array.isArray(profile.emotionalPatterns?.emotionalTriggers) ? [...profile.emotionalPatterns.emotionalTriggers] : [];
      if (topic !== 'general' && emotion !== 'neutral') {
        const triggerIdx = emotionalTriggers.findIndex(
          t => (t.trigger || '').toLowerCase() === topic && (t.emotion || '').toLowerCase() === emotion
        );
        if (triggerIdx >= 0) {
          emotionalTriggers[triggerIdx] = {
            ...emotionalTriggers[triggerIdx],
            frequency: (emotionalTriggers[triggerIdx].frequency || 0) + 1
          };
        } else {
          emotionalTriggers.push({ trigger: topic, emotion, frequency: 1 });
        }
        emotionalTriggers = emotionalTriggers.sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, 10);
      }
      const emotionalPatterns = {
        ...(profile.emotionalPatterns || {}),
        predominantEmotions: predominantEmotions.sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, MAX_EMOTIONS),
        emotionalTriggers
      };

      // connectionStats: actualizar horario y día de conexión
      const nowHour = now.getHours();
      const nowDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const period = nowHour >= 6 && nowHour < 12 ? 'morning' : nowHour >= 12 && nowHour < 18 ? 'afternoon' : nowHour >= 18 && nowHour < 24 ? 'evening' : 'night';
      const frequentTimes = { ...(profile.connectionStats?.frequentTimes || {}), [period]: (profile.connectionStats?.frequentTimes?.[period] || 0) + 1 };
      const weekdayPatterns = { ...(profile.connectionStats?.weekdayPatterns || {}), [nowDay]: (profile.connectionStats?.weekdayPatterns?.[nowDay] || 0) + 1 };
      const connectionStats = {
        ...(profile.connectionStats || {}),
        lastConnection: now,
        frequentTimes,
        weekdayPatterns
      };

      // timePatterns: frecuencia y estado emocional típico por franja horaria
      const slotKey = period === 'morning' ? 'morningInteractions' : period === 'afternoon' ? 'afternoonInteractions' : period === 'evening' ? 'eveningInteractions' : 'nightInteractions';
      const timePatterns = { ...(profile.timePatterns || {}) };
      const currentSlot = timePatterns[slotKey] || { frequency: 0, averageMood: 'neutral' };
      timePatterns[slotKey] = {
        frequency: (currentSlot.frequency || 0) + 1,
        averageMood: emotion !== 'neutral' ? emotion : (currentSlot.averageMood || 'neutral')
      };

      // patrones.temas
      let patronesTemas = Array.isArray(profile.patrones?.temas) ? [...profile.patrones.temas] : [];
      const temaIdx = patronesTemas.findIndex(t => (t.tema || '').toLowerCase() === topic);
      if (temaIdx >= 0) {
        patronesTemas[temaIdx] = {
          ...patronesTemas[temaIdx],
          frecuencia: (patronesTemas[temaIdx].frecuencia || 0) + 1,
          ultimaVez: now
        };
      } else {
        patronesTemas.push({ tema: topic, frecuencia: 1, ultimaVez: now });
      }
      patronesTemas = patronesTemas.sort((a, b) => (b.frecuencia || 0) - (a.frecuencia || 0)).slice(0, MAX_TOPICS);
      const patrones = { ...(profile.patrones || {}), temas: patronesTemas };

      // lastInteractions: append and keep last N
      let lastInteractions = Array.isArray(profile.lastInteractions) ? [...profile.lastInteractions] : [];
      lastInteractions.push({ timestamp: now, emotion, topic });
      lastInteractions = lastInteractions.slice(-MAX_LAST_INTERACTIONS);

      // preferences.topicsOfInterest: add topic if not generic and not already present
      let topicsOfInterest = Array.isArray(profile.preferences?.topicsOfInterest) ? [...profile.preferences.topicsOfInterest] : [];
      if (topic !== 'general' && topic.length > 1 && !topicsOfInterest.some(t => (t || '').toLowerCase() === topic)) {
        topicsOfInterest.push(topic);
        topicsOfInterest = topicsOfInterest.slice(-MAX_TOPICS_INTEREST);
      }
      const preferences = { ...(profile.preferences || {}), topicsOfInterest };

      const updated = await UserProfile.findOneAndUpdate(
        { userId },
        {
          $set: {
            commonTopics,
            emotionalPatterns,
            connectionStats,
            timePatterns,
            patrones,
            lastInteractions,
            preferences,
            'metadata.ultimaInteraccion': now
          }
        },
        { new: true }
      ).lean();

      const cacheKey = cacheService.generateKey('profile', userId);
      await cacheService.delete(cacheKey).catch(() => {});

      return updated;
    } catch (error) {
      console.error('[UserProfileService] Error en updateLongTermProfileFromConversation:', error, { userId });
      return null;
    }
  }

  /**
   * Registra o actualiza una estrategia de afrontamiento tras el uso de una técnica terapéutica.
   * @param {string} userId - ID del usuario
   * @param {Object} params - { strategy, effectiveness }
   * @param {string} params.strategy - Nombre de la técnica/estrategia
   * @param {number} [params.effectiveness=5] - Efectividad percibida 1-10
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async registerCopingStrategy(userId, { strategy, effectiveness = 5 }) {
    try {
      if (!this.isValidUserId(userId) || !strategy || typeof strategy !== 'string') return null;
      const eff = Math.min(10, Math.max(1, Number(effectiveness) || 5));
      const profile = await UserProfile.findOne({ userId }).lean();
      if (!profile) return null;

      let copingStrategies = Array.isArray(profile.copingStrategies) ? [...profile.copingStrategies] : [];
      const strategyNorm = strategy.trim().toLowerCase();
      const idx = copingStrategies.findIndex(s => (s.strategy || '').toLowerCase() === strategyNorm);

      const now = new Date();
      if (idx >= 0) {
        const prev = copingStrategies[idx];
        const prevCount = prev.usageCount || 0;
        const prevEff = prev.effectiveness || 5;
        copingStrategies[idx] = {
          strategy: prev.strategy || strategy,
          usageCount: prevCount + 1,
          effectiveness: prevCount > 0
            ? Math.round((prevEff * prevCount + eff) / (prevCount + 1) * 10) / 10
            : eff,
          lastUsed: now
        };
      } else {
        copingStrategies.push({
          strategy: strategy.trim(),
          effectiveness: eff,
          usageCount: 1,
          lastUsed: now
        });
      }
      copingStrategies = copingStrategies
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 15);

      const updated = await UserProfile.findOneAndUpdate(
        { userId },
        { $set: { copingStrategies } },
        { new: true }
      ).lean();

      const cacheKey = cacheService.generateKey('profile', userId);
      await cacheService.delete(cacheKey).catch(() => {});

      return updated;
    } catch (error) {
      console.error('[UserProfileService] Error registrando copingStrategy:', error, { userId, strategy });
      return null;
    }
  }

  /**
   * Infiere preferencias de personalización a partir del comportamiento (Fase 3).
   * Solo actualiza cuando el usuario tiene valores por defecto (neutral/default).
   * @param {string} userId - ID del usuario
   * @param {Object} inferred - { communicationStyle?, responseLength?, responseStyle? }
   * @returns {Promise<Object|null>} Perfil actualizado o null
   */
  async inferPreferencesFromBehavior(userId, inferred) {
    try {
      if (!this.isValidUserId(userId) || !inferred || typeof inferred !== 'object') return null;
      const profile = await UserProfile.findOne({ userId }).lean();
      if (!profile) return null;

      const updates = {};
      const comm = profile.preferences?.communicationStyle;
      if ((comm === 'neutral' || !comm) && inferred.communicationStyle) {
        updates['preferences.communicationStyle'] = inferred.communicationStyle;
      }
      const respLen = profile.preferences?.responseLength;
      if ((respLen === 'MEDIUM' || !respLen) && inferred.responseLength) {
        updates['preferences.responseLength'] = inferred.responseLength;
      }
      const respStyle = profile.preferences?.responseStyle;
      if ((respStyle === 'balanced' || !respStyle) && inferred.responseStyle) {
        updates['preferences.responseStyle'] = inferred.responseStyle;
      }
      if (Object.keys(updates).length === 0) return profile;

      const updated = await UserProfile.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true }
      ).lean();

      const cacheKey = cacheService.generateKey('profile', userId);
      await cacheService.delete(cacheKey).catch(() => {});

      return updated;
    } catch (error) {
      console.warn('[UserProfileService] Error infiriendo preferencias:', error.message);
      return null;
    }
  }

  /**
   * Actualiza las preferencias del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} newPreferences - Nuevas preferencias a actualizar
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async updatePreferences(userId, newPreferences) {
    try {
      return await UserProfile.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            'preferences': newPreferences
          }
        },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('[UserProfileService] Error actualizando preferencias:', error);
      return null;
    }
  }

  /**
   * Determina si se debe generar un insight basado en condiciones específicas
   * @param {string} userId - ID del usuario
   * @param {Object} contexto - Contexto actual (emotional, etc.)
   * @returns {Promise<boolean>} true si se debe generar insight, false en caso contrario
   */
  async shouldGenerateInsight(userId, contexto) {
    try {
      const perfil = await this.getOrCreateProfile(userId);
      const ultimaInteraccion = perfil.metadata?.ultimaInteraccion;
      const ahora = new Date();
      
      // Generar insight si:
      // 1. Han pasado más de 24 horas desde la última interacción
      // 2. Ha habido un cambio emocional significativo
      // 3. Se han completado al menos 5 sesiones desde el último insight
      
      const horasDesdeUltimaInteraccion = ultimaInteraccion ? 
        (ahora - new Date(ultimaInteraccion)) / (1000 * 60 * 60) : HOURS_FOR_INSIGHT;

      return horasDesdeUltimaInteraccion >= HOURS_FOR_INSIGHT || 
             contexto?.emotional?.intensity >= INTENSITY_THRESHOLD ||
             (perfil.metadata?.sesionesCompletadas % SESSIONS_FOR_INSIGHT === 0);
    } catch (error) {
      console.error('[UserProfileService] Error evaluando generación de insight:', error);
      return false;
    }
  }

  /**
   * Obtiene los patrones emocionales del usuario de los últimos días
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Objeto con emoción predominante, intensidad promedio, tendencia y patrones
   */
  async getEmotionalPatterns(userId) {
    try {
      const perfil = await this.getOrCreateProfile(userId);
      const patronesEmocionales = perfil.patrones?.emocionales || [];
      
      // Analizar los últimos 7 días
      const ultimaSemana = new Date();
      ultimaSemana.setDate(ultimaSemana.getDate() - DAYS_FOR_PATTERNS);
      
      const patronesRecientes = patronesEmocionales.filter(p => 
        new Date(p.timestamp) >= ultimaSemana
      );

      return {
        predominante: this.calcularEmocionPredominante(patronesRecientes),
        intensidadPromedio: this.calcularIntensidadPromedio(patronesRecientes),
        tendencia: this.calcularTendencia(patronesRecientes),
        patrones: patronesRecientes
      };
    } catch (error) {
      console.error('[UserProfileService] Error obteniendo patrones emocionales:', error);
      return {
        predominante: DEFAULT_EMOTION,
        intensidadPromedio: DEFAULT_INTENSITY,
        tendencia: DEFAULT_TENDENCY,
        patrones: []
      };
    }
  }

  /**
   * Calcula la emoción predominante en un conjunto de patrones
   * @param {Array} patrones - Array de patrones emocionales
   * @returns {string} Nombre de la emoción predominante
   */
  calcularEmocionPredominante(patrones) {
    if (!patrones || !patrones.length) return DEFAULT_EMOTION;
    
    const conteo = patrones.reduce((acc, p) => {
      acc[p.emocion] = (acc[p.emocion] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(conteo)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Calcula la intensidad promedio de un conjunto de patrones
   * @param {Array} patrones - Array de patrones emocionales
   * @returns {number} Intensidad promedio redondeada
   */
  calcularIntensidadPromedio(patrones) {
    if (!patrones || !patrones.length) return DEFAULT_INTENSITY;
    
    const suma = patrones.reduce((acc, p) => acc + (p.intensidad || 0), 0);
    return Math.round(suma / patrones.length);
  }

  /**
   * Calcula la tendencia emocional (ascendente, descendente, estable)
   * @param {Array} patrones - Array de patrones emocionales
   * @returns {string} Tendencia: 'ascendente', 'descendente' o 'estable'
   */
  calcularTendencia(patrones) {
    if (!patrones || patrones.length < 2) return DEFAULT_TENDENCY;
    
    const ordenados = [...patrones].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const primeraIntensidad = ordenados[0].intensidad;
    const ultimaIntensidad = ordenados[ordenados.length - 1].intensidad;
    
    if (ultimaIntensidad - primeraIntensidad > INTENSITY_DIFF_THRESHOLD) return 'ascendente';
    if (primeraIntensidad - ultimaIntensidad > INTENSITY_DIFF_THRESHOLD) return 'descendente';
    return DEFAULT_TENDENCY;
  }

  /**
   * Actualiza los patrones de conexión del usuario (período del día y día de la semana)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async actualizarPatronesConexion(userId) {
    try {
      const periodo = this.determinarPeriodo();
      const diaSemana = this.obtenerDiaSemana();
      
      const update = {
        $inc: {
          [`patrones.conexion.periodos.${periodo.nombre}`]: 1,
          [`patrones.conexion.diasSemana.${diaSemana}`]: 1
        },
        $set: {
          'patrones.conexion.ultimaConexion': new Date()
        },
        $push: {
          'patrones.conexion.historial': {
            periodo: periodo.nombre,
            diaSemana,
            timestamp: new Date()
          }
        }
      };

      return await UserProfile.findOneAndUpdate(
        { userId },
        update,
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('[UserProfileService] Error en patrones de conexión:', error);
      return null;
    }
  }

  /**
   * Actualiza los patrones emocionales del usuario basado en un mensaje
   * @param {string} userId - ID del usuario
   * @param {Object} mensaje - Mensaje a analizar
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async actualizarPatronesEmocionales(userId, mensaje) {
    try {
      const analisis = await emotionalAnalyzer.analyzeEmotion(mensaje);
      const periodo = this.determinarPeriodo();

      const patronEmocional = {
        emocion: analisis.emotion,
        intensidad: analisis.intensity,
        periodo: periodo.nombre,
        timestamp: new Date(),
        contexto: analisis.emotionalState
      };

      const update = {
        $push: {
          'patrones.emocionales.historial': {
            $each: [patronEmocional],
            $slice: -HISTORY_LIMIT
          }
        },
        $set: {
          'patrones.emocionales.actual': patronEmocional
        }
      };

      // Actualizar frecuencias emocionales
      update.$inc = {
        [`patrones.emocionales.frecuencias.${analisis.emotion}`]: 1,
        [`patrones.emocionales.intensidades.${this.categorizarIntensidad(analisis.intensity)}`]: 1
      };

      return await UserProfile.findOneAndUpdate(
        { userId },
        update,
        { new: true }
      );
    } catch (error) {
      console.error('[UserProfileService] Error en patrones emocionales:', error);
      return null;
    }
  }

  /**
   * Actualiza los patrones cognitivos del usuario basado en un mensaje
   * @param {string} userId - ID del usuario
   * @param {Object} mensaje - Mensaje a analizar
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async actualizarPatronesCognitivos(userId, mensaje) {
    try {
      const patrones = await this.analizarPatronesCognitivos(mensaje);
      
      const update = {
        $push: {
          'patrones.cognitivos.historial': {
            patrones,
            timestamp: new Date()
          }
        }
      };

      // Actualizar frecuencias de patrones cognitivos
      Object.entries(patrones).forEach(([tipo, presencia]) => {
        if (presencia) {
          update.$inc = {
            ...update.$inc,
            [`patrones.cognitivos.frecuencias.${tipo}`]: 1
          };
        }
      });

      return await UserProfile.findOneAndUpdate(
        { userId },
        update,
        { new: true }
      );
    } catch (error) {
      console.error('[UserProfileService] Error en patrones cognitivos:', error);
      return null;
    }
  }

  /**
   * Actualiza las estrategias de afrontamiento del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} mensaje - Mensaje a analizar
   * @param {Object} contexto - Contexto adicional (efectividad, etc.)
   * @returns {Promise<Object|null>} Perfil actualizado o null si hay error
   */
  async actualizarEstrategiasAfrontamiento(userId, mensaje, contexto) {
    try {
      const estrategias = await this.identificarEstrategiasAfrontamiento(mensaje);
      
      const update = {
        $push: {
          'estrategias.historial': {
            estrategias,
            contexto,
            efectividad: contexto.efectividad || null,
            timestamp: new Date()
          }
        }
      };

      // Actualizar estadísticas de estrategias
      estrategias.forEach(estrategia => {
        update.$inc = {
          ...update.$inc,
          [`estrategias.frecuencias.${estrategia.tipo}`]: 1
        };
      });

      return await UserProfile.findOneAndUpdate(
        { userId },
        update,
        { new: true }
      );
    } catch (error) {
      console.error('[UserProfileService] Error en estrategias de afrontamiento:', error);
      return null;
    }
  }

  /**
   * Genera insights profundos sobre el usuario usando OpenAI
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Insights generados o null si hay error
   */
  async generarInsights(userId) {
    try {
      const perfil = await UserProfile.findOne({ userId });
      const fechaLimite = new Date(Date.now() - DAYS_FOR_INSIGHTS * 24 * 60 * 60 * 1000);
      
      const mensajesRecientes = await Message.find({
        userId,
        createdAt: { $gte: fechaLimite }
      }).sort({ createdAt: 1 });

      const analisis = {
        perfil: this.prepararPerfilParaAnalisis(perfil),
        mensajes: mensajesRecientes,
        dimensiones: DIMENSIONES_ANALISIS
      };

      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `Analiza el perfil del usuario y genera insights profundos sobre:
              1. Patrones de comportamiento y su evolución
              2. Estrategias de afrontamiento efectivas
              3. Áreas de desarrollo personal
              4. Recomendaciones personalizadas
              5. Tendencias y cambios significativos
              
              Responde en formato JSON estructurado.`
          },
          {
            role: 'user',
            content: JSON.stringify(analisis)
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('[UserProfileService] Error generando insights:', error);
      return null;
    }
  }

  /**
   * Determina el período del día actual
   * @returns {Object} Objeto con inicio, fin y nombre del período
   */
  determinarPeriodo() {
    const hora = new Date().getHours();
    return Object.values(PERIODOS).find(
      periodo => hora >= periodo.inicio && hora <= periodo.fin
    ) || PERIODOS.TARDE;
  }

  /**
   * Obtiene el día de la semana actual
   * @returns {string} Nombre del día de la semana
   */
  obtenerDiaSemana() {
    return DIAS_SEMANA[new Date().getDay()];
  }

  /**
   * Categoriza la intensidad emocional (alta, media, baja)
   * @param {number} intensidad - Valor de intensidad (0-10)
   * @returns {string} Categoría: 'alta', 'media' o 'baja'
   */
  categorizarIntensidad(intensidad) {
    if (intensidad >= INTENSITY_HIGH) return 'alta';
    if (intensidad >= INTENSITY_MEDIUM) return 'media';
    return 'baja';
  }

  /**
   * Analiza patrones cognitivos en un mensaje
   * @param {Object} mensaje - Mensaje a analizar (debe tener propiedad 'content')
   * @returns {Promise<Object>} Objeto con patrones detectados (distorsiones, autocritica, etc.)
   */
  async analizarPatronesCognitivos(mensaje) {
    if (!mensaje || typeof mensaje.content !== 'string') {
      return {};
    }
    
    const patrones = {
      distorsiones: /(?:siempre|nunca|todo|nada|debería|tengo que)/i,
      autocritica: /(?:mi culpa|soy un|no sirvo|no puedo)/i,
      catastrofizacion: /(?:terrible|horrible|desastre|lo peor)/i,
      generalizacion: /(?:todos|nadie|siempre|jamás|típico)/i
    };

    return Object.entries(patrones).reduce((acc, [tipo, patron]) => {
      acc[tipo] = patron.test(mensaje.content);
      return acc;
    }, {});
  }

  /**
   * Identifica estrategias de afrontamiento en un mensaje
   * @param {Object} mensaje - Mensaje a analizar (debe tener propiedad 'content')
   * @returns {Promise<Array>} Array de estrategias identificadas con tipo y timestamp
   */
  async identificarEstrategiasAfrontamiento(mensaje) {
    if (!mensaje || typeof mensaje.content !== 'string') {
      return [];
    }
    
    const estrategias = {
      activas: /(?:intenté|busqué|decidí|resolví|afronté)/i,
      evitativas: /(?:evité|preferí no|mejor no|dejé de)/i,
      apoyo: /(?:pedí ayuda|hablé con|busqué apoyo|consulté)/i,
      reflexivas: /(?:pensé en|analicé|consideré|reflexioné)/i
    };

    return Object.entries(estrategias)
      .filter(([, patron]) => patron.test(mensaje.content))
      .map(([tipo]) => ({
        tipo,
        timestamp: new Date()
      }));
  }

  /**
   * Prepara el perfil del usuario para análisis de insights
   * @param {Object} perfil - Perfil del usuario
   * @returns {Object|null} Perfil preparado o null si no existe
   */
  prepararPerfilParaAnalisis(perfil) {
    if (!perfil) return null;

    return {
      patrones: {
        emocionales: perfil.patrones?.emocionales || [],
        cognitivos: perfil.patrones?.cognitivos || [],
        conductuales: perfil.estrategias || []
      },
      preferencias: perfil.preferences || {},
      metadata: perfil.metadata || {}
    };
  }
}

export default new UserProfileService(); 