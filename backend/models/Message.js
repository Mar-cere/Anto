/**
 * Modelo de Mensaje - Gestiona los mensajes del chat entre usuarios y el asistente IA
 */
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Referencias
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  // Contenido del mensaje
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    default: 'user',
    index: true
  },
  // Metadatos del mensaje
  metadata: {
    // Estado de entrega del mensaje
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent'
    },
    // Contexto del mensaje (análisis emocional y contextual)
    context: {
      emotional: {
        mainEmotion: {
          type: String,
          enum: ['feliz', 'triste', 'ansioso', 'enojado', 'neutral', 'otro']
        },
        intensity: {
          type: Number,
          min: 0,
          max: 10
        },
        secondary: [String]
      },
      contextual: {
        intent: String,
        topics: [String],
        urgent: Boolean
      },
      response: mongoose.Schema.Types.Mixed
    },
    // Información de error (si existe)
    error: String
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
messageSchema.index({ userId: 1, conversationId: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ role: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
