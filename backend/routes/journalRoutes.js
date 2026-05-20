/**
 * Rutas de Journal (Diario de Gratitud) - Gestiona CRUD de entradas de diario
 */
import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import Journal from '../models/Journal.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody } from '../utils/apiValidation.js';
import { journalApiCopy } from '../utils/journalApiCopy.js';
import {
  getCreateJournalSchema,
  getUpdateJournalSchema,
} from '../utils/journalSchemas.js';

const router = express.Router();

router.use(attachApiCopy(journalApiCopy));

const createJournalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => journalApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
  standardHeaders: true,
  legacyHeaders: false,
});

const updateJournalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => journalApiCopy(resolveRequestLanguage(req)).rateLimitUpdate,
  standardHeaders: true,
  legacyHeaders: false,
});

const deleteJournalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => journalApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

const findJournalById = async (journalId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(journalId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  return await Journal.findOne({
    _id: new mongoose.Types.ObjectId(journalId),
    userId: new mongoose.Types.ObjectId(userId),
  });
};

router.get('/', async (req, res) => {
  const copy = req.apiCopy;
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
      sortOrder = 'desc',
    } = req.query;

    const entries = await Journal.findByUser(userId, {
      startDate,
      endDate,
      archived: archived === 'true',
      emotionalState,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      entries,
      count: entries.length,
    });
  } catch (error) {
    console.error('Error obteniendo entradas:', error);
    res.status(500).json({
      success: false,
      error: copy.listError,
    });
  }
});

router.get('/stats', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const stats = await Journal.getUserStats(userId);
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: copy.statsError,
    });
  }
});

router.get('/:id', validateObjectId, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: copy.notFound,
      });
    }

    res.json({
      success: true,
      entry: journal,
    });
  } catch (error) {
    console.error('Error obteniendo entrada:', error);
    res.status(500).json({
      success: false,
      error: copy.getError,
    });
  }
});

router.post('/', createJournalLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;

    const { error, value } = validateBody(getCreateJournalSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const journal = new Journal({
      userId: new mongoose.Types.ObjectId(userId),
      content: value.content,
      entryDate: value.entryDate ? new Date(value.entryDate) : new Date(),
      emotionalState: value.emotionalState,
      tags: value.tags || [],
    });

    await journal.save();

    res.status(201).json({
      success: true,
      message: copy.createdSuccess,
      entry: journal,
    });
  } catch (error) {
    console.error('Error creando entrada:', error);
    res.status(500).json({
      success: false,
      error: copy.createError,
    });
  }
});

router.put('/:id', validateObjectId, updateJournalLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: copy.notFound,
      });
    }

    const { error, value } = validateBody(getUpdateJournalSchema(), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    if (value.content !== undefined) journal.content = value.content;
    if (value.entryDate !== undefined) journal.entryDate = new Date(value.entryDate);
    if (value.emotionalState !== undefined) journal.emotionalState = value.emotionalState;
    if (value.tags !== undefined) journal.tags = value.tags;
    if (value.archived !== undefined) journal.archived = value.archived;

    await journal.save();

    res.json({
      success: true,
      message: copy.updatedSuccess,
      entry: journal,
    });
  } catch (error) {
    console.error('Error actualizando entrada:', error);
    res.status(500).json({
      success: false,
      error: copy.updateError,
    });
  }
});

router.delete('/:id', validateObjectId, deleteJournalLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: copy.notFound,
      });
    }

    await journal.deleteOne();

    res.json({
      success: true,
      message: copy.deletedSuccess,
    });
  } catch (error) {
    console.error('Error eliminando entrada:', error);
    res.status(500).json({
      success: false,
      error: copy.deleteError,
    });
  }
});

router.patch('/:id/archive', validateObjectId, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const journal = await findJournalById(req.params.id, userId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: copy.notFound,
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
        error: copy.archivedFieldInvalid,
      });
    }

    res.json({
      success: true,
      message: archived ? copy.archivedSuccess : copy.unarchivedSuccess,
      entry: journal,
    });
  } catch (error) {
    console.error('Error archivando entrada:', error);
    res.status(500).json({
      success: false,
      error: copy.archiveError,
    });
  }
});

export default router;
