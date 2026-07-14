/**
 * Analizador de correlación entre paráfrasis y WAI scores (#55 Fase 3)
 * 
 * Analiza si el uso de paráfrasis correlaciona con mejores scores
 * en la Working Alliance Inventory (WAI), particularmente en el eje
 * de "sentirse escuchado".
 */

import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import SessionAllianceFeedback from '../../models/SessionAllianceFeedback.js';

/**
 * Calcula la correlación de Pearson entre dos arrays.
 * @param {number[]} x - Array de valores x
 * @param {number[]} y - Array de valores y
 * @returns {number} Coeficiente de correlación (-1 a 1)
 */
function calculatePearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Analiza la correlación entre paráfrasis y WAI scores.
 * 
 * @param {Object} options - Opciones de filtrado
 * @param {string} [options.startDate] - Fecha inicio (ISO)
 * @param {string} [options.endDate] - Fecha fin (ISO)
 * @returns {Promise<Object>} Análisis de correlación
 */
export async function analyzeWaiCorrelation(options = {}) {
  const { startDate, endDate } = options;

  const matchFilters = {};
  if (startDate || endDate) {
    matchFilters.createdAt = {};
    if (startDate) matchFilters.createdAt.$gte = new Date(startDate);
    if (endDate) matchFilters.createdAt.$lte = new Date(endDate);
  }

  // Obtener conversaciones con métricas de paráfrasis y WAI feedback
  const conversations = await Conversation.aggregate([
    { $match: matchFilters },
    {
      $lookup: {
        from: 'sessionalliancefeedbacks',
        localField: '_id',
        foreignField: 'conversationId',
        as: 'waiFeedback',
      },
    },
    {
      $match: {
        'metrics.paraphrasisRequired': { $exists: true, $gt: 0 },
        'waiFeedback.0': { $exists: true },
        'waiFeedback.0.status': 'SUBMITTED',
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        paraphrasisRequired: '$metrics.paraphrasisRequired',
        paraphrasisDetected: '$metrics.paraphrasisDetected',
        paraphrasisRate: {
          $cond: {
            if: { $gt: ['$metrics.paraphrasisRequired', 0] },
            then: { $divide: ['$metrics.paraphrasisDetected', '$metrics.paraphrasisRequired'] },
            else: 0,
          },
        },
        waiFeedback: { $arrayElemAt: ['$waiFeedback', 0] },
        createdAt: 1,
      },
    },
  ]);

  if (conversations.length < 10) {
    return {
      correlation: null,
      sampleSize: conversations.length,
      avgWaiWithParaphrasis: null,
      avgWaiWithoutParaphrasis: null,
      waiDimensions: null,
      error: 'Insufficient data for correlation analysis (minimum 10 conversations required)',
    };
  }

  // Separar en dos grupos: con paráfrasis (rate > 0.5) y sin paráfrasis (rate <= 0.5)
  const withParaphrasis = conversations.filter((c) => c.paraphrasisRate > 0.5);
  const withoutParaphrasis = conversations.filter((c) => c.paraphrasisRate <= 0.5);

  // Función helper para calcular score total WAI (promedio de los 4 ejes)
  const calculateTotalScore = (scores) => {
    if (!scores || !scores.heard || !scores.safe || !scores.useful || !scores.noPressure) {
      return 0;
    }
    return (scores.heard + scores.safe + scores.useful + scores.noPressure) / 4;
  };

  // Calcular promedios de WAI
  const avgWaiWithParaphrasis =
    withParaphrasis.length > 0
      ? withParaphrasis.reduce((sum, c) => sum + calculateTotalScore(c.waiFeedback?.scores), 0) /
        withParaphrasis.length
      : 0;

  const avgWaiWithoutParaphrasis =
    withoutParaphrasis.length > 0
      ? withoutParaphrasis.reduce((sum, c) => sum + calculateTotalScore(c.waiFeedback?.scores), 0) /
        withoutParaphrasis.length
      : 0;

  // Calcular correlación de Pearson
  const paraphrasisRates = conversations.map((c) => c.paraphrasisRate);
  const waiScores = conversations.map((c) => calculateTotalScore(c.waiFeedback?.scores));
  const correlation = calculatePearsonCorrelation(paraphrasisRates, waiScores);

  // Analizar por dimensión de WAI (ejes de alianza terapéutica)
  const waiDimensions = {
    heard: {
      withParaphrasis:
        withParaphrasis.length > 0
          ? withParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.heard || 0), 0) /
            withParaphrasis.length
          : 0,
      withoutParaphrasis:
        withoutParaphrasis.length > 0
          ? withoutParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.heard || 0), 0) /
            withoutParaphrasis.length
          : 0,
    },
    safe: {
      withParaphrasis:
        withParaphrasis.length > 0
          ? withParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.safe || 0), 0) /
            withParaphrasis.length
          : 0,
      withoutParaphrasis:
        withoutParaphrasis.length > 0
          ? withoutParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.safe || 0), 0) /
            withoutParaphrasis.length
          : 0,
    },
    useful: {
      withParaphrasis:
        withParaphrasis.length > 0
          ? withParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.useful || 0), 0) /
            withParaphrasis.length
          : 0,
      withoutParaphrasis:
        withoutParaphrasis.length > 0
          ? withoutParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.useful || 0), 0) /
            withoutParaphrasis.length
          : 0,
    },
    noPressure: {
      withParaphrasis:
        withParaphrasis.length > 0
          ? withParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.noPressure || 0), 0) /
            withParaphrasis.length
          : 0,
      withoutParaphrasis:
        withoutParaphrasis.length > 0
          ? withoutParaphrasis.reduce((sum, c) => sum + (c.waiFeedback?.scores?.noPressure || 0), 0) /
            withoutParaphrasis.length
          : 0,
    },
  };

  return {
    correlation,
    sampleSize: conversations.length,
    avgWaiWithParaphrasis: Math.round(avgWaiWithParaphrasis * 100) / 100,
    avgWaiWithoutParaphrasis: Math.round(avgWaiWithoutParaphrasis * 100) / 100,
    waiDimensions: {
      heard: {
        withParaphrasis: Math.round(waiDimensions.heard.withParaphrasis * 100) / 100,
        withoutParaphrasis: Math.round(waiDimensions.heard.withoutParaphrasis * 100) / 100,
        lift: Math.round((waiDimensions.heard.withParaphrasis - waiDimensions.heard.withoutParaphrasis) * 100) / 100,
      },
      safe: {
        withParaphrasis: Math.round(waiDimensions.safe.withParaphrasis * 100) / 100,
        withoutParaphrasis: Math.round(waiDimensions.safe.withoutParaphrasis * 100) / 100,
        lift: Math.round((waiDimensions.safe.withParaphrasis - waiDimensions.safe.withoutParaphrasis) * 100) / 100,
      },
      useful: {
        withParaphrasis: Math.round(waiDimensions.useful.withParaphrasis * 100) / 100,
        withoutParaphrasis: Math.round(waiDimensions.useful.withoutParaphrasis * 100) / 100,
        lift: Math.round((waiDimensions.useful.withParaphrasis - waiDimensions.useful.withoutParaphrasis) * 100) / 100,
      },
      noPressure: {
        withParaphrasis: Math.round(waiDimensions.noPressure.withParaphrasis * 100) / 100,
        withoutParaphrasis: Math.round(waiDimensions.noPressure.withoutParaphrasis * 100) / 100,
        lift: Math.round((waiDimensions.noPressure.withParaphrasis - waiDimensions.noPressure.withoutParaphrasis) * 100) / 100,
      },
    },
    groupSizes: {
      withParaphrasis: withParaphrasis.length,
      withoutParaphrasis: withoutParaphrasis.length,
    },
  };
}
