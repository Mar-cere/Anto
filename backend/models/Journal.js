const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  mood: {
    type: String,
    required: true,
    enum: ['Excelente', 'Bien', 'Normal', 'Mal', 'Terrible']
  },
  category: {
    type: String,
    required: true,
    enum: ['Reflexión', 'Meta', 'Día Duro', 'Otro']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  activities: [{
    type: String,
    trim: true
  }],
  gratitude: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  improvements: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
JournalSchema.index({ userId: 1, date: -1 });
JournalSchema.index({ userId: 1, mood: 1 });
JournalSchema.index({ userId: 1, category: 1 });
JournalSchema.index({ userId: 1, tags: 1 });

const Journal = mongoose.model('Journal', JournalSchema);

module.exports = Journal;
