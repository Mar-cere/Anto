/**
 * Chat invitado (sin cuenta) — límite de mensajes, sin suscripción.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { authenticateGuest } from '../middleware/guestAuth.js';
import guestChatService from '../services/guestChatService.js';

const router = express.Router();

const guestSessionCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Demasiadas sesiones de invitado. Intenta más tarde o crea una cuenta.',
  standardHeaders: true,
  legacyHeaders: false
});

/** Anti-spam: envíos por IP (trust proxy en server.js) */
const guestMessagePostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Demasiados mensajes. Espera un momento e inténtalo de nuevo.',
  standardHeaders: true,
  legacyHeaders: false
});

const guestMessagesGetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
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
      return res.status(400).json({ message: 'Identificador de conversación no válido' });
    }
    if (req.guestSession.conversationId.toString() !== conversationId) {
      return res.status(403).json({ message: 'Conversación no permitida para esta sesión' });
    }
    const messages = await guestChatService.getGuestMessages(req.guestSession);
    res.json({ messages });
  } catch (error) {
    console.error('[GuestChat] Error listando mensajes:', error);
    res.status(500).json({ message: 'Error al cargar mensajes', error: error.message });
  }
});

router.post('/messages', guestMessagePostLimiter, authenticateGuest, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || typeof content !== 'string') {
      return res.status(400).json({ message: 'conversationId y content (texto) son requeridos' });
    }
    if (!mongoose.Types.ObjectId.isValid(String(conversationId))) {
      return res.status(400).json({ message: 'Identificador de conversación no válido' });
    }
    if (req.guestSession.conversationId.toString() !== String(conversationId)) {
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
      return res.status(403).json({
        message: error.message,
        code: 'GUEST_LIMIT_REACHED',
        maxUserMessages: error.maxUserMessages,
        requiresAccount: true
      });
    }
    if (error.status === 400) {
      return res.status(400).json({
        message: error.message,
        code: error.code || undefined
      });
    }
    console.error('[GuestChat] Error enviando mensaje:', error);
    res.status(500).json({ message: 'Error al procesar el mensaje', error: error.message });
  }
});

export default router;
