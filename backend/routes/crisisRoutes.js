/**
 * Rutas de Crisis - Gestiona endpoints para métricas y estadísticas de crisis
 */
import express from 'express';
import Joi from 'joi';
import { authenticateToken as protect } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import crisisMetricsService from '../services/crisisMetricsService.js';
import { crisisApiCopy } from '../utils/crisisApiCopy.js';

const router = express.Router();

router.use(protect);
router.use(attachApiCopy(crisisApiCopy));

const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: req.apiCopy.invalidQueryParams,
        errors: error.details.map((detail) => detail.message),
      });
    }
    req.query = value;
    next();
  };
};

const daysQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
});

const monthsQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(24).default(6),
});

const periodQuerySchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '180d', '365d').default('30d'),
});

const historyQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  riskLevel: Joi.string().valid('LOW', 'WARNING', 'MEDIUM', 'HIGH').allow(null, '').optional(),
  startDate: Joi.date().iso().allow(null, '').optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null, '').optional(),
});

const comparePeriodsQuerySchema = Joi.object({
  currentDays: Joi.number().integer().min(1).max(365).default(30),
  previousDays: Joi.number().integer().min(1).max(365).default(30),
});

router.get('/summary', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const summary = await crisisMetricsService.getCrisisSummary(req.user._id, days);

    res.json({
      success: true,
      data: summary,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.summaryError,
      error: error.message,
    });
  }
});

router.get('/trends', validateQueryParams(periodQuerySchema), async (req, res) => {
  try {
    const period = req.query.period;
    const trends = await crisisMetricsService.getEmotionalTrends(req.user._id, period);

    res.json({
      success: true,
      data: trends,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo tendencias:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.trendsError,
      error: error.message,
    });
  }
});

router.get('/by-month', validateQueryParams(monthsQuerySchema), async (req, res) => {
  try {
    const months = req.query.months;
    const monthlyData = await crisisMetricsService.getCrisisByMonth(req.user._id, months);

    res.json({
      success: true,
      data: monthlyData,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo crisis por mes:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.byMonthError,
      error: error.message,
    });
  }
});

router.get('/history', validateQueryParams(historyQuerySchema), async (req, res) => {
  try {
    const options = {
      limit: req.query.limit,
      offset: req.query.offset,
      riskLevel: req.query.riskLevel || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };

    const history = await crisisMetricsService.getCrisisHistory(req.user._id, options);

    res.json({
      success: true,
      data: history,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.historyError,
      error: error.message,
    });
  }
});

router.get('/alerts-stats', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const stats = await crisisMetricsService.getAlertStatistics(req.user._id, days);

    res.json({
      success: true,
      data: stats,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.alertsStatsError,
      error: error.message,
    });
  }
});

router.get('/followup-stats', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const stats = await crisisMetricsService.getFollowUpStatistics(req.user._id, days);

    res.json({
      success: true,
      data: stats,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo estadísticas de seguimiento:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.followupStatsError,
      error: error.message,
    });
  }
});

router.get('/emotion-distribution', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const distribution = await crisisMetricsService.getEmotionDistribution(req.user._id, days);

    res.json({
      success: true,
      data: distribution,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo distribución de emociones:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.emotionDistributionError,
      error: error.message,
    });
  }
});

router.get('/compare-periods', validateQueryParams(comparePeriodsQuerySchema), async (req, res) => {
  try {
    const currentDays = req.query.currentDays;
    const previousDays = req.query.previousDays;
    const comparison = await crisisMetricsService.comparePeriods(
      req.user._id,
      currentDays,
      previousDays,
    );

    res.json({
      success: true,
      data: comparison,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error comparando períodos:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.comparePeriodsError,
      error: error.message,
    });
  }
});

router.get('/export', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const exportData = await crisisMetricsService.getExportData(req.user._id, days);

    res.json({
      success: true,
      data: exportData,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo datos para exportación:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.exportError,
      error: error.message,
    });
  }
});

router.get('/technique-recommendations', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const recommendations = await crisisMetricsService.getTechniqueRecommendations(
      req.user._id,
      days,
      req.appLanguage,
    );

    res.json({
      success: true,
      data: recommendations,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error obteniendo recomendaciones:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.recommendationsError,
      error: error.message,
    });
  }
});

router.get('/technique-effectiveness', validateQueryParams(daysQuerySchema), async (req, res) => {
  try {
    const days = req.query.days;
    const analysis = await crisisMetricsService.getTechniqueEffectivenessAnalysis(
      req.user._id,
      days,
    );

    res.json({
      success: true,
      data: analysis,
      language: req.appLanguage,
    });
  } catch (error) {
    console.error('[CrisisRoutes] Error analizando efectividad:', error);
    res.status(500).json({
      success: false,
      message: req.apiCopy.techniqueEffectivenessError,
      error: error.message,
    });
  }
});

export default router;
