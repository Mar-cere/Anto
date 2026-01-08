/**
 * Rutas de Distorsiones Cognitivas
 * Endpoints para consultar reportes de distorsiones cognitivas detectadas
 */
import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import CognitiveDistortionReport from '../models/CognitiveDistortionReport.js';
import cognitiveDistortionDetector from '../services/cognitiveDistortionDetector.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);
router.use(requireActiveSubscription(true));

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
    console.error('[CognitiveDistortionsRoutes] Error obteniendo tipos:', error);
    res.status(500).json({
      message: 'Error al obtener tipos de distorsiones',
      error: error.message
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
    const distortionInfo = cognitiveDistortionDetector.getDistortionInfo(type);
    
    if (!distortionInfo) {
      return res.status(404).json({
        message: 'Tipo de distorsión no encontrado'
      });
    }
    
    res.json({ distortion: distortionInfo });
  } catch (error) {
    console.error('[CognitiveDistortionsRoutes] Error obteniendo distorsión:', error);
    res.status(500).json({
      message: 'Error al obtener información de distorsión',
      error: error.message
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
    
    const query = { userId };
    if (type) {
      query['primaryDistortion.type'] = type;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reports, total] = await Promise.all([
      CognitiveDistortionReport.find(query)
        .sort({ detectedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v')
        .lean(),
      CognitiveDistortionReport.countDocuments(query)
    ]);
    
    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[CognitiveDistortionsRoutes] Error obteniendo reportes:', error);
    res.status(500).json({
      message: 'Error al obtener reportes',
      error: error.message
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
    
    const statistics = await CognitiveDistortionReport.getUserStatistics(
      userId,
      parseInt(days)
    );
    
    res.json({ statistics });
  } catch (error) {
    console.error('[CognitiveDistortionsRoutes] Error obteniendo estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message
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
    
    const [statistics, recentReports, allTypes] = await Promise.all([
      CognitiveDistortionReport.getUserStatistics(userId, parseInt(days)),
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
    console.error('[CognitiveDistortionsRoutes] Error obteniendo resumen:', error);
    res.status(500).json({
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
});

export default router;

