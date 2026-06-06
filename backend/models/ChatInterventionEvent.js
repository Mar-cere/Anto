import mongoose from 'mongoose';

const ChatInterventionEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
      required: true,
    },
    // "Sesión" lógica: agrupación de eventos dentro de una ventana temporal.
    sessionId: { type: String, index: true, required: true },
    assistantMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    // Id estable de la intervención sugerida (por ahora, los IDs de ActionSuggestionService).
    interventionId: { type: String, index: true, required: true },
    interventionType: { type: String, default: 'technique' },
    // Tema canónico (tags fijos) y opcionalmente un tema libre para el modo mixto.
    topicTag: { type: String, index: true, default: 'general' },
    topicFree: { type: String, default: null },
    // shown | clicked | dismissed | completed
    eventType: { type: String, index: true, required: true },
    source: { type: String, default: 'chat_suggestions_v1' },
    riskLevel: { type: String, default: null },
    meta: { type: Object, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ChatInterventionEventSchema.index({ conversationId: 1, createdAt: -1 });
ChatInterventionEventSchema.index({ userId: 1, createdAt: -1 });
ChatInterventionEventSchema.index({
  userId: 1,
  conversationId: 1,
  sessionId: 1,
  eventType: 1,
});

export default mongoose.model('ChatInterventionEvent', ChatInterventionEventSchema);

