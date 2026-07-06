/**
 * Enfriamiento de propuestas de compromiso no solicitadas (#202).
 */
import Conversation from '../models/Conversation.js';
import { isExplicitCommitmentRequest } from './chatCommitmentProposalService.js';

export const COMMITMENT_PROPOSAL_COOLDOWN_MS = 30 * 60 * 1000;

/**
 * @param {string} userContent
 * @param {unknown} conversationId
 * @param {unknown[]} proposedCommitments
 */
export async function filterProposedCommitmentsByConversationCap(
  userContent,
  conversationId,
  proposedCommitments,
) {
  if (!proposedCommitments?.length) return [];
  if (isExplicitCommitmentRequest(userContent)) return proposedCommitments;
  if (conversationId == null || String(conversationId).trim() === '') {
    return proposedCommitments;
  }

  const conv = await Conversation.findById(conversationId)
    .select('lastCommitmentProposalAt')
    .lean();
  const lastAt = conv?.lastCommitmentProposalAt
    ? new Date(conv.lastCommitmentProposalAt).getTime()
    : null;
  if (lastAt && Date.now() - lastAt < COMMITMENT_PROPOSAL_COOLDOWN_MS) {
    return [];
  }
  return proposedCommitments;
}

/**
 * @param {string} userContent
 * @param {unknown} conversationId
 * @param {number} emittedCount
 */
export async function incrementCommitmentProposalCountIfApplied(
  userContent,
  conversationId,
  emittedCount,
) {
  if (!emittedCount || isExplicitCommitmentRequest(userContent)) return;
  if (conversationId == null || String(conversationId).trim() === '') return;

  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { lastCommitmentProposalAt: new Date() } },
  );
}

export default {
  COMMITMENT_PROPOSAL_COOLDOWN_MS,
  filterProposedCommitmentsByConversationCap,
  incrementCommitmentProposalCountIfApplied,
};
