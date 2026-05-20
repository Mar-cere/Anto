/**
 * Rutas de Feedback de Respuestas
 * Endpoints para gestionar el feedback del usuario sobre las respuestas
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ResponseFeedback from '../models/ResponseFeedback.js';
import Message from '../models/Message.js';
import effectivenessFeedbackService from '../services/effectivenessFeedbackService.js';
import Joi from 'joi';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validationErrorBody, validateBody } from '../utils/apiValidation.js';
import { responseFeedbackApiCopy } from '../utils/responseFeedbackApiCopy.js';

const router = express.Router();

router.use(attachApiCopy(responseFeedbackApiCopy));

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
    const { error, value } = validateBody(createFeedbackSchema, req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }

    const { messageId, feedbackType, rating, comment, metadata } = value;

    // Verificar que el mensaje existe y pertenece al usuario
    const message = await Message.findOne({
      _id: messageId,
      userId: req.user._id,
      role: 'assistant',
    })
      .select('_id conversationId userId')
      .lean();

    if (!message) {
      return res.status(404).json({
        message: req.apiCopy.messageNotFound,
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

      // Si el mensaje contenía técnica, actualizar copingStrategies
      effectivenessFeedbackService.processFeedback(
        req.user._id.toString(),
        messageId,
        feedbackType,
        rating
      ).catch(err => console.warn('[ResponseFeedback] Error actualizando copingStrategy:', err.message));

      return res.json({
        message: req.apiCopy.feedbackUpdated,
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

    // Si el mensaje contenía una técnica sugerida, actualizar copingStrategies
    effectivenessFeedbackService.processFeedback(
      req.user._id.toString(),
      messageId,
      feedbackType,
      rating
    ).catch(err => console.warn('[ResponseFeedback] Error actualizando copingStrategy:', err.message));

    res.status(201).json({
      message: req.apiCopy.feedbackSaved,
      feedback,
    });
  } catch (error) {
    console.error('[ResponseFeedbackRoutes] Error creando feedback:', error);
    res.status(500).json({
      message: req.apiCopy.saveError,
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
      message: req.apiCopy.statsError,
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
    })
      .lean();

    if (!feedback) {
      return res.status(404).json({
        message: req.apiCopy.feedbackNotFound,
      });
    }

    res.json(feedback);
  } catch (error) {
    console.error('[ResponseFeedbackRoutes] Error obteniendo feedback:', error);
    res.status(500).json({
      message: req.apiCopy.getError,
      error: error.message,
    });
  }
});

export default router;

