/**
 * Rutas de autorregistro ABC (#86).
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import AbcRecord from '../models/AbcRecord.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody } from '../utils/apiValidation.js';
import { abcRecordApiCopy } from '../utils/abcRecordApiCopy.js';
import { getCreateAbcRecordSchema } from '../utils/abcRecordSchemas.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';

const router = express.Router();

router.use(attachApiCopy(abcRecordApiCopy));

const createAbcRecordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => abcRecordApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
  standardHeaders: true,
  legacyHeaders: false,
});

const deleteAbcRecordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => abcRecordApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

const findAbcRecordById = async (recordId, userId) => {
  if (
    !mongoose.Types.ObjectId.isValid(recordId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }
  return AbcRecord.findOne({
    _id: new mongoose.Types.ObjectId(recordId),
    userId: new mongoose.Types.ObjectId(userId),
  });
};

function formatRecordForExport(record, copy, index) {
  const date = record.entryDate
    ? new Date(record.entryDate).toISOString().slice(0, 10)
    : '';
  const lines = [
    `--- ${copy.exportDate}: ${date} ---`,
    `${copy.exportSectionA}: ${record.activatingEvent || ''}`,
    `${copy.exportSectionB}: ${record.beliefs || ''}`,
    `${copy.exportSectionC}:`,
  ];
  if (record.emotions) {
    lines.push(`  ${copy.exportEmotion}: ${record.emotions}`);
  }
  if (record.emotionIntensity != null) {
    lines.push(`  ${copy.exportIntensity}: ${record.emotionIntensity}/10`);
  }
  if (record.consequence) {
    lines.push(`  ${copy.exportBehavior}: ${record.consequence}`);
  }
  if (index > 0) lines.unshift('');
  return lines.join('\n');
}

router.get('/export', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;
    const records = await AbcRecord.findByUser(userId, {
      archived: false,
      limit: Math.min(parseInt(limit, 10) || 20, 50),
      sortOrder: 'desc',
    });

    const body = [
      copy.exportHeader,
      '',
      ...records.map((record, index) => formatRecordForExport(record, copy, index)),
    ].join('\n');

    res.json({
      success: true,
      format: 'text',
      count: records.length,
      exportText: body,
    });
  } catch (error) {
    console.error('Error exportando registros ABC:', error);
    res.status(500).json({
      success: false,
      error: copy.exportError,
    });
  }
});

router.get('/', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const {
      startDate,
      endDate,
      archived = false,
      limit = 50,
      skip = 0,
      sortBy = 'entryDate',
      sortOrder = 'desc',
    } = req.query;

    const records = await AbcRecord.findByUser(userId, {
      startDate,
      endDate,
      archived: archived === 'true',
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      records,
      count: records.length,
    });
  } catch (error) {
    console.error('Error obteniendo registros ABC:', error);
    res.status(500).json({
      success: false,
      error: copy.listError,
    });
  }
});

router.get('/:id', validateObjectId, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const record = await findAbcRecordById(req.params.id, userId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: copy.notFound,
      });
    }

    res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error obteniendo registro ABC:', error);
    res.status(500).json({
      success: false,
      error: copy.getError,
    });
  }
});

router.post('/', createAbcRecordLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;

    const { error, value } = validateBody(getCreateAbcRecordSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const record = new AbcRecord({
      userId: new mongoose.Types.ObjectId(userId),
      activatingEvent: value.activatingEvent,
      beliefs: value.beliefs,
      emotions: value.emotions || '',
      emotionIntensity: value.emotionIntensity ?? 5,
      consequence: value.consequence || '',
      entryDate: value.entryDate ? new Date(value.entryDate) : new Date(),
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: copy.createdSuccess,
      record,
    });
  } catch (error) {
    console.error('Error creando registro ABC:', error);
    res.status(500).json({
      success: false,
      error: copy.createError,
    });
  }
});

router.delete('/:id', validateObjectId, deleteAbcRecordLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const record = await findAbcRecordById(req.params.id, userId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: copy.notFound,
      });
    }

    await record.deleteOne();

    res.json({
      success: true,
      message: copy.deletedSuccess,
    });
  } catch (error) {
    console.error('Error eliminando registro ABC:', error);
    res.status(500).json({
      success: false,
      error: copy.deleteError,
    });
  }
});

export default router;
