/**
 * Estado TCC lite persistido en conversación (resume fiable entre sesiones del hilo).
 */
import Conversation from '../models/Conversation.js';
import mongoose from 'mongoose';

const VALID_STEPS = new Set([
  'capture_thought',
  'check_evidence',
  'build_alternative',
  'wrap_up',
]);

export function normalizeTccLiteState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const step = String(raw.step || '').trim();
  if (!VALID_STEPS.has(step)) return null;
  const distortionType = String(raw.distortionType || '').trim().toLowerCase() || null;
  return {
    step,
    distortionType,
    completed: raw.completed === true,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}

export async function loadTccLiteStateFromConversation(conversationId) {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(String(conversationId))) return null;
  try {
    const doc = await Conversation.findById(conversationId).select('tccLiteState').lean();
    return normalizeTccLiteState(doc?.tccLiteState);
  } catch {
    return null;
  }
}

export async function saveTccLiteStateToConversation(conversationId, tccLitePlan) {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(String(conversationId))) return;
  if (!tccLitePlan?.active || !tccLitePlan?.step) {
    if (tccLitePlan?.completed) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          tccLiteState: {
            step: 'wrap_up',
            distortionType: tccLitePlan.distortionType || null,
            completed: true,
            updatedAt: new Date(),
          },
        },
      }).catch(() => {});
    }
    return;
  }
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      tccLiteState: {
        step: tccLitePlan.step,
        distortionType: tccLitePlan.distortionType || null,
        completed: tccLitePlan.completed === true,
        updatedAt: new Date(),
      },
    },
  }).catch(() => {});
}

export default {
  normalizeTccLiteState,
  loadTccLiteStateFromConversation,
  saveTccLiteStateToConversation,
};
