/**
 * Modelo de Feedback de Respuesta
 * Almacena el feedback del usuario sobre las respuestas del asistente
 */

import mongoose from 'mongoose';

const responseFeedbackSchema = new mongoose.Schema({
  // Usuario que proporciona el feedback
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Mensaje del asistente al que se refiere el feedback
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true,
  },

  // Conversación relacionada
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },

  // Tipo de feedback
  feedbackType: {
    type: String,
    enum: ['helpful', 'not_helpful', 'neutral', 'excellent', 'poor'],
    required: true,
  },

  // Calificación (1-5)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },

  // Comentario opcional
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },

  // Metadatos adicionales
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Índices compuestos
responseFeedbackSchema.index({ userId: 1, createdAt: -1 });
responseFeedbackSchema.index({ messageId: 1 });
responseFeedbackSchema.index({ conversationId: 1, createdAt: -1 });
responseFeedbackSchema.index({ feedbackType: 1, createdAt: -1 });

// Métodos estáticos
responseFeedbackSchema.statics.getFeedbackStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$feedbackType',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const total = await this.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: startDate },
  });

  return {
    total,
    byType: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgRating: stat.avgRating,
      };
      return acc;
    }, {}),
  };
};

const ResponseFeedback = mongoose.models.ResponseFeedback || mongoose.model('ResponseFeedback', responseFeedbackSchema);

export default ResponseFeedback;

