const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  value: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

const HabitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['Salud', 'Relajación', 'Educación', 'Ejercicio', 'Otros'],
    default: 'Otros'
  },
  benefit: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily'
  },
  weeklyProgress: [ProgressSchema],
  monthlyProgress: [ProgressSchema],
  streak: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastCompleted: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
HabitSchema.index({ userId: 1, category: 1 });
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ userId: 1, lastCompleted: 1 });

// Método para verificar si el hábito se completó hoy
HabitSchema.methods.isCompletedToday = function() {
  if (!this.lastCompleted) return false;
  const today = new Date();
  const lastCompleted = new Date(this.lastCompleted);
  return (
    lastCompleted.getDate() === today.getDate() &&
    lastCompleted.getMonth() === today.getMonth() &&
    lastCompleted.getFullYear() === today.getFullYear()
  );
};

// Método para calcular el progreso promedio
HabitSchema.methods.getAverageProgress = function(period = 'weekly') {
  const progress = period === 'weekly' ? this.weeklyProgress : this.monthlyProgress;
  if (!progress || progress.length === 0) return 0;
  
  const sum = progress.reduce((acc, curr) => acc + curr.value, 0);
  return sum / progress.length;
};

// Método para actualizar el streak
HabitSchema.methods.updateStreak = function() {
  if (!this.lastCompleted) return;

  const today = new Date();
  const lastCompleted = new Date(this.lastCompleted);
  const diffDays = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    this.streak = 1;
  } else if (diffDays === 1) {
    this.streak += 1;
  }
};

// Middleware pre-save
HabitSchema.pre('save', function(next) {
  if (this.isModified('lastCompleted')) {
    this.updateStreak();
  }
  next();
});

const Habit = mongoose.model('Habit', HabitSchema);

module.exports = Habit;
