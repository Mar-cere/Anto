/**
 * Plan semanal de activación conductual (#88).
 */
import mongoose from 'mongoose';

const SLOT_STATUSES = ['planned', 'completed', 'skipped'];
const ACTIVITY_TYPES = ['pleasant', 'routine'];

const weekPlanSlotSchema = new mongoose.Schema(
  {
    slotId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    dayOffset: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
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
    status: {
      type: String,
      enum: SLOT_STATUSES,
      default: 'planned',
    },
    completedLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BehavioralActivationLog',
      default: null,
    },
    linkedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    linkedHabitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      default: null,
    },
  },
  { _id: false },
);

const behavioralActivationWeekPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
      index: true,
    },
    slots: {
      type: [weekPlanSlotSchema],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.length <= 7,
        message: 'El plan semanal admite como máximo 7 actividades',
      },
    },
  },
  { timestamps: true },
);

behavioralActivationWeekPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

const BehavioralActivationWeekPlan =
  mongoose.models.BehavioralActivationWeekPlan ||
  mongoose.model('BehavioralActivationWeekPlan', behavioralActivationWeekPlanSchema);

export default BehavioralActivationWeekPlan;
