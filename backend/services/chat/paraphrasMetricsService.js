/**
 * Servicio de métricas de paráfrasis.
 * Propuesta #55: Paráfrasis + validación antes consejo - Fase 2
 *
 * Registra y analiza métricas de uso de paráfrasis:
 * - Tasa de adherencia (requeridas vs. detectadas)
 * - Correlación con WAI scores
 * - Impacto en retención
 */

import Message from '../../models/Message.js';
import Conversation from '../../models/Conversation.js';

/**
 * Límites y configuración para métricas
 */
export const METRICS_CONFIG = {
  MAX_LOOKBACK_DAYS: 90, // Máximo días atrás para análisis
  MIN_CONVERSATIONS_FOR_STATS: 10, // Mínimo de conversaciones para estadísticas confiables
};

/**
 * Registra métricas de paráfrasis en el turno.
 * Se llama después de persistir el mensaje del asistente.
 *
 * @param {string} conversationId - ID de la conversación
 * @param {string} messageId - ID del mensaje del asistente
 * @param {Object} metricsData - Datos de métricas
 * @param {boolean} metricsData.wasRequired - ¿Se requería paráfrasis según reglas?
 * @param {boolean} metricsData.wasDetected - ¿Se detectó paráfrasis en la respuesta?
 * @param {number} metricsData.confidence - Confianza de detección (0-1)
 * @param {Object} [metricsData.emotionalContext] - Contexto emocional del turno
 * @returns {Promise<void>}
 */
