/**
 * Rutas para Técnicas Terapéuticas
 * 
 * Endpoints para obtener técnicas terapéuticas, registrar uso,
 * y obtener historial de técnicas utilizadas.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import TherapeuticTechniqueUsage from '../models/TherapeuticTechniqueUsage.js';
import userProfileService from '../services/userProfileService.js';
import {
  buildAllTechniquesList,
  buildTechniquesForEmotion,
} from '../constants/therapeuticTechniquesLocale.js';
import {
  getMindfulnessTechniquesForLanguage,
  getAllGroundingTechniquesForLanguage,
} from '../constants/mindfulnessTechniquesLocale.js';
import {
  getPsychoeducationModule,
  getAvailableTopics,
} from '../constants/psychoeducation.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { therapeuticApiCopy } from '../utils/therapeuticApiCopy.js';

const router = express.Router();

/**
 * GET /api/therapeutic-techniques
 * Obtiene todas las técnicas terapéuticas disponibles
 */
router.get('/', authenticateToken, (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const allTechniques = buildAllTechniquesList(language);

    res.json({
      success: true,
      data: allTechniques,
      count: allTechniques.length,
      language,
    });
  } catch (error) {
    console.error('Error obteniendo técnicas terapéuticas:', error);
    res.status(500).json({
      success: false,
      error: copy.listError,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/emotion/:emotion
 * Obtiene técnicas terapéuticas filtradas por emoción
 */
router.get('/emotion/:emotion', authenticateToken, (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const { emotion } = req.params;
    const techniques = buildTechniquesForEmotion(emotion, language);

    res.json({
      success: true,
      data: techniques,
      count: techniques.length,
      emotion,
      language,
    });
  } catch (error) {
    console.error('Error obteniendo técnicas por emoción:', error);
    res.status(500).json({
      success: false,
      error: copy.emotionError,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/mindfulness
 * Obtiene técnicas de mindfulness por emoción
 */
router.get('/mindfulness/:emotion?', authenticateToken, (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const { emotion } = req.params;

    if (emotion) {
      const techniques = getMindfulnessTechniquesForLanguage(emotion, language);
      res.json({
        success: true,
        data: techniques,
        count: techniques.length,
        emotion,
        language,
      });
    } else {
      const allTechniques = getAllGroundingTechniquesForLanguage(language);
      res.json({
        success: true,
        data: allTechniques,
        count: Object.keys(allTechniques).reduce(
          (sum, key) => sum + Object.keys(allTechniques[key]).length,
          0,
        ),
        language,
      });
    }
  } catch (error) {
    console.error('Error obteniendo técnicas de mindfulness:', error);
    res.status(500).json({
      success: false,
      error: copy.mindfulnessError,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/psychoeducation/:topic
 * Obtiene información psicoeducativa sobre un tema
 */
router.get('/psychoeducation/:topic', authenticateToken, (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const { topic } = req.params;
    const module = getPsychoeducationModule(topic, language);

    if (!module) {
      const availableTopics = getAvailableTopics(language);
      return res.status(404).json({
        success: false,
        error: copy.psychoeducationNotFound(topic),
        availableTopics,
      });
    }

    res.json({
      success: true,
      data: module,
      topic,
      language,
    });
  } catch (error) {
    console.error('Error obteniendo psicoeducación:', error);
    res.status(500).json({
      success: false,
      error: copy.psychoeducationError,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/psychoeducation
 * Obtiene lista de temas disponibles de psicoeducación
 */
router.get('/psychoeducation', authenticateToken, (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const topics = getAvailableTopics(language);
    res.json({
      success: true,
      data: topics,
      count: topics.length,
      language,
    });
  } catch (error) {
    console.error('Error obteniendo temas de psicoeducación:', error);
    res.status(500).json({
      success: false,
      error: copy.psychoeducationTopicsError,
    });
  }
});

/**
 * POST /api/therapeutic-techniques/use
 * Registra el uso de una técnica terapéutica
 */
router.post('/use', authenticateToken, async (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const {
      techniqueId,
      techniqueName,
      techniqueType,
      emotion,
      completed = false,
      duration = null,
      exerciseData = {},
      emotionalIntensityBefore = null,
      emotionalIntensityAfter = null,
      effectiveness = null,
      notes = null,
    } = req.body;

    const userId = req.user._id;

    // Validar campos requeridos
    if (!techniqueId || !techniqueName || !techniqueType) {
      return res.status(400).json({
        success: false,
        error: copy.useMissingFields,
      });
    }

    // Crear registro de uso
    const usage = new TherapeuticTechniqueUsage({
      userId,
      techniqueId,
      techniqueName,
      techniqueType,
      emotion: emotion || null,
      completed,
      duration: duration || null,
      exerciseData,
      emotionalIntensityBefore: emotionalIntensityBefore || null,
      emotionalIntensityAfter: emotionalIntensityAfter || null,
      effectiveness: effectiveness || null,
      notes: notes || null,
      startedAt: new Date(),
      completedAt: completed ? new Date() : null,
    });

    await usage.save();

    // Registrar en UserProfile.copingStrategies para personalizar futuras respuestas
    userProfileService.registerCopingStrategy(userId.toString(), {
      strategy: techniqueName,
      effectiveness: effectiveness ?? 5
    }).catch(err => console.warn('[TherapeuticTechniques] Error registrando copingStrategy:', err.message));

    console.log(`[TherapeuticTechniques] Usuario ${userId} usó técnica ${techniqueId} (${completed ? 'completado' : 'incompleto'})`);

    res.json({
      success: true,
      message: copy.useSuccess,
      data: {
        id: usage._id,
        userId,
        techniqueId,
        completed,
        timestamp: usage.createdAt,
      },
    });
  } catch (error) {
    console.error('Error registrando uso de técnica:', error);
    res.status(500).json({
      success: false,
      error: copy.useError,
      details: error.message,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/history
 * Obtiene el historial de técnicas utilizadas por el usuario
 */
router.get('/history', authenticateToken, async (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0, techniqueId, emotion, completed } = req.query;

    const query = { userId };

    // Filtros opcionales
    if (techniqueId) query.techniqueId = techniqueId;
    if (emotion) query.emotion = emotion;
    if (completed !== undefined) query.completed = completed === 'true';

    const history = await TherapeuticTechniqueUsage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-exerciseData') // Excluir exerciseData para reducir tamaño
      .lean();

    const total = await TherapeuticTechniqueUsage.countDocuments(query);

    res.json({
      success: true,
      data: history,
      count: history.length,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('Error obteniendo historial de técnicas:', error);
    res.status(500).json({
      success: false,
      error: copy.historyError,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/stats
 * Obtiene estadísticas de uso de técnicas del usuario
 */
router.get('/stats', authenticateToken, async (req, res) => {
  const language = resolveRequestLanguage(req);
  const copy = therapeuticApiCopy(language);
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    // Obtener estadísticas generales
    const generalStats = await TherapeuticTechniqueUsage.getUserStats(userId, options);

    // Obtener técnicas más usadas
    const mostUsed = await TherapeuticTechniqueUsage.getMostUsedTechniques(userId, 10);

    // Obtener estadísticas por emoción
    const byEmotion = await TherapeuticTechniqueUsage.getStatsByEmotion(userId);

    // Obtener estadísticas por tipo
    const byType = await TherapeuticTechniqueUsage.getStatsByType(userId);

    // Obtener uso por período (últimos 30 días)
    const usageByDay = await TherapeuticTechniqueUsage.getUsageByPeriod(userId, 'day');
    const last30Days = usageByDay.slice(-30);

    res.json({
      success: true,
      data: {
        general: generalStats,
        mostUsed,
        byEmotion,
        byType,
        usageByDay: last30Days,
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de técnicas:', error);
    res.status(500).json({
      success: false,
      error: copy.statsError,
    });
  }
});

export default router;

