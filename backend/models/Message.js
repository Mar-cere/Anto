/**
 * Modelo de Mensaje
 * 
 * Gestiona los mensajes del chat entre usuarios y la IA.
 * Incluye optimizaciones de índices para mejorar el rendimiento.
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Usuario que envió el mensaje
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ID de la conversación
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },

  // Contenido del mensaje
  content: {
    type: String,
    required: true,
    trim: true,
  },

  // Rol del mensaje (user, assistant o system)
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    index: true,
  },

  // Metadatos del mensaje
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índices compuestos para consultas frecuentes
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, conversationId: 1, createdAt: -1 });
messageSchema.index({ role: 1, createdAt: -1 });
messageSchema.index({ 'metadata.status': 1, createdAt: -1 });

// Índice de texto para búsquedas (opcional, solo si se necesita búsqueda de texto)
// messageSchema.index({ content: 'text' });

// Índice para consultas de análisis emocional
messageSchema.index({ 
  userId: 1, 
  'metadata.context.emotional.mainEmotion': 1, 
  createdAt: -1 
});

// Índice para consultas de crisis
messageSchema.index({ 
  userId: 1, 
  'metadata.crisis.riskLevel': 1, 
  createdAt: -1 
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
