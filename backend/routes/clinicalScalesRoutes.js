/**
 * Rutas de Escalas Clínicas
 * Endpoints para administrar y consultar escalas validadas (PHQ-9, GAD-7)
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import ClinicalScaleResult from '../models/ClinicalScaleResult.js';
import clinicalScalesService from '../services/clinicalScalesService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting para escalas clínicas
const scalesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Máximo 50 requests por 15 minutos
  message: 'Demasiadas solicitudes. Por favor, espera un momento.',
  standardHeaders: true,
  legacyHeaders: false
});

// Todas las rutas requieren autenticación y rate limiting
router.use(protect);
router.use(requireActiveSubscription(true));
router.use(scalesLimiter);

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
    logger.error('[ClinicalScalesRoutes] Error obteniendo escalas:', error);
    res.status(500).json({
      message: 'Error al obtener escalas disponibles',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
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
    
    // SEGURIDAD: Validar scaleType
    const normalizedScaleType = scaleType?.toUpperCase()?.trim();
    if (!normalizedScaleType || !['PHQ9', 'GAD7'].includes(normalizedScaleType)) {
      return res.status(400).json({
        message: 'Tipo de escala inválido. Debe ser PHQ9 o GAD7'
      });
    }
    
    const definition = clinicalScalesService.getScaleDefinition(normalizedScaleType);
    
    if (!definition) {
      return res.status(404).json({
        message: 'Escala no encontrada'
      });
    }
    
    res.json({ definition });
  } catch (error) {
    logger.error('[ClinicalScalesRoutes] Error obteniendo definición:', error);
    res.status(500).json({
      message: 'Error al obtener definición de escala',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
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
    
    // SEGURIDAD: Validar y sanitizar scaleType
    const normalizedScaleType = scaleType?.toUpperCase()?.trim();
    if (!normalizedScaleType || !['PHQ9', 'GAD7'].includes(normalizedScaleType)) {
      return res.status(400).json({
        message: 'Tipo de escala inválido. Debe ser PHQ9 o GAD7'
      });
    }
    
    // Validar escala
    const definition = clinicalScalesService.getScaleDefinition(normalizedScaleType);
    if (!definition) {
      return res.status(404).json({
        message: 'Escala no encontrada'
      });
    }
    
    // SEGURIDAD: Validar itemScores
    if (!itemScores || !Array.isArray(itemScores)) {
      return res.status(400).json({
        message: 'itemScores debe ser un array'
      });
    }
    
    // SEGURIDAD: Validar límite de ítems
    if (itemScores.length > definition.items.length) {
      return res.status(400).json({
        message: `Demasiados ítems. La escala ${normalizedScaleType} tiene ${definition.items.length} ítems`
      });
    }
    
    // SEGURIDAD: Validar que no haya ítems duplicados
    const itemIds = itemScores.map(i => i.itemId);
    const uniqueItemIds = new Set(itemIds);
    if (itemIds.length !== uniqueItemIds.size) {
      return res.status(400).json({
        message: 'No se permiten ítems duplicados'
      });
    }
    
    // Calcular puntuación total
    let totalScore = 0;
    const validatedItemScores = [];
    
    for (const itemScore of itemScores) {
      // SEGURIDAD: Validar tipos y valores
      if (typeof itemScore.itemId !== 'number' || typeof itemScore.score !== 'number') {
        return res.status(400).json({
          message: `Ítem inválido: itemId y score deben ser números`
        });
      }
      
      if (itemScore.score < 0 || itemScore.score > 3 || !Number.isInteger(itemScore.score)) {
        return res.status(400).json({
          message: `Puntuación inválida para ítem ${itemScore.itemId}: debe ser un entero entre 0 y 3`
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
    
    // SEGURIDAD: Validar límite máximo de puntuación
    const maxScore = normalizedScaleType === 'PHQ9' ? 27 : 21;
    if (totalScore > maxScore) {
      return res.status(400).json({
        message: `Puntuación total inválida: ${totalScore}. El máximo para ${normalizedScaleType} es ${maxScore}`
      });
    }
    
    // SEGURIDAD: Sanitizar notas si existen
    const sanitizedNotes = notes && typeof notes === 'string' 
      ? notes.trim().substring(0, 1000) 
      : undefined;
    
    // Interpretar puntuación
    const interpretation = clinicalScalesService.interpretScore(totalScore, normalizedScaleType);
    
    // Crear resultado
    const result = new ClinicalScaleResult({
      userId,
      scaleType: normalizedScaleType,
      totalScore,
      itemScores: validatedItemScores,
      interpretation,
      administrationMethod: 'manual',
      notes: sanitizedNotes
    });
    
    await result.save();
    
    logger.info(`[ClinicalScalesRoutes] Escala ${normalizedScaleType} completada por usuario ${userId}`, {
      scaleType: normalizedScaleType,
      totalScore,
      severity: interpretation.severity
    });
    
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
    logger.error('[ClinicalScalesRoutes] Error guardando resultado:', error);
    res.status(500).json({
      message: 'Error al guardar resultado de escala',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
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
    
    // SEGURIDAD: Validar y limitar parámetros
    const validatedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Entre 1 y 100
    const validatedPage = Math.max(parseInt(page) || 1, 1); // Mínimo 1
    
    const query = { userId };
    if (scaleType) {
      const normalizedScaleType = scaleType.toUpperCase().trim();
      if (['PHQ9', 'GAD7'].includes(normalizedScaleType)) {
        query.scaleType = normalizedScaleType;
      } else {
        return res.status(400).json({
          message: 'Tipo de escala inválido'
        });
      }
    }
    
    const skip = (validatedPage - 1) * validatedLimit;
    
    const [results, total] = await Promise.all([
      ClinicalScaleResult.find(query)
        .sort({ createdAt: -1 })
        .limit(validatedLimit)
        .skip(skip)
        .lean(),
      ClinicalScaleResult.countDocuments(query)
    ]);
    
    res.json({
      results,
      pagination: {
        total,
        page: validatedPage,
        pages: Math.ceil(total / validatedLimit),
        limit: validatedLimit
      }
    });
  } catch (error) {
    logger.error('[ClinicalScalesRoutes] Error obteniendo resultados:', error);
    res.status(500).json({
      message: 'Error al obtener resultados',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
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
    
    // SEGURIDAD: Validar scaleType
    const normalizedScaleType = scaleType?.toUpperCase()?.trim();
    if (!normalizedScaleType || !['PHQ9', 'GAD7'].includes(normalizedScaleType)) {
      return res.status(400).json({
        message: 'Tipo de escala inválido'
      });
    }
    
    // SEGURIDAD: Validar y limitar días
    const validatedDays = Math.min(Math.max(parseInt(days) || 30, 1), 365); // Entre 1 y 365 días
    
    const progress = await ClinicalScaleResult.getUserProgress(
      userId,
      normalizedScaleType,
      validatedDays
    );
    
    res.json({ progress });
  } catch (error) {
    logger.error('[ClinicalScalesRoutes] Error obteniendo progreso:', error);
    res.status(500).json({
      message: 'Error al obtener progreso',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
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
    
    // SEGURIDAD: Validar y limitar días
    const validatedDays = Math.min(Math.max(parseInt(days) || 30, 1), 365); // Entre 1 y 365 días
    
    const [phq9Progress, gad7Progress, latestResults] = await Promise.all([
      ClinicalScaleResult.getUserProgress(userId, 'PHQ9', validatedDays),
      ClinicalScaleResult.getUserProgress(userId, 'GAD7', validatedDays),
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
    logger.error('[ClinicalScalesRoutes] Error obteniendo resumen:', error);
    res.status(500).json({
      message: 'Error al obtener resumen',
      error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
    });
  }
});

export default router;

