/**
 * Jerarquía de exposición + SUDS (#87).
 * Pasos ordenados con registro de intentos (peak/end SUDS 0–100).
 */
import mongoose from 'mongoose';

const exposureAttemptSchema = new mongoose.Schema(
  {
    attemptDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    peakSuds: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    endSuds: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { _id: true },
);

const exposureStepSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    attempts: {
      type: [exposureAttemptSchema],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true },
);

const exposurePlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    steps: {
      type: [exposureStepSchema],
      validate: {
        validator(steps) {
          return Array.isArray(steps) && steps.length >= 2 && steps.length <= 15;
        },
        message: 'La jerarquía debe tener entre 2 y 15 pasos',
      },
    },
    currentStepIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

exposurePlanSchema.index({ userId: 1, updatedAt: -1 });
exposurePlanSchema.index({ userId: 1, archived: 1, updatedAt: -1 });

exposurePlanSchema.statics.findByUser = function findByUser(userId, options = {}) {
  const { archived = false, limit = 20, skip = 0 } = options;

  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    archived,
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

const ExposurePlan =
  mongoose.models.ExposurePlan || mongoose.model('ExposurePlan', exposurePlanSchema);

export default ExposurePlan;
