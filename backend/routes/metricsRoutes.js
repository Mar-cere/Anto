/**
 * Rutas de Métricas y Monitoreo
 * 
 * Endpoints para obtener métricas del sistema y estadísticas de salud
 */
import express from 'express';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth.js';
import metricsService from '../services/metricsService.js';

const productActionMetricSchema = Joi.object({
  event: Joi.string().valid('confirm_dismissed', 'create_failed').required(),
  surface: Joi.string().valid('task_modal', 'habit_modal').required(),
  resource: Joi.string()
    .valid('task', 'habit')
    .when('event', {
      is: 'create_failed',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
});

const router = express.Router();

// Middleware: Solo administradores pueden acceder a métricas globales
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  // Verificar que el usuario tenga rol de administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador.',
      required: 'admin',
      current: req.user.role || 'user'
    });
  }

  next();
};

// Obtener métricas generales del sistema (requiere autenticación)
router.get('/system', authenticateToken, isAdmin, async (req, res) => {
  try {
    const metrics = metricsService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del sistema',
      error: error.message
    });
  }
});

// Obtener estadísticas de salud del sistema
router.get('/health', authenticateToken, isAdmin, async (req, res) => {
  try {
    const healthStats = await metricsService.getHealthStats();
    res.json({
      success: true,
      data: healthStats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de salud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de salud',
      error: error.message
    });
  }
});

/** Dismiss modal sin confirmar o fallo de creación (cliente), §8 contrato chat acciones. */
router.post('/product-action', authenticateToken, async (req, res) => {
  try {
    const { error, value } = productActionMetricSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0]?.message || 'Datos inválidos'
      });
    }
    if (value.event === 'confirm_dismissed') {
      await metricsService.recordMetric(
        'product_action_confirm_dismissed',
        { surface: value.surface },
        req.user._id.toString()
      );
    } else {
      await metricsService.recordMetric(
        'product_action_create_failed',
        { fromChat: true, resource: value.resource },
        req.user._id.toString()
      );
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('POST /api/metrics/product-action', e);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar métrica'
    });
  }
});

// Obtener métricas del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userMetrics = metricsService.getUserMetrics(req.user._id.toString());
    res.json({
      success: true,
      data: userMetrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del usuario',
      error: error.message
    });
  }
});

// Obtener métricas por tipo
router.get('/type/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const metrics = metricsService.getMetricsByType(type);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error obteniendo métricas por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas por tipo',
      error: error.message
    });
  }
});

export default router;

