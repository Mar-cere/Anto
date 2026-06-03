/**
 * Registro de activación conductual (#88).
 * Actividad planificada + ánimo antes/después (1–10).
 */
import mongoose from 'mongoose';

const ACTIVITY_TYPES = ['pleasant', 'routine'];

const behavioralActivationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    activityType: {
      type: String,
      enum: ACTIVITY_TYPES,
      default: 'pleasant',
    },
    moodBefore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    moodAfter: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    entryDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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

behavioralActivationLogSchema.index({ userId: 1, entryDate: -1 });
behavioralActivationLogSchema.index({ userId: 1, archived: 1, entryDate: -1 });

behavioralActivationLogSchema.statics.findByUser = function findByUser(userId, options = {}) {
  const {
    startDate,
    endDate,
    archived = false,
    limit = 50,
    skip = 0,
    sortBy = 'entryDate',
    sortOrder = 'desc',
  } = options;

  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    archived,
  };

  if (startDate || endDate) {
    query.entryDate = {};
    if (startDate) query.entryDate.$gte = new Date(startDate);
    if (endDate) query.entryDate.$lte = new Date(endDate);
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return this.find(query).sort(sort).limit(limit).skip(skip).lean();
};

const BehavioralActivationLog =
  mongoose.models.BehavioralActivationLog ||
  mongoose.model('BehavioralActivationLog', behavioralActivationLogSchema);

export default BehavioralActivationLog;
