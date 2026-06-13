/**
 * Limpia estado de sesión al borrar mensajes de una conversación.
 * Evita que resúmenes, sugerencias o el grafo reutilicen contexto borrado.
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';

/**
 * @param {import('mongoose').Types.ObjectId|string} conversationId
 * @param {{ full?: boolean }} [options] — full=false si solo se borró un rol concreto
 */
export async function resetConversationSessionState(conversationId, { full = true } = {}) {
  if (!full || !conversationId) return;

  const convOid = mongoose.Types.ObjectId.isValid(String(conversationId))
    ? new mongoose.Types.ObjectId(String(conversationId))
    : null;
  if (!convOid) return;

  await Conversation.updateOne(
    { _id: convOid },
    {
      $set: {
        rollingSummaryAtMessageCount: 0,
        nonExplicitProductProposalCount: 0,
        nonExplicitProductProposalRejectStreak: 0,
        lastNonExplicitProductProposalAt: null,
      },
      $unset: {
        rollingSummary: '',
        sessionIntention: '',
        lastMessage: '',
      },
    },
  );

  await ChatInterventionEvent.deleteMany({ conversationId: convOid });
}

export default { resetConversationSessionState };
