/**
 * Rutas de Feedback de Respuestas
 * Endpoints para gestionar el feedback del usuario sobre las respuestas
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ResponseFeedback from '../models/ResponseFeedback.js';
import Message from '../models/Message.js';
import Joi from 'joi';

const router = express.Router();

// Esquema de validación para crear feedback
const createFeedbackSchema = Joi.object({
  messageId: Joi.string().required(),
  feedbackType: Joi.string().valid('helpful', 'not_helpful', 'neutral', 'excellent', 'poor').required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).allow('', null).optional(),
  metadata: Joi.object().optional(),
});

// Crear feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createFeedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(d => d.message),
      });
    }

    const { messageId, feedbackType, rating, comment, metadata } = value;

    // Verificar que el mensaje existe y pertenece al usuario
    const message = await Message.findOne({
      _id: messageId,
      userId: req.user._id,
      role: 'assistant',
    });

    if (!message) {
      return res.status(404).json({
        message: 'Mensaje no encontrado',
      });
    }

    // Verificar si ya existe feedback para este mensaje
    const existingFeedback = await ResponseFeedback.findOne({
      userId: req.user._id,
      messageId,
    });

    if (existingFeedback) {
      // Actualizar feedback existente
      existingFeedback.feedbackType = feedbackType;
      existingFeedback.rating = rating;
      existingFeedback.comment = comment || existingFeedback.comment;
      existingFeedback.metadata = { ...existingFeedback.metadata, ...metadata };
      await existingFeedback.save();

      return res.json({
        message: 'Feedback actualizado',
        feedback: existingFeedback,
      });
    }

    // Crear nuevo feedback
    const feedback = new ResponseFeedback({
      userId: req.user._id,
      messageId,
      conversationId: message.conversationId,
      feedbackType,
      rating,
      comment: comment || undefined,
      metadata: metadata || {},
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback guardado',
      feedback,
    });
  } catch (error) {
    console.error('[ResponseFeedbackRoutes] Error creando feedback:', error);
    res.status(500).json({
      message: 'Error al guardar feedback',
      error: error.message,
    });
  }
});

// Obtener estadísticas de feedback
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await ResponseFeedback.getFeedbackStats(req.user._id, days);

    res.json(stats);
  } catch (error) {
    console.error('[ResponseFeedbackRoutes] Error obteniendo estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
});

// Obtener feedback de un mensaje específico
router.get('/message/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const feedback = await ResponseFeedback.findOne({
      userId: req.user._id,
      messageId,
    });

    if (!feedback) {
      return res.status(404).json({
        message: 'No se encontró feedback para este mensaje',
      });
    }

    res.json(feedback);
  } catch (error) {
    console.error('[ResponseFeedbackRoutes] Error obteniendo feedback:', error);
    res.status(500).json({
      message: 'Error al obtener feedback',
      error: error.message,
    });
  }
});

export default router;

