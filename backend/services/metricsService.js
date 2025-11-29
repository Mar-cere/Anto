/**
 * Servicio de Métricas y Monitoreo
 * 
 * Recolecta y almacena métricas del sistema para análisis y monitoreo
 */
import mongoose from 'mongoose';

// Schema de métricas (opcional, puede usarse en memoria también)
const metricsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  type: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  data: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

// Índices para consultas eficientes
metricsSchema.index({ timestamp: -1, type: 1 });
metricsSchema.index({ userId: 1, timestamp: -1 });

// Solo crear modelo si no existe
let Metric;
try {
  Metric = mongoose.models.Metric || mongoose.model('Metric', metricsSchema);
} catch (error) {
  Metric = mongoose.model('Metric', metricsSchema);
}

class MetricsService {
  constructor() {
    // Métricas en memoria (para acceso rápido)
    this.inMemoryMetrics = {
      emotionalAnalysis: {
        total: 0,
        byEmotion: {},
        bySubtype: {},
        byTopic: {},
        averageIntensity: 0,
        averageConfidence: 0
      },
      sessionMemory: {
        activeSessions: 0,
        totalAnalyses: 0,
        averageSessionLength: 0
      },
      therapeuticTemplates: {
        usage: {},
        effectiveness: {}
      },
      protocols: {
        started: 0,
        completed: 0,
        byType: {}
      },
      actionSuggestions: {
        generated: 0,
        clicked: 0,
        byType: {}
      },
      responseGeneration: {
        total: 0,
        averageTime: 0,
        errors: 0
      }
    };

    // Historial de métricas (últimas 1000 entradas)
    this.metricsHistory = [];
    this.MAX_HISTORY_SIZE = 1000;
  }

  /**
   * Registra una métrica
   * @param {string} type - Tipo de métrica
   * @param {Object} data - Datos de la métrica
   * @param {string} userId - ID del usuario (opcional)
   * @param {Object} metadata - Metadata adicional (opcional)
   */
  async recordMetric(type, data, userId = null, metadata = {}) {
    try {
      // Actualizar métricas en memoria
      this.updateInMemoryMetrics(type, data, userId);

      // Agregar al historial
      this.addToHistory({
        timestamp: new Date(),
        type,
        userId,
        data,
        metadata
      });

      // Guardar en BD si está disponible (opcional, puede ser async)
      if (mongoose.connection.readyState === 1) {
        Metric.create({
          type,
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
          data,
          metadata
        }).catch(error => {
          // No bloquear si falla el guardado en BD
          console.warn('[MetricsService] Error guardando métrica en BD:', error.message);
        });
      }
    } catch (error) {
      console.error('[MetricsService] Error registrando métrica:', error);
    }
  }

  /**
   * Actualiza métricas en memoria
   * @param {string} type - Tipo de métrica
   * @param {Object} data - Datos
   * @param {string} userId - ID del usuario
   */
  updateInMemoryMetrics(type, data, userId) {
    switch (type) {
      case 'emotional_analysis':
        this.inMemoryMetrics.emotionalAnalysis.total++;
        if (data.mainEmotion) {
          this.inMemoryMetrics.emotionalAnalysis.byEmotion[data.mainEmotion] = 
            (this.inMemoryMetrics.emotionalAnalysis.byEmotion[data.mainEmotion] || 0) + 1;
        }
        if (data.subtype) {
          this.inMemoryMetrics.emotionalAnalysis.bySubtype[data.subtype] = 
            (this.inMemoryMetrics.emotionalAnalysis.bySubtype[data.subtype] || 0) + 1;
        }
        if (data.topic) {
          this.inMemoryMetrics.emotionalAnalysis.byTopic[data.topic] = 
            (this.inMemoryMetrics.emotionalAnalysis.byTopic[data.topic] || 0) + 1;
        }
        // Actualizar promedios
        const total = this.inMemoryMetrics.emotionalAnalysis.total;
        const currentAvgIntensity = this.inMemoryMetrics.emotionalAnalysis.averageIntensity;
        const currentAvgConfidence = this.inMemoryMetrics.emotionalAnalysis.averageConfidence;
        this.inMemoryMetrics.emotionalAnalysis.averageIntensity = 
          ((currentAvgIntensity * (total - 1)) + (data.intensity || 0)) / total;
        this.inMemoryMetrics.emotionalAnalysis.averageConfidence = 
          ((currentAvgConfidence * (total - 1)) + (data.confidence || 0)) / total;
        break;

      case 'session_memory':
        if (data.action === 'add') {
          this.inMemoryMetrics.sessionMemory.totalAnalyses++;
        } else if (data.action === 'active') {
          this.inMemoryMetrics.sessionMemory.activeSessions = data.count || 0;
        }
        break;

      case 'therapeutic_template':
        const templateKey = `${data.emotion}_${data.subtype || 'none'}`;
        this.inMemoryMetrics.therapeuticTemplates.usage[templateKey] = 
          (this.inMemoryMetrics.therapeuticTemplates.usage[templateKey] || 0) + 1;
        break;

      case 'protocol':
        if (data.action === 'start') {
          this.inMemoryMetrics.protocols.started++;
          this.inMemoryMetrics.protocols.byType[data.protocolType] = 
            (this.inMemoryMetrics.protocols.byType[data.protocolType] || 0) + 1;
        } else if (data.action === 'complete') {
          this.inMemoryMetrics.protocols.completed++;
        }
        break;

      case 'action_suggestion':
        if (data.action === 'generate') {
          this.inMemoryMetrics.actionSuggestions.generated++;
          if (data.suggestionType) {
            this.inMemoryMetrics.actionSuggestions.byType[data.suggestionType] = 
              (this.inMemoryMetrics.actionSuggestions.byType[data.suggestionType] || 0) + 1;
          }
        } else if (data.action === 'click') {
          this.inMemoryMetrics.actionSuggestions.clicked++;
        }
        break;

      case 'response_generation':
        this.inMemoryMetrics.responseGeneration.total++;
        if (data.error) {
          this.inMemoryMetrics.responseGeneration.errors++;
        }
        if (data.time) {
          const total = this.inMemoryMetrics.responseGeneration.total;
          const currentAvg = this.inMemoryMetrics.responseGeneration.averageTime;
          this.inMemoryMetrics.responseGeneration.averageTime = 
            ((currentAvg * (total - 1)) + data.time) / total;
        }
        break;
    }
  }

