/**
 * Modelo de Uso de Técnicas Terapéuticas
 * 
 * Registra cada vez que un usuario utiliza una técnica terapéutica,
 * incluyendo detalles del ejercicio, duración, y resultados.
 */

import mongoose from 'mongoose';

const therapeuticTechniqueUsageSchema = new mongoose.Schema({
  // Usuario que utilizó la técnica
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Identificador de la técnica (nombre o ID)
  techniqueId: {
    type: String,
    required: true,
    index: true,
  },

  // Nombre de la técnica
  techniqueName: {
    type: String,
    required: true,
  },

  // Tipo/categoría de la técnica (CBT, DBT, ACT, immediate)
  techniqueType: {
    type: String,
    enum: ['CBT', 'DBT', 'ACT', 'immediate'],
    required: true,
  },

  // Emoción para la cual se usó la técnica
  emotion: {
    type: String,
    enum: ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa', 'alegria', 'esperanza', 'neutral'],
    index: true,
  },

  // Si el ejercicio fue completado
  completed: {
    type: Boolean,
    default: false,
  },

  // Duración del ejercicio en segundos (si aplica)
  duration: {
    type: Number,
    default: null,
  },

  // Datos específicos del ejercicio (respuestas, ciclos, etc.)
  exerciseData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Intensidad emocional antes del ejercicio (1-10)
  emotionalIntensityBefore: {
    type: Number,
    min: 1,
    max: 10,
    default: null,
  },

  // Intensidad emocional después del ejercicio (1-10)
  emotionalIntensityAfter: {
    type: Number,
    min: 1,
    max: 10,
    default: null,
  },

  // Efectividad percibida (1-5)
  effectiveness: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },

  // Notas o comentarios del usuario
  notes: {
    type: String,
    default: null,
  },

  // Timestamp de cuando se inició el ejercicio
  startedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // Timestamp de cuando se completó el ejercicio
  completedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índices compuestos para consultas frecuentes
therapeuticTechniqueUsageSchema.index({ userId: 1, createdAt: -1 });
therapeuticTechniqueUsageSchema.index({ userId: 1, techniqueId: 1, createdAt: -1 });
therapeuticTechniqueUsageSchema.index({ userId: 1, emotion: 1, createdAt: -1 });
therapeuticTechniqueUsageSchema.index({ userId: 1, techniqueType: 1, createdAt: -1 });
therapeuticTechniqueUsageSchema.index({ userId: 1, completed: 1 });

// Método estático: obtener estadísticas de uso por usuario
therapeuticTechniqueUsageSchema.statics.getUserStats = async function(userId, options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalUses: { $sum: 1 },
        completedUses: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        totalDuration: {
          $sum: { $ifNull: ['$duration', 0] }
        },
        averageEffectiveness: {
          $avg: { $ifNull: ['$effectiveness', null] }
        },
        techniquesUsed: { $addToSet: '$techniqueId' },
        emotionsTreated: { $addToSet: '$emotion' },
        typesUsed: { $addToSet: '$techniqueType' },
      }
    },
    {
      $project: {
        _id: 0,
        totalUses: 1,
        completedUses: 1,
        completionRate: {
          $cond: [
            { $eq: ['$totalUses', 0] },
            0,
            { $divide: ['$completedUses', '$totalUses'] }
          ]
        },
        totalDuration: 1,
        averageDuration: {
          $cond: [
            { $eq: ['$completedUses', 0] },
            0,
            { $divide: ['$totalDuration', '$completedUses'] }
          ]
        },
        averageEffectiveness: {
          $cond: [
            { $eq: [{ $ifNull: ['$averageEffectiveness', null] }, null] },
            null,
            { $round: ['$averageEffectiveness', 2] }
          ]
        },
        uniqueTechniques: { $size: '$techniquesUsed' },
        uniqueEmotions: { $size: '$emotionsTreated' },
        uniqueTypes: { $size: '$typesUsed' },
      }
    }
  ]);

  return stats[0] || {
    totalUses: 0,
    completedUses: 0,
    completionRate: 0,
    totalDuration: 0,
    averageDuration: 0,
    averageEffectiveness: null,
    uniqueTechniques: 0,
    uniqueEmotions: 0,
    uniqueTypes: 0,
  };
};

