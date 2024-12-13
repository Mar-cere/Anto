const mongoose = require('mongoose');

const TimerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['pomodoro', 'meditation', 'break', 'custom'],
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
TimerSchema.index({ userId: 1, startTime: -1 });
TimerSchema.index({ userId: 1, type: 1 });

const Timer = mongoose.model('Timer', TimerSchema);

module.exports = Timer;
