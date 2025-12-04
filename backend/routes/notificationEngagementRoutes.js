/**
 * Rutas para Analytics de Engagement de Notificaciones
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import NotificationEngagement from '../models/NotificationEngagement.js';

const router = express.Router();

const patchEngagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: 'Demasiadas actualizaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GET /api/notifications/engagement/stats
 * Obtiene estadísticas de engagement de notificaciones del usuario
 */
router.get('/engagement/stats', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const days = parseInt(req.query.days) || 30;

    const stats = await NotificationEngagement.getEngagementStats(userId, days);

    res.json({
      success: true,
      data: {
        stats,
        period: days
      }
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error obteniendo stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de engagement'
    });
  }
});

/**
 * GET /api/notifications/engagement/overall
 * Obtiene estadísticas generales de engagement
 */
router.get('/engagement/overall', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const days = parseInt(req.query.days) || 30;

    const stats = await NotificationEngagement.getOverallStats(userId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error obteniendo overall stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas generales'
    });
  }
});

/**
 * GET /api/notifications/engagement/history
 * Obtiene el historial de notificaciones del usuario
 */
router.get('/engagement/history', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId };
    
    // Filtros opcionales
    if (req.query.type) {
      filter.notificationType = req.query.type;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.sentAt = {};
      if (req.query.startDate) {
        filter.sentAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.sentAt.$lte = new Date(req.query.endDate);
      }
    }

    const [notifications, total] = await Promise.all([
      NotificationEngagement.find(filter)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationEngagement.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de notificaciones'
    });
  }
});

/**
 * PATCH /api/notifications/engagement/:id/status
 * Actualiza el estado de una notificación (por ejemplo, cuando el usuario la abre)
 */
router.patch('/engagement/:id/status', authenticateToken, patchEngagementLimiter, async (req, res) => {
  try {
    const notificationId = new mongoose.Types.ObjectId(req.params.id);
    const { status } = req.body;

    if (!['sent', 'delivered', 'opened', 'dismissed', 'error'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const update = { status };
    
    // Si se marca como abierta, agregar timestamp
    if (status === 'opened') {
      update.openedAt = new Date();
    }
    // Si se marca como entregada, agregar timestamp
    if (status === 'delivered') {
      update.deliveredAt = new Date();
    }

    const notification = await NotificationEngagement.findOneAndUpdate(
      { _id: notificationId, userId: new mongoose.Types.ObjectId(req.user._id) },
      update,
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado de notificación'
    });
  }
});

export default router;

