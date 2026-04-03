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
      },
      promptHistoryTruncation: {
        events: 0,
        truncatedEvents: 0,
        tailOnlyEvents: 0,
        sumDroppedTotal: 0,
        sumNonempty: 0,
        maxDroppedInEvent: 0,
        bySource: {},
        byCallSite: {}
      },
      /** Contadores ligeros en memoria: todas las selecciones vs truncadas (sin escribir en Mongo por mensaje). */
      promptHistorySelectionSamples: {
        totalSelections: 0,
        truncatedSelections: 0
      },
      /** Respuestas del asistente: frases tipo plantilla y solapamiento con el último mensaje del usuario. */
      chatTemplateSignals: {
        total: 0,
        sumStockScore: 0,
        sumEchoRatio: 0,
        sumEchoUsefulRatio: 0,
        sumEchoEmptyRatio: 0,
        hitsByPhrase: {},
        byResponseStyle: {},
        byChatPrefsKey: {}
      },
      /** Pulgar arriba/abajo en mensajes del asistente */
      messageFeedback: {
        up: 0,
        down: 0,
        cleared: 0
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
  /**
   * Muestra en memoria cada llamada a selectHistoryForPrompt (barato; no persiste en Mongo).
   * @param {{ truncated?: boolean }} data
   */
  recordPromptHistorySelectionSample(data) {
    const s = this.inMemoryMetrics.promptHistorySelectionSamples;
    s.totalSelections++;
    if (data.truncated) s.truncatedSelections++;
  }

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

      case 'prompt_history_truncation': {
        const ph = this.inMemoryMetrics.promptHistoryTruncation;
        ph.events++;
        if (data.truncated) ph.truncatedEvents++;
        if (data.tailOnly) ph.tailOnlyEvents++;
        ph.sumDroppedTotal += data.droppedTotal || 0;
        ph.sumNonempty += data.nonemptyCount || 0;
        const dropped = data.droppedTotal || 0;
        if (dropped > ph.maxDroppedInEvent) ph.maxDroppedInEvent = dropped;
        const src = data.source || 'unknown';
        ph.bySource[src] = (ph.bySource[src] || 0) + 1;
        const cs = data.callSite || 'unknown';
        ph.byCallSite[cs] = (ph.byCallSite[cs] || 0) + 1;
        break;
      }

      case 'chat_template_signals': {
        const c = this.inMemoryMetrics.chatTemplateSignals;
        c.total++;
        c.sumStockScore += data.stockPhraseScore || 0;
        c.sumEchoRatio += data.echoOverlapRatio || 0;
        c.sumEchoUsefulRatio += data.echoUsefulRatio || 0;
        c.sumEchoEmptyRatio += data.echoEmptyRatio || 0;
        const hits = data.stockPhraseHits || {};
        for (const k of Object.keys(hits)) {
          c.hitsByPhrase[k] = (c.hitsByPhrase[k] || 0) + hits[k];
        }
        const rs = data.responseStyle || 'unknown';
        c.byResponseStyle[rs] = (c.byResponseStyle[rs] || 0) + 1;
        const pk = data.chatPrefsKey || 'r0a0p0';
        c.byChatPrefsKey[pk] = (c.byChatPrefsKey[pk] || 0) + 1;
        break;
      }

      case 'message_feedback': {
        const mf = this.inMemoryMetrics.messageFeedback;
        const h = data.helpful;
        if (h === 'up') mf.up++;
        else if (h === 'down') mf.down++;
        else if (h === 'cleared') mf.cleared++;
        break;
      }
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

    const ph = this.inMemoryMetrics.promptHistoryTruncation;
    const samples = this.inMemoryMetrics.promptHistorySelectionSamples;
    const promptHistory = {
      samples: {
        totalSelections: samples.totalSelections,
        truncatedSelections: samples.truncatedSelections,
        truncatedRateOfSelections:
          samples.totalSelections > 0
            ? ((samples.truncatedSelections / samples.totalSelections) * 100).toFixed(2) + '%'
            : '0%'
      },
      truncatedEventsDetail:
        ph.events > 0
          ? {
              persistedEvents: ph.events,
              truncatedRate: ((ph.truncatedEvents / ph.events) * 100).toFixed(2) + '%',
              tailOnlyEvents: ph.tailOnlyEvents,
              avgDroppedWhenTruncated:
                ph.truncatedEvents > 0
                  ? (ph.sumDroppedTotal / ph.truncatedEvents).toFixed(2)
                  : '0',
              maxDroppedInEvent: ph.maxDroppedInEvent,
              bySource: ph.bySource,
              byCallSite: ph.byCallSite
            }
          : null
    };

    const cts = this.inMemoryMetrics.chatTemplateSignals;
    const chatTemplateSignals =
      cts.total > 0
        ? {
            samples: cts.total,
            avgStockScore: (cts.sumStockScore / cts.total).toFixed(3),
            avgEchoOverlap: (cts.sumEchoRatio / cts.total).toFixed(3),
            avgEchoUseful: (cts.sumEchoUsefulRatio / cts.total).toFixed(3),
            avgEchoEmpty: (cts.sumEchoEmptyRatio / cts.total).toFixed(3),
            byResponseStyle: cts.byResponseStyle,
            byChatPrefsKey: cts.byChatPrefsKey
          }
        : null;

    return {
      status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
      errorRate: errorRate.toFixed(2),
      totalRequests: this.inMemoryMetrics.responseGeneration.total,
      averageResponseTime: this.inMemoryMetrics.responseGeneration.averageTime.toFixed(2),
      recentErrors: recentErrors.length,
      activeSessions: this.inMemoryMetrics.sessionMemory.activeSessions,
      cacheStats: cacheStats,
      promptHistoryTruncation: promptHistory,
      chatTemplateSignals
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

