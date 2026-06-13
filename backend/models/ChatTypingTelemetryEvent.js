/**
 * Telemetría agregada de tecleo por mensaje (#215). Sin contenido del texto.
 */
import mongoose from 'mongoose';

const chatTypingTelemetryEventSchema = new mongoose.Schema(
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
      index: true,
      default: null,
    },
    sessionId: { type: String, index: true, default: null },
    draftDurationMs: { type: Number, min: 0, default: 0 },
    avgFlightTimeMs: { type: Number, min: 0, default: 0 },
    backspaceRate: { type: Number, min: 0, max: 1, default: 0 },
    revisionCount: { type: Number, min: 0, default: 0 },
    charCountFinal: { type: Number, min: 0, default: 0 },
    cognitiveLoadScore: { type: Number, min: 0, max: 1, default: 0 },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

chatTypingTelemetryEventSchema.index({ userId: 1, submittedAt: -1 });

export default mongoose.model('ChatTypingTelemetryEvent', chatTypingTelemetryEventSchema);
