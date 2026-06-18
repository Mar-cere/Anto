/**
 * Resuelve conversación activa para mensajes de chat vía Socket.IO.
 * Alineado con POST /api/chat/messages (conversationId del cliente).
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';

const CONVERSATION_SELECT =
  '_id sessionIntention tccLiteState rollingSummary rollingSummaryAtMessageCount status';

/**
 * @param {{ userId: import('mongoose').Types.ObjectId|string, conversationId?: string|null }} params
 * @returns {Promise<object>}
 */
export async function resolveChatConversationForSocket({ userId, conversationId = null }) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const rawId = String(conversationId || '').trim();

  if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
    const owned = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(rawId),
      userId: uid,
    })
      .select(CONVERSATION_SELECT)
      .lean();
    if (!owned) {
      const err = new Error('Conversación no encontrada o no autorizada');
      err.code = 'CONVERSATION_FORBIDDEN';
      throw err;
    }
    return owned;
  }

  let conversation = await Conversation.findOne({
    userId: uid,
    status: 'active',
  })
    .select(CONVERSATION_SELECT)
    .sort({ updatedAt: -1 })
    .lean();

  if (!conversation) {
    const created = new Conversation({ userId: uid });
    await created.save();
    return {
      _id: created._id,
      sessionIntention: created.sessionIntention ?? null,
      tccLiteState: created.tccLiteState,
      rollingSummary: created.rollingSummary ?? null,
      rollingSummaryAtMessageCount: created.rollingSummaryAtMessageCount ?? 0,
      status: created.status ?? 'active',
    };
  }

  return conversation;
}

export default { resolveChatConversationForSocket };
