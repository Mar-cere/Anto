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
  if (!proposedProductActions?.length) return [];
  if (isExplicitProductActionRequest(userContent)) return proposedProductActions;
  if (conversationId == null || String(conversationId).trim() === '') {
    return proposedProductActions;
  }

  const conv = await Conversation.findById(conversationId)
    .select('nonExplicitProductProposalCount lastNonExplicitProductProposalAt')
    .lean();
  const n = conv?.nonExplicitProductProposalCount ?? 0;
  const needLevel = getProductActionNeedLevel(userContent);
  const dynamicCap = CAP_BY_NEED_LEVEL[needLevel] ?? MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION;
  if (n >= dynamicCap) {
    return [];
  }
  const lastAt = conv?.lastNonExplicitProductProposalAt
    ? new Date(conv.lastNonExplicitProductProposalAt).getTime()
    : null;
  const cooldownMs = COOLDOWN_MS_BY_NEED_LEVEL[needLevel] ?? NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS;
  if (lastAt && Date.now() - lastAt < cooldownMs) {
    return [];
  }
  return proposedProductActions;
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

export default {
  MAX_NON_EXPLICIT_PRODUCT_PROPOSALS_PER_CONVERSATION,
  NON_EXPLICIT_PRODUCT_PROPOSAL_COOLDOWN_MS,
  CAP_BY_NEED_LEVEL,
  COOLDOWN_MS_BY_NEED_LEVEL,
  filterProposedProductActionsByConversationCap,
  incrementNonExplicitProductProposalCountIfApplied
};
