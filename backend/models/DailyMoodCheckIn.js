/**
 * Check-in emocional diario desde el dashboard (una entrada por usuario y día calendario).
 */
import mongoose from 'mongoose';

export const DAILY_MOOD_VALUES = ['calm', 'anxious', 'tired', 'good'];

const dailyMoodCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** YYYY-MM-DD en zona del usuario al registrar */
    dateKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },
    mood: {
      type: String,
      enum: DAILY_MOOD_VALUES,
      required: true,
    },
    source: {
      type: String,
      enum: ['dashboard'],
      default: 'dashboard',
    },
    timezone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 64,
    },
  },
  { timestamps: true },
);

dailyMoodCheckInSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
dailyMoodCheckInSchema.index({ userId: 1, createdAt: -1 });

const DailyMoodCheckIn =
  mongoose.models.DailyMoodCheckIn ||
  mongoose.model('DailyMoodCheckIn', dailyMoodCheckInSchema);

export default DailyMoodCheckIn;
