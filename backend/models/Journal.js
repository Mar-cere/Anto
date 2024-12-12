const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    type: String,
    required: true,
    enum: ['Excelente', 'Bien', 'Normal', 'Mal', 'Terrible']
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
  thoughts: {
    type: String,
    trim: true,
    maxlength: 2000
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
JournalSchema.index({ userId: 1, tags: 1 });

const Journal = mongoose.model('Journal', JournalSchema);

module.exports = Journal;
