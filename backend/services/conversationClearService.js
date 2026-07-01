/**
 * Limpia estado de sesión al borrar mensajes de una conversación.
 * Evita que resúmenes, sugerencias o el grafo reutilicen contexto borrado.
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import SessionSummaryJob from '../models/SessionSummaryJob.js';
import User from '../models/User.js';

/**
 * @param {import('mongoose').Types.ObjectId|string} conversationId
 * @param {{ full?: boolean, userId?: import('mongoose').Types.ObjectId|string }} [options]
 * — full=false si solo se borró un rol concreto
 */
export async function resetConversationSessionState(conversationId, { full = true, userId = null } = {}) {
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
        tccLiteState: '',
        sessionEmotionalState: '',
        crisisProtocolState: '',
        softCrisisCheckInState: '',
      },
    },
  );

  await ChatInterventionEvent.deleteMany({ conversationId: convOid });

  if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
    const uid = new mongoose.Types.ObjectId(String(userId));
    await SessionSummaryJob.updateMany(
      {
        userId: uid,
        conversationId: convOid,
        status: { $in: ['pending', 'processing'] },
      },
      { $set: { status: 'cancelled' } },
    );
    await User.updateOne(
      { _id: uid, 'lastSessionSummary.conversationId': convOid },
      { $unset: { lastSessionSummary: '' } },
    );
  }
}

export default { resetConversationSessionState };
