/**
 * Rutas de jerarquía de exposición + SUDS (#87).
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import ExposurePlan from '../models/ExposurePlan.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody } from '../utils/apiValidation.js';
import { exposurePlanApiCopy } from '../utils/exposurePlanApiCopy.js';
import {
  getCreateExposurePlanSchema,
  getLogExposureAttemptSchema,
} from '../utils/exposurePlanSchemas.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';

const router = express.Router();

router.use(attachApiCopy(exposurePlanApiCopy));

const createPlanLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: (req) => exposurePlanApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
  standardHeaders: true,
  legacyHeaders: false,
});

const attemptLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => exposurePlanApiCopy(resolveRequestLanguage(req)).rateLimitAttempt,
  standardHeaders: true,
  legacyHeaders: false,
});

const deletePlanLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => exposurePlanApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

function clampQueryInt(value, { fallback = 0, min = 0, max = 50 } = {}) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

const findPlanById = async (planId, userId) => {
  if (
    !mongoose.Types.ObjectId.isValid(planId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return null;
  }
  return ExposurePlan.findOne({
    _id: new mongoose.Types.ObjectId(planId),
    userId: new mongoose.Types.ObjectId(userId),
  });
};

function statusLabel(status, copy) {
  if (status === 'completed') return copy.statusCompleted;
  if (status === 'in_progress') return copy.statusInProgress;
  return copy.statusPending;
}

function formatPlanForExport(plan, copy) {
  const lines = [
    `${copy.exportGoal}: ${plan.title || ''}`,
    '',
  ];

  (plan.steps || []).forEach((step, index) => {
    lines.push(
      `${copy.exportStep} ${index + 1}: ${step.description || ''}`,
      `  ${copy.exportStatus}: ${statusLabel(step.status, copy)}`,
    );
    if (Array.isArray(step.attempts) && step.attempts.length > 0) {
      lines.push(`  ${copy.exportAttempts}:`);
      step.attempts.forEach((attempt) => {
        const date = attempt.attemptDate
          ? new Date(attempt.attemptDate).toISOString().slice(0, 10)
          : '';
        lines.push(
          `    - ${copy.exportDate}: ${date} | ${copy.exportPeakSuds}: ${attempt.peakSuds} | ${copy.exportEndSuds}: ${attempt.endSuds}`,
        );
        if (attempt.notes) {
          lines.push(`      ${copy.exportNotes}: ${attempt.notes}`);
        }
      });
    }
    lines.push('');
  });

  return lines.join('\n');
}

function normalizeStepIndex(plan, stepIndex) {
  const index = Number(stepIndex);
  if (!Number.isInteger(index) || index < 0 || index >= plan.steps.length) {
    return null;
  }
  return index;
}

router.get('/export', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const plans = await ExposurePlan.findByUser(userId, {
      archived: false,
      limit: clampQueryInt(req.query.limit, { fallback: 10, min: 1, max: 20 }),
    });

    const body = [
      copy.exportHeader,
      copy.exportDisclaimer,
      '',
      ...plans.map((plan, index) => {
        const block = formatPlanForExport(plan, copy);
        return index > 0 ? `\n---\n${block}` : block;
      }),
    ].join('\n');

    res.json({
      success: true,
      format: 'text',
      count: plans.length,
      exportText: body,
    });
  } catch (error) {
    console.error('Error exportando planes de exposición:', error);
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
    const { archived = false, limit = 20, skip = 0 } = req.query;

    const plans = await ExposurePlan.findByUser(userId, {
      archived: archived === 'true',
      limit: clampQueryInt(limit, { fallback: 20, min: 1, max: 50 }),
      skip: clampQueryInt(skip, { fallback: 0, min: 0, max: 500 }),
    });

    res.json({
      success: true,
      plans,
      count: plans.length,
    });
  } catch (error) {
    console.error('Error obteniendo planes de exposición:', error);
    res.status(500).json({
      success: false,
      error: copy.listError,
    });
  }
});

router.get('/:id', validateObjectId, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const plan = await findPlanById(req.params.id, req.user.userId);
    if (!plan) {
      return res.status(404).json({ success: false, error: copy.notFound });
    }
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error obteniendo plan de exposición:', error);
    res.status(500).json({ success: false, error: copy.getError });
  }
});

router.post('/', createPlanLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const userId = req.user.userId;
    const { error, value } = validateBody(getCreateExposurePlanSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const steps = value.steps.map((description, order) => ({
      description: description.trim(),
      order,
      status: order === 0 ? 'in_progress' : 'pending',
      attempts: [],
    }));

    const plan = new ExposurePlan({
      userId: new mongoose.Types.ObjectId(userId),
      title: value.title.trim(),
      steps,
      currentStepIndex: 0,
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: copy.createdSuccess,
      plan,
    });
  } catch (error) {
    console.error('Error creando plan de exposición:', error);
    res.status(500).json({
      success: false,
      error: copy.createError,
    });
  }
});

router.post('/:id/attempts', validateObjectId, attemptLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const plan = await findPlanById(req.params.id, req.user.userId);
    if (!plan) {
      return res.status(404).json({ success: false, error: copy.notFound });
    }

    const { error, value } = validateBody(getLogExposureAttemptSchema(copy), req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const stepIndex = normalizeStepIndex(plan, value.stepIndex);
    if (stepIndex == null) {
      return res.status(400).json({ success: false, error: copy.stepIndexInvalid });
    }

    if (stepIndex > plan.currentStepIndex) {
      return res.status(400).json({ success: false, error: copy.stepLocked });
    }

    const step = plan.steps[stepIndex];
    if (step.status === 'completed') {
      return res.status(400).json({ success: false, error: copy.stepAlreadyCompleted });
    }

    if (step.status === 'pending') {
      step.status = 'in_progress';
    }

    step.attempts.push({
      attemptDate: new Date(),
      peakSuds: value.peakSuds,
      endSuds: value.endSuds,
      notes: value.notes || '',
    });

    await plan.save();

    res.json({
      success: true,
      message: copy.attemptSuccess,
      plan,
    });
  } catch (error) {
    console.error('Error registrando intento de exposición:', error);
    res.status(500).json({
      success: false,
      error: copy.attemptError,
    });
  }
});

router.post('/:id/steps/:stepIndex/complete', validateObjectId, attemptLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const plan = await findPlanById(req.params.id, req.user.userId);
    if (!plan) {
      return res.status(404).json({ success: false, error: copy.notFound });
    }

    const stepIndex = normalizeStepIndex(plan, req.params.stepIndex);
    if (stepIndex == null) {
      return res.status(400).json({ success: false, error: copy.stepIndexInvalid });
    }

    if (stepIndex !== plan.currentStepIndex) {
      return res.status(400).json({ success: false, error: copy.stepLocked });
    }

    const step = plan.steps[stepIndex];
    if (step.status === 'completed') {
      return res.status(400).json({ success: false, error: copy.stepAlreadyCompleted });
    }

    if (!Array.isArray(step.attempts) || step.attempts.length === 0) {
      return res.status(400).json({ success: false, error: copy.stepNeedsAttempt });
    }

    step.status = 'completed';
    step.completedAt = new Date();

    const nextIndex = stepIndex + 1;
    if (nextIndex < plan.steps.length) {
      plan.currentStepIndex = nextIndex;
      if (plan.steps[nextIndex].status === 'pending') {
        plan.steps[nextIndex].status = 'in_progress';
      }
    }

    await plan.save();

    res.json({
      success: true,
      message: copy.stepCompleteSuccess,
      plan,
    });
  } catch (error) {
    console.error('Error completando paso de exposición:', error);
    res.status(500).json({
      success: false,
      error: copy.stepCompleteError,
    });
  }
});

router.delete('/:id', validateObjectId, deletePlanLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const plan = await findPlanById(req.params.id, req.user.userId);
    if (!plan) {
      return res.status(404).json({ success: false, error: copy.notFound });
    }

    await plan.deleteOne();

    res.json({
      success: true,
      message: copy.deletedSuccess,
    });
  } catch (error) {
    console.error('Error eliminando plan de exposición:', error);
    res.status(500).json({
      success: false,
      error: copy.deleteError,
    });
  }
});

export default router;
