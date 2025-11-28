/**
 * Rutas de Testing para Notificaciones Push
 * 
 * Endpoints temporales para probar el sistema de notificaciones
 * ⚠️ SOLO PARA DESARROLLO - Eliminar en producción
 * 
 * @author AntoApp Team
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import pushNotificationService from '../services/pushNotificationService.js';

const router = express.Router();

/**
 * POST /api/notifications/test/crisis-warning
 * Envía una notificación de prueba de crisis WARNING
 */
router.post('/test/crisis-warning', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+pushToken');

    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene token push registrado. Activa las notificaciones push en Settings.'
      });
    }

    const result = await pushNotificationService.sendCrisisWarning(
      user.pushToken,
      {
        emotion: 'tristeza',
        intensity: 6
      }
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Notificación de prueba WARNING enviada exitosamente',
        ticketId: result.ticketId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error enviando notificación',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[TestNotificationRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación de prueba',
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/test/crisis-medium
 * Envía una notificación de prueba de crisis MEDIUM
 */
router.post('/test/crisis-medium', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+pushToken');

    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene token push registrado. Activa las notificaciones push en Settings.'
      });
    }

    const result = await pushNotificationService.sendCrisisMedium(user.pushToken);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notificación de prueba MEDIUM enviada exitosamente',
        ticketId: result.ticketId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error enviando notificación',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[TestNotificationRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación de prueba',
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/test/followup
 * Envía una notificación de prueba de seguimiento
 */
router.post('/test/followup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+pushToken');

    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene token push registrado. Activa las notificaciones push en Settings.'
      });
    }

    const result = await pushNotificationService.sendFollowUp(
      user.pushToken,
      {
        hoursSinceCrisis: 24,
        message: 'Han pasado 24 horas desde tu último momento difícil. ¿Quieres compartir cómo te sientes?'
      }
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Notificación de prueba de seguimiento enviada exitosamente',
        ticketId: result.ticketId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error enviando notificación',
        error: result.error
      });
    }
  } catch (error) {
    console.error('[TestNotificationRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación de prueba',
      error: error.message
    });
  }
});

export default router;

