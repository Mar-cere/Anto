/**
 * Rutas de activación conductual (#88).
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import BehavioralActivationLog from '../models/BehavioralActivationLog.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody } from '../utils/apiValidation.js';
import { behavioralActivationApiCopy } from '../utils/behavioralActivationApiCopy.js';
import { getCreateBehavioralActivationSchema } from '../utils/behavioralActivationSchemas.js';
import { getUpdateWeekPlanSchema } from '../utils/behavioralActivationWeekPlanSchemas.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import {
  getOrCreateWeekPlan,
  saveWeekPlan,
} from '../services/behavioralActivationWeekPlanService.js';
import {
  linkBaSlotToProduct,
  reconcileWeekPlanWithLinkedProducts,
  syncBaEcosystemFromLog,
} from '../services/behavioralActivationProductBridgeService.js';
import {
  getLinkBaProductSchema,
  getSyncBaFromLogSchema,
} from '../utils/behavioralActivationLinkProductSchemas.js';
import { buildBaBridgeErrorBody } from '../utils/baBridgeErrorResponse.js';

const router = express.Router();

router.use(attachApiCopy(behavioralActivationApiCopy));

const createLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => behavioralActivationApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
  standardHeaders: true,
  legacyHeaders: false,
});

const deleteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => behavioralActivationApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
  standardHeaders: true,
  legacyHeaders: false,
});

const weekPlanLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => behavioralActivationApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
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
  return BehavioralActivationLog.findOne({
    _id: new mongoose.Types.ObjectId(recordId),
    userId: new mongoose.Types.ObjectId(userId),
  });
};

function typeLabel(activityType, copy) {
  return activityType === 'routine' ? copy.exportTypeRoutine : copy.exportTypePleasant;
}

function formatLogForExport(record, copy, index) {
  const date = record.entryDate
    ? new Date(record.entryDate).toISOString().slice(0, 10)
    : '';
  const lines = [
    `--- ${copy.exportDate}: ${date} ---`,
    `${copy.exportActivity}: ${record.activityDescription || ''}`,
    `${copy.exportType}: ${typeLabel(record.activityType, copy)}`,
    `${copy.exportMoodBefore}: ${record.moodBefore}/10`,
    `${copy.exportMoodAfter}: ${record.moodAfter}/10`,
  ];
  if (record.notes) {
    lines.push(`${copy.exportNotes}: ${record.notes}`);
  }
  if (index > 0) lines.unshift('');
  return lines.join('\n');
}

router.get('/week-plan', weekPlanLimiter, async (req, res) => {
  const copy = req.apiCopy;
  const language = resolveRequestLanguage(req);
  try {
    const weekStartRaw = req.query?.weekStart;
    if (
      weekStartRaw != null &&
      weekStartRaw !== '' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(String(weekStartRaw).trim())
    ) {
      return res.status(400).json({ success: false, error: copy.joiWeekStartInvalid });
    }
    const weekStart = weekStartRaw;
    const result = await getOrCreateWeekPlan(req.user.userId, weekStart, language);
    const reconciled = await reconcileWeekPlanWithLinkedProducts({
      userId: req.user.userId,
      plan: result.plan,
    });
    res.json({
      success: true,
      weekStart: result.weekStart,
      dayLabels: result.dayLabels,
      plan: reconciled.plan,
    });
  } catch (error) {
    console.error('Error obteniendo plan semanal BA:', error);
    res.status(500).json({ success: false, error: copy.weekPlanError });
  }
});

router.post('/week-plan/link-product', weekPlanLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getLinkBaProductSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const result = await linkBaSlotToProduct({
      userId: req.user.userId,
      weekStartInput: value.weekStart || undefined,
      slotId: value.slotId,
      productKind: value.productKind,
      logId: value.logId || null,
      language: resolveRequestLanguage(req),
    });

    res.status(result.idempotentReplay ? 200 : 201).json({
      success: true,
      message: copy.linkProductSuccess,
      productKind: result.productKind,
      task: result.task || undefined,
      habit: result.habit || undefined,
      plan: result.plan,
      idempotentReplay: !!result.idempotentReplay,
    });
  } catch (err) {
    if (err?.code === 'PLAN_NOT_FOUND') {
      return res
        .status(404)
        .json(buildBaBridgeErrorBody('PLAN_NOT_FOUND', copy.linkProductPlanNotFound));
    }
    if (err?.code === 'SLOT_NOT_FOUND') {
      return res
        .status(404)
        .json(buildBaBridgeErrorBody('SLOT_NOT_FOUND', copy.linkProductSlotNotFound));
    }
    if (err?.code === 'SLOT_LINK_CONFLICT') {
      return res
        .status(409)
        .json(buildBaBridgeErrorBody('SLOT_LINK_CONFLICT', copy.linkProductConflict));
    }
    if (err?.code === 'PRODUCT_VALIDATION') {
      return res.status(400).json({
        ...buildBaBridgeErrorBody('PRODUCT_VALIDATION', copy.linkProductValidationError),
        details: err.message,
      });
    }
    console.error('Error vinculando slot BA a producto:', err);
    res.status(500).json({ success: false, error: copy.linkProductError });
  }
});

router.post('/week-plan/sync-from-log', weekPlanLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getSyncBaFromLogSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const result = await syncBaEcosystemFromLog({
      userId: req.user.userId,
      weekStartInput: value.weekStart || undefined,
      slotId: value.slotId,
      logId: value.logId,
    });

    if (!result) {
      return res
        .status(404)
        .json(buildBaBridgeErrorBody('SLOT_NOT_FOUND', copy.linkProductSlotNotFound));
    }

    res.json({
      success: true,
      message: copy.syncFromLogSuccess,
      plan: result.plan,
      sync: result.sync,
    });
  } catch (err) {
    console.error('Error sincronizando BA desde log:', err);
    res.status(500).json({ success: false, error: copy.syncFromLogError });
  }
});

router.put('/week-plan', weekPlanLimiter, async (req, res) => {
  const copy = req.apiCopy;
  const language = resolveRequestLanguage(req);
  try {
    const { error, value } = validateBody(getUpdateWeekPlanSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const result = await saveWeekPlan(
      req.user.userId,
      value.weekStart || undefined,
      value.slots,
      language,
    );

    res.json({
      success: true,
      message: copy.weekPlanSaved,
      weekStart: result.weekStart,
      dayLabels: result.dayLabels,
      plan: result.plan,
    });
  } catch (error) {
    console.error('Error guardando plan semanal BA:', error);
    res.status(500).json({ success: false, error: copy.weekPlanSaveError });
  }
});

router.get('/export', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const records = await BehavioralActivationLog.findByUser(req.user.userId, {
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
    console.error('Error exportando registros BA:', error);
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

    const records = await BehavioralActivationLog.findByUser(req.user.userId, {
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
    console.error('Error obteniendo registros BA:', error);
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
    console.error('Error obteniendo registro BA:', error);
    res.status(500).json({ success: false, error: copy.getError });
  }
});

router.post('/', createLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getCreateBehavioralActivationSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const record = new BehavioralActivationLog({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      activityDescription: value.activityDescription,
      activityType: value.activityType,
      moodBefore: value.moodBefore,
      moodAfter: value.moodAfter,
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
    console.error('Error creando registro BA:', error);
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
    console.error('Error eliminando registro BA:', error);
    res.status(500).json({ success: false, error: copy.deleteError });
  }
});

export default router;
