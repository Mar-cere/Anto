/**
 * Modelo de Evento de Crisis - Registra eventos de crisis detectados
 * para seguimiento, análisis y mejora del sistema
 */
import mongoose from 'mongoose';

const crisisEventSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Nivel de riesgo detectado
  riskLevel: {
    type: String,
    enum: ['LOW', 'WARNING', 'MEDIUM', 'HIGH'],
    required: true,
    index: true
  },
  // Fecha de detección
  detectedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  // Fecha de resolución (si aplica)
  resolvedAt: {
    type: Date,
    default: null
  },
  // Información del mensaje que activó la crisis
  triggerMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    contentPreview: {
      type: String,
      maxlength: 200 // Solo preview, no contenido completo por privacidad
    },
    emotionalAnalysis: {
      mainEmotion: String,
      intensity: Number
    }
  },
  // Análisis de tendencias al momento de la crisis
  trendAnalysis: {
    rapidDecline: Boolean,
    sustainedLow: Boolean,
    isolation: Boolean,
    escalation: Boolean,
    warnings: [String]
  },
  // Historial de crisis previas al momento de detección
  crisisHistory: {
    totalCrises: Number,
    recentCrises: Number
  },
  // Alertas enviadas
  alerts: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    contactsNotified: {
      type: Number,
      default: 0
    },
    channels: {
      email: Boolean,
      whatsapp: Boolean
    }
  },
  // Seguimiento
  followUp: {
    scheduled: {
      type: Boolean,
      default: false
    },
    scheduledAt: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    followUpMessages: [{
      sentAt: Date,
      responseReceived: Boolean,
      responseAt: Date
    }]
  },
  // Resultado/Estado
  outcome: {
    type: String,
    enum: ['resolved', 'ongoing', 'escalated', 'false_positive', 'unknown'],
    default: 'unknown'
  },
  // Notas adicionales (para análisis futuro)
  notes: {
    type: String,
    maxlength: 1000
  },
  // Metadatos
  metadata: {
    riskScore: Number, // Score calculado
    factors: [String], // Factores que contribuyeron al riesgo
    protectiveFactors: [String] // Factores protectores detectados
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
crisisEventSchema.index({ userId: 1, detectedAt: -1 });
crisisEventSchema.index({ riskLevel: 1, detectedAt: -1 });
crisisEventSchema.index({ outcome: 1 });
crisisEventSchema.index({ 'followUp.scheduled': 1, 'followUp.completed': 1 });

// Método estático: obtener crisis recientes de un usuario
crisisEventSchema.statics.getRecentCrises = function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    userId,
    detectedAt: { $gte: startDate }
  })
    .sort({ detectedAt: -1 })
    .lean();
};

// Método estático: obtener crisis pendientes de seguimiento
crisisEventSchema.statics.getPendingFollowUps = function() {
  return this.find({
    'followUp.scheduled': true,
    'followUp.completed': false,
    'followUp.scheduledAt': { $lte: new Date() }
  })
    .populate('userId', 'name email')
    .lean();
};

// Método de instancia: marcar como resuelto
crisisEventSchema.methods.markAsResolved = function(outcome = 'resolved') {
  this.resolvedAt = new Date();
  this.outcome = outcome;
  return this.save();
};

// Método de instancia: programar seguimiento
crisisEventSchema.methods.scheduleFollowUp = function(hours = 24) {
  this.followUp.scheduled = true;
  this.followUp.scheduledAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

// Eliminar modelo de caché si existe
if (mongoose.models.CrisisEvent) {
  delete mongoose.models.CrisisEvent;
}

const CrisisEvent = mongoose.model('CrisisEvent', crisisEventSchema);

export default CrisisEvent;

