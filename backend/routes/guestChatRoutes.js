/**
 * Chat invitado (sin cuenta) — límite de mensajes, sin suscripción.
 */
import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import mongoose from 'mongoose';
import { authenticateGuest } from '../middleware/guestAuth.js';
import Message from '../models/Message.js';
import guestChatService from '../services/guestChatService.js';
import metricsService from '../services/metricsService.js';
import { GUEST_SESSION_CREATE_RATE_LIMIT } from '../constants/guestChat.js';

const router = express.Router();

const guestSessionCreateLimiter = createRateLimiter({
  ...GUEST_SESSION_CREATE_RATE_LIMIT,
  message: 'Demasiadas sesiones de invitado. Intenta más tarde o crea una cuenta.',
  standardHeaders: true,
  legacyHeaders: false,
});

/** Anti-spam: envíos por IP (trust proxy en server.js) */
const guestMessagePostLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Demasiados mensajes. Espera un momento e inténtalo de nuevo.',
  standardHeaders: true,
  legacyHeaders: false
});

const guestMessagesGetLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 45,
  message: 'Demasiadas peticiones. Espera un momento.',
  standardHeaders: true,
  legacyHeaders: false
});

const guestConversationDeleteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Demasiadas peticiones. Espera un momento.',
  standardHeaders: true,
  legacyHeaders: false
});

function hashIp(req) {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip ? String(ip).split(':').join('').slice(0, 32) : null;
}

router.post('/session', guestSessionCreateLimiter, async (req, res) => {
  try {
    const data = await guestChatService.createGuestSession(hashIp(req));
    res.status(201).json(data);
  } catch (error) {
    console.error('[GuestChat] Error creando sesión:', error);
    metricsService.bumpChatFriction('guest_session_server_error', {
      httpStatus: 500,
      surface: 'guest'
    });
    res.status(500).json({ message: 'No se pudo iniciar el chat de invitado', error: error.message });
  }
});

router.get(
  '/conversations/:conversationId/messages',
  guestMessagesGetLimiter,
  authenticateGuest,
  async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      metricsService.bumpChatFriction('guest_get_messages_invalid_conversation_id', {
        httpStatus: 400,
        surface: 'guest'
      });
      return res.status(400).json({ message: 'Identificador de conversación no válido' });
    }
    if (req.guestSession.conversationId.toString() !== conversationId) {
      metricsService.bumpChatFriction('guest_get_messages_conversation_mismatch', {
        httpStatus: 403,
        surface: 'guest'
      });
      return res.status(403).json({ message: 'Conversación no permitida para esta sesión' });
    }
    const messages = await guestChatService.getGuestMessages(req.guestSession);
    metricsService.bumpChatExploration('guest_load_messages');
    res.json({ messages });
  } catch (error) {
    console.error('[GuestChat] Error listando mensajes:', error);
    metricsService.bumpChatFriction('guest_load_messages_server_error', {
      httpStatus: 500,
      surface: 'guest'
    });
    res.status(500).json({ message: 'Error al cargar mensajes', error: error.message });
  }
});

router.delete(
  '/conversations/:conversationId/messages',
  guestConversationDeleteLimiter,
  authenticateGuest,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        metricsService.bumpChatFriction('guest_delete_messages_invalid_conversation_id', {
          httpStatus: 400,
          surface: 'guest'
        });
        return res.status(400).json({ message: 'Identificador de conversación no válido' });
      }
      if (req.guestSession.conversationId.toString() !== conversationId) {
        metricsService.bumpChatFriction('guest_delete_messages_conversation_mismatch', {
          httpStatus: 403,
          surface: 'guest'
        });
        return res.status(403).json({ message: 'Conversación no permitida para esta sesión' });
      }
      const result = await Message.deleteMany({
        conversationId,
        guestSessionId: req.guestSession._id
      });
      res.json({
        message: 'Mensajes eliminados exitosamente',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('[GuestChat] Error borrando mensajes:', error);
      metricsService.bumpChatFriction('guest_delete_messages_server_error', {
        httpStatus: 500,
        surface: 'guest'
      });
      res.status(500).json({ message: 'Error al eliminar mensajes', error: error.message });
    }
  }
);

router.post('/messages', guestMessagePostLimiter, authenticateGuest, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || typeof content !== 'string') {
      metricsService.bumpChatFriction('guest_message_missing_body_fields', {
        httpStatus: 400,
        surface: 'guest'
      });
      return res.status(400).json({ message: 'conversationId y content (texto) son requeridos' });
    }
    if (!mongoose.Types.ObjectId.isValid(String(conversationId))) {
      metricsService.bumpChatFriction('guest_message_invalid_conversation_id', {
        httpStatus: 400,
        surface: 'guest'
      });
      return res.status(400).json({ message: 'Identificador de conversación no válido' });
    }
    if (req.guestSession.conversationId.toString() !== String(conversationId)) {
      metricsService.bumpChatFriction('guest_message_conversation_mismatch', {
        httpStatus: 403,
        surface: 'guest'
      });
      return res.status(403).json({ message: 'Conversación no permitida' });
    }

    const result = await guestChatService.sendGuestMessage(req.guestSession, content);
    res.status(201).json({
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      context: result.context,
      guest: result.guest
    });
  } catch (error) {
    if (error.status === 403 && error.code === 'GUEST_LIMIT_REACHED') {
      metricsService.bumpChatFriction('guest_limit_reached', {
        httpStatus: 403,
        surface: 'guest'
      });
      return res.status(403).json({
        message: error.message,
        code: 'GUEST_LIMIT_REACHED',
        maxUserMessages: error.maxUserMessages,
        requiresAccount: true
      });
    }
    if (error.status === 400) {
      metricsService.bumpChatFriction('guest_message_client_error', {
        httpStatus: 400,
        surface: 'guest'
      });
      return res.status(400).json({
        message: error.message,
        code: error.code || undefined
      });
    }
    console.error('[GuestChat] Error enviando mensaje:', error);
    metricsService.bumpChatFriction('guest_message_server_error', {
      httpStatus: 500,
      surface: 'guest'
    });
    res.status(500).json({ message: 'Error al procesar el mensaje', error: error.message });
  }
});

export default router;
