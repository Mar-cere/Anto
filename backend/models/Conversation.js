/**
 * Modelo de Conversación - Gestiona las conversaciones de chat entre usuarios y el asistente IA
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { SESSION_INTENTION_VALUES } from '../constants/sessionIntention.js';

const conversationSchema = new mongoose.Schema({
  // ID único generado automáticamente
  id: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(16).toString('hex'),
    unique: true,
    index: true
  },
  // Usuario propietario (omitir si isGuest: conversación solo con guestSessionId)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  isGuest: {
    type: Boolean,
    default: false,
    index: true
  },
  guestSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GuestSession',
    default: null,
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
  },
  /** Resumen acumulado del hilo (generado en background; puede ir unos mensajes retrasado) */
  rollingSummary: {
    type: String,
    default: null,
    maxlength: 4000
  },
  /** Total de mensajes en el hilo cuando se generó rollingSummary (para saber cuándo refrescar) */
  rollingSummaryAtMessageCount: {
    type: Number,
    default: 0
  },
  /**
   * Intención declarada al inicio (#72): ajusta tono y ratio escucha/consejo en el prompt.
   * @type {'vent'|'organize'|'technique'|'plan'|undefined}
   */
  sessionIntention: {
    type: String,
    enum: SESSION_INTENTION_VALUES,
    default: undefined
  },
  /**
   * Veces que se ofreció propuesta productiva (tarea/hábito) sin pedido explícito al usuario.
   * Máx. 2 por conversación; los mensajes explícitos ("en mis tareas", etc.) no incrementan y no se bloquean.
   */
  nonExplicitProductProposalCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Middleware pre-save: ejecuta antes de guardar
conversationSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = crypto.randomBytes(16).toString('hex');
  }
  if (this.isGuest) {
    if (!this.guestSessionId) {
      return next(new Error('Conversación invitada requiere guestSessionId'));
    }
  } else if (!this.userId) {
    return next(new Error('Conversación requiere userId o modo invitado'));
  }
  next();
});

// Índices para optimizar consultas
conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
