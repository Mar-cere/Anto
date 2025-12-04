/**
 * Rutas de Notificaciones Push
 * 
 * Maneja el registro y gestión de tokens push para notificaciones
 * 
 * @author AntoApp Team
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const deletePushTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Demasiadas eliminaciones de tokens. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/notifications/push-token
 * Registra o actualiza el token push del usuario
 */
router.post('/push-token', authenticateToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user._id;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Token push es requerido'
      });
    }

    // Validar formato básico del token Expo
    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      return res.status(400).json({
        success: false,
        message: 'Formato de token push inválido'
      });
    }

    // Actualizar token en el usuario
    await User.findByIdAndUpdate(userId, {
      pushToken,
      pushTokenUpdatedAt: new Date()
    }, { select: '+pushToken' }); // Forzar incluir el campo

    console.log(`[NotificationRoutes] ✅ Token push actualizado para usuario ${userId}`);

    res.json({
      success: true,
      message: 'Token push registrado exitosamente'
    });
  } catch (error) {
    console.error('[NotificationRoutes] ❌ Error registrando token push:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando token push',
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/push-token
 * Elimina el token push del usuario (útil para logout)
 */
router.delete('/push-token', authenticateToken, deletePushTokenLimiter, async (req, res) => {
  try {
    const userId = req.user._id;

    // Eliminar token
    await User.findByIdAndUpdate(userId, {
      $unset: { pushToken: '', pushTokenUpdatedAt: '' }
    }, { select: '+pushToken' });

    console.log(`[NotificationRoutes] ✅ Token push eliminado para usuario ${userId}`);

    res.json({
      success: true,
      message: 'Token push eliminado exitosamente'
    });
  } catch (error) {
    console.error('[NotificationRoutes] ❌ Error eliminando token push:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando token push',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/push-token
 * Obtiene el estado del token push del usuario
 */
router.get('/push-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('+pushToken pushTokenUpdatedAt');

    res.json({
      success: true,
      hasToken: !!user.pushToken,
      tokenUpdatedAt: user.pushTokenUpdatedAt || null
    });
  } catch (error) {
    console.error('[NotificationRoutes] ❌ Error obteniendo estado del token:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del token',
      error: error.message
    });
  }
});

export default router;

