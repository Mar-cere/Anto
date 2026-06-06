/**
 * Modelo de autorregistro ABC (#86).
 * A = situación activadora, B = pensamientos, C = consecuencias (emoción + conducta).
 */
import mongoose from 'mongoose';

const abcRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activatingEvent: {
      type: String,
      required: [true, 'La situación activadora es requerida'],
      trim: true,
      minlength: [1, 'La situación debe tener al menos 1 carácter'],
      maxlength: [1000, 'La situación no puede exceder 1000 caracteres'],
    },
    beliefs: {
      type: String,
      required: [true, 'Los pensamientos son requeridos'],
      trim: true,
      minlength: [1, 'Los pensamientos deben tener al menos 1 carácter'],
      maxlength: [1000, 'Los pensamientos no pueden exceder 1000 caracteres'],
    },
    emotions: {
      type: String,
      trim: true,
      maxlength: [200, 'Las emociones no pueden exceder 200 caracteres'],
      default: '',
    },
    emotionIntensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    consequence: {
      type: String,
      trim: true,
      maxlength: [1000, 'La consecuencia no puede exceder 1000 caracteres'],
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

abcRecordSchema.index({ userId: 1, entryDate: -1 });
abcRecordSchema.index({ userId: 1, archived: 1, entryDate: -1 });

abcRecordSchema.statics.findByUser = function findByUser(userId, options = {}) {
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

abcRecordSchema.methods.archive = function archive() {
  this.archived = true;
  return this.save();
};

abcRecordSchema.methods.unarchive = function unarchive() {
  this.archived = false;
  return this.save();
};

const AbcRecord =
  mongoose.models.AbcRecord || mongoose.model('AbcRecord', abcRecordSchema);

export default AbcRecord;
