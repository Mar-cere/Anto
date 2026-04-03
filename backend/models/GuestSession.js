/**
 * Sesión de chat invitado (sin cuenta). Límite de mensajes del usuario por sesión.
 */
import mongoose from 'mongoose';

const guestSessionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
      index: true
    },
    /** Mensajes de rol `user` ya enviados en esta sesión */
    userMessagesUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    maxUserMessages: {
      type: Number,
      default: 5
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    ipHash: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

if (mongoose.models.GuestSession) {
  delete mongoose.models.GuestSession;
}

const GuestSession = mongoose.model('GuestSession', guestSessionSchema);
export default GuestSession;
