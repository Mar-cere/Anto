/**
 * Rutas de Notificaciones Push
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import User from '../models/User.js';
import pushNotificationService from '../services/pushNotificationService.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { resolveAppLanguage } from '../utils/resolveAppLanguage.js';
import { notificationApiCopy } from '../utils/notificationApiCopy.js';
import { isPreferencesNotificationsEnabled } from '../utils/preferencesNotifications.js';

const router = express.Router();

router.use(attachApiCopy(notificationApiCopy));

const deletePushTokenLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: (req) =>
    notificationApiCopy(resolveRequestLanguage(req)).rateLimitDeleteToken,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/push-token', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { pushToken } = req.body;
    const userId = req.user._id;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: copy.pushTokenRequired,
      });
    }

    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      return res.status(400).json({
        success: false,
        message: copy.invalidPushTokenFormat,
      });
    }

    const prevUser = await User.findById(userId).select(
      '+pushToken subscription notificationPreferences preferences'
    );

    if (!prevUser) {
      return res.status(404).json({
        success: false,
        message: copy.userNotFound,
      });
    }

    const hadToken = !!prevUser?.pushToken;
    const now = new Date();
    const inTrial =
      prevUser?.subscription?.status === 'trial' &&
      prevUser?.subscription?.trialEndDate &&
      new Date(prevUser.subscription.trialEndDate) > now;

    await User.findByIdAndUpdate(
      userId,
      {
        pushToken,
        pushTokenUpdatedAt: new Date(),
      },
      { select: '+pushToken' }
    );

    console.log(`[NotificationRoutes] ✅ Token push actualizado para usuario ${userId}`);

    if (
      !hadToken &&
      inTrial &&
      prevUser?.notificationPreferences?.enabled !== false &&
      isPreferencesNotificationsEnabled(prevUser?.preferences?.notifications)
    ) {
      try {
        const pushLanguage = resolveAppLanguage({
          preferenceLanguage: prevUser?.preferences?.language,
          headerLanguage: req.headers['x-app-language'],
        });
        await pushNotificationService.sendTrialWelcome(pushToken, {
          language: pushLanguage,
        });
      } catch (welcomeErr) {
        console.warn('[NotificationRoutes] No se pudo enviar trial welcome push:', welcomeErr?.message);
      }
    }

    res.json({
      success: true,
      message: copy.registerSuccess,
    });
  } catch (error) {
    console.error('[NotificationRoutes] ❌ Error registrando token push:', error);
    res.status(500).json({
      success: false,
      message: copy.registerError,
      error: error.message,
    });
  }
});

router.delete('/push-token', authenticateToken, deletePushTokenLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
      userId,
      {
        $unset: { pushToken: '', pushTokenUpdatedAt: '' },
      },
      { select: '+pushToken' }
    );

    console.log(`[NotificationRoutes] ✅ Token push eliminado para usuario ${userId}`);

    res.json({
      success: true,
      message: copy.deleteSuccess,
    });
  } catch (error) {
    console.error('[NotificationRoutes] ❌ Error eliminando token push:', error);
    res.status(500).json({
      success: false,
      message: copy.deleteError,
      error: error.message,
    });
  }
});

router.get('/push-token', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('+pushToken pushTokenUpdatedAt');

    res.json({
      success: true,
      hasToken: !!user.pushToken,
      tokenUpdatedAt: user.pushTokenUpdatedAt || null,
    });
  } catch (error) {
    console.error('[NotificationRoutes] ❌ Error obteniendo estado del token:', error);
    res.status(500).json({
      success: false,
      message: copy.getStatusError,
      error: error.message,
    });
  }
});

export default router;
