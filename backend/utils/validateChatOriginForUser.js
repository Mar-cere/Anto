/**
 * Evita que un usuario adjunte chatOrigin ajenos (IDs válidos pero de otra conversación).
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

/**
 * @param {{ conversationId: string, sourceMessageId: string, source?: string }} chatOrigin
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @returns {Promise<boolean>}
 */
export async function validateChatOriginForUser(chatOrigin, userId) {
  if (!chatOrigin || typeof chatOrigin !== 'object') return false;
  const { conversationId, sourceMessageId } = chatOrigin;
  if (!conversationId || !sourceMessageId) return false;
  if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(sourceMessageId)) {
    return false;
  }
  try {
    const userOid = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const convOid = new mongoose.Types.ObjectId(String(conversationId));
    const msgOid = new mongoose.Types.ObjectId(String(sourceMessageId));

    const conv = await Conversation.findOne({ _id: convOid, userId: userOid }).select('_id').lean();
    if (!conv) return false;

    const msg = await Message.findOne({
      _id: msgOid,
      conversationId: conv._id
    })
      .select('_id')
      .lean();
    return Boolean(msg);
  } catch {
    return false;
  }
}
