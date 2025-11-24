/**
 * Analizador de Tendencias de Crisis - Analiza patrones históricos para detectar
 * deterioros graduales y cambios anormales en el estado emocional del usuario
 */
import Message from '../models/Message.js';

class CrisisTrendAnalyzer {
  constructor() {
    // Ventanas de tiempo para análisis
    this.SHORT_TERM_DAYS = 7; // Últimos 7 días
    this.MEDIUM_TERM_DAYS = 30; // Últimos 30 días
    this.LONG_TERM_DAYS = 90; // Últimos 90 días
    
    // Umbrales para detectar cambios significativos
    this.INTENSITY_CHANGE_THRESHOLD = 2; // Cambio de 2 puntos en intensidad
    this.EMOTION_CHANGE_THRESHOLD = 0.3; // 30% de cambio en distribución emocional
    this.FREQUENCY_CHANGE_THRESHOLD = 0.5; // 50% de cambio en frecuencia
    
    // Factores de riesgo por tendencia
    this.TREND_RISK_FACTORS = {
      RAPID_DECLINE: 2, // Deterioro rápido
      SUSTAINED_LOW: 1.5, // Estado bajo sostenido
      VOLATILITY: 1, // Alta volatilidad emocional
      ISOLATION: 1.5, // Aislamiento (menos mensajes)
      ESCALATION: 2 // Escalada emocional reciente
    };
  }

  /**
   * Analiza la tendencia emocional del usuario en diferentes períodos
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Análisis de tendencias
   */
  async analyzeTrends(userId) {
    try {
      const now = new Date();
      const shortTermStart = new Date(now.getTime() - this.SHORT_TERM_DAYS * 24 * 60 * 60 * 1000);
      const mediumTermStart = new Date(now.getTime() - this.MEDIUM_TERM_DAYS * 24 * 60 * 60 * 1000);
      const longTermStart = new Date(now.getTime() - this.LONG_TERM_DAYS * 24 * 60 * 60 * 1000);

      // Obtener mensajes de diferentes períodos
      const [shortTermMessages, mediumTermMessages, longTermMessages] = await Promise.all([
        this.getMessagesInPeriod(userId, shortTermStart, now),
        this.getMessagesInPeriod(userId, mediumTermStart, now),
        this.getMessagesInPeriod(userId, longTermStart, now)
      ]);

      // Analizar cada período
      const shortTermAnalysis = this.analyzePeriod(shortTermMessages, 'short');
      const mediumTermAnalysis = this.analyzePeriod(mediumTermMessages, 'medium');
      const longTermAnalysis = this.analyzePeriod(longTermMessages, 'long');

      // Detectar tendencias y cambios
      const trends = this.detectTrends(shortTermAnalysis, mediumTermAnalysis, longTermAnalysis);
      const riskAdjustment = this.calculateRiskAdjustment(trends);

      return {
        periods: {
          short: shortTermAnalysis,
          medium: mediumTermAnalysis,
          long: longTermAnalysis
        },
        trends,
        riskAdjustment,
        warnings: this.generateWarnings(trends)
      };
    } catch (error) {
      console.error('[CrisisTrendAnalyzer] Error analizando tendencias:', error);
      return {
        periods: {},
        trends: {},
        riskAdjustment: 0,
        warnings: []
      };
    }
  }

  /**
   * Obtiene mensajes del usuario en un período específico
   * @param {string} userId - ID del usuario
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Array>} Array de mensajes
   */
  async getMessagesInPeriod(userId, startDate, endDate) {
    try {
      const messages = await Message.find({
        userId,
        role: 'user',
        createdAt: { $gte: startDate, $lte: endDate },
        'metadata.context.emotional.mainEmotion': { $exists: true }
      })
        .select('content metadata.context.emotional createdAt')
        .sort({ createdAt: -1 })
        .lean();

      return messages;
    } catch (error) {
      console.error('[CrisisTrendAnalyzer] Error obteniendo mensajes:', error);
      return [];
    }
  }

  /**
   * Analiza un período específico de mensajes
   * @param {Array} messages - Array de mensajes
   * @param {string} periodName - Nombre del período ('short', 'medium', 'long')
   * @returns {Object} Análisis del período
   */
  analyzePeriod(messages, periodName) {
    if (!messages || messages.length === 0) {
      return {
        messageCount: 0,
        averageIntensity: 5,
        emotionDistribution: {},
        negativeEmotionRate: 0,
        highIntensityRate: 0,
        frequency: 0
      };
    }

    const emotions = messages.map(msg => ({
      emotion: msg.metadata?.context?.emotional?.mainEmotion || 'neutral',
      intensity: msg.metadata?.context?.emotional?.intensity || 5,
      timestamp: msg.createdAt
    }));

    // Calcular métricas
    const totalIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0);
    const averageIntensity = totalIntensity / emotions.length;

