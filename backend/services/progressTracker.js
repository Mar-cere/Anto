/**
 * Rastreador de Progreso - Gestiona el seguimiento y reportes del progreso terapéutico del usuario
 */
import mongoose from 'mongoose';
import UserProgress from '../models/UserProgress.js';

class ProgressTracker {
  constructor() {
    // Constantes de configuración
    this.EMOTION_NEUTRAL = 'neutral';
    this.INTENSITY_DEFAULT = 5;
    this.TOPIC_GENERAL = 'GENERAL';
    this.MESSAGE_COUNT_DEFAULT = 1;
    this.RESPONSE_QUALITY_DEFAULT = 3;
    this.MAX_COMMON_ITEMS = 5;
  }
  
  // Helper: validar que el userId es válido
  isValidUserId(userId) {
    return userId && (
      typeof userId === 'string' || 
      userId instanceof mongoose.Types.ObjectId ||
      mongoose.Types.ObjectId.isValid(userId)
    );
  }
  
  // Helper: validar que es un array válido con elementos
  isValidArray(value) {
    return Array.isArray(value) && value.length > 0;
  }
  
  // Helper: obtener elementos comunes de un array de entradas
  obtenerElementosComunes(entries, extractor, defaultValue, limit = this.MAX_COMMON_ITEMS) {
    if (!this.isValidArray(entries)) {
      return [];
    }
    
    const items = {};
    entries.forEach(entry => {
      const item = extractor(entry) || defaultValue;
      items[item] = (items[item] || 0) + 1;
    });
    
    return Object.entries(items)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  /**
   * Registra el progreso de una sesión para el usuario
   * @param {string|ObjectId} userId - ID del usuario
   * @param {Object} mensaje - Mensaje recibido (debe tener metadata.context)
   * @returns {Promise<Object|null>} Progreso actualizado o null si hay error
   */
  async trackProgress(userId, mensaje) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      if (!mensaje || typeof mensaje !== 'object') {
        throw new Error('mensaje válido es requerido');
      }
      
      // Crear entrada de progreso
      const progressEntry = {
        timestamp: new Date(),
        emotionalState: {
          mainEmotion: mensaje?.metadata?.context?.emotional?.mainEmotion || this.EMOTION_NEUTRAL,
          intensity: mensaje?.metadata?.context?.emotional?.intensity || this.INTENSITY_DEFAULT
        },
        context: {
          topic: mensaje?.metadata?.context?.contextual?.tema?.categoria || this.TOPIC_GENERAL,
          triggers: [],
          copingStrategies: []
        },
        sessionMetrics: {
          messageCount: this.MESSAGE_COUNT_DEFAULT,
          responseQuality: this.RESPONSE_QUALITY_DEFAULT
        }
      };
      
      // Actualizar progreso del usuario
      const userProgress = await UserProgress.findOneAndUpdate(
        { userId },
        {
          $push: { entries: progressEntry },
          $inc: { 'overallMetrics.totalSessions': 1 }
        },
        { new: true, upsert: true }
      );
      
      return userProgress;
    } catch (error) {
      console.error('[ProgressTracker] Error en seguimiento de progreso:', error, { userId, mensaje });
      return null;
    }
  }

  /**
   * Genera un reporte de progreso para el usuario
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object|null>} Reporte de progreso con total de sesiones, intensidad promedio, emociones y temas comunes
   */
  async generarReporte(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      const progress = await UserProgress.findOne({ userId });
      
      if (!progress || !this.isValidArray(progress.entries)) {
        return {
          totalSessions: 0,
          averageIntensity: 0,
          commonEmotions: [],
          commonTopics: []
        };
      }
      
      return {
        totalSessions: progress.entries.length,
        averageIntensity: this.calcularIntensidadPromedio(progress.entries),
        commonEmotions: this.obtenerEmocionesComunes(progress.entries),
        commonTopics: this.obtenerTemasComunes(progress.entries)
      };
    } catch (error) {
      console.error('[ProgressTracker] Error generando reporte:', error, { userId });
      return null;
    }
  }

  /**
   * Calcula la intensidad emocional promedio de las entradas
   * @param {Array} entries - Lista de entradas de progreso
   * @returns {number} Intensidad promedio (0 si no hay entradas)
   */
  calcularIntensidadPromedio(entries) {
    if (!this.isValidArray(entries)) {
      return 0;
    }
    
    const sum = entries.reduce((acc, entry) => {
      return acc + (entry.emotionalState?.intensity || 0);
    }, 0);
    
    return sum / entries.length;
  }

  /**
   * Obtiene las emociones más comunes de las entradas
   * @param {Array} entries - Lista de entradas de progreso
   * @returns {Array} Lista de emociones comunes con su frecuencia (máximo 5)
   */
  obtenerEmocionesComunes(entries) {
    return this.obtenerElementosComunes(
      entries,
      (entry) => entry.emotionalState?.mainEmotion,
      this.EMOTION_NEUTRAL
    );
  }

  /**
   * Obtiene los temas más comunes de las entradas
   * @param {Array} entries - Lista de entradas de progreso
   * @returns {Array} Lista de temas comunes con su frecuencia (máximo 5)
   */
  obtenerTemasComunes(entries) {
    return this.obtenerElementosComunes(
      entries,
      (entry) => entry.context?.topic,
      this.TOPIC_GENERAL
    );
  }
}

export default new ProgressTracker(); 