/**
 * Modelo de Insights del Usuario - Gestiona análisis de patrones, emociones y metas activas del usuario
 */
import mongoose from 'mongoose';

const userInsightSchema = new mongoose.Schema({
  // Referencia al usuario (único: un registro por usuario)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Historial de interacciones con análisis
  interactions: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    patterns: {
      type: Object,
      default: {}
    },
    goals: {
      type: Object,
      default: {}
    },
    emotion: {
      type: String,
      default: 'neutral'
    },
    intensity: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    }
  }],
  // Patrones recurrentes identificados
  recurringPatterns: [{
    type: String,
    trim: true
  }],
  // Metas activas del usuario
  activeGoals: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
userInsightSchema.index({ 'interactions.timestamp': -1 });

const UserInsight = mongoose.models.UserInsight || mongoose.model('UserInsight', userInsightSchema);

export default UserInsight;
