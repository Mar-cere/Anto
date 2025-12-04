/**
 * Rutas de Crisis - Gestiona endpoints para métricas y estadísticas de crisis
 */
import express from 'express';
import Joi from 'joi';
import { authenticateToken as protect } from '../middleware/auth.js';
import crisisMetricsService from '../services/crisisMetricsService.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Middleware para validar query parameters
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }
    req.query = value;
    next();
  };
};

// Esquemas de validación para query parameters
const daysQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30)
});

const monthsQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(24).default(6)
});

const periodQuerySchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '180d', '365d').default('30d')
});

const historyQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  riskLevel: Joi.string().valid('LOW', 'WARNING', 'MEDIUM', 'HIGH').allow(null, '').optional(),
  startDate: Joi.date().iso().allow(null, '').optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null, '').optional()
});

const comparePeriodsQuerySchema = Joi.object({
  currentDays: Joi.number().integer().min(1).max(365).default(30),
  previousDays: Joi.number().integer().min(1).max(365).default(30)
});

/**
 * GET /api/crisis/summary
 * Obtiene un resumen general de crisis del usuario
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/summary', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const summary = await crisisMetricsService.getCrisisSummary(req.user._id, days);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de crisis',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/trends
 * Obtiene tendencias emocionales del usuario
 * Query params: period ('7d', '30d', '90d', '180d', '365d', default: '30d')
 */
router.get('/trends', validateQueryParams(periodQuerySchema), async (req, res) => {
  try {
    const period = req.query.period;
    const trends = await crisisMetricsService.getEmotionalTrends(req.user._id, period);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo tendencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tendencias emocionales',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/by-month
 * Obtiene crisis agrupadas por mes
 * Query params: months (default: 6, min: 1, max: 24)
 */
router.get('/by-month', validateQueryParams(monthsQuerySchema), async (req, res) => {
  try {
    const months = req.query.months;
    const monthlyData = await crisisMetricsService.getCrisisByMonth(req.user._id, months);
    
    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo crisis por mes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener crisis por mes',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/history
 * Obtiene historial de crisis con detalles
 * Query params: limit (1-100), offset (min: 0), riskLevel (LOW/WARNING/MEDIUM/HIGH), startDate, endDate
 */
router.get('/history', validateQueryParams(historyQuerySchema), async (req, res) => {
  try {
    const options = {
      limit: req.query.limit,
      offset: req.query.offset,
      riskLevel: req.query.riskLevel || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };

    const history = await crisisMetricsService.getCrisisHistory(req.user._id, options);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de crisis',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/alerts-stats
 * Obtiene estadísticas de alertas
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/alerts-stats', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const stats = await crisisMetricsService.getAlertStatistics(req.user._id, days);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de alertas',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/followup-stats
 * Obtiene estadísticas de seguimiento
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/followup-stats', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const stats = await crisisMetricsService.getFollowUpStatistics(req.user._id, days);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo estadísticas de seguimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de seguimiento',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/emotion-distribution
 * Obtiene distribución de emociones en crisis
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/emotion-distribution', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const distribution = await crisisMetricsService.getEmotionDistribution(req.user._id, days);
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo distribución de emociones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener distribución de emociones',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/compare-periods
 * Compara métricas entre dos períodos
 * Query params: currentDays (default: 30, min: 1, max: 365), previousDays (default: 30, min: 1, max: 365)
 */
router.get('/compare-periods', validateQueryParams(comparePeriodsQuerySchema), async (req, res) => {
  try {
    const currentDays = req.query.currentDays;
    const previousDays = req.query.previousDays;
    const comparison = await crisisMetricsService.comparePeriods(req.user._id, currentDays, previousDays);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error comparando períodos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al comparar períodos',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/export
 * Obtiene datos para exportación CSV
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/export', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const exportData = await crisisMetricsService.getExportData(req.user._id, days);
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo datos para exportación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos para exportación',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/technique-recommendations
 * Obtiene recomendaciones de técnicas basadas en crisis detectadas
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/technique-recommendations', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const recommendations = await crisisMetricsService.getTechniqueRecommendations(req.user._id, days);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo recomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recomendaciones de técnicas',
      error: error.message
    });
  }
});

/**
 * GET /api/crisis/technique-effectiveness
 * Obtiene análisis de efectividad de técnicas por tipo de crisis
 * Query params: days (default: 30, min: 1, max: 365)
 */
router.get('/technique-effectiveness', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const analysis = await crisisMetricsService.getTechniqueEffectivenessAnalysis(req.user._id, days);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error analizando efectividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al analizar efectividad de técnicas',
      error: error.message
    });
  }
});

export default router;

