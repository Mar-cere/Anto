/**
 * Modelo de Progreso del Usuario - Gestiona el seguimiento del progreso emocional, sesiones y metas del usuario
 */
import mongoose from 'mongoose';

// Sub-esquema: Entrada individual de progreso
const progressEntrySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Estado emocional registrado
  emotionalState: {
    mainEmotion: {
      type: String,
      required: true
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    secondaryEmotions: [{
      emotion: String,
      intensity: {
        type: Number,
        min: 1,
        max: 10
      }
    }]
  },
  // Contexto de la sesión
  context: {
    topic: {
      type: String,
      required: true
    },
    triggers: [String],
    copingStrategies: [String]
  },
  // Insights generados durante la sesión
  insights: [{
    type: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Métricas de la sesión
  sessionMetrics: {
    duration: {
      type: Number,
      default: 0
    },
    messageCount: {
      type: Number,
      default: 0
    },
    responseQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  }
}, { _id: false });

const userProgressSchema = new mongoose.Schema({
  // Referencia al usuario (único: un registro por usuario)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Historial de entradas de progreso
  entries: [progressEntrySchema],
  // Métricas generales calculadas
  overallMetrics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    emotionalTrends: {
      predominantEmotions: [{
        emotion: String,
        frequency: {
          type: Number,
          default: 0
        }
      }],
      averageIntensity: {
        type: Number,
        default: 0
      }
    },
    commonTopics: [{
      topic: String,
      frequency: {
        type: Number,
        default: 0
      }
    }],
    effectiveCopingStrategies: [{
      strategy: String,
      effectiveness: {
        type: Number,
        min: 0,
        max: 10
      }
    }]
  },
  // Metas del usuario
  goals: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    targetDate: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['pendiente', 'en_progreso', 'completado', 'abandonado'],
      default: 'pendiente'
    }
  }]
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas comunes
userProgressSchema.index({ 'entries.timestamp': -1 });
userProgressSchema.index({ 'goals.status': 1 });
userProgressSchema.index({ 'goals.targetDate': 1 });

// Método para agregar una nueva entrada de progreso
userProgressSchema.methods.addProgressEntry = async function(entryData) {
  this.entries.push(entryData);
  await this.updateOverallMetrics();
  return this.save();
};

// Método para actualizar métricas generales
userProgressSchema.methods.updateOverallMetrics = async function() {
  if (!this.entries.length) return;

  // Calcular métricas básicas
  this.overallMetrics.totalSessions = this.entries.length;

  // Calcular duración promedio de sesiones
  const totalDuration = this.entries.reduce((sum, entry) => 
    sum + (entry.sessionMetrics?.duration || 0), 0);
  this.overallMetrics.averageSessionDuration = totalDuration / this.entries.length;

  // Analizar tendencias emocionales
  const emotionCounts = {};
  let totalIntensity = 0;

  this.entries.forEach(entry => {
    const emotion = entry.emotionalState.mainEmotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    totalIntensity += entry.emotionalState.intensity;
  });

  this.overallMetrics.emotionalTrends = {
    predominantEmotions: Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        frequency: count / this.entries.length
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5),
    averageIntensity: totalIntensity / this.entries.length
  };

  // Analizar temas comunes
  const topicCounts = {};
  this.entries.forEach(entry => {
    const topic = entry.context.topic;
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  this.overallMetrics.commonTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      frequency: count / this.entries.length
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  // Analizar estrategias de afrontamiento efectivas
  const strategyEffectiveness = {};
  this.entries.forEach(entry => {
    entry.context.copingStrategies.forEach(strategy => {
      if (!strategyEffectiveness[strategy]) {
        strategyEffectiveness[strategy] = {
          total: 0,
          count: 0
        };
      }
      strategyEffectiveness[strategy].total += entry.sessionMetrics.responseQuality || 3;
      strategyEffectiveness[strategy].count += 1;
    });
  });

  this.overallMetrics.effectiveCopingStrategies = Object.entries(strategyEffectiveness)
    .map(([strategy, data]) => ({
      strategy,
      effectiveness: data.total / data.count
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, 5);
};

// Método para obtener resumen de progreso
userProgressSchema.methods.getProgressSummary = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentEntries = this.entries.filter(entry => 
    entry.timestamp >= cutoffDate
  );

  return {
    recentProgress: {
      totalSessions: recentEntries.length,
      emotionalTrends: this.analyzeRecentEmotions(recentEntries),
      activeGoals: this.goals.filter(goal => 
        goal.status === 'en_progreso'
      ),
      recentInsights: this.getRecentInsights(recentEntries)
    },
    overallMetrics: this.overallMetrics
  };
};

// Método auxiliar para analizar emociones recientes
userProgressSchema.methods.analyzeRecentEmotions = function(entries) {
  if (!entries || entries.length === 0) {
    return {
      predominantEmotions: [],
      averageIntensity: 0
    };
  }

  const emotionCounts = {};
  let totalIntensity = 0;

  entries.forEach(entry => {
    const emotion = entry.emotionalState?.mainEmotion || 'neutral';
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    totalIntensity += entry.emotionalState?.intensity || 5;
  });

  return {
    predominantEmotions: Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        frequency: count / entries.length
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5),
    averageIntensity: totalIntensity / entries.length
  };
};

// Método auxiliar para obtener insights recientes
userProgressSchema.methods.getRecentInsights = function(entries) {
  if (!entries || entries.length === 0) return [];
  
  const allInsights = entries
    .reduce((insights, entry) => {
      if (entry.insights && Array.isArray(entry.insights)) {
        return [...insights, ...entry.insights];
      }
      return insights;
    }, [])
    .filter(insight => insight != null);
  
  return allInsights
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 10);
};

const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', userProgressSchema);

export default UserProgress; 