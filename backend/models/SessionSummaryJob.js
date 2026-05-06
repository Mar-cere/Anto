/**
 * Job diferido para generar el resumen de última sesión (#4 + #47).
 * Un usuario solo debe tener un job `pending` a la vez (reemplazo al reprogramar).
 */
import mongoose from 'mongoose';

const sessionSummaryJobSchema = new mongoose.Schema(
  {
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
    /** Momento en que debe ejecutarse el worker (tras inactividad). */
    runAt: {
      type: Date,
      required: true,
      index: true
    },
    /**
     * `createdAt` del último mensaje del hilo al momento de programar.
     * Si aparece un mensaje con `createdAt` mayor, el usuario siguió en el chat → se cancela.
     */
    baselineLastMessageAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'cancelled', 'failed'],
      default: 'pending',
      index: true
    },
    lastError: {
      type: String,
      maxlength: 2000,
      default: null
    }
  },
  { timestamps: true }
);

sessionSummaryJobSchema.index({ status: 1, runAt: 1 });

const SessionSummaryJob =
  mongoose.models.SessionSummaryJob || mongoose.model('SessionSummaryJob', sessionSummaryJobSchema);

export default SessionSummaryJob;
