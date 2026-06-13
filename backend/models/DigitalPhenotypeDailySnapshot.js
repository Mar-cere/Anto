/**
 * Snapshot diario de fenotipado digital (#216). Agregados, no series crudas.
 */
import mongoose from 'mongoose';

const digitalPhenotypeDailySnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayKey: { type: String, required: true, trim: true, maxlength: 10, index: true },
    steps: { type: Number, min: 0, default: null },
    sleepHours: { type: Number, min: 0, max: 24, default: null },
    screenTimeMinutes: { type: Number, min: 0, default: null },
    socialScreenRatio: { type: Number, min: 0, max: 1, default: null },
    inactivityHours: { type: Number, min: 0, max: 24, default: null },
    source: {
      type: String,
      enum: ['healthkit', 'health_connect', 'google_fit', 'manual', 'stub'],
      default: 'stub',
    },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

digitalPhenotypeDailySnapshotSchema.index({ userId: 1, dayKey: 1 }, { unique: true });

export default mongoose.model('DigitalPhenotypeDailySnapshot', digitalPhenotypeDailySnapshotSchema);