    // Distribución emocional
    const emotionDistribution = {};
    emotions.forEach(e => {
      emotionDistribution[e.emotion] = (emotionDistribution[e.emotion] || 0) + 1;
    });

    // Normalizar distribución
    Object.keys(emotionDistribution).forEach(emotion => {
      emotionDistribution[emotion] = emotionDistribution[emotion] / emotions.length;
    });

    // Tasa de emociones negativas
    const negativeEmotions = ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'];
    const negativeCount = emotions.filter(e => negativeEmotions.includes(e.emotion)).length;
    const negativeEmotionRate = negativeCount / emotions.length;

    // Tasa de alta intensidad (>= 7)
    const highIntensityCount = emotions.filter(e => e.intensity >= 7).length;
    const highIntensityRate = highIntensityCount / emotions.length;

    // Frecuencia de mensajes (mensajes por día)
    const daysInPeriod = periodName === 'short' ? this.SHORT_TERM_DAYS :
                        periodName === 'medium' ? this.MEDIUM_TERM_DAYS :
                        this.LONG_TERM_DAYS;
    const frequency = messages.length / daysInPeriod;

    return {
      messageCount: messages.length,
      averageIntensity,
      emotionDistribution,
      negativeEmotionRate,
      highIntensityRate,
      frequency,
      emotions // Guardar para análisis de tendencias
    };
  }

  /**
   * Detecta tendencias comparando diferentes períodos
   * @param {Object} shortTerm - Análisis de corto plazo
   * @param {Object} mediumTerm - Análisis de mediano plazo
   * @param {Object} longTerm - Análisis de largo plazo
   * @returns {Object} Tendencias detectadas
   */
  detectTrends(shortTerm, mediumTerm, longTerm) {
    const trends = {
      intensityTrend: 'stable', // 'increasing', 'decreasing', 'stable'
      emotionTrend: 'stable', // 'improving', 'declining', 'stable'
      frequencyTrend: 'stable', // 'increasing', 'decreasing', 'stable'
      volatility: 'low', // 'low', 'medium', 'high'
      rapidDecline: false,
      sustainedLow: false,
      isolation: false,
      escalation: false
    };

    // Tendencia de intensidad
    if (shortTerm.averageIntensity < mediumTerm.averageIntensity - this.INTENSITY_CHANGE_THRESHOLD) {
      trends.intensityTrend = 'decreasing';
      if (shortTerm.averageIntensity < longTerm.averageIntensity - this.INTENSITY_CHANGE_THRESHOLD * 1.5) {
        trends.rapidDecline = true;
      }
    } else if (shortTerm.averageIntensity > mediumTerm.averageIntensity + this.INTENSITY_CHANGE_THRESHOLD) {
      trends.intensityTrend = 'increasing';
      if (shortTerm.averageIntensity >= 7) {
        trends.escalation = true;
      }
    }

    // Tendencia emocional (mejora o deterioro)
    if (shortTerm.negativeEmotionRate > mediumTerm.negativeEmotionRate + this.EMOTION_CHANGE_THRESHOLD) {
      trends.emotionTrend = 'declining';
    } else if (shortTerm.negativeEmotionRate < mediumTerm.negativeEmotionRate - this.EMOTION_CHANGE_THRESHOLD) {
      trends.emotionTrend = 'improving';
    }

    // Tendencia de frecuencia
    if (shortTerm.frequency < mediumTerm.frequency * (1 - this.FREQUENCY_CHANGE_THRESHOLD)) {
      trends.frequencyTrend = 'decreasing';
      if (shortTerm.frequency < mediumTerm.frequency * 0.5) {
        trends.isolation = true; // Reducción significativa en comunicación
      }
    } else if (shortTerm.frequency > mediumTerm.frequency * (1 + this.FREQUENCY_CHANGE_THRESHOLD)) {
      trends.frequencyTrend = 'increasing';
    }

    // Estado bajo sostenido
    if (shortTerm.averageIntensity <= 4 && 
        mediumTerm.averageIntensity <= 4 && 
        shortTerm.negativeEmotionRate >= 0.6) {
      trends.sustainedLow = true;
    }

    // Volatilidad emocional
    if (shortTerm.emotions && shortTerm.emotions.length > 0) {
      const intensities = shortTerm.emotions.map(e => e.intensity);
      const variance = this.calculateVariance(intensities);
      if (variance > 4) {
        trends.volatility = 'high';
      } else if (variance > 2) {
        trends.volatility = 'medium';
      }
    }

    return trends;
  }

  /**
   * Calcula la varianza de un array de números
   * @param {Array<number>} values - Array de valores
   * @returns {number} Varianza
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calcula el ajuste de riesgo basado en las tendencias
   * @param {Object} trends - Tendencias detectadas
   * @returns {number} Ajuste de riesgo (puede ser positivo o negativo)
   */
  calculateRiskAdjustment(trends) {
    let adjustment = 0;

    if (trends.rapidDecline) {
      adjustment += this.TREND_RISK_FACTORS.RAPID_DECLINE;
    }
    if (trends.sustainedLow) {
      adjustment += this.TREND_RISK_FACTORS.SUSTAINED_LOW;
    }
    if (trends.volatility === 'high') {
      adjustment += this.TREND_RISK_FACTORS.VOLATILITY;
    }
    if (trends.isolation) {
      adjustment += this.TREND_RISK_FACTORS.ISOLATION;
    }
    if (trends.escalation) {
      adjustment += this.TREND_RISK_FACTORS.ESCALATION;
    }

    // Factores protectores (reducen riesgo)
    if (trends.emotionTrend === 'improving') {
      adjustment -= 0.5;
    }
    if (trends.frequencyTrend === 'increasing' && trends.intensityTrend !== 'decreasing') {
      adjustment -= 0.5; // Más comunicación puede ser positivo
    }

    return adjustment;
  }

  /**
   * Genera advertencias basadas en las tendencias
   * @param {Object} trends - Tendencias detectadas
   * @returns {Array<string>} Array de advertencias
   */
  generateWarnings(trends) {
    const warnings = [];

    if (trends.rapidDecline) {
      warnings.push('Deterioro emocional rápido detectado en los últimos días');
    }
    if (trends.sustainedLow) {
      warnings.push('Estado emocional bajo sostenido durante un período prolongado');
    }
    if (trends.isolation) {
      warnings.push('Reducción significativa en la frecuencia de comunicación');
    }
    if (trends.escalation) {
      warnings.push('Escalada emocional reciente detectada');
    }
    if (trends.volatility === 'high') {
      warnings.push('Alta volatilidad emocional detectada');
    }

    return warnings;
  }

  /**
   * Obtiene el historial de crisis previas del usuario
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás
   * @returns {Promise<Object>} Objeto con totalCrises, recentCrises y crisisDays
   */
  async getCrisisHistory(userId, days = 30) {
    try {
      // Usar el modelo CrisisEvent para obtener crisis reales
      const CrisisEvent = (await import('../models/CrisisEvent.js')).default;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const crises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate }
      })
        .select('detectedAt riskLevel')
        .sort({ detectedAt: -1 })
        .lean();

      // Agrupar por día para contar crisis
      const crisisByDay = {};
      crises.forEach(crisis => {
        const day = new Date(crisis.detectedAt).toISOString().split('T')[0];
        if (!crisisByDay[day]) {
          crisisByDay[day] = [];
        }
        crisisByDay[day].push(crisis);
      });

      // Crisis recientes (últimos 7 días)
      const recentStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCrises = crises.filter(crisis => 
        new Date(crisis.detectedAt) >= recentStart
      ).length;

      return {
        totalCrises: Object.keys(crisisByDay).length,
        recentCrises,
        crisisDays: Object.keys(crisisByDay)
      };
    } catch (error) {
      console.error('[CrisisTrendAnalyzer] Error obteniendo historial de crisis:', error);
      // Fallback: usar mensajes si CrisisEvent no está disponible
      try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const crisisMessages = await Message.find({
          userId,
          role: 'user',
          createdAt: { $gte: startDate },
          'metadata.context.emotional.intensity': { $gte: 8 },
          'metadata.context.emotional.mainEmotion': { 
            $in: ['tristeza', 'ansiedad', 'enojo', 'miedo'] 
          }
        })
          .select('createdAt metadata.context.emotional')
          .sort({ createdAt: -1 })
          .lean();

        const crisisByDay = {};
        crisisMessages.forEach(msg => {
          const day = msg.createdAt.toISOString().split('T')[0];
          if (!crisisByDay[day]) {
            crisisByDay[day] = [];
          }
          crisisByDay[day].push(msg);
        });

        return {
          totalCrises: Object.keys(crisisByDay).length,
          recentCrises: Object.keys(crisisByDay).filter(day => {
            const dayDate = new Date(day);
            const daysAgo = (Date.now() - dayDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          }).length,
          crisisDays: Object.keys(crisisByDay)
        };
      } catch (fallbackError) {
        console.error('[CrisisTrendAnalyzer] Error en fallback:', fallbackError);
        return { totalCrises: 0, recentCrises: 0, crisisDays: [] };
      }
    }
  }
}

// Singleton instance
const crisisTrendAnalyzer = new CrisisTrendAnalyzer();
export default crisisTrendAnalyzer;

