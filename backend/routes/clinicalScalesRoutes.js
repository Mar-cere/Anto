/**
 * Rutas de Escalas Clínicas
 * Endpoints para administrar y consultar escalas validadas (PHQ-9, GAD-7)
 */
import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import ClinicalScaleResult from '../models/ClinicalScaleResult.js';
import clinicalScalesService from '../services/clinicalScalesService.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);
router.use(requireActiveSubscription(true));

/**
 * GET /api/clinical-scales/available
 * Obtiene las escalas disponibles
 */
router.get('/available', async (req, res) => {
  try {
    const scales = ['PHQ9', 'GAD7'].map(scaleName => {
      const definition = clinicalScalesService.getScaleDefinition(scaleName);
      return {
        name: scaleName,
        displayName: definition.name,
        description: definition.description,
        items: definition.items.map(item => ({
          id: item.id,
          question: item.question
        })),
        scoring: {
          min: 0,
          max: scaleName === 'PHQ9' ? 27 : 21,
          interpretation: definition.scoring.interpretation
        }
      };
    });
    
    res.json({ scales });
  } catch (error) {
    console.error('[ClinicalScalesRoutes] Error obteniendo escalas:', error);
    res.status(500).json({
      message: 'Error al obtener escalas disponibles',
      error: error.message
    });
  }
});

/**
 * GET /api/clinical-scales/:scaleType/definition
 * Obtiene la definición completa de una escala
 */
router.get('/:scaleType/definition', async (req, res) => {
  try {
    const { scaleType } = req.params;
    const definition = clinicalScalesService.getScaleDefinition(scaleType.toUpperCase());
    
    if (!definition) {
      return res.status(404).json({
        message: 'Escala no encontrada'
      });
    }
    
    res.json({ definition });
  } catch (error) {
    console.error('[ClinicalScalesRoutes] Error obteniendo definición:', error);
    res.status(500).json({
      message: 'Error al obtener definición de escala',
      error: error.message
    });
  }
});

/**
 * POST /api/clinical-scales/:scaleType/submit
 * Envía los resultados de una escala
 */
router.post('/:scaleType/submit', async (req, res) => {
  try {
    const { scaleType } = req.params;
    const { itemScores, notes } = req.body;
    const userId = req.user._id;
    
    // Validar escala
    const definition = clinicalScalesService.getScaleDefinition(scaleType.toUpperCase());
    if (!definition) {
      return res.status(404).json({
        message: 'Escala no encontrada'
      });
    }
    
    // Validar itemScores
    if (!itemScores || !Array.isArray(itemScores)) {
      return res.status(400).json({
        message: 'itemScores debe ser un array'
      });
    }
    
    // Calcular puntuación total
    let totalScore = 0;
    const validatedItemScores = [];
    
    for (const itemScore of itemScores) {
      if (itemScore.score < 0 || itemScore.score > 3) {
        return res.status(400).json({
          message: `Puntuación inválida para ítem ${itemScore.itemId}: debe estar entre 0 y 3`
        });
      }
      
      const item = definition.items.find(i => i.id === itemScore.itemId);
      if (!item) {
        return res.status(400).json({
          message: `Ítem ${itemScore.itemId} no encontrado en la escala`
        });
      }
      
      totalScore += itemScore.score;
      validatedItemScores.push({
        itemId: itemScore.itemId,
        score: itemScore.score,
        question: item.question
      });
    }
    
    // Interpretar puntuación
    const interpretation = clinicalScalesService.interpretScore(totalScore, scaleType.toUpperCase());
    
    // Crear resultado
    const result = new ClinicalScaleResult({
      userId,
      scaleType: scaleType.toUpperCase(),
      totalScore,
      itemScores: validatedItemScores,
      interpretation,
      administrationMethod: 'manual',
      notes: notes || undefined
    });
    
    await result.save();
    
    res.status(201).json({
      result: {
        id: result._id,
        scaleType: result.scaleType,
        totalScore: result.totalScore,
        interpretation: result.interpretation,
        createdAt: result.createdAt
      },
      message: 'Escala completada exitosamente'
    });
  } catch (error) {
    console.error('[ClinicalScalesRoutes] Error guardando resultado:', error);
    res.status(500).json({
      message: 'Error al guardar resultado de escala',
      error: error.message
    });
  }
});

/**
 * GET /api/clinical-scales/results
 * Obtiene los resultados de escalas del usuario
 */
router.get('/results', async (req, res) => {
  try {
    const { scaleType, limit = 20, page = 1 } = req.query;
    const userId = req.user._id;
    
    const query = { userId };
    if (scaleType) {
      query.scaleType = scaleType.toUpperCase();
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [results, total] = await Promise.all([
      ClinicalScaleResult.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      ClinicalScaleResult.countDocuments(query)
    ]);
    
    res.json({
      results,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[ClinicalScalesRoutes] Error obteniendo resultados:', error);
    res.status(500).json({
      message: 'Error al obtener resultados',
      error: error.message
    });
  }
});

/**
 * GET /api/clinical-scales/:scaleType/progress
 * Obtiene el progreso del usuario en una escala específica
 */
router.get('/:scaleType/progress', async (req, res) => {
  try {
    const { scaleType } = req.params;
    const { days = 30 } = req.query;
    const userId = req.user._id;
    
    const progress = await ClinicalScaleResult.getUserProgress(
      userId,
      scaleType.toUpperCase(),
      parseInt(days)
    );
    
    res.json({ progress });
  } catch (error) {
    console.error('[ClinicalScalesRoutes] Error obteniendo progreso:', error);
    res.status(500).json({
      message: 'Error al obtener progreso',
      error: error.message
    });
  }
});

/**
 * GET /api/clinical-scales/summary
 * Obtiene un resumen de todas las escalas del usuario
 */
router.get('/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;
    
    const [phq9Progress, gad7Progress, latestResults] = await Promise.all([
      ClinicalScaleResult.getUserProgress(userId, 'PHQ9', parseInt(days)),
      ClinicalScaleResult.getUserProgress(userId, 'GAD7', parseInt(days)),
      ClinicalScaleResult.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('scaleType totalScore interpretation.severity createdAt')
        .lean()
    ]);
    
    res.json({
      phq9: phq9Progress,
      gad7: gad7Progress,
      latestResults
    });
  } catch (error) {
    console.error('[ClinicalScalesRoutes] Error obteniendo resumen:', error);
    res.status(500).json({
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
});

export default router;

