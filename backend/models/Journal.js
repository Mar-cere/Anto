/**
 * Modelo de Journal (Diario de Gratitud) - Gestiona entradas de diario de gratitud del usuario
 */
import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Contenido de la entrada
  content: {
    type: String,
    required: [true, 'El contenido es requerido'],
    trim: true,
    minlength: [1, 'El contenido debe tener al menos 1 carácter'],
    maxlength: [2000, 'El contenido debe tener máximo 2000 caracteres']
  },
  // Fecha de la entrada (permite fechas pasadas y futuras para flexibilidad)
  entryDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  // Estado emocional asociado (opcional)
  emotionalState: {
    type: String,
    enum: ['happy', 'grateful', 'peaceful', 'content', 'hopeful', 'other'],
    default: 'grateful'
  },
  // Tags o categorías (opcional)
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  // Si la entrada está archivada
  archived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices compuestos para búsquedas eficientes
journalSchema.index({ userId: 1, entryDate: -1 });
journalSchema.index({ userId: 1, archived: 1, entryDate: -1 });
journalSchema.index({ userId: 1, emotionalState: 1 });

// Método estático para obtener entradas de un usuario
journalSchema.statics.findByUser = function(userId, options = {}) {
  const {
    startDate,
    endDate,
    archived = false,
    emotionalState,
    limit = 50,
    skip = 0,
    sortBy = 'entryDate',
    sortOrder = 'desc'
  } = options;

  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    archived
  };

  if (startDate || endDate) {
    query.entryDate = {};
    if (startDate) query.entryDate.$gte = new Date(startDate);
    if (endDate) query.entryDate.$lte = new Date(endDate);
  }

  if (emotionalState) {
    query.emotionalState = emotionalState;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();
};

// Método estático para obtener estadísticas de un usuario
journalSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        archived: false
      }
    },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        thisWeek: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$entryDate',
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ]
              },
              1,
              0
            ]
          }
        },
        thisMonth: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$entryDate',
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ]
              },
              1,
              0
            ]
          }
        },
        emotionalStates: {
          $push: '$emotionalState'
        }
      }
    }
  ]);

  if (!stats || stats.length === 0) {
    return {
      totalEntries: 0,
      thisWeek: 0,
      thisMonth: 0,
      emotionalStateDistribution: {}
    };
  }

  const stat = stats[0];
  const emotionalStateDistribution = stat.emotionalStates.reduce((acc, state) => {
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  return {
    totalEntries: stat.totalEntries || 0,
    thisWeek: stat.thisWeek || 0,
    thisMonth: stat.thisMonth || 0,
    emotionalStateDistribution
  };
};

// Método de instancia para archivar
journalSchema.methods.archive = function() {
  this.archived = true;
  return this.save();
};

// Método de instancia para desarchivar
journalSchema.methods.unarchive = function() {
  this.archived = false;
  return this.save();
};

const Journal = mongoose.models.Journal || mongoose.model('Journal', journalSchema);

export default Journal;

