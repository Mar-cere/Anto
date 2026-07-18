/**
 * Job diferido para extracción de patrones experienciales al cierre de sesión (#203).
 */
import mongoose from 'mongoose';

const experientialPatternJobSchema = new mongoose.Schema(
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
    runAt: {
      type: Date,
      required: true,
      index: true,
    },
    baselineLastMessageAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    lastError: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    patternsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

experientialPatternJobSchema.index({ status: 1, runAt: 1 });

const ExperientialPatternJob =
  mongoose.models.ExperientialPatternJob ||
  mongoose.model('ExperientialPatternJob', experientialPatternJobSchema);

export default ExperientialPatternJob;
