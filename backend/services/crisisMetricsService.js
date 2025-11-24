/**
 * Servicio de Métricas de Crisis - Proporciona estadísticas y métricas
 * sobre eventos de crisis, tendencias emocionales y seguimientos
 */
import CrisisEvent from '../models/CrisisEvent.js';
import Message from '../models/Message.js';
import crisisTrendAnalyzer from './crisisTrendAnalyzer.js';

class CrisisMetricsService {
  /**
   * Obtiene un resumen general de crisis del usuario
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás (default: 30)
   * @returns {Promise<Object>} Resumen de crisis
   */
  async getCrisisSummary(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Obtener todas las crisis del período
      const crises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate }
      }).lean();

      // Calcular métricas
      const totalCrises = crises.length;
      const crisesByLevel = {
        LOW: crises.filter(c => c.riskLevel === 'LOW').length,
        WARNING: crises.filter(c => c.riskLevel === 'WARNING').length,
        MEDIUM: crises.filter(c => c.riskLevel === 'MEDIUM').length,
        HIGH: crises.filter(c => c.riskLevel === 'HIGH').length
      };

      // Crisis este mes
      const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const crisesThisMonth = crises.filter(c => 
        new Date(c.detectedAt) >= thisMonthStart
      ).length;

      // Crisis recientes (últimos 7 días)
      const recentStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCrises = crises.filter(c => 
        new Date(c.detectedAt) >= recentStart
      ).length;

      // Tasa de resolución
      const resolvedCrises = crises.filter(c => 
        c.outcome === 'resolved' || c.resolvedAt !== null
      ).length;
      const resolutionRate = totalCrises > 0 ? resolvedCrises / totalCrises : 0;

      // Alertas enviadas
      const alertsSent = crises.filter(c => 
        c.alerts?.sent === true
      ).length;

      // Seguimientos completados
      const followUpsCompleted = crises.filter(c => 
        c.followUp?.completed === true
      ).length;

      // Nivel de riesgo promedio (convertir a número para cálculo)
      const riskLevelValues = { LOW: 1, WARNING: 2, MEDIUM: 3, HIGH: 4 };
      const averageRiskLevel = totalCrises > 0
        ? crises.reduce((sum, c) => sum + (riskLevelValues[c.riskLevel] || 2), 0) / totalCrises
        : 0;
      
      const averageRiskLevelText = averageRiskLevel < 1.5 ? 'LOW' :
                                   averageRiskLevel < 2.5 ? 'WARNING' :
                                   averageRiskLevel < 3.5 ? 'MEDIUM' : 'HIGH';

      return {
        totalCrises,
        crisesThisMonth,
        recentCrises,
        crisesByLevel,
        averageRiskLevel: averageRiskLevelText,
        resolutionRate: Math.round(resolutionRate * 100) / 100,
        alertsSent,
        followUpsCompleted,
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo resumen:', error);
      throw error;
    }
  }

  /**
   * Obtiene tendencias emocionales del usuario
   * @param {string} userId - ID del usuario
   * @param {string} period - Período: '7d', '30d', '90d' (default: '30d')
   * @returns {Promise<Object>} Tendencias emocionales
   */
  async getEmotionalTrends(userId, period = '30d') {
    try {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const trendAnalysis = await crisisTrendAnalyzer.analyzeTrends(userId);

      // Obtener mensajes del período para gráfico de intensidad
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const messages = await Message.find({
        userId,
        role: 'user',
        createdAt: { $gte: startDate },
        'metadata.context.emotional.intensity': { $exists: true }
      })
        .select('createdAt metadata.context.emotional')
        .sort({ createdAt: 1 })
        .lean();

      // Agrupar por día para el gráfico
      const dataPoints = [];
      const dailyData = {};

      messages.forEach(msg => {
        const date = new Date(msg.createdAt).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { intensities: [], emotions: [] };
        }
        dailyData[date].intensities.push(msg.metadata?.context?.emotional?.intensity || 5);
        dailyData[date].emotions.push(msg.metadata?.context?.emotional?.mainEmotion || 'neutral');
      });

      // Calcular promedio por día
      Object.keys(dailyData).sort().forEach(date => {
        const dayData = dailyData[date];
        const avgIntensity = dayData.intensities.reduce((sum, i) => sum + i, 0) / dayData.intensities.length;
        dataPoints.push({
          date,
          intensity: Math.round(avgIntensity * 10) / 10,
          messageCount: dayData.intensities.length
        });
      });

      // Distribución de emociones
      const emotionCounts = {};
      messages.forEach(msg => {
        const emotion = msg.metadata?.context?.emotional?.mainEmotion || 'neutral';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });

      const totalMessages = messages.length;
      const emotionDistribution = {};
      Object.keys(emotionCounts).forEach(emotion => {
        emotionDistribution[emotion] = totalMessages > 0
          ? Math.round((emotionCounts[emotion] / totalMessages) * 100) / 100
          : 0;
      });

      // Calcular intensidad promedio
      const intensities = messages.map(msg => msg.metadata?.context?.emotional?.intensity || 5);
      const averageIntensity = intensities.length > 0
        ? intensities.reduce((sum, i) => sum + i, 0) / intensities.length
        : 5;

      return {
        period,
        averageIntensity: Math.round(averageIntensity * 10) / 10,
        trend: trendAnalysis.trends?.intensityTrend || 'stable',
        emotionTrend: trendAnalysis.trends?.emotionTrend || 'stable',
        dataPoints,
        emotionDistribution,
        warnings: trendAnalysis.warnings || []
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo tendencias:', error);
      throw error;
    }
  }

  /**
   * Obtiene crisis agrupadas por mes
   * @param {string} userId - ID del usuario
   * @param {number} months - Número de meses hacia atrás (default: 6)
   * @returns {Promise<Array>} Array de crisis por mes
   */
  async getCrisisByMonth(userId, months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const crises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate }
      })
        .select('detectedAt riskLevel')
        .sort({ detectedAt: 1 })
        .lean();

      // Agrupar por mes
      const monthlyData = {};
      
      crises.forEach(crisis => {
        const date = new Date(crisis.detectedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            monthKey,
            crises: 0,
            high: 0,
            medium: 0,
            warning: 0,
            low: 0
          };
        }
        
        monthlyData[monthKey].crises++;
        monthlyData[monthKey][crisis.riskLevel.toLowerCase()]++;
      });

      // Convertir a array y ordenar
      return Object.values(monthlyData).sort((a, b) => 
        a.monthKey.localeCompare(b.monthKey)
      );
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo crisis por mes:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de crisis con detalles
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Object>} Historial de crisis paginado
   */
  async getCrisisHistory(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        riskLevel = null,
        startDate = null,
        endDate = null
      } = options;

      const query = { userId };
      
      if (riskLevel) {
        query.riskLevel = riskLevel;
      }
      
      if (startDate || endDate) {
        query.detectedAt = {};
        if (startDate) query.detectedAt.$gte = new Date(startDate);
        if (endDate) query.detectedAt.$lte = new Date(endDate);
      }

      const [crises, total] = await Promise.all([
        CrisisEvent.find(query)
          .select('-__v')
          .sort({ detectedAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        CrisisEvent.countDocuments(query)
      ]);

      return {
        crises,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de alertas
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás (default: 30)
   * @returns {Promise<Object>} Estadísticas de alertas
   */
  async getAlertStatistics(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const crises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate },
        'alerts.sent': true
      }).lean();

      const totalAlerts = crises.length;
      const alertsByChannel = {
        email: crises.filter(c => c.alerts?.channels?.email).length,
        whatsapp: crises.filter(c => c.alerts?.channels?.whatsapp).length,
        both: crises.filter(c => 
          c.alerts?.channels?.email && c.alerts?.channels?.whatsapp
        ).length
      };

      const totalContactsNotified = crises.reduce((sum, c) => 
        sum + (c.alerts?.contactsNotified || 0), 0
      );

      const averageContactsPerAlert = totalAlerts > 0
        ? totalContactsNotified / totalAlerts
        : 0;

      return {
        totalAlerts,
        alertsByChannel,
        totalContactsNotified,
        averageContactsPerAlert: Math.round(averageContactsPerAlert * 10) / 10,
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo estadísticas de alertas:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de seguimiento
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás (default: 30)
   * @returns {Promise<Object>} Estadísticas de seguimiento
   */
  async getFollowUpStatistics(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const crises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate }
      }).lean();

      const scheduled = crises.filter(c => c.followUp?.scheduled).length;
      const completed = crises.filter(c => c.followUp?.completed).length;
      const pending = scheduled - completed;

      // Outcomes
      const outcomes = {
        resolved: crises.filter(c => c.outcome === 'resolved').length,
        ongoing: crises.filter(c => c.outcome === 'ongoing').length,
        escalated: crises.filter(c => c.outcome === 'escalated').length,
        false_positive: crises.filter(c => c.outcome === 'false_positive').length,
        unknown: crises.filter(c => c.outcome === 'unknown').length
      };

      const completionRate = scheduled > 0
        ? Math.round((completed / scheduled) * 100) / 100
        : 0;

      return {
        scheduled,
        completed,
        pending,
        completionRate,
        outcomes,
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo estadísticas de seguimiento:', error);
      throw error;
    }
  }

  /**
   * Obtiene distribución de emociones en crisis
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás (default: 30)
   * @returns {Promise<Object>} Distribución de emociones
   */
  async getEmotionDistribution(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const crises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate },
        'triggerMessage.emotionalAnalysis.mainEmotion': { $exists: true }
      }).lean();

      const emotionCounts = {};
      crises.forEach(crisis => {
        const emotion = crisis.triggerMessage?.emotionalAnalysis?.mainEmotion || 'neutral';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });

      const total = crises.length;
      const distribution = {};
      Object.keys(emotionCounts).forEach(emotion => {
        distribution[emotion] = total > 0
          ? Math.round((emotionCounts[emotion] / total) * 100) / 100
          : 0;
      });

      return {
        distribution,
        total,
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo distribución de emociones:', error);
      throw error;
    }
  }
}

// Singleton instance
const crisisMetricsService = new CrisisMetricsService();
export default crisisMetricsService;

