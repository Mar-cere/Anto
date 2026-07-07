/**
 * Compromisos entre sesiones (#202): micro-acciones acordadas o sugeridas al cerrar chat.
 */
import mongoose from 'mongoose';

const sessionCommitmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 240,
    },
    source: {
      type: String,
      enum: ['session_insight', 'manual', 'chat_action', 'chat_proposed'],
      default: 'session_insight',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'skipped', 'archived'],
      default: 'active',
      index: true,
    },
    followUpAt: {
      type: Date,
      default: null,
      index: true,
    },
    followUpAnswer: {
      type: String,
      enum: ['pending', 'yes', 'partial', 'no'],
      default: 'pending',
    },
    followUpAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFollowUpAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    renegotiatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionCommitment',
      default: null,
    },
    sourceMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

sessionCommitmentSchema.index({ userId: 1, status: 1, createdAt: -1 });
sessionCommitmentSchema.index({ userId: 1, followUpAt: 1, status: 1 });

const SessionCommitment =
  mongoose.models.SessionCommitment ||
  mongoose.model('SessionCommitment', sessionCommitmentSchema);

export default SessionCommitment;
