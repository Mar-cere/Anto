/**
 * Rutas para Analytics de Engagement de Notificaciones
 */
import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import NotificationEngagement from '../models/NotificationEngagement.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { notificationEngagementApiCopy } from '../utils/notificationEngagementApiCopy.js';

const router = express.Router();

router.use(attachApiCopy(notificationEngagementApiCopy));

const patchEngagementLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) =>
    notificationEngagementApiCopy(resolveRequestLanguage(req)).rateLimitUpdate,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/engagement/stats', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const days = parseInt(req.query.days) || 30;

    const stats = await NotificationEngagement.getEngagementStats(userId, days);

    res.json({
      success: true,
      data: {
        stats,
        period: days,
      },
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error obteniendo stats:', error);
    res.status(500).json({
      success: false,
      message: copy.engagementStatsError,
    });
  }
});

router.get('/engagement/overall', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const days = parseInt(req.query.days) || 30;

    const stats = await NotificationEngagement.getOverallStats(userId, days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error obteniendo overall stats:', error);
    res.status(500).json({
      success: false,
      message: copy.overallStatsError,
    });
  }
});

router.get('/engagement/history', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId };

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
      NotificationEngagement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: copy.historyError,
    });
  }
});

router.patch('/engagement/:id/status', authenticateToken, patchEngagementLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const notificationId = new mongoose.Types.ObjectId(req.params.id);
    const { status } = req.body;

    if (!['sent', 'delivered', 'opened', 'dismissed', 'error'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: copy.invalidStatus,
      });
    }

    const update = { status };

    if (status === 'opened') {
      update.openedAt = new Date();
    }
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
        message: copy.notificationNotFound,
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('[NotificationEngagementRoutes] Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: copy.updateStatusError,
    });
  }
});

export default router;
