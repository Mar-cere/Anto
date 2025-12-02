/**
 * Servicio de Métricas de Crisis - Proporciona estadísticas y métricas
 * sobre eventos de crisis, tendencias emocionales y seguimientos
 */
import CrisisEvent from '../models/CrisisEvent.js';
import Message from '../models/Message.js';
import TherapeuticTechniqueUsage from '../models/TherapeuticTechniqueUsage.js';
import crisisTrendAnalyzer from './crisisTrendAnalyzer.js';
import { selectAppropriateTechnique } from '../constants/therapeuticTechniques.js';

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

  /**
   * Compara métricas entre dos períodos
   * @param {string} userId - ID del usuario
   * @param {number} currentDays - Días del período actual
   * @param {number} previousDays - Días del período anterior
   * @returns {Promise<Object>} Comparación de períodos
   */
  async comparePeriods(userId, currentDays = 30, previousDays = 30) {
    try {
      const currentStart = new Date(Date.now() - currentDays * 24 * 60 * 60 * 1000);
      const previousStart = new Date(Date.now() - (currentDays + previousDays) * 24 * 60 * 60 * 1000);
      const previousEnd = currentStart;

      const [currentCrises, previousCrises] = await Promise.all([
        CrisisEvent.find({
          userId,
          detectedAt: { $gte: currentStart }
        }).lean(),
        CrisisEvent.find({
          userId,
          detectedAt: { $gte: previousStart, $lt: previousEnd }
        }).lean()
      ]);

      const currentSummary = await this.getCrisisSummary(userId, currentDays);
      const previousSummary = {
        totalCrises: previousCrises.length,
        crisesByLevel: {
          LOW: previousCrises.filter(c => c.riskLevel === 'LOW').length,
          WARNING: previousCrises.filter(c => c.riskLevel === 'WARNING').length,
          MEDIUM: previousCrises.filter(c => c.riskLevel === 'MEDIUM').length,
          HIGH: previousCrises.filter(c => c.riskLevel === 'HIGH').length
        },
        resolutionRate: previousCrises.length > 0
          ? previousCrises.filter(c => c.outcome === 'resolved' || c.resolvedAt !== null).length / previousCrises.length
          : 0
      };

      return {
        current: currentSummary,
        previous: previousSummary,
        comparison: {
          totalCrisesChange: currentSummary.totalCrises - previousSummary.totalCrises,
          totalCrisesChangePercent: previousSummary.totalCrises > 0
            ? ((currentSummary.totalCrises - previousSummary.totalCrises) / previousSummary.totalCrises * 100).toFixed(1)
            : currentSummary.totalCrises > 0 ? 100 : 0,
          resolutionRateChange: currentSummary.resolutionRate - previousSummary.resolutionRate,
          resolutionRateChangePercent: previousSummary.resolutionRate > 0
            ? ((currentSummary.resolutionRate - previousSummary.resolutionRate) / previousSummary.resolutionRate * 100).toFixed(1)
            : currentSummary.resolutionRate > 0 ? 100 : 0
        }
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error comparando períodos:', error);
      throw error;
    }
  }

  /**
   * Genera datos para exportación CSV
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás
   * @returns {Promise<Object>} Datos formateados para CSV
   */
  async getExportData(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [summary, trends, monthlyData, history, alertsStats, followUpStats] = await Promise.all([
        this.getCrisisSummary(userId, days),
        this.getEmotionalTrends(userId, '30d'),
        this.getCrisisByMonth(userId, Math.ceil(days / 30)),
        this.getCrisisHistory(userId, { limit: 1000, offset: 0 }),
        this.getAlertStatistics(userId, days),
        this.getFollowUpStatistics(userId, days)
      ]);

      return {
        summary,
        trends,
        monthlyData,
        history: history.crises,
        alertsStats,
        followUpStats,
        exportDate: new Date().toISOString(),
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo datos para exportación:', error);
      throw error;
    }
  }

  /**
   * Obtiene recomendaciones de técnicas basadas en crisis detectadas
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás
   * @returns {Promise<Object>} Recomendaciones de técnicas
   */
  async getTechniqueRecommendations(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Obtener crisis recientes
      const recentCrises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate }
      })
        .select('triggerMessage.emotionalAnalysis riskLevel')
        .sort({ detectedAt: -1 })
        .limit(10)
        .lean();

      // Obtener técnicas más efectivas del usuario
      const mostEffectiveTechniques = await TherapeuticTechniqueUsage.getMostUsedTechniques(userId, 5);
      
      // Analizar emociones más frecuentes en crisis
      const emotionCounts = {};
      recentCrises.forEach(crisis => {
        const emotion = crisis.triggerMessage?.emotionalAnalysis?.mainEmotion || 'neutral';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });

      const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
      );

      // Obtener nivel de riesgo promedio
      const riskLevelValues = { LOW: 1, WARNING: 2, MEDIUM: 3, HIGH: 4 };
      const avgRiskLevel = recentCrises.length > 0
        ? recentCrises.reduce((sum, c) => sum + (riskLevelValues[c.riskLevel] || 2), 0) / recentCrises.length
        : 2;
      const avgIntensity = avgRiskLevel < 1.5 ? 4 : avgRiskLevel < 2.5 ? 6 : avgRiskLevel < 3.5 ? 7 : 9;

      // Seleccionar técnicas recomendadas
      const recommendedTechniques = [];
      
      // Técnica basada en emoción más frecuente
      if (mostFrequentEmotion !== 'neutral') {
        const technique = selectAppropriateTechnique(mostFrequentEmotion, avgIntensity, 'intermedia');
        if (technique) {
          recommendedTechniques.push({
            ...technique,
            reason: `Basada en tu emoción más frecuente en crisis: ${mostFrequentEmotion}`,
            priority: 'high'
          });
        }
      }

      // Técnicas más efectivas del usuario
      mostEffectiveTechniques.slice(0, 2).forEach(tech => {
        if (tech.averageEffectiveness && tech.averageEffectiveness >= 3.5) {
          recommendedTechniques.push({
            techniqueId: tech.techniqueId,
            name: tech.techniqueName,
            type: tech.techniqueType,
            reason: `Técnica que te ha funcionado bien (efectividad: ${tech.averageEffectiveness}/5)`,
            priority: 'medium',
            effectiveness: tech.averageEffectiveness
          });
        }
      });

      return {
        recommendedTechniques,
        mostFrequentEmotion,
        recentCrisesCount: recentCrises.length,
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error obteniendo recomendaciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene análisis de efectividad de técnicas por tipo de crisis
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia atrás
   * @returns {Promise<Object>} Análisis de efectividad
   */
  async getTechniqueEffectivenessAnalysis(userId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Obtener técnicas usadas en el período
      const techniquesUsed = await TherapeuticTechniqueUsage.find({
        userId,
        createdAt: { $gte: startDate }
      })
        .select('techniqueId techniqueName techniqueType emotion effectiveness completed emotionalIntensityBefore emotionalIntensityAfter')
        .lean();

      // Obtener crisis resueltas en el período
      const resolvedCrises = await CrisisEvent.find({
        userId,
        detectedAt: { $gte: startDate },
        outcome: 'resolved'
      })
        .select('detectedAt resolvedAt riskLevel triggerMessage.emotionalAnalysis')
        .lean();

      // Analizar correlación entre uso de técnicas y resolución de crisis
      const techniqueEffectiveness = {};
      
      techniquesUsed.forEach(usage => {
        const key = usage.techniqueId;
        if (!techniqueEffectiveness[key]) {
          techniqueEffectiveness[key] = {
            techniqueId: usage.techniqueId,
            techniqueName: usage.techniqueName,
            techniqueType: usage.techniqueType,
            totalUses: 0,
            completedUses: 0,
            totalEffectiveness: 0,
            effectivenessCount: 0,
            intensityReduction: 0,
            intensityReductionCount: 0
          };
        }

        techniqueEffectiveness[key].totalUses++;
        if (usage.completed) {
          techniqueEffectiveness[key].completedUses++;
        }
        if (usage.effectiveness) {
          techniqueEffectiveness[key].totalEffectiveness += usage.effectiveness;
          techniqueEffectiveness[key].effectivenessCount++;
        }
        if (usage.emotionalIntensityBefore && usage.emotionalIntensityAfter) {
          const reduction = usage.emotionalIntensityBefore - usage.emotionalIntensityAfter;
          techniqueEffectiveness[key].intensityReduction += reduction;
          techniqueEffectiveness[key].intensityReductionCount++;
        }
      });

      // Calcular promedios
      const effectivenessData = Object.values(techniqueEffectiveness).map(tech => ({
        ...tech,
        completionRate: tech.totalUses > 0 ? tech.completedUses / tech.totalUses : 0,
        averageEffectiveness: tech.effectivenessCount > 0 
          ? tech.totalEffectiveness / tech.effectivenessCount 
          : null,
        averageIntensityReduction: tech.intensityReductionCount > 0
          ? tech.intensityReduction / tech.intensityReductionCount
          : null
      }));

      // Ordenar por efectividad promedio
      effectivenessData.sort((a, b) => {
        const aScore = (a.averageEffectiveness || 0) + (a.averageIntensityReduction || 0);
        const bScore = (b.averageEffectiveness || 0) + (b.averageIntensityReduction || 0);
        return bScore - aScore;
      });

      return {
        techniques: effectivenessData,
        totalTechniquesUsed: techniquesUsed.length,
        resolvedCrisesCount: resolvedCrises.length,
        period: days
      };
    } catch (error) {
      console.error('[CrisisMetricsService] Error analizando efectividad:', error);
      throw error;
    }
  }
}

// Singleton instance
const crisisMetricsService = new CrisisMetricsService();
export default crisisMetricsService;

