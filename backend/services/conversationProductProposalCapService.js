/**
 * Tope de propuestas productivas no explícitas por conversación (sesión de chat).
 * @see chatProductActionProposalService.isExplicitProductActionRequest
 */
import Conversation from '../models/Conversation.js';
import {
  getProductActionNeedLevel,
  isExplicitProductActionRequest
} from './chatProductActionProposalService.js';

export const MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION = 2;
export const NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS = 10 * 60 * 1000;

export const CAP_BY_NEED_LEVEL = {
  low: 1,
  medium: 2,
  high: 3
};

export const COOLDOWN_MS_BY_NEED_LEVEL = {
  low: 20 * 60 * 1000,
  medium: NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS,
  high: 5 * 60 * 1000
};

function buildAskFirstPrompt(userContent) {
  if (/estudiar|examen|materia|temario|apunte/i.test(userContent)) {
    return '¿Quieres que lo convirtamos en una tarea de estudio concreta?';
  }
  if (/cocina|encimera|escritorio|desorden/i.test(userContent)) {
    return '¿Quieres que lo convirtamos en una tarea concreta para empezar ahora?';
  }
  return '¿Quieres que lo pasemos a una tarea concreta?';
}

/**
 * @param {string} userContent
 * @param {unknown} conversationId
 * @param {unknown[]} proposedProductActions
 */
export async function filterProposedProductActionsByConversationCap(
  userContent,
  conversationId,
  proposedProductActions
) {
  const result = await evaluateProposedProductActionsState(
    userContent,
    conversationId,
    proposedProductActions
  );
  return result.actions;
}

/**
 * Evalúa disponibilidad + estado UX de sugerencias productivas.
 * @returns {Promise<{actions: unknown[], status: { paused: boolean, reason: string | null, askFirst: boolean, askFirstPrompt?: string, cooldownSecondsRemaining?: number }}>}
 */
export async function evaluateProposedProductActionsState(
  userContent,
  conversationId,
  proposedProductActions
) {
  if (!proposedProductActions?.length) {
    return {
      actions: [],
      status: { paused: false, reason: null, askFirst: false }
    };
  }
  if (isExplicitProductActionRequest(userContent)) {
    return {
      actions: proposedProductActions,
      status: { paused: false, reason: null, askFirst: false }
    };
  }
  if (conversationId == null || String(conversationId).trim() === '') {
    return {
      actions: proposedProductActions,
      status: { paused: false, reason: null, askFirst: false }
    };
  }

  const conv = await Conversation.findById(conversationId)
    .select('nonExplicitProductProposalCount lastNonExplicitProductProposalAt nonExplicitProductProposalRejectStreak')
    .lean();
  const n = conv?.nonExplicitProductProposalCount ?? 0;
  const rejectStreak = conv?.nonExplicitProductProposalRejectStreak ?? 0;
  const needLevel = getProductActionNeedLevel(userContent);
  const askFirst = needLevel === 'medium';
  const dynamicCap = CAP_BY_NEED_LEVEL[needLevel] ?? MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION;
  if (rejectStreak >= 3 && needLevel !== 'high') {
    return {
      actions: [],
      status: { paused: true, reason: 'user_reject_streak', askFirst: false }
    };
  }
  if (n >= dynamicCap) {
    return {
      actions: [],
      status: { paused: true, reason: 'cap', askFirst: false }
    };
  }
  const lastAt = conv?.lastNonExplicitProductProposalAt
    ? new Date(conv.lastNonExplicitProductProposalAt).getTime()
    : null;
  const cooldownMs = COOLDOWN_MS_BY_NEED_LEVEL[needLevel] ?? NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS;
  if (lastAt) {
    const remaining = cooldownMs - (Date.now() - lastAt);
    if (remaining > 0) {
      return {
        actions: [],
        status: {
          paused: true,
          reason: 'cooldown',
          askFirst: false,
          cooldownSecondsRemaining: Math.ceil(remaining / 1000)
        }
      };
    }
  }
  if (askFirst) {
    return {
      actions: [],
      status: {
        paused: false,
        reason: null,
        askFirst: true,
        askFirstPrompt: buildAskFirstPrompt(userContent)
      }
    };
  }
  return {
    actions: proposedProductActions,
    status: { paused: false, reason: null, askFirst: false }
  };
}

/**
 * @param {string} userContent
 * @param {unknown} conversationId
 * @param {number} emittedCount
 */
export async function incrementNonExplicitProductProposalCountIfApplied(
  userContent,
  conversationId,
  emittedCount
) {
  if (!emittedCount || isExplicitProductActionRequest(userContent)) return;
  if (conversationId == null || String(conversationId).trim() === '') return;

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $inc: { nonExplicitProductProposalCount: 1 },
      $set: { lastNonExplicitProductProposalAt: new Date() }
    }
  );
}

export async function registerProductProposalFeedback(conversationId, action) {
  if (!conversationId) return;
  if (action === 'accepted') {
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { nonExplicitProductProposalRejectStreak: 0 } }
    );
    return;
  }
  if (action === 'rejected') {
    await Conversation.updateOne(
      { _id: conversationId },
      { $inc: { nonExplicitProductProposalRejectStreak: 1 } }
    );
  }
}

export default {
  MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION,
  NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS,
  CAP_BY_NEED_LEVEL,
  COOLDOWN_MS_BY_NEED_LEVEL,
  evaluateProposedProductActionsState,
  filterProposedProductActionsByConversationCap,
  incrementNonExplicitProductProposalCountIfApplied,
  registerProductProposalFeedback
};
