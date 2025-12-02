/**
 * Rutas de Crisis - Gestiona endpoints para métricas y estadísticas de crisis
 */
import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import crisisMetricsService from '../services/crisisMetricsService.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

/**
 * GET /api/crisis/summary
 * Obtiene un resumen general de crisis del usuario
 * Query params: days (default: 30)
 */
router.get('/summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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
 * Query params: period ('7d', '30d', '90d', default: '30d')
 */
router.get('/trends', async (req, res) => {
  try {
    const period = req.query.period || '30d';
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
 * Query params: months (default: 6)
 */
router.get('/by-month', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
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
 * Query params: limit, offset, riskLevel, startDate, endDate
 */
router.get('/history', async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
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
 * Query params: days (default: 30)
 */
router.get('/alerts-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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
 * Query params: days (default: 30)
 */
router.get('/followup-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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
 * Query params: days (default: 30)
 */
router.get('/emotion-distribution', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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
 * Query params: currentDays (default: 30), previousDays (default: 30)
 */
router.get('/compare-periods', async (req, res) => {
  try {
    const currentDays = parseInt(req.query.currentDays) || 30;
    const previousDays = parseInt(req.query.previousDays) || 30;
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
 * Query params: days (default: 30)
 */
router.get('/export', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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
 * Query params: days (default: 30)
 */
router.get('/technique-recommendations', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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
 * Query params: days (default: 30)
 */
router.get('/technique-effectiveness', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
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

