/**
 * Modelo de Metas del Usuario - Gestiona las metas terapéuticas y personales del usuario
 */
import mongoose from 'mongoose';

const userGoalsSchema = new mongoose.Schema({
  // Referencia al usuario (único: un registro por usuario)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Lista de metas del usuario
  goals: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 1 // Progreso de 0 a 1 (0% a 100%)
    },
    milestones: [{
      date: Date,
      description: String,
      emotionalState: String
    }],
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active'
    }
  }]
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

const UserGoals = mongoose.models.UserGoals || mongoose.model('UserGoals', userGoalsSchema);

export default UserGoals; 