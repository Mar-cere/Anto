/**
 * Rutas internas de métricas de paráfrasis (#55)
 * Endpoints para análisis de impacto y dashboard de monitoreo
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiCopy.js';
import {
  getParaphrasStats,
  getUserParaphrasMetrics,
  calculateAdherenceRate,
} from '../services/chat/paraphrasMetricsService.js';
import { analyzeWaiCorrelation } from '../services/analytics/waiCorrelationAnalyzer.js';
import { analyzeRetentionImpact } from '../services/analytics/retentionImpactAnalyzer.js';

const router = express.Router();

/**
 * GET /api/internal/paraphrasis/stats
 * 
 * Obtiene estadísticas agregadas de paráfrasis.
 * 
 * Query params:
 * - userId: Filtrar por usuario específico
 * - conversationId: Filtrar por conversación específica
 * - startDate: Fecha inicio (ISO)
 * - endDate: Fecha fin (ISO)
 * 
 * Retorna:
 * - totalConversations: Total de conversaciones analizadas
 * - totalParaphrasisRequired: Total de turnos donde se requería paráfrasis
 * - totalParaphrasisDetected: Total de turnos donde se detectó paráfrasis
 * - adherenceRate: Tasa de adherencia (detected / required)
 */
router.get(
  '/stats',
  authenticateToken,
  attachApiCopy('en'), // TODO: add i18n for internal routes
  async (req, res) => {
    try {
      const { userId, conversationId, startDate, endDate } = req.query;

      const filters = {};
      if (userId) filters.userId = userId;
      if (conversationId) filters.conversationId = conversationId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const stats = await getParaphrasStats(filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[GET /api/internal/paraphrasis/stats] Error:', error);
      res.status(500).json({
        success: false,
        error: req.apiCopy?.errors?.internalError || 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/internal/paraphrasis/user/:userId
 * 
 * Obtiene métricas detalladas de paráfrasis para un usuario específico.
 * 
 * Query params:
 * - limit: Número máximo de mensajes recientes a incluir (default 50, max 100)
 * 
 * Retorna:
 * - userId: ID del usuario
 * - totalConversations: Total de conversaciones del usuario
 * - totalParaphrasisRequired: Total de turnos donde se requería paráfrasis
 * - totalParaphrasisDetected: Total de turnos donde se detectó paráfrasis
 * - adherenceRate: Tasa de adherencia para este usuario
 * - recentMessages: Mensajes recientes con métricas de paráfrasis
 */
router.get(
  '/user/:userId',
  authenticateToken,
  attachApiCopy('en'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const options = {};
      if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          options.limit = Math.min(parsedLimit, 100);
        }
      }

      const userMetrics = await getUserParaphrasMetrics(userId, options);

      res.json({
        success: true,
        data: userMetrics,
      });
    } catch (error) {
      console.error(`[GET /api/internal/paraphrasis/user/:userId] Error:`, error);
      res.status(500).json({
        success: false,
        error: req.apiCopy?.errors?.internalError || 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/internal/paraphrasis/adherence
 * 
 * Calcula la tasa de adherencia de paráfrasis en un período.
 * 
 * Query params:
 * - startDate: Fecha inicio (ISO, opcional)
 * - endDate: Fecha fin (ISO, opcional)
 * 
 * Retorna:
 * - adherenceRate: Tasa de adherencia (0-1)
 * - period: { startDate, endDate }
 */
router.get(
  '/adherence',
  authenticateToken,
  attachApiCopy('en'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const adherenceRate = await calculateAdherenceRate(startDate, endDate);

      res.json({
        success: true,
        data: {
          adherenceRate,
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      });
    } catch (error) {
      console.error('[GET /api/internal/paraphrasis/adherence] Error:', error);
      res.status(500).json({
        success: false,
        error: req.apiCopy?.errors?.internalError || 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/internal/paraphrasis/wai-correlation
 * 
 * Analiza la correlación entre el uso de paráfrasis y los scores de WAI.
 * Requiere feature #98 (WAI post-sesión) implementado.
 * 
 * Query params:
 * - startDate: Fecha inicio (ISO, opcional)
 * - endDate: Fecha fin (ISO, opcional)
 * 
 * Retorna:
 * - correlation: Coeficiente de correlación de Pearson
 * - sampleSize: Número de conversaciones analizadas
 * - avgWaiWithParaphrasis: Promedio de WAI en conversaciones con paráfrasis
 * - avgWaiWithoutParaphrasis: Promedio de WAI en conversaciones sin paráfrasis
 * - waiDimensions: Desglose por dimensión de WAI (goals, tasks, bond, total)
 */
router.get(
  '/wai-correlation',
  authenticateToken,
  attachApiCopy('en'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const correlation = await analyzeWaiCorrelation({ startDate, endDate });

      res.json({
        success: true,
        data: correlation,
      });
    } catch (error) {
      console.error('[GET /api/internal/paraphrasis/wai-correlation] Error:', error);
      res.status(500).json({
        success: false,
        error: req.apiCopy?.errors?.internalError || 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/internal/paraphrasis/retention-impact
 * 
 * Analiza el impacto del uso de paráfrasis en la retención de usuarios.
 * 
 * Query params:
 * - startDate: Fecha inicio (ISO, opcional)
 * - endDate: Fecha fin (ISO, opcional)
 * - cohortSize: Tamaño mínimo de cohorte para análisis (default 100)
 * 
 * Retorna:
 * - retentionD7: Retención a 7 días (con paráfrasis vs sin paráfrasis)
 * - retentionD30: Retención a 30 días (con paráfrasis vs sin paráfrasis)
 * - sampleSize: Número de usuarios analizados
 * - relativeLift: Mejora relativa de retención con paráfrasis
 */
router.get(
  '/retention-impact',
  authenticateToken,
  attachApiCopy('en'),
  async (req, res) => {
    try {
      const { startDate, endDate, cohortSize } = req.query;

      const options = {};
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;
      if (cohortSize) {
        const parsed = parseInt(cohortSize, 10);
        if (!isNaN(parsed) && parsed > 0) {
          options.cohortSize = parsed;
        }
      }

      const retentionImpact = await analyzeRetentionImpact(options);

      res.json({
        success: true,
        data: retentionImpact,
      });
    } catch (error) {
      console.error('[GET /api/internal/paraphrasis/retention-impact] Error:', error);
      res.status(500).json({
        success: false,
        error: req.apiCopy?.errors?.internalError || 'Internal server error',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/internal/paraphrasis/dashboard
 * 
 * Endpoint consolidado con todas las métricas para el dashboard de monitoreo.
 * 
 * Query params:
 * - startDate: Fecha inicio (ISO, opcional)
 * - endDate: Fecha fin (ISO, opcional)
 * 
 * Retorna un objeto con todas las métricas clave:
 * - stats: Estadísticas generales de paráfrasis
 * - wai: Correlación con WAI
 * - retention: Impacto en retención
 */
router.get(
  '/dashboard',
  authenticateToken,
  attachApiCopy('en'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Ejecutar todos los análisis en paralelo
      const [stats, waiCorrelation, retentionImpact] = await Promise.allSettled([
        getParaphrasStats({ startDate, endDate }),
        analyzeWaiCorrelation({ startDate, endDate }),
        analyzeRetentionImpact({ startDate, endDate }),
      ]);

      res.json({
        success: true,
        data: {
          stats: stats.status === 'fulfilled' ? stats.value : null,
          wai: waiCorrelation.status === 'fulfilled' ? waiCorrelation.value : null,
          retention: retentionImpact.status === 'fulfilled' ? retentionImpact.value : null,
        },
        errors: {
          stats: stats.status === 'rejected' ? stats.reason?.message : null,
          wai: waiCorrelation.status === 'rejected' ? waiCorrelation.reason?.message : null,
          retention: retentionImpact.status === 'rejected' ? retentionImpact.reason?.message : null,
        },
      });
    } catch (error) {
      console.error('[GET /api/internal/paraphrasis/dashboard] Error:', error);
      res.status(500).json({
        success: false,
        error: req.apiCopy?.errors?.internalError || 'Internal server error',
        message: error.message,
      });
    }
  }
);

export default router;
