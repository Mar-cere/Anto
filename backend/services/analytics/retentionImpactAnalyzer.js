/**
 * Analizador de impacto de paráfrasis en retención de usuarios (#55 Fase 3)
 * 
 * Analiza si el uso de paráfrasis correlaciona con mayor retención
 * a 7 y 30 días.
 */

import User from '../../models/User.js';
import Conversation from '../../models/Conversation.js';

/**
 * Calcula la retención de un cohorte de usuarios.
 * 
 * @param {string[]} userIds - IDs de usuarios en el cohorte
 * @param {Date} cohortStartDate - Fecha de inicio del cohorte
 * @param {number} retentionDays - Días para calcular retención (7, 30, etc.)
 * @returns {Promise<number>} Tasa de retención (0-1)
 */
async function calculateCohortRetention(userIds, cohortStartDate, retentionDays) {
  if (userIds.length === 0) {
    return 0;
  }

  const retentionDate = new Date(cohortStartDate);
  retentionDate.setDate(retentionDate.getDate() + retentionDays);

  // Contar usuarios que tuvieron actividad después de N días
  const activeUsers = await Conversation.distinct('userId', {
    userId: { $in: userIds },
    createdAt: {
      $gte: retentionDate,
      $lte: new Date(retentionDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días de ventana
    },
  });

  return activeUsers.length / userIds.length;
}

/**
 * Analiza el impacto del uso de paráfrasis en la retención de usuarios.
 * 
 * @param {Object} options - Opciones de análisis
 * @param {string} [options.startDate] - Fecha inicio del cohorte (ISO)
 * @param {string} [options.endDate] - Fecha fin del cohorte (ISO)
 * @param {number} [options.cohortSize] - Tamaño mínimo de cohorte (default 100)
 * @returns {Promise<Object>} Análisis de impacto en retención
 */
export async function analyzeRetentionImpact(options = {}) {
  const { startDate, endDate, cohortSize = 100 } = options;

  const matchFilters = {};
  if (startDate || endDate) {
    matchFilters.createdAt = {};
    if (startDate) matchFilters.createdAt.$gte = new Date(startDate);
    if (endDate) matchFilters.createdAt.$lte = new Date(endDate);
  }

  // Obtener conversaciones con métricas de paráfrasis
  const conversations = await Conversation.aggregate([
    { $match: matchFilters },
    {
      $match: {
        'metrics.paraphrasisRequired': { $exists: true, $gt: 0 },
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
        createdAt: 1,
      },
    },
  ]);

  if (conversations.length < cohortSize) {
    return {
      retentionD7: null,
      retentionD30: null,
      sampleSize: conversations.length,
      relativeLift: null,
      error: `Insufficient data for retention analysis (minimum ${cohortSize} conversations required)`,
    };
  }

  // Agrupar usuarios por experiencia de paráfrasis
  const userParaphrasisExperience = {};
  conversations.forEach((conv) => {
    if (!userParaphrasisExperience[conv.userId]) {
      userParaphrasisExperience[conv.userId] = {
        totalRequired: 0,
        totalDetected: 0,
        firstConversationDate: conv.createdAt,
      };
    }
    userParaphrasisExperience[conv.userId].totalRequired += conv.paraphrasisRequired;
    userParaphrasisExperience[conv.userId].totalDetected += conv.paraphrasisDetected;
    
    // Mantener la fecha más temprana
    if (conv.createdAt < userParaphrasisExperience[conv.userId].firstConversationDate) {
      userParaphrasisExperience[conv.userId].firstConversationDate = conv.createdAt;
    }
  });

  // Calcular tasa de paráfrasis por usuario y separar en cohortes
  const usersWithParaphrasis = [];
  const usersWithoutParaphrasis = [];

  Object.entries(userParaphrasisExperience).forEach(([userId, exp]) => {
    const userRate =
      exp.totalRequired > 0 ? exp.totalDetected / exp.totalRequired : 0;

    const userObj = {
      userId,
      paraphrasisRate: userRate,
      firstConversationDate: exp.firstConversationDate,
    };

    if (userRate > 0.5) {
      usersWithParaphrasis.push(userObj);
    } else {
      usersWithoutParaphrasis.push(userObj);
    }
  });

  if (usersWithParaphrasis.length < cohortSize / 2 || usersWithoutParaphrasis.length < cohortSize / 2) {
    return {
      retentionD7: null,
      retentionD30: null,
      sampleSize: conversations.length,
      relativeLift: null,
      error: `Insufficient users in each cohort (need at least ${cohortSize / 2} per group)`,
      groupSizes: {
        withParaphrasis: usersWithParaphrasis.length,
        withoutParaphrasis: usersWithoutParaphrasis.length,
      },
    };
  }

  // Calcular fecha de cohorte (usar la más temprana como referencia)
  const allUsers = [...usersWithParaphrasis, ...usersWithoutParaphrasis];
  const cohortStartDate = new Date(
    Math.min(...allUsers.map((u) => new Date(u.firstConversationDate).getTime()))
  );

  // Calcular retención D7 y D30 para cada cohorte
  const [
    retentionD7WithParaphrasis,
    retentionD7WithoutParaphrasis,
    retentionD30WithParaphrasis,
    retentionD30WithoutParaphrasis,
  ] = await Promise.all([
    calculateCohortRetention(
      usersWithParaphrasis.map((u) => u.userId),
      cohortStartDate,
      7
    ),
    calculateCohortRetention(
      usersWithoutParaphrasis.map((u) => u.userId),
      cohortStartDate,
      7
    ),
    calculateCohortRetention(
      usersWithParaphrasis.map((u) => u.userId),
      cohortStartDate,
      30
    ),
    calculateCohortRetention(
      usersWithoutParaphrasis.map((u) => u.userId),
      cohortStartDate,
      30
    ),
  ]);

  // Calcular lift relativo
  const liftD7 =
    retentionD7WithoutParaphrasis > 0
      ? (retentionD7WithParaphrasis - retentionD7WithoutParaphrasis) / retentionD7WithoutParaphrasis
      : 0;

  const liftD30 =
    retentionD30WithoutParaphrasis > 0
      ? (retentionD30WithParaphrasis - retentionD30WithoutParaphrasis) / retentionD30WithoutParaphrasis
      : 0;

  return {
    retentionD7: {
      withParaphrasis: Math.round(retentionD7WithParaphrasis * 1000) / 10, // Porcentaje con 1 decimal
      withoutParaphrasis: Math.round(retentionD7WithoutParaphrasis * 1000) / 10,
      absoluteLift: Math.round((retentionD7WithParaphrasis - retentionD7WithoutParaphrasis) * 1000) / 10,
      relativeLift: Math.round(liftD7 * 1000) / 10, // Porcentaje
    },
    retentionD30: {
      withParaphrasis: Math.round(retentionD30WithParaphrasis * 1000) / 10,
      withoutParaphrasis: Math.round(retentionD30WithoutParaphrasis * 1000) / 10,
      absoluteLift: Math.round((retentionD30WithParaphrasis - retentionD30WithoutParaphrasis) * 1000) / 10,
      relativeLift: Math.round(liftD30 * 1000) / 10,
    },
    sampleSize: conversations.length,
    groupSizes: {
      withParaphrasis: usersWithParaphrasis.length,
      withoutParaphrasis: usersWithoutParaphrasis.length,
    },
    cohortStartDate: cohortStartDate.toISOString(),
  };
}
