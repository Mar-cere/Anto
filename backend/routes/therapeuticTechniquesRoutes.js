/**
 * Rutas para Técnicas Terapéuticas
 * 
 * Endpoints para obtener técnicas terapéuticas, registrar uso,
 * y obtener historial de técnicas utilizadas.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import TherapeuticTechniqueUsage from '../models/TherapeuticTechniqueUsage.js';
import {
  CBT_TECHNIQUES,
  DBT_TECHNIQUES,
  ACT_TECHNIQUES,
  IMMEDIATE_TECHNIQUES,
  getImmediateTechniques,
  getCBTTechniques,
  getDBTTechniques,
  getACTTechniques,
} from '../constants/therapeuticTechniques.js';

const router = express.Router();

/**
 * GET /api/therapeutic-techniques
 * Obtiene todas las técnicas terapéuticas disponibles
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const allTechniques = [];

    // Agregar técnicas inmediatas
    Object.entries(IMMEDIATE_TECHNIQUES).forEach(([emotion, techniques]) => {
      techniques.forEach(technique => {
        allTechniques.push({
          ...technique,
          category: 'immediate',
          emotion,
          emotions: [emotion],
        });
      });
    });

    // Agregar técnicas CBT
    Object.entries(CBT_TECHNIQUES).forEach(([key, technique]) => {
      allTechniques.push({
        ...technique,
        id: `cbt-${key}`,
        category: 'CBT',
        type: 'CBT',
      });
    });

    // Agregar técnicas DBT
    Object.entries(DBT_TECHNIQUES).forEach(([key, technique]) => {
      allTechniques.push({
        ...technique,
        id: `dbt-${key}`,
        category: 'DBT',
        type: 'DBT',
      });
    });

    // Agregar técnicas ACT
    Object.entries(ACT_TECHNIQUES).forEach(([key, technique]) => {
      allTechniques.push({
        ...technique,
        id: `act-${key}`,
        category: 'ACT',
        type: 'ACT',
      });
    });

    res.json({
      success: true,
      data: allTechniques,
      count: allTechniques.length,
    });
  } catch (error) {
    console.error('Error obteniendo técnicas terapéuticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener técnicas terapéuticas',
    });
  }
});

/**
 * GET /api/therapeutic-techniques/emotion/:emotion
 * Obtiene técnicas terapéuticas filtradas por emoción
 */
router.get('/emotion/:emotion', authenticateToken, (req, res) => {
  try {
    const { emotion } = req.params;
    const techniques = [];

    // Técnicas inmediatas para la emoción
    const immediate = getImmediateTechniques(emotion);
    immediate.forEach(technique => {
      techniques.push({
        ...technique,
        category: 'immediate',
        emotion,
        emotions: [emotion],
      });
    });

    // Técnicas CBT para la emoción
    const cbt = getCBTTechniques(emotion);
    cbt.forEach((technique, index) => {
      techniques.push({
        ...technique,
        id: `cbt-${emotion}-${index}`,
        category: 'CBT',
        type: 'CBT',
      });
    });

    // Técnicas DBT para la emoción
    const dbt = getDBTTechniques(emotion);
    dbt.forEach((technique, index) => {
      techniques.push({
        ...technique,
        id: `dbt-${emotion}-${index}`,
        category: 'DBT',
        type: 'DBT',
      });
    });

    // Técnicas ACT para la emoción
    const act = getACTTechniques(emotion);
    act.forEach((technique, index) => {
      techniques.push({
        ...technique,
        id: `act-${emotion}-${index}`,
        category: 'ACT',
        type: 'ACT',
      });
    });

    res.json({
      success: true,
      data: techniques,
      count: techniques.length,
      emotion,
    });
  } catch (error) {
    console.error('Error obteniendo técnicas por emoción:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener técnicas terapéuticas',
    });
  }
});

/**
 * POST /api/therapeutic-techniques/use
 * Registra el uso de una técnica terapéutica
 */
router.post('/use', authenticateToken, async (req, res) => {
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
        error: 'Faltan campos requeridos: techniqueId, techniqueName, techniqueType',
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

    console.log(`[TherapeuticTechniques] Usuario ${userId} usó técnica ${techniqueId} (${completed ? 'completado' : 'incompleto'})`);

    res.json({
      success: true,
      message: 'Uso de técnica registrado',
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
      error: 'Error al registrar uso de técnica',
      details: error.message,
    });
  }
});

/**
 * GET /api/therapeutic-techniques/history
 * Obtiene el historial de técnicas utilizadas por el usuario
 */
router.get('/history', authenticateToken, async (req, res) => {
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
      error: 'Error al obtener historial de técnicas',
    });
  }
});

/**
 * GET /api/therapeutic-techniques/stats
 * Obtiene estadísticas de uso de técnicas del usuario
 */
router.get('/stats', authenticateToken, async (req, res) => {
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
      error: 'Error al obtener estadísticas de técnicas',
    });
  }
});

export default router;

