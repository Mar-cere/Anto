/**
 * Rutas de patrones experienciales / memoria del proceso (#203 / #211).
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody, validationErrorBody } from '../utils/apiValidation.js';
import { experientialPatternsApiCopy } from '../utils/experientialPatternsApiCopy.js';
import {
  getConsentSchema,
  getCreateExperientialPatternSchema,
  getUpdateExperientialPatternSchema,
} from '../utils/experientialPatternsSchemas.js';
import {
  archiveExperientialPattern,
  createExperientialPattern,
  getExperientialPatternsConsent,
  isExperientialPatternsEnabled,
  listExperientialPatterns,
  sanitizeExperientialPatch,
  setExperientialPatternsConsent,
  updateExperientialPattern,
} from '../services/experientialPatternService.js';
import metricsService from '../services/metricsService.js';

const router = express.Router();

router.use(attachApiCopy(experientialPatternsApiCopy));

const listLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: (req) => experientialPatternsApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => experientialPatternsApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

function featureOr503(req, res) {
  if (!isExperientialPatternsEnabled()) {
    res.status(503).json({ success: false, message: req.apiCopy.featureDisabled });
    return false;
  }
  return true;
}

router.get('/consent', listLimiter, async (req, res) => {
  try {
    if (!featureOr503(req, res)) return;
    const consent = await getExperientialPatternsConsent(req.user._id);
    return res.json({ success: true, consent });
  } catch (error) {
    console.error('[experientialPatternsRoutes] GET /consent:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.consentError });
  }
});

router.patch('/consent', writeLimiter, async (req, res) => {
  try {
    if (!featureOr503(req, res)) return;
    const { error, value } = validateBody(getConsentSchema(), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }
    const result = await setExperientialPatternsConsent(req.user._id, value.enabled);
    if (result.error) {
      return res.status(404).json({ success: false, message: req.apiCopy.notFound });
    }
    metricsService
      .recordMetric(
        'experiential_consent_updated',
        { enabled: value.enabled === true },
        String(req.user._id),
      )
      .catch(() => {});
    return res.json({
      success: true,
      message: req.apiCopy.consentUpdated,
      consent: result.consent,
    });
  } catch (error) {
    console.error('[experientialPatternsRoutes] PATCH /consent:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.consentError });
  }
});

router.get('/', listLimiter, async (req, res) => {
  try {
    if (!featureOr503(req, res)) return;
    const activeOnly = String(req.query.activeOnly || 'true') !== 'false';
    const limit = parseInt(req.query.limit, 10);
    const patterns = await listExperientialPatterns(req.user._id, { activeOnly, limit });
    return res.json({ success: true, patterns });
  } catch (error) {
    console.error('[experientialPatternsRoutes] GET /:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.listError });
  }
});

router.post('/', writeLimiter, async (req, res) => {
  try {
    if (!featureOr503(req, res)) return;
    const { error, value } = validateBody(getCreateExperientialPatternSchema(req.apiCopy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }
    const result = await createExperientialPattern(req.user._id, {
      ...value,
      source: 'manual',
      userConfirmed: true,
    });
    if (result.error) {
      const msg = req.apiCopy[result.error] || req.apiCopy.createError;
      let status = 400;
      if (result.error === 'consentRequired') status = 403;
      else if (result.error === 'tooManyActive' || result.error === 'duplicateActive') status = 409;
      return res.status(status).json({ success: false, message: msg, code: result.error });
    }
    metricsService
      .recordMetric('experiential_pattern_created', { source: 'manual' }, String(req.user._id))
      .catch(() => {});
    return res.status(201).json({ success: true, pattern: result.pattern });
  } catch (error) {
    console.error('[experientialPatternsRoutes] POST /:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.createError });
  }
});

router.patch('/:id', validateObjectId, writeLimiter, async (req, res) => {
  try {
    if (!featureOr503(req, res)) return;
    const { error, value } = validateBody(getUpdateExperientialPatternSchema(req.apiCopy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(req.apiCopy, error));
    }
    const patch = sanitizeExperientialPatch(value);
    const result = await updateExperientialPattern(req.user._id, req.params.id, patch);
    if (result.error) {
      const msg = req.apiCopy[result.error] || req.apiCopy.updateError;
      const status = result.error === 'notFound' ? 404 : 400;
      return res.status(status).json({ success: false, message: msg, code: result.error });
    }
    if (patch.followUpStatus) {
      metricsService
        .recordMetric(
          'experiential_follow_up_answered',
          { status: patch.followUpStatus },
          String(req.user._id),
        )
        .catch(() => {});
    }
    if (patch.archive) {
      metricsService
        .recordMetric('experiential_pattern_archived', {}, String(req.user._id))
        .catch(() => {});
    }
    return res.json({ success: true, pattern: result.pattern });
  } catch (error) {
    console.error('[experientialPatternsRoutes] PATCH /:id:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.updateError });
  }
});

router.delete('/:id', validateObjectId, writeLimiter, async (req, res) => {
  try {
    if (!featureOr503(req, res)) return;
    const result = await archiveExperientialPattern(req.user._id, req.params.id);
    if (result.error) {
      const status = result.error === 'notFound' ? 404 : 400;
      return res.status(status).json({
        success: false,
        message: req.apiCopy[result.error] || req.apiCopy.deleteError,
        code: result.error,
      });
    }
    metricsService
      .recordMetric('experiential_pattern_archived', {}, String(req.user._id))
      .catch(() => {});
    return res.json({ success: true, pattern: result.pattern });
  } catch (error) {
    console.error('[experientialPatternsRoutes] DELETE /:id:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.deleteError });
  }
});

export default router;
