/**
 * Rutas de pensamientos automáticos (#89).
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import AutomaticThoughtLog from '../models/AutomaticThoughtLog.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody } from '../utils/apiValidation.js';
import { automaticThoughtApiCopy } from '../utils/automaticThoughtApiCopy.js';
import { getCreateAutomaticThoughtSchema } from '../utils/automaticThoughtSchemas.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';

const router = express.Router();

router.use(attachApiCopy(automaticThoughtApiCopy));

const createLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => automaticThoughtApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
  standardHeaders: true,
  legacyHeaders: false,
});

const deleteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => automaticThoughtApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
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

const findLogById = async (recordId, userId) => {
  if (
    !mongoose.Types.ObjectId.isValid(recordId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }
  return AutomaticThoughtLog.findOne({
    _id: new mongoose.Types.ObjectId(recordId),
    userId: new mongoose.Types.ObjectId(userId),
  });
};

function formatLogForExport(record, copy, index) {
  const date = record.entryDate
    ? new Date(record.entryDate).toISOString().slice(0, 10)
    : '';
  const lines = [
    `--- ${copy.exportDate}: ${date} ---`,
    `${copy.exportSituation}: ${record.situation || ''}`,
    `${copy.exportThought}: ${record.automaticThought || ''}`,
  ];
  if (record.emotion) {
    lines.push(`${copy.exportEmotion}: ${record.emotion}`);
  }
  lines.push(`${copy.exportIntensity}: ${record.emotionIntensity ?? 5}/10`);
  if (record.distortionName || record.distortionType) {
    lines.push(
      `${copy.exportDistortion}: ${record.distortionName || record.distortionType}`,
    );
  }
  if (record.balancedThought) {
    lines.push(`${copy.exportBalanced}: ${record.balancedThought}`);
  }
  if (record.notes) {
    lines.push(`${copy.exportNotes}: ${record.notes}`);
  }
  if (index > 0) lines.unshift('');
  return lines.join('\n');
}

router.get('/export', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const records = await AutomaticThoughtLog.findByUser(req.user.userId, {
      archived: false,
      limit: clampQueryInt(req.query.limit, { fallback: 20, min: 1, max: 50 }),
      sortOrder: 'desc',
    });

    const body = [
      copy.exportHeader,
      '',
      ...records.map((record, index) => formatLogForExport(record, copy, index)),
    ].join('\n');

    res.json({
      success: true,
      format: 'text',
      count: records.length,
      exportText: body,
    });
  } catch (error) {
    console.error('Error exportando registros AT:', error);
    res.status(500).json({ success: false, error: copy.exportError });
  }
});

router.get('/', async (req, res) => {
  const copy = req.apiCopy;
  try {
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

    const records = await AutomaticThoughtLog.findByUser(req.user.userId, {
      startDate,
      endDate,
      archived: archived === 'true',
      limit: clampQueryInt(limit, { fallback: 50, min: 1, max: 100 }),
      skip: clampQueryInt(skip, { fallback: 0, min: 0, max: 500 }),
      sortBy: safeSortBy,
      sortOrder: safeSortOrder,
    });

    res.json({ success: true, records, count: records.length });
  } catch (error) {
    console.error('Error obteniendo registros AT:', error);
    res.status(500).json({ success: false, error: copy.listError });
  }
});

router.get('/:id', validateObjectId, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const record = await findLogById(req.params.id, req.user.userId);
    if (!record) {
      return res.status(404).json({ success: false, error: copy.notFound });
    }
    res.json({ success: true, record });
  } catch (error) {
    console.error('Error obteniendo registro AT:', error);
    res.status(500).json({ success: false, error: copy.getError });
  }
});

router.post('/', createLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getCreateAutomaticThoughtSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const record = new AutomaticThoughtLog({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      situation: value.situation,
      automaticThought: value.automaticThought,
      emotion: value.emotion || '',
      emotionIntensity: value.emotionIntensity ?? 5,
      distortionType: value.distortionType || '',
      distortionName: value.distortionName || '',
      balancedThought: value.balancedThought || '',
      notes: value.notes || '',
      entryDate: value.entryDate ? new Date(value.entryDate) : new Date(),
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: copy.createdSuccess,
      record,
    });
  } catch (error) {
    console.error('Error creando registro AT:', error);
    res.status(500).json({ success: false, error: copy.createError });
  }
});

router.delete('/:id', validateObjectId, deleteLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const record = await findLogById(req.params.id, req.user.userId);
    if (!record) {
      return res.status(404).json({ success: false, error: copy.notFound });
    }
    await record.deleteOne();
    res.json({ success: true, message: copy.deletedSuccess });
  } catch (error) {
    console.error('Error eliminando registro AT:', error);
    res.status(500).json({ success: false, error: copy.deleteError });
  }
});

export default router;
