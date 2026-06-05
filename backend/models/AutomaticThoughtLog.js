/**
 * Registro de pensamiento automático (#89).
 * Situación + cognición + vínculo opcional a distorsión cognitiva.
 */
import mongoose from 'mongoose';

const automaticThoughtLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    situation: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    automaticThought: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    emotion: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    emotionIntensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    distortionType: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    distortionName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    balancedThought: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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

automaticThoughtLogSchema.index({ userId: 1, entryDate: -1 });
automaticThoughtLogSchema.index({ userId: 1, archived: 1, entryDate: -1 });

automaticThoughtLogSchema.statics.findByUser = function findByUser(userId, options = {}) {
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

const AutomaticThoughtLog =
  mongoose.models.AutomaticThoughtLog ||
  mongoose.model('AutomaticThoughtLog', automaticThoughtLogSchema);

export default AutomaticThoughtLog;
