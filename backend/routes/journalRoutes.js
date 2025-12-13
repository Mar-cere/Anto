/**
 * Rutas de Journal (Diario de Gratitud) - Gestiona CRUD de entradas de diario
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import Journal from '../models/Journal.js';

const router = express.Router();

// Rate limiters: control de frecuencia de peticiones
const createJournalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas entradas creadas. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const updateJournalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: 'Demasiadas actualizaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const deleteJournalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas eliminaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Esquema de validación para crear entrada
const createJournalSchema = Joi.object({
  content: Joi.string()
    .required()
    .min(1)
    .max(2000)
    .messages({
      'string.empty': 'El contenido no puede estar vacío',
      'string.min': 'El contenido debe tener al menos 1 carácter',
      'string.max': 'El contenido no puede exceder 2000 caracteres',
      'any.required': 'El contenido es requerido'
    }),
  entryDate: Joi.date().optional(),
  emotionalState: Joi.string()
    .valid('happy', 'grateful', 'peaceful', 'content', 'hopeful', 'other')
    .optional()
    .default('grateful'),
  tags: Joi.array().items(Joi.string().trim().max(30)).optional().default([])
});

// Esquema de validación para actualizar entrada
const updateJournalSchema = Joi.object({
  content: Joi.string().min(1).max(2000).optional(),
  entryDate: Joi.date().optional(),
  emotionalState: Joi.string()
    .valid('happy', 'grateful', 'peaceful', 'content', 'hopeful', 'other')
    .optional(),
  tags: Joi.array().items(Joi.string().trim().max(30)).optional(),
  archived: Joi.boolean().optional()
});

// Helper: buscar entrada por ID y validar propiedad
const findJournalById = async (journalId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(journalId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  return await Journal.findOne({
    _id: new mongoose.Types.ObjectId(journalId),
    userId: new mongoose.Types.ObjectId(userId)
  });
};

/**
 * GET /api/journals
 * Obtener todas las entradas del usuario
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      startDate,
      endDate,
      archived = false,
      emotionalState,
      limit = 50,
      skip = 0,
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = req.query;

    const entries = await Journal.findByUser(userId, {
      startDate,
      endDate,
      archived: archived === 'true',
      emotionalState,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Error obteniendo entradas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las entradas del diario'
    });
  }
});

/**
 * GET /api/journals/stats
 * Obtener estadísticas del diario del usuario
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await Journal.getUserStats(userId);
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas del diario'
    });
  }
});

/**
 * GET /api/journals/:id
 * Obtener una entrada específica
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    res.json({
      success: true,
      entry: journal
    });
  } catch (error) {
    console.error('Error obteniendo entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la entrada'
    });
  }
});

/**
 * POST /api/journals
 * Crear una nueva entrada
 */
router.post('/', createJournalLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Validar datos
    const { error, value } = createJournalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Crear entrada
    const journal = new Journal({
      userId: new mongoose.Types.ObjectId(userId),
      content: value.content,
      entryDate: value.entryDate ? new Date(value.entryDate) : new Date(),
      emotionalState: value.emotionalState,
      tags: value.tags || []
    });

    await journal.save();

    res.status(201).json({
      success: true,
      message: 'Entrada creada exitosamente',
      entry: journal
    });
  } catch (error) {
    console.error('Error creando entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la entrada'
    });
  }
});

/**
 * PUT /api/journals/:id
 * Actualizar una entrada
 */
router.put('/:id', validateObjectId, updateJournalLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    // Validar datos
    const { error, value } = updateJournalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Actualizar campos
    if (value.content !== undefined) journal.content = value.content;
    if (value.entryDate !== undefined) journal.entryDate = new Date(value.entryDate);
    if (value.emotionalState !== undefined) journal.emotionalState = value.emotionalState;
    if (value.tags !== undefined) journal.tags = value.tags;
    if (value.archived !== undefined) journal.archived = value.archived;

    await journal.save();

    res.json({
      success: true,
      message: 'Entrada actualizada exitosamente',
      entry: journal
    });
  } catch (error) {
    console.error('Error actualizando entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la entrada'
    });
  }
});

/**
 * DELETE /api/journals/:id
 * Eliminar una entrada
 */
router.delete('/:id', validateObjectId, deleteJournalLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    await journal.deleteOne();

    res.json({
      success: true,
      message: 'Entrada eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la entrada'
    });
  }
});

/**
 * PATCH /api/journals/:id/archive
 * Archivar/desarchivar una entrada
 */
router.patch('/:id/archive', validateObjectId, async (req, res) => {
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    const { archived } = req.body;
    if (archived === true) {
      await journal.archive();
    } else if (archived === false) {
      await journal.unarchive();
    } else {
      return res.status(400).json({
        success: false,
        error: 'El campo archived debe ser true o false'
      });
    }

    res.json({
      success: true,
      message: `Entrada ${archived ? 'archivada' : 'desarchivada'} exitosamente`,
      entry: journal
    });
  } catch (error) {
    console.error('Error archivando entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al archivar la entrada'
    });
  }
});

export default router;