export async function recordParaphrasMetrics(conversationId, messageId, metricsData) {
  // Validar entrada
  if (!conversationId || typeof conversationId !== 'string') {
    console.warn('[recordParaphrasMetrics] Invalid conversationId:', conversationId);
    return;
  }

  if (!messageId || typeof messageId !== 'string') {
    console.warn('[recordParaphrasMetrics] Invalid messageId:', messageId);
    return;
  }

  if (!metricsData || typeof metricsData !== 'object' || Array.isArray(metricsData)) {
    console.warn('[recordParaphrasMetrics] Invalid metricsData:', metricsData);
    return;
  }

  const { wasRequired, wasDetected, confidence, emotionalContext } = metricsData;

  // Validar tipos
  const normalizedWasRequired = Boolean(wasRequired);
  const normalizedWasDetected = Boolean(wasDetected);
  const normalizedConfidence =
    typeof confidence === 'number' && !isNaN(confidence) && isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : 0;

  try {
    // Actualizar metadatos del mensaje
    await Message.findByIdAndUpdate(messageId, {
      $set: {
        'metadata.paraphrasis': {
          wasRequired: normalizedWasRequired,
          wasDetected: normalizedWasDetected,
          confidence: normalizedConfidence,
          timestamp: new Date(),
        },
      },
    });

    // Agregar a métricas de conversación (para análisis agregado)
    const updateOps = {};

    if (normalizedWasRequired) {
      updateOps['metrics.paraphrasisRequired'] = 1;
    }

    if (normalizedWasDetected) {
      updateOps['metrics.paraphrasisDetected'] = 1;
    }

    if (Object.keys(updateOps).length > 0) {
      await Conversation.findByIdAndUpdate(conversationId, { $inc: updateOps });
    }

    // Log para análisis (opcional: enviar a servicio de métricas externo)
    console.log('[ParaphrasMetrics]', {
      conversationId,
      messageId,
      wasRequired: normalizedWasRequired,
      wasDetected: normalizedWasDetected,
      confidence: normalizedConfidence,
      emotionalIntensity: emotionalContext?.intensity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[recordParaphrasMetrics] Error recording metrics:', error.message);
    // No fallar el flujo si las métricas fallan
  }
}

/**
 * Obtiene estadísticas agregadas de paráfrasis para análisis.
 *
 * @param {Object} [filters={}] - Filtros opcionales
 * @param {string} [filters.userId] - ID del usuario
 * @param {string} [filters.conversationId] - ID de la conversación
 * @param {Date|string} [filters.startDate] - Fecha de inicio
 * @param {Date|string} [filters.endDate] - Fecha de fin
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export async function getParaphrasStats(filters = {}) {
  // Validar entrada
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    filters = {};
  }

  const { userId, conversationId, startDate, endDate } = filters;

  try {
    // Construir query de match
    const match = {};

    if (userId && typeof userId === 'string') {
      match.userId = userId;
    }

    if (conversationId && typeof conversationId === 'string') {
      match._id = conversationId;
    }

    // Validar y normalizar fechas
    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const normalizedStartDate = new Date(startDate);
        if (!isNaN(normalizedStartDate.getTime())) {
          match.createdAt.$gte = normalizedStartDate;
        }
      }

      if (endDate) {
        const normalizedEndDate = new Date(endDate);
        if (!isNaN(normalizedEndDate.getTime())) {
          match.createdAt.$lte = normalizedEndDate;
        }
      }

      // Si no hay fechas válidas, remover el campo
      if (Object.keys(match.createdAt).length === 0) {
        delete match.createdAt;
      }
    }

    // Ejecutar agregación
    const stats = await Conversation.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalParaphrasisRequired: { $sum: { $ifNull: ['$metrics.paraphrasisRequired', 0] } },
          totalParaphrasisDetected: { $sum: { $ifNull: ['$metrics.paraphrasisDetected', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalConversations: 1,
          totalParaphrasisRequired: 1,
          totalParaphrasisDetected: 1,
          adherenceRate: {
            $cond: {
              if: { $gt: ['$totalParaphrasisRequired', 0] },
              then: { $divide: ['$totalParaphrasisDetected', '$totalParaphrasisRequired'] },
              else: 0,
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalConversations: 0,
      totalParaphrasisRequired: 0,
      totalParaphrasisDetected: 0,
      adherenceRate: 0,
    };

    return result;
  } catch (error) {
    console.error('[getParaphrasStats] Error fetching stats:', error.message);
    return {
      totalConversations: 0,
      totalParaphrasisRequired: 0,
      totalParaphrasisDetected: 0,
      adherenceRate: 0,
      error: error.message,
    };
  }
}

/**
 * Obtiene métricas detalladas de paráfrasis para un usuario específico.
 *
 * @param {string} userId - ID del usuario
 * @param {Object} [options={}] - Opciones adicionales
 * @param {number} [options.limit=50] - Límite de mensajes a analizar
 * @returns {Promise<Object>} Métricas detalladas
 */
export async function getUserParaphrasMetrics(userId, options = {}) {
  // Validar entrada
  if (!userId || typeof userId !== 'string') {
    return {
      userId: null,
      totalMessages: 0,
      paraphrasisRequired: 0,
      paraphrasisDetected: 0,
      adherenceRate: 0,
      recentMessages: [],
    };
  }

  const limit = typeof options.limit === 'number' && options.limit > 0 ? Math.min(options.limit, 100) : 50;

  try {
    // Buscar conversaciones del usuario
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    if (conversations.length === 0) {
      return {
        userId,
        totalMessages: 0,
        paraphrasisRequired: 0,
        paraphrasisDetected: 0,
        adherenceRate: 0,
        recentMessages: [],
      };
    }

    const conversationIds = conversations.map((c) => c._id);

    // Buscar mensajes del asistente con métricas de paráfrasis
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      role: 'assistant',
      'metadata.paraphrasis': { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Calcular métricas
    let paraphrasisRequired = 0;
    let paraphrasisDetected = 0;

    const recentMessages = messages.map((msg) => {
      const paraphrasisMeta = msg.metadata?.paraphrasis || {};

      if (paraphrasisMeta.wasRequired) paraphrasisRequired++;
      if (paraphrasisMeta.wasDetected) paraphrasisDetected++;

      return {
        messageId: msg._id,
        conversationId: msg.conversationId,
        wasRequired: Boolean(paraphrasisMeta.wasRequired),
        wasDetected: Boolean(paraphrasisMeta.wasDetected),
        confidence: paraphrasisMeta.confidence || 0,
        timestamp: msg.createdAt,
      };
    });

    const adherenceRate = paraphrasisRequired > 0 ? paraphrasisDetected / paraphrasisRequired : 0;

    return {
      userId,
      totalMessages: messages.length,
      paraphrasisRequired,
      paraphrasisDetected,
      adherenceRate,
      recentMessages,
    };
  } catch (error) {
    console.error('[getUserParaphrasMetrics] Error fetching user metrics:', error.message);
    return {
      userId,
      totalMessages: 0,
      paraphrasisRequired: 0,
      paraphrasisDetected: 0,
      adherenceRate: 0,
      recentMessages: [],
      error: error.message,
    };
  }
}

/**
 * Calcula la tasa de adherencia de paráfrasis en un rango de fechas.
 *
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {Promise<number>} Tasa de adherencia (0-1)
 */
export async function calculateAdherenceRate(startDate, endDate) {
  try {
    const stats = await getParaphrasStats({ startDate, endDate });
    return stats.adherenceRate || 0;
  } catch (error) {
    console.error('[calculateAdherenceRate] Error calculating rate:', error.message);
    return 0;
  }
}

/**
 * Valida que las métricas de paráfrasis estén configuradas correctamente.
 *
 * @returns {Promise<Object>} Resultado de validación
 */
export async function validateParaphrasMetricsSetup() {
  try {
    // Verificar que existan conversaciones con métricas
    const sampleConversation = await Conversation.findOne({
      'metrics.paraphrasisRequired': { $exists: true },
    }).lean();

    const hasSampleConversation = Boolean(sampleConversation);

    // Verificar que existan mensajes con metadata de paráfrasis
    const sampleMessage = await Message.findOne({
      'metadata.paraphrasis': { $exists: true },
    }).lean();

    const hasSampleMessage = Boolean(sampleMessage);

    return {
      isConfigured: hasSampleConversation && hasSampleMessage,
      hasSampleConversation,
      hasSampleMessage,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[validateParaphrasMetricsSetup] Error validating setup:', error.message);
    return {
      isConfigured: false,
      hasSampleConversation: false,
      hasSampleMessage: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
