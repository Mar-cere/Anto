/**
 * Modelo de Conversación - Gestiona las conversaciones de chat entre usuarios y el asistente IA
 */
import crypto from 'crypto';
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // ID único generado automáticamente
  id: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(16).toString('hex'),
    unique: true,
    index: true
  },
  // Usuario propietario de la conversación (chat 1-a-1 con el asistente IA)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Estado de la conversación
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true
  },
  // Referencia al último mensaje enviado
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Middleware pre-save: ejecuta antes de guardar
conversationSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = crypto.randomBytes(16).toString('hex');
  }
  next();
});

// Índices para optimizar consultas
conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
