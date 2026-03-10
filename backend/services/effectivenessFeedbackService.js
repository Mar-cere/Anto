/**
 * Servicio de feedback de efectividad para técnicas.
 * Recoge feedback implícito o explícito sobre técnicas y actualiza copingStrategies.
 * @see docs/MEJORAS_SERVICIOS_CHAT.md - Fase 3, punto 10
 *
 * Cuando el usuario da feedback (helpful/not_helpful/excellent/poor) sobre un mensaje
 * que contenía una técnica sugerida, actualiza UserProfile.copingStrategies.
 */
import Message from '../models/Message.js';
import userProfileService from './userProfileService.js';

// Mapeo feedbackType + rating -> effectiveness (1-10)
const FEEDBACK_TO_EFFECTIVENESS = {
  excellent: 9,
  helpful: 7,
  neutral: 5,
  not_helpful: 3,
  poor: 2
};

/**
 * Procesa feedback del usuario sobre un mensaje del asistente.
 * Si el mensaje contenía una técnica sugerida, actualiza copingStrategies.
 * @param {string} userId - ID del usuario
 * @param {string} messageId - ID del mensaje del asistente
 * @param {string} feedbackType - helpful | not_helpful | neutral | excellent | poor
 * @param {number} rating - 1-5
 * @returns {Promise<{ updated: boolean, strategy?: string }>}
 */
async function processFeedback(userId, messageId, feedbackType, rating = 3) {
  try {
    if (!userId || !messageId) return { updated: false };

    const message = await Message.findOne({
      _id: messageId,
      userId,
      role: 'assistant'
    })
      .select('metadata')
      .lean();

    if (!message?.metadata?.context) return { updated: false };

    // Obtener técnica: puede estar en metadata.context.therapeutic o en response (JSON)
    let techniqueName = message.metadata.context?.therapeutic?.technique;
    if (!techniqueName && message.metadata.context?.response) {
      try {
        const parsed = JSON.parse(message.metadata.context.response);
        techniqueName = parsed?.therapeutic?.technique;
      } catch {
        // ignore parse error
      }
    }

    if (!techniqueName || typeof techniqueName !== 'string') return { updated: false };

    // Calcular effectiveness: combinar feedbackType y rating
    let effectiveness = FEEDBACK_TO_EFFECTIVENESS[feedbackType] ?? 5;
    if (rating && rating >= 1 && rating <= 5) {
      effectiveness = Math.round((effectiveness + (rating / 5) * 5) / 2);
      effectiveness = Math.min(10, Math.max(1, effectiveness));
    }

    await userProfileService.registerCopingStrategy(userId.toString(), {
      strategy: techniqueName.trim(),
      effectiveness
    });

    return { updated: true, strategy: techniqueName };
  } catch (error) {
    console.warn('[EffectivenessFeedbackService] Error procesando feedback:', error.message);
    return { updated: false };
  }
}

const effectivenessFeedbackService = {
  processFeedback
};

export default effectivenessFeedbackService;
