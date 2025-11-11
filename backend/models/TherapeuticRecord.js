/**
 * Modelo de Registro Terapéutico - Gestiona el seguimiento terapéutico del usuario, sesiones y metas
 */
import mongoose from 'mongoose';

// Sub-esquemas: estructuras reutilizables
const EmotionSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'neutral',
    required: true
  },
  intensity: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  emotion: {
    type: EmotionSchema,
    required: true,
    default: () => ({})
  },
  tools: [{
    type: String
  }],
  progress: {
    type: String,
    default: 'en_curso'
  }
}, { _id: false });

const CurrentStatusSchema = new mongoose.Schema({
  emotion: {
    type: String,
    default: 'neutral',
    required: true
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { _id: false });

const therapeuticRecordSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Historial de sesiones terapéuticas
  sessions: {
    type: [SessionSchema],
    default: []
  },
  // Estado emocional actual del usuario
  currentStatus: {
    type: CurrentStatusSchema,
    required: true,
    default: () => ({})
  },
  // Herramientas terapéuticas activas
  activeTools: {
    type: [String],
    default: []
  },
  // Métricas de progreso terapéutico
  progressMetrics: {
    emotionalStability: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    toolMastery: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    engagementLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    }
  },
  // Metas terapéuticas del usuario
  therapeuticGoals: [{
    description: String,
    status: {
      type: String,
      enum: ['pendiente', 'en_progreso', 'logrado'],
      default: 'pendiente'
    },
    dateCreated: {
      type: Date,
      default: Date.now
    },
    dateAchieved: Date
  }]
}, {
  timestamps: true, // Crea createdAt y updatedAt automáticamente
  strict: true
});

// Middleware pre-save: asegura valores por defecto en la creación
therapeuticRecordSchema.pre('save', function(next) {
  if (!this.currentStatus) {
    this.currentStatus = {
      emotion: 'neutral',
      lastUpdate: new Date()
    };
  }
  next();
});

// Middleware pre-findOneAndUpdate: asegura estructura correcta en actualizaciones
therapeuticRecordSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Normalizar currentStatus si viene como string
  if (update.$set && update.$set.currentStatus) {
    if (typeof update.$set.currentStatus === 'string') {
      update.$set.currentStatus = {
        emotion: update.$set.currentStatus,
        lastUpdate: new Date()
      };
    }
  }
  
  next();
});

const TherapeuticRecord = mongoose.models.TherapeuticRecord || mongoose.model('TherapeuticRecord', therapeuticRecordSchema);

export default TherapeuticRecord;
