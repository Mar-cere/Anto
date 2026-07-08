/**
 * Rutas de compromisos entre sesiones (#202).
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { sessionCommitmentApiCopy } from '../utils/sessionCommitmentApiCopy.js';
import metricsService from '../services/metricsService.js';
import {
  createSessionCommitment,
  listSessionCommitments,
  renegotiateSessionCommitment,
  sanitizeCommitmentPatch,
  updateSessionCommitment,
} from '../services/sessionCommitmentService.js';

const router = express.Router();

router.use(attachApiCopy(sessionCommitmentApiCopy));

const listLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: (req) => sessionCommitmentApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => sessionCommitmentApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

function recordCommitmentFollowUpAnswer(userId, patch) {
  if (patch.followUpAnswer) {
    metricsService
      .recordMetric(
        'commitment_follow_up_answered',
        { answer: patch.followUpAnswer },
        String(userId),
      )
      .catch(() => {});
  } else if (patch.status === 'skipped') {
    metricsService
      .recordMetric(
        'commitment_follow_up_answered',
        { answer: 'skipped' },
        String(userId),
      )
      .catch(() => {});
  } else if (patch.label != null) {
    metricsService
      .recordMetric('commitment_renegotiated', {}, String(userId))
      .catch(() => {});
  }
}

router.get('/', listLimiter, async (req, res) => {
  try {
    const status = String(req.query.status || 'active').trim();
    const limit = parseInt(req.query.limit, 10);
    const commitments = await listSessionCommitments(req.user._id, { status, limit });
    return res.json({ success: true, commitments });
  } catch (error) {
    console.error('[sessionCommitmentRoutes] GET /:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.listError });
  }
});

router.post('/', writeLimiter, async (req, res) => {
  try {
    const result = await createSessionCommitment(req.user._id, req.body || {});
    if (result.error) {
      const msg = req.apiCopy[result.error] || req.apiCopy.createError;
      const status =
        result.error === 'tooManyActive' ? 409 : 400;
      return res.status(status).json({ success: false, message: msg, code: result.error });
    }
    metricsService
      .recordMetric(
        'commitment_created',
        {
          source: result.commitment?.source || 'unknown',
          linkedTask: Boolean(result.commitment?.sourceMeta?.taskId),
          linkedHabit: Boolean(result.commitment?.sourceMeta?.habitId),
        },
        String(req.user._id),
      )
      .catch(() => {});
    if (result.commitment?.sourceMeta?.taskId) {
      metricsService
        .recordMetric('commitment_linked_task', {}, String(req.user._id))
        .catch(() => {});
    }
    if (result.commitment?.sourceMeta?.habitId) {
      metricsService
        .recordMetric('commitment_linked_habit', {}, String(req.user._id))
        .catch(() => {});
    }
    return res.status(201).json({ success: true, commitment: result.commitment });
  } catch (error) {
    console.error('[sessionCommitmentRoutes] POST /:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.createError });
  }
});

router.patch('/:id', validateObjectId, writeLimiter, async (req, res) => {
  try {
    if (req.body?.renegotiate === true && req.body?.label != null) {
      const result = await renegotiateSessionCommitment(req.user._id, req.params.id, {
        label: req.body.label,
        followUpHours: req.body.followUpHours,
      });
      if (result.error) {
        const msg = req.apiCopy[result.error] || req.apiCopy.updateError;
        const status = result.error === 'notFound' ? 404 : 400;
        return res.status(status).json({ success: false, message: msg, code: result.error });
      }
      metricsService
        .recordMetric('commitment_renegotiated', {}, String(req.user._id))
        .catch(() => {});
      return res.json({ success: true, commitment: result.commitment });
    }

    const patch = sanitizeCommitmentPatch(req.body);
    const result = await updateSessionCommitment(req.user._id, req.params.id, patch);
    if (result.error) {
      const msg = req.apiCopy[result.error] || req.apiCopy.updateError;
      const status = result.error === 'notFound' ? 404 : 400;
      return res.status(status).json({ success: false, message: msg, code: result.error });
    }
    recordCommitmentFollowUpAnswer(req.user._id, patch);
    return res.json({ success: true, commitment: result.commitment });
  } catch (error) {
    console.error('[sessionCommitmentRoutes] PATCH /:id:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.updateError });
  }
});

export default router;
