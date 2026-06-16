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
import { fetchAbcMacroPatterns, toClientAbcPatterns } from '../services/abcMacroPatternService.js';
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

const macroPatternsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => abcRecordApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

const ALLOWED_SORT_FIELDS = new Set(['entryDate', 'createdAt', 'updatedAt']);

function clampQueryInt(value, { fallback = 0, min = 0, max = 50 } = {}) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

const MAX_MACRO_WINDOW_MS = 366 * 24 * 60 * 60 * 1000;

function parseBoundedDateRange(startDate, endDate) {
  const since = startDate ? new Date(startDate) : null;
  const until = endDate ? new Date(endDate) : null;
  const safeSince = since && !Number.isNaN(since.getTime()) ? since : undefined;
  const safeUntil = until && !Number.isNaN(until.getTime()) ? until : undefined;
  if (safeSince && safeUntil && safeUntil.getTime() < safeSince.getTime()) {
    return { since: undefined, until: undefined, invalid: true };
  }
  if (safeSince && safeUntil && safeUntil.getTime() - safeSince.getTime() > MAX_MACRO_WINDOW_MS) {
    return { since: undefined, until: undefined, invalid: true };
  }
  return { since: safeSince, until: safeUntil, invalid: false };
}

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
      limit: clampQueryInt(limit, { fallback: 20, min: 1, max: 50 }),
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

    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'entryDate';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const records = await AbcRecord.findByUser(userId, {
      startDate,
      endDate,
      archived: archived === 'true',
      limit: clampQueryInt(limit, { fallback: 50, min: 1, max: 100 }),
      skip: clampQueryInt(skip, { fallback: 0, min: 0, max: 500 }),
      sortBy: safeSortBy,
      sortOrder: safeSortOrder,
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

router.get('/macro-patterns', macroPatternsLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 80 } = req.query;
    const { since, until, invalid } = parseBoundedDateRange(startDate, endDate);
    if (invalid) {
      return res.status(400).json({ success: false, error: copy.macroPatternsInvalidRange });
    }
    const language = resolveRequestLanguage(req);

    const result = await fetchAbcMacroPatterns({
      userId,
      since,
      until,
      language,
      limit: clampQueryInt(limit, { fallback: 80, min: 1, max: 100 }),
    });

    res.json({
      success: true,
      recordCount: result.recordCount,
      patterns: toClientAbcPatterns(result.patterns),
    });
  } catch (error) {
    console.error('Error obteniendo patrones macro ABC:', error);
    res.status(500).json({
      success: false,
      error: copy.macroPatternsError,
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
