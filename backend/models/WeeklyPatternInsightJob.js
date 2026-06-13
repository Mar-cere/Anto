/**
 * Job async para generar informe semanal (#208 / #217).
 */
import mongoose from 'mongoose';

const weeklyPatternInsightJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekKey: { type: String, required: true, trim: true, maxlength: 12, index: true },
    runAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0, max: 5 },
    lastError: { type: String, maxlength: 500, default: null },
  },
  { timestamps: true },
);

weeklyPatternInsightJobSchema.index({ status: 1, runAt: 1 });
weeklyPatternInsightJobSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

export default mongoose.model('WeeklyPatternInsightJob', weeklyPatternInsightJobSchema);
