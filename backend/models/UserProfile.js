/**
 * Modelo de Perfil de Usuario - Gestiona el perfil personalizado del usuario con patrones emocionales, temporales y preferencias
 */
import mongoose from 'mongoose';

// Sub-esquemas: estructuras reutilizables
const EmotionTimePatternSchema = new mongoose.Schema({
  morning: { type: Number, default: 0 },
  afternoon: { type: Number, default: 0 },
  evening: { type: Number, default: 0 },
  night: { type: Number, default: 0 }
}, { _id: false });

const EmotionSchema = new mongoose.Schema({
  emotion: { type: String, required: true },
  frequency: { type: Number, default: 0 },
  timePattern: {
    type: EmotionTimePatternSchema,
    default: () => ({})
  }
}, { _id: false });

const TimeInteractionSchema = new mongoose.Schema({
  frequency: { type: Number, default: 0 },
  averageMood: { type: String, default: 'neutral' }
}, { _id: false });

const userProfileSchema = new mongoose.Schema({
  // Referencia al usuario (único: un registro por usuario)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Patrones temporales de interacción
  timePatterns: {
    morningInteractions: { type: TimeInteractionSchema, default: () => ({}) },
    afternoonInteractions: { type: TimeInteractionSchema, default: () => ({}) },
    eveningInteractions: { type: TimeInteractionSchema, default: () => ({}) },
    nightInteractions: { type: TimeInteractionSchema, default: () => ({}) }
  },
  // Patrones emocionales predominantes
  emotionalPatterns: {
    predominantEmotions: {
      type: [EmotionSchema],
      default: () => ([])
    },
    emotionalTriggers: [{
      trigger: String,
      emotion: String,
      frequency: Number
    }]
  },
  // Temas comunes de conversación
  commonTopics: [{
    topic: String,
    frequency: Number,
    lastDiscussed: Date,
    associatedEmotions: [{
      emotion: String,
      intensity: Number
    }]
  }],
  // Estrategias de afrontamiento utilizadas
  copingStrategies: [{
    strategy: String,
    effectiveness: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  }],
  // Preferencias de comunicación del usuario
  preferences: {
    communicationStyle: {
      type: String,
      enum: ['formal', 'casual', 'neutral', 'empático'],
      default: 'neutral'
    },
    responseLength: {
      type: String,
      enum: ['SHORT', 'MEDIUM', 'LONG'],
      default: 'MEDIUM'
    },
    topicsOfInterest: [String],
    triggerTopics: [String]
  },
  // Métricas de progreso emocional
  progressMetrics: {
    emotionalGrowth: {
      startDate: Date,
      checkpoints: [{
        date: Date,
        metrics: {
          emotionalAwareness: {
            type: Number,
            min: 1,
            max: 10
          },
          copingSkills: {
            type: Number,
            min: 1,
            max: 10
          },
          overallWellbeing: {
            type: Number,
            min: 1,
            max: 10
          }
        }
      }]
    }
  },
  // Últimas interacciones con análisis
  lastInteractions: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    emotion: String,
    topic: String,
    responseEffectiveness: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  // Estadísticas de conexión
  connectionStats: {
    lastConnection: {
      type: Date,
      default: Date.now
    },
    frequentTimes: {
      morning: { type: Number, default: 0 },    // 6-12h
      afternoon: { type: Number, default: 0 },  // 12-18h
      evening: { type: Number, default: 0 },    // 18-24h
      night: { type: Number, default: 0 }       // 0-6h
    },
    weekdayPatterns: {
      monday: { type: Number, default: 0 },
      tuesday: { type: Number, default: 0 },
      wednesday: { type: Number, default: 0 },
      thursday: { type: Number, default: 0 },
      friday: { type: Number, default: 0 },
      saturday: { type: Number, default: 0 },
      sunday: { type: Number, default: 0 }
    }
  },
  // Patrones del usuario (usado extensivamente por servicios)
  patrones: {
    emocionales: [{
      emocion: String,
      intensidad: {
        type: Number,
        min: 0,
        max: 10
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    conexion: [{
      horario: String,
      duracion: Number,
      fecha: {
        type: Date,
        default: Date.now
      }
    }],
    temas: [{
      tema: String,
      frecuencia: {
        type: Number,
        default: 0
      },
      ultimaVez: Date
    }]
  },
  // Metadatos del perfil
  metadata: {
    ultimaInteraccion: Date,
    sesionesCompletadas: {
      type: Number,
      default: 0
    },
    progresoGeneral: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    ultimoContexto: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
userProfileSchema.index({ 'metadata.ultimaInteraccion': -1 });

// Middleware pre-save: asegura valores por defecto en la creación
userProfileSchema.pre('save', function(next) {
  if (!this.emotionalPatterns) {
    this.emotionalPatterns = { predominantEmotions: [] };
  }
  if (!this.timePatterns) {
    this.timePatterns = {
      morningInteractions: { frequency: 0, averageMood: 'neutral' },
      afternoonInteractions: { frequency: 0, averageMood: 'neutral' },
      eveningInteractions: { frequency: 0, averageMood: 'neutral' },
      nightInteractions: { frequency: 0, averageMood: 'neutral' }
    };
  }
  if (!this.connectionStats) {
    this.connectionStats = {
      lastConnection: new Date(),
      frequentTimes: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      },
      weekdayPatterns: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      }
    };
  }
  next();
});

const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);

export default UserProfile; 