// Método estático: obtener técnicas más usadas
therapeuticTechniqueUsageSchema.statics.getMostUsedTechniques = async function(userId, limit = 10) {
  return await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$techniqueId',
        techniqueName: { $first: '$techniqueName' },
        techniqueType: { $first: '$techniqueType' },
        count: { $sum: 1 },
        completedCount: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        averageEffectiveness: {
          $avg: { $ifNull: ['$effectiveness', null] }
        },
        lastUsed: { $max: '$createdAt' },
      }
    },
    {
      $project: {
        _id: 0,
        techniqueId: '$_id',
        techniqueName: 1,
        techniqueType: 1,
        count: 1,
        completedCount: 1,
        completionRate: {
          $cond: [
            { $eq: ['$count', 0] },
            0,
            { $divide: ['$completedCount', '$count'] }
          ]
        },
        averageEffectiveness: {
          $cond: [
            { $eq: [{ $ifNull: ['$averageEffectiveness', null] }, null] },
            null,
            { $round: ['$averageEffectiveness', 2] }
          ]
        },
        lastUsed: 1,
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Método estático: obtener estadísticas por emoción
therapeuticTechniqueUsageSchema.statics.getStatsByEmotion = async function(userId) {
  return await this.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        emotion: { $ne: null }
      } 
    },
    {
      $group: {
        _id: '$emotion',
        count: { $sum: 1 },
        completedCount: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        averageEffectiveness: {
          $avg: { $ifNull: ['$effectiveness', null] }
        },
      }
    },
    {
      $project: {
        _id: 0,
        emotion: '$_id',
        count: 1,
        completedCount: 1,
        completionRate: {
          $cond: [
            { $eq: ['$count', 0] },
            0,
            { $divide: ['$completedCount', '$count'] }
          ]
        },
        averageEffectiveness: {
          $cond: [
            { $eq: [{ $ifNull: ['$averageEffectiveness', null] }, null] },
            null,
            { $round: ['$averageEffectiveness', 2] }
          ]
        },
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Método estático: obtener estadísticas por tipo de técnica
therapeuticTechniqueUsageSchema.statics.getStatsByType = async function(userId) {
  return await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$techniqueType',
        count: { $sum: 1 },
        completedCount: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        averageEffectiveness: {
          $avg: { $ifNull: ['$effectiveness', null] }
        },
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        count: 1,
        completedCount: 1,
        completionRate: {
          $cond: [
            { $eq: ['$count', 0] },
            0,
            { $divide: ['$completedCount', '$count'] }
          ]
        },
        averageEffectiveness: {
          $cond: [
            { $eq: [{ $ifNull: ['$averageEffectiveness', null] }, null] },
            null,
            { $round: ['$averageEffectiveness', 2] }
          ]
        },
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Método estático: obtener uso por período (día, semana, mes)
therapeuticTechniqueUsageSchema.statics.getUsageByPeriod = async function(userId, period = 'day') {
  let groupFormat;
  
  switch (period) {
    case 'day':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      break;
    case 'week':
      groupFormat = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      break;
    case 'month':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      break;
    default:
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
  }

  return await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: groupFormat,
        count: { $sum: 1 },
        completedCount: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        date: { $first: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0,
        period: '$_id',
        count: 1,
        completedCount: 1,
        date: 1,
      }
    },
    { $sort: { date: 1 } }
  ]);
};

const TherapeuticTechniqueUsage = mongoose.model('TherapeuticTechniqueUsage', therapeuticTechniqueUsageSchema);

export default TherapeuticTechniqueUsage;