  /**
   * Agrega métrica al historial
   * @param {Object} metric - Métrica a agregar
   */
  addToHistory(metric) {
    this.metricsHistory.push(metric);
    
    // Limitar tamaño del historial
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory.shift(); // Eliminar la más antigua
    }
  }

  /**
   * Obtiene métricas en memoria
   * @returns {Object} Métricas actuales
   */
  getMetrics() {
    return {
      ...this.inMemoryMetrics,
      historySize: this.metricsHistory.length,
      lastUpdated: new Date()
    };
  }

  /**
   * Obtiene métricas de un tipo específico
   * @param {string} type - Tipo de métrica
   * @returns {Object} Métricas del tipo
   */
  getMetricsByType(type) {
    return this.metricsHistory
      .filter(m => m.type === type)
      .slice(-100); // Últimas 100 del tipo
  }

  /**
   * Obtiene métricas de un usuario específico
   * @param {string} userId - ID del usuario
   * @returns {Array} Métricas del usuario
   */
  getUserMetrics(userId) {
    return this.metricsHistory
      .filter(m => m.userId && m.userId.toString() === userId.toString())
      .slice(-50); // Últimas 50 del usuario
  }

  /**
   * Obtiene estadísticas de salud del sistema
   * @returns {Promise<Object>} Estadísticas de salud
   */
  async getHealthStats() {
    const recentErrors = this.metricsHistory
      .filter(m => m.type === 'response_generation' && m.data?.error)
      .slice(-10);

    const errorRate = this.inMemoryMetrics.responseGeneration.total > 0
      ? (this.inMemoryMetrics.responseGeneration.errors / this.inMemoryMetrics.responseGeneration.total) * 100
      : 0;

    const cacheStats = await this.getCacheStats();

    return {
      status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
      errorRate: errorRate.toFixed(2),
      totalRequests: this.inMemoryMetrics.responseGeneration.total,
      averageResponseTime: this.inMemoryMetrics.responseGeneration.averageTime.toFixed(2),
      recentErrors: recentErrors.length,
      activeSessions: this.inMemoryMetrics.sessionMemory.activeSessions,
      cacheStats: cacheStats
    };
  }

  /**
   * Obtiene estadísticas de caché (si está disponible)
   * @returns {Object} Estadísticas de caché
   */
  getCacheStats() {
    try {
      const { default: analysisCache } = require('./emotionalAnalysisCache.js');
      return analysisCache.getStats();
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Limpia métricas antiguas
   * @param {number} daysToKeep - Días de métricas a mantener
   */
  async cleanupOldMetrics(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      if (mongoose.connection.readyState === 1) {
        const result = await Metric.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        
        console.log(`[MetricsService] Limpieza: ${result.deletedCount} métricas antiguas eliminadas`);
        return result.deletedCount;
      }
    } catch (error) {
      console.error('[MetricsService] Error limpiando métricas antiguas:', error);
      return 0;
    }
  }
}

export default new MetricsService();

