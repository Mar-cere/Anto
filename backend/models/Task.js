const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['Salud', 'Educación', 'Relajación', 'Trabajo', 'Otros'],
    default: 'Otros'
  },
  priority: {
    type: String,
    required: true,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Media'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  subtasks: [SubtaskSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, completed: 1 });
TaskSchema.index({ userId: 1, category: 1 });

// Método para verificar si la tarea está vencida
TaskSchema.methods.isOverdue = function() {
  return !this.completed && new Date() > this.dueDate;
};

// Método para calcular el progreso de las subtareas
TaskSchema.methods.getProgress = function() {
  if (!this.subtasks || this.subtasks.length === 0) return 0;
  const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
  return (completedSubtasks / this.subtasks.length) * 100;
};

// Middleware pre-save para validaciones adicionales
TaskSchema.pre('save', function(next) {
  // Asegurarse de que la fecha de vencimiento no sea anterior a la fecha actual
  if (this.isNew && this.dueDate < new Date()) {
    next(new Error('La fecha de vencimiento no puede ser anterior a la fecha actual'));
  }
  next();
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
