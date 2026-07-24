/**
 * Rutas de Métricas y Monitoreo
 */
import express from 'express';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import metricsService from '../services/metricsService.js';
import { metricsApiCopy } from '../utils/metricsApiCopy.js';

const commitmentMetricSchema = Joi.object({
  event: Joi.string().valid('create_dismissed', 'bridge_dismissed', 'follow_up_shown').required(),
  surface: Joi.when('event', {
    is: 'follow_up_shown',
    then: Joi.string().valid('dashboard').required(),
    otherwise: Joi.string()
      .valid('chat', 'task_modal', 'habit_modal', 'session_insight')
      .required(),
  }),
});

const productActionMetricSchema = Joi.object({
  event: Joi.string().valid('confirm_dismissed', 'create_failed').required(),
  surface: Joi.string().valid('task_modal', 'habit_modal').required(),
  resource: Joi.string()
    .valid('task', 'habit')
    .when('event', {
      is: 'create_failed',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
});

const softLandingMetricSchema = Joi.object({
  event: Joi.string().valid('regulation_tap').required(),
  techniqueId: Joi.string().valid('breathing', 'grounding').required(),
  surface: Joi.string().valid('chat_strip').default('chat_strip'),
});

const router = express.Router();

router.use(attachApiCopy(metricsApiCopy));

const isAdmin = (req, res, next) => {
  const copy = req.apiCopy;
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: copy.notAuthenticated,
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: copy.adminDenied,
      required: 'admin',
      current: req.user.role || 'user',
    });
  }

  next();
};

router.get('/system', authenticateToken, isAdmin, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const metrics = metricsService.getMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error obteniendo métricas del sistema:', error);
    res.status(500).json({
      success: false,
      message: copy.systemMetricsError,
      error: error.message,
    });
  }
});

router.get('/health', authenticateToken, isAdmin, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const healthStats = await metricsService.getHealthStats();
    res.json({
      success: true,
      data: healthStats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de salud:', error);
    res.status(500).json({
      success: false,
      message: copy.healthStatsError,
      error: error.message,
    });
  }
});

router.post('/commitment', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = commitmentMetricSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0]?.message || copy.invalidData,
      });
    }
    const metricName =
      value.event === 'bridge_dismissed'
        ? 'commitment_bridge_dismissed'
        : value.event === 'follow_up_shown'
          ? 'commitment_follow_up_shown'
          : 'commitment_create_dismissed';
    await metricsService.recordMetric(
      metricName,
      { surface: value.surface },
      req.user._id.toString(),
    );
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('POST /api/metrics/commitment', e);
    return res.status(500).json({
      success: false,
      message: copy.recordMetricError,
    });
  }
});

router.post('/soft-landing', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = softLandingMetricSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0]?.message || copy.invalidData,
      });
    }
    await metricsService.recordMetric(
      'soft_landing_regulation_tap',
      {
        techniqueId: value.techniqueId,
        surface: value.surface,
      },
      req.user._id.toString(),
    );
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('POST /api/metrics/soft-landing', e);
    return res.status(500).json({
      success: false,
      message: copy.recordMetricError,
    });
  }
});

router.post('/product-action', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = productActionMetricSchema.validate(req.body, {
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0]?.message || copy.invalidData,
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
      message: copy.recordMetricError,
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userMetrics = metricsService.getUserMetrics(req.user._id.toString());
    res.json({
      success: true,
      data: userMetrics,
    });
  } catch (error) {
    console.error('Error obteniendo métricas del usuario:', error);
    res.status(500).json({
      success: false,
      message: copy.userMetricsError,
      error: error.message,
    });
  }
});

router.get('/type/:type', authenticateToken, isAdmin, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { type } = req.params;
    const metrics = metricsService.getMetricsByType(type);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error obteniendo métricas por tipo:', error);
    res.status(500).json({
      success: false,
      message: copy.metricsByTypeError,
      error: error.message,
    });
  }
});

export default router;
