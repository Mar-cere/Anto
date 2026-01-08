/**
 * Rutas de Distorsiones Cognitivas
 * Endpoints para consultar reportes de distorsiones cognitivas detectadas
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import CognitiveDistortionReport from '../models/CognitiveDistortionReport.js';
import cognitiveDistortionDetector from '../services/cognitiveDistortionDetector.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting para distorsiones cognitivas
const distortionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Máximo 50 requests por 15 minutos
  message: 'Demasiadas solicitudes. Por favor, espera un momento.',
  standardHeaders: true,
  legacyHeaders: false
});

// Todas las rutas requieren autenticación y rate limiting
router.use(protect);
router.use(requireActiveSubscription(true));
router.use(distortionsLimiter);

/**
 * GET /api/cognitive-distortions/types
 * Obtiene todos los tipos de distorsiones cognitivas disponibles
 */
router.get('/types', async (req, res) => {
  try {
    const allDistortions = cognitiveDistortionDetector.getAllDistortions();
    
    const distortions = Object.entries(allDistortions).map(([key, value]) => ({
      type: key,
      name: value.name,
      description: value.description,
      examples: value.examples,
      intervention: value.intervention
    }));
    
    res.json({ distortions });
  } catch (error) {
    logger.error('[CognitiveDistortionsRoutes] Error obteniendo tipos:', error);
    res.status(500).json({
      message: 'Error al obtener tipos de distorsiones',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
    });
  }
});

/**
 * GET /api/cognitive-distortions/:type
 * Obtiene información detallada sobre un tipo específico de distorsión
 */
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // SEGURIDAD: Validar que el tipo solo contenga caracteres permitidos
    if (!type || !/^[a-z_]+$/.test(type)) {
      return res.status(400).json({
        message: 'Tipo de distorsión inválido'
      });
    }
    
    const distortionInfo = cognitiveDistortionDetector.getDistortionInfo(type);
    
    if (!distortionInfo) {
      return res.status(404).json({
        message: 'Tipo de distorsión no encontrado'
      });
    }
    
    res.json({ distortion: distortionInfo });
  } catch (error) {
    logger.error('[CognitiveDistortionsRoutes] Error obteniendo distorsión:', error);
    res.status(500).json({
      message: 'Error al obtener información de distorsión',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
    });
  }
});

/**
 * GET /api/cognitive-distortions/reports
 * Obtiene los reportes de distorsiones detectadas
 */
router.get('/reports', async (req, res) => {
  try {
    const { limit = 20, page = 1, type } = req.query;
    const userId = req.user._id;
    
    // SEGURIDAD: Validar y limitar parámetros
    const validatedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Entre 1 y 100
    const validatedPage = Math.max(parseInt(page) || 1, 1); // Mínimo 1
    
    const query = { userId };
    if (type) {
      // SEGURIDAD: Validar que el tipo de distorsión existe
      const allDistortions = cognitiveDistortionDetector.getAllDistortions();
      if (allDistortions[type]) {
        query['primaryDistortion.type'] = type;
      } else {
        return res.status(400).json({
          message: 'Tipo de distorsión inválido'
        });
      }
    }
    
    const skip = (validatedPage - 1) * validatedLimit;
    
    const [reports, total] = await Promise.all([
      CognitiveDistortionReport.find(query)
        .sort({ detectedAt: -1 })
        .limit(validatedLimit)
        .skip(skip)
        .select('-__v')
        .lean(),
      CognitiveDistortionReport.countDocuments(query)
    ]);
    
    res.json({
      reports,
      pagination: {
        total,
        page: validatedPage,
        pages: Math.ceil(total / validatedLimit),
        limit: validatedLimit
      }
    });
  } catch (error) {
    logger.error('[CognitiveDistortionsRoutes] Error obteniendo reportes:', error);
    res.status(500).json({
      message: 'Error al obtener reportes',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
    });
  }
});

/**
 * GET /api/cognitive-distortions/statistics
 * Obtiene estadísticas de distorsiones cognitivas
 */
router.get('/statistics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;
    
    // SEGURIDAD: Validar y limitar días
    const validatedDays = Math.min(Math.max(parseInt(days) || 30, 1), 365); // Entre 1 y 365 días
    
    const statistics = await CognitiveDistortionReport.getUserStatistics(
      userId,
      validatedDays
    );
    
    res.json({ statistics });
  } catch (error) {
    logger.error('[CognitiveDistortionsRoutes] Error obteniendo estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
    });
  }
});

/**
 * GET /api/cognitive-distortions/summary
 * Obtiene un resumen completo de distorsiones
 */
router.get('/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;
    
    // SEGURIDAD: Validar y limitar días
    const validatedDays = Math.min(Math.max(parseInt(days) || 30, 1), 365); // Entre 1 y 365 días
    
    const [statistics, recentReports, allTypes] = await Promise.all([
      CognitiveDistortionReport.getUserStatistics(userId, validatedDays),
      CognitiveDistortionReport.find({ userId })
        .sort({ detectedAt: -1 })
        .limit(10)
        .select('primaryDistortion emotionalContext detectedAt')
        .lean(),
      cognitiveDistortionDetector.getAllDistortions()
    ]);
    
    // Agregar información de cada tipo de distorsión
    const detailedStatistics = {
      ...statistics,
      mostCommonDetailed: statistics.mostCommon.map(item => ({
        ...item,
        info: allTypes[item.type] ? {
          name: allTypes[item.type].name,
          description: allTypes[item.type].description,
          intervention: allTypes[item.type].intervention
        } : null
      }))
    };
    
    res.json({
      statistics: detailedStatistics,
      recentReports
    });
  } catch (error) {
    logger.error('[CognitiveDistortionsRoutes] Error obteniendo resumen:', error);
    res.status(500).json({
      message: 'Error al obtener resumen',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
    });
  }
});

export default router;

