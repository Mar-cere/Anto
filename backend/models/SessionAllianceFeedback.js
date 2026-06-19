/**
 * Alianza terapéutica post-sesión (#98): escala 1–5 por eje o skip registrado.
 */
import mongoose from 'mongoose';
import { SESSION_WAI_STATUS } from '../constants/sessionAllianceFeedback.js';

const axisScoreSchema = new mongoose.Schema(
  {
    heard: { type: Number, min: 1, max: 5 },
    safe: { type: Number, min: 1, max: 5 },
    useful: { type: Number, min: 1, max: 5 },
    noPressure: { type: Number, min: 1, max: 5 },
  },
  { _id: false },
);

const sessionAllianceFeedbackSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [SESSION_WAI_STATUS.SUBMITTED, SESSION_WAI_STATUS.SKIPPED],
      required: true,
    },
    scores: {
      type: axisScoreSchema,
      default: null,
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es',
    },
    sessionMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    submittedAt: { type: Date, default: null },
    skippedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sessionAllianceFeedbackSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
sessionAllianceFeedbackSchema.index({ userId: 1, createdAt: -1 });
sessionAllianceFeedbackSchema.index({ status: 1, createdAt: -1 });

const SessionAllianceFeedback =
  mongoose.models.SessionAllianceFeedback ||
  mongoose.model('SessionAllianceFeedback', sessionAllianceFeedbackSchema);

export default SessionAllianceFeedback;
