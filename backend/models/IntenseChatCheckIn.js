/**
 * Check-in push diferido tras una sesión de chat emocionalmente intensa
 * (misma conversación; el envío se suprime si el usuario ya siguió escribiendo).
 */
import mongoose from 'mongoose';

const intenseChatCheckInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  anchorAssistantMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'skipped', 'cancelled'],
    default: 'pending',
    index: true
  },
  reason: {
    type: String,
    enum: ['high_intensity', 'warning_level', 'high_intensity_and_warning'],
    default: 'high_intensity'
  },
  marker: {
    intensity: Number,
    riskLevel: String
  },
  sentAt: Date,
  skipReason: String,
  cancelReason: String
}, {
  timestamps: true
});

intenseChatCheckInSchema.index({ status: 1, scheduledFor: 1 });
intenseChatCheckInSchema.index({ userId: 1, status: 1, createdAt: -1 });

if (mongoose.models.IntenseChatCheckIn) {
  delete mongoose.models.IntenseChatCheckIn;
}

const IntenseChatCheckIn = mongoose.model('IntenseChatCheckIn', intenseChatCheckInSchema);

export default IntenseChatCheckIn;
