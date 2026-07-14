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
  // Validar tipo de options
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    console.warn('[analyzeRetentionImpact] Invalid options type, using empty object');
    options = {};
  }

  const { startDate, endDate, cohortSize = 100 } = options;

  // Validar y normalizar cohortSize
  let normalizedCohortSize = 100;
  if (typeof cohortSize === 'number' && !isNaN(cohortSize) && isFinite(cohortSize) && cohortSize > 0) {
    normalizedCohortSize = Math.min(Math.max(Math.floor(cohortSize), 10), 10000);
  }

  const matchFilters = {};
  if (startDate || endDate) {
    matchFilters.createdAt = {};
    if (startDate) {
      try {
        matchFilters.createdAt.$gte = new Date(startDate);
        if (isNaN(matchFilters.createdAt.$gte.getTime())) {
          console.warn('[analyzeRetentionImpact] Invalid startDate, ignoring');
          delete matchFilters.createdAt.$gte;
        }
      } catch (error) {
        console.warn('[analyzeRetentionImpact] Error parsing startDate:', error);
      }
    }
    if (endDate) {
      try {
        matchFilters.createdAt.$lte = new Date(endDate);
        if (isNaN(matchFilters.createdAt.$lte.getTime())) {
          console.warn('[analyzeRetentionImpact] Invalid endDate, ignoring');
          delete matchFilters.createdAt.$lte;
        }
      } catch (error) {
        console.warn('[analyzeRetentionImpact] Error parsing endDate:', error);
      }
    }
    // Si no quedó ningún filtro de fecha válido, eliminar el objeto
    if (Object.keys(matchFilters.createdAt).length === 0) {
      delete matchFilters.createdAt;
    }
  }

  let conversations;
  try {
    // Obtener conversaciones con métricas de paráfrasis
    conversations = await Conversation.aggregate([
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
  } catch (error) {
    console.error('[analyzeRetentionImpact] Database error:', error);
    return {
      retentionD7: null,
      retentionD30: null,
      sampleSize: 0,
      relativeLift: null,
      error: 'Database error: ' + error.message,
    };
  }

  if (conversations.length < normalizedCohortSize) {
    return {
      retentionD7: null,
      retentionD30: null,
      sampleSize: conversations.length,
      relativeLift: null,
      error: `Insufficient data for retention analysis (minimum ${normalizedCohortSize} conversations required)`,
    };
  }

  // Agrupar usuarios por experiencia de paráfrasis
  const userParaphrasisExperience = {};
  conversations.forEach((conv) => {
    // Validar datos de conversación
    if (!conv || !conv.userId || typeof conv.userId !== 'string') {
      console.warn('[analyzeRetentionImpact] Invalid conversation data, skipping');
      return;
    }

    if (
      typeof conv.paraphrasisRequired !== 'number' ||
      typeof conv.paraphrasisDetected !== 'number' ||
      !conv.createdAt
    ) {
      console.warn('[analyzeRetentionImpact] Invalid metrics data for conversation, skipping');
      return;
    }

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

  if (usersWithParaphrasis.length < normalizedCohortSize / 2 || usersWithoutParaphrasis.length < normalizedCohortSize / 2) {
    return {
      retentionD7: null,
      retentionD30: null,
      sampleSize: conversations.length,
      relativeLift: null,
      error: `Insufficient users in each cohort (need at least ${normalizedCohortSize / 2} per group)`,
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
