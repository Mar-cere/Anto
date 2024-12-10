const mongoose = require('mongoose');

const EmotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  emotion: {
    type: String,
    required: true,
  },
  emoji: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

const Emotion = mongoose.model('Emotion', EmotionSchema);

module.exports = Emotion;

