/**
 * Rutas para Técnicas Terapéuticas
 * 
 * Endpoints para obtener técnicas terapéuticas, registrar uso,
 * y obtener historial de técnicas utilizadas.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
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
    const { techniqueId, completed, data } = req.body;
    const userId = req.user._id;

    // TODO: Guardar en base de datos cuando se cree el modelo
    // Por ahora, solo retornamos éxito
    console.log(`[TherapeuticTechniques] Usuario ${userId} usó técnica ${techniqueId}`);

    res.json({
      success: true,
      message: 'Uso de técnica registrado',
      data: {
        userId,
        techniqueId,
        completed,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error registrando uso de técnica:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar uso de técnica',
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

    // TODO: Obtener de base de datos cuando se cree el modelo
    // Por ahora, retornamos array vacío
    res.json({
      success: true,
      data: [],
      count: 0,
    });
  } catch (error) {
    console.error('Error obteniendo historial de técnicas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de técnicas',
    });
  }
});

export default router;

