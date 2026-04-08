/**
 * Middleware de validación para rutas de chat.
 * Extraído de chatRoutes para reutilización y claridad.
 */
import mongoose from 'mongoose';
import Conversation from '../../models/Conversation.js';
import metricsService from '../../services/metricsService.js';

export function isValidObjectId(id) {
  if (id == null || id === '') return false;
  return mongoose.isValidObjectId(String(id));
}

export function validarConversationId(req, res, next) {
  const { conversationId } = req.params;

  if (!conversationId) {
    metricsService.bumpChatFriction('missing_conversation_id_param', {
      httpStatus: 400,
      surface: 'registered'
    });
    return res.status(400).json({
      message: 'ID de conversación requerido'
    });
  }

  if (!isValidObjectId(conversationId)) {
    metricsService.bumpChatFriction('invalid_conversation_id_param', {
      httpStatus: 400,
      surface: 'registered'
    });
    return res.status(400).json({
      message: 'ID de conversación inválido'
    });
  }
  next();
}

export async function validarConversacion(req, res, next) {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    metricsService.bumpChatFriction('invalid_conversation_or_user_id', {
      httpStatus: 400,
      surface: 'registered'
    });
    return res.status(400).json({ message: 'ID de conversación o usuario inválido' });
  }

  const conversation = await Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    userId: new mongoose.Types.ObjectId(req.user._id)
  })
    .select('_id userId')
    .lean();

  if (!conversation) {
    metricsService.bumpChatFriction('conversation_not_found_or_forbidden', {
      httpStatus: 404,
      surface: 'registered'
    });
    return res.status(404).json({ message: 'Conversación no encontrada' });
  }

  req.conversation = conversation;
  next();
}
