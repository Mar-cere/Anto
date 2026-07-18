/**
 * Patrones experienciales entre sesiones (#203 / #211):
 * observaciones subjetivas con ancla temporal y follow-up evolutivo.
 */
import mongoose from 'mongoose';

const CATEGORIES = ['time_of_day', 'emotion', 'relationship', 'coping', 'other'];
const FOLLOW_UP_STATUSES = [
  'pending',
  'acknowledged',
  'changed',
  'unchanged',
  'skipped',
  'archived',
];
const SOURCES = ['session_extract', 'manual'];

const experientialPatternSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    sourceMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    statement: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    /** Clave normalizada para deduplicar (lowercase, sin acentos, espacios colapsados). */
    normalizedKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
      index: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'other',
    },
    observedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    followUpAt: {
      type: Date,
      default: null,
      index: true,
    },
    followUpAskedAt: {
      type: Date,
      default: null,
    },
    followUpAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFollowUpAt: {
      type: Date,
      default: null,
    },
    followUpStatus: {
      type: String,
      enum: FOLLOW_UP_STATUSES,
      default: 'pending',
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1,
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es',
    },
    source: {
      type: String,
      enum: SOURCES,
      default: 'manual',
    },
    userConfirmed: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

experientialPatternSchema.index({ userId: 1, isActive: 1, followUpAt: 1 });
experientialPatternSchema.index({ userId: 1, followUpStatus: 1, followUpAskedAt: 1 });
experientialPatternSchema.index({ userId: 1, normalizedKey: 1, isActive: 1 });

export const EXPERIENTIAL_PATTERN_CATEGORIES = CATEGORIES;
export const EXPERIENTIAL_FOLLOW_UP_STATUSES = FOLLOW_UP_STATUSES;

const ExperientialPattern =
  mongoose.models.ExperientialPattern ||
  mongoose.model('ExperientialPattern', experientialPatternSchema);

export default ExperientialPattern;
