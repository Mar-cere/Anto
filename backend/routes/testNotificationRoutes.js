/**
 * Rutas de Testing para Notificaciones Push
 * SOLO PARA DESARROLLO
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import User from '../models/User.js';
import pushNotificationService from '../services/pushNotificationService.js';
import { testNotificationApiCopy } from '../utils/testNotificationApiCopy.js';

const router = express.Router();

router.use(attachApiCopy(testNotificationApiCopy));

router.post('/test/crisis-warning', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+pushToken');

    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: copy.noPushToken,
      });
    }

    const result = await pushNotificationService.sendCrisisWarning(user.pushToken, {
      emotion: 'tristeza',
      intensity: 6,
    });

    if (result.success) {
      res.json({
        success: true,
        message: copy.warningSent,
        ticketId: result.ticketId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: copy.sendError,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[TestNotificationRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: copy.testSendError,
      error: error.message,
    });
  }
});

router.post('/test/crisis-medium', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+pushToken');

    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: copy.noPushToken,
      });
    }

    const result = await pushNotificationService.sendCrisisMedium(user.pushToken);

    if (result.success) {
      res.json({
        success: true,
        message: copy.mediumSent,
        ticketId: result.ticketId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: copy.sendError,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[TestNotificationRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: copy.testSendError,
      error: error.message,
    });
  }
});

router.post('/test/followup', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+pushToken');

    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: copy.noPushToken,
      });
    }

    const result = await pushNotificationService.sendFollowUp(user.pushToken, {
      hoursSinceCrisis: 24,
      message: copy.followupTestMessage,
    });

    if (result.success) {
      res.json({
        success: true,
        message: copy.followupSent,
        ticketId: result.ticketId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: copy.sendError,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[TestNotificationRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: copy.testSendError,
      error: error.message,
    });
  }
});

export default router;
