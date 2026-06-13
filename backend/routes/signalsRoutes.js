/**
 * Rutas de señales multimodales (#215 / #216 / #217 / #208).
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { recordTypingTelemetryEvent } from '../services/chatTypingTelemetryService.js';
import { upsertDigitalPhenotypeSnapshot } from '../services/digitalPhenotypeService.js';
import {
  getSignalConsentForUser,
  isDigitalHealthAllowed,
  isTypingTelemetryAllowed,
  isWeeklyInsightsAllowed,
  updateSignalConsentForUser,
} from '../services/signalConsentService.js';
import {
  getWeeklyPatternInsight,
  getMonthlyPatternInsight,
  scheduleWeeklyPatternInsightJob,
  getPreviousIsoWeekKey,
} from '../services/weeklyPatternInsightService.js';
import { normalizeMonthKey, getPreviousMonthKey } from '../utils/monthKeys.js';
import { signalsApiCopy } from '../utils/signalsApiCopy.js';
import {
  extractTypingMetricsPayload,
  normalizeIsoWeekKey,
} from '../utils/signalValidators.js';

const router = express.Router();
router.use(attachApiCopy(signalsApiCopy));

const typingTelemetryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => req.apiCopy?.rateLimit || 'Too many requests',
});

const phenotypeSyncLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => req.apiCopy?.rateLimit || 'Too many requests',
});

const weeklyInsightLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => req.apiCopy?.rateLimit || 'Too many requests',
});

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value));
}

router.get('/consent', protect, async (req, res) => {
  try {
    const consent = await getSignalConsentForUser(req.user._id);
    res.json({ success: true, consent });
  } catch (error) {
    console.error('[SignalsRoutes] GET /consent:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError });
  }
});

router.patch('/consent', protect, async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const patch = {};
    if (body.typingTelemetry && typeof body.typingTelemetry === 'object') {
      if (typeof body.typingTelemetry.enabled === 'boolean') {
        patch.typingTelemetry = { enabled: body.typingTelemetry.enabled };
      }
    }
    if (body.digitalHealth && typeof body.digitalHealth === 'object') {
      patch.digitalHealth = {};
      if (typeof body.digitalHealth.enabled === 'boolean') {
        patch.digitalHealth.enabled = body.digitalHealth.enabled;
      }
      if (body.digitalHealth.steps === true) patch.digitalHealth.steps = true;
      if (body.digitalHealth.sleep === true) patch.digitalHealth.sleep = true;
      if (body.digitalHealth.screenTime === true) patch.digitalHealth.screenTime = true;
    }
    if (body.weeklyInsights && typeof body.weeklyInsights.enabled === 'boolean') {
      patch.weeklyInsights = { enabled: body.weeklyInsights.enabled };
    }
    const consent = await updateSignalConsentForUser(req.user._id, patch);
    res.json({ success: true, consent });
  } catch (error) {
    console.error('[SignalsRoutes] PATCH /consent:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError });
  }
});

router.post(
  '/typing-telemetry',
  protect,
  requireActiveSubscription(true),
  typingTelemetryLimiter,
  async (req, res) => {
    try {
      const consent = await getSignalConsentForUser(req.user._id);
      if (!isTypingTelemetryAllowed(consent)) {
        return res.status(403).json({ success: false, message: req.apiCopy?.consentRequired });
      }

      const metrics = extractTypingMetricsPayload(req.body);
      if (!metrics) {
        return res.status(400).json({ success: false, message: req.apiCopy?.invalidPayload });
      }

      const conversationId = String(req.body?.conversationId || '').trim();
      const doc = await recordTypingTelemetryEvent({
        userId: req.user._id,
        conversationId: isValidObjectId(conversationId) ? conversationId : null,
        sessionId: String(req.body?.sessionId || '').slice(0, 64) || null,
        payload: metrics,
      });

      if (!doc) {
        return res.json({ success: true, recorded: false });
      }
      res.json({ success: true, recorded: true, id: doc._id, deduped: !doc.createdAt });
    } catch (error) {
      console.error('[SignalsRoutes] POST /typing-telemetry:', error);
      res.status(500).json({ success: false, message: req.apiCopy?.serverError });
    }
  },
);

router.post(
  '/digital-phenotype/sync',
  protect,
  requireActiveSubscription(true),
  phenotypeSyncLimiter,
  async (req, res) => {
    try {
      const consent = await getSignalConsentForUser(req.user._id);
      if (!isDigitalHealthAllowed(consent)) {
        return res.status(403).json({ success: false, message: req.apiCopy?.consentRequired });
      }

      const doc = await upsertDigitalPhenotypeSnapshot({
        userId: req.user._id,
        payload: req.body || {},
        fromClient: true,
      });
      if (!doc) {
        return res.status(400).json({ success: false, message: req.apiCopy?.invalidPayload });
      }
      res.json({ success: true, synced: true, dayKey: doc.dayKey || null });
    } catch (error) {
      console.error('[SignalsRoutes] POST /digital-phenotype/sync:', error);
      res.status(500).json({ success: false, message: req.apiCopy?.serverError });
    }
  },
);

router.get(
  '/weekly-insight',
  protect,
  requireActiveSubscription(true),
  weeklyInsightLimiter,
  async (req, res) => {
    try {
      const consent = await getSignalConsentForUser(req.user._id);
      if (!isWeeklyInsightsAllowed(consent)) {
        return res.status(403).json({ success: false, message: req.apiCopy?.weeklyInsightsDisabled });
      }

      const language = req.appLanguage || resolveRequestLanguage(req);
      const weekKey = normalizeIsoWeekKey(
        String(req.query?.weekKey || '').trim(),
        getPreviousIsoWeekKey(),
      );
      if (!weekKey) {
        return res.status(400).json({ success: false, message: req.apiCopy?.invalidWeekKey });
      }

      const insight = await getWeeklyPatternInsight({
        userId: req.user._id,
        weekKey,
        language,
      });

      res.json({
        success: true,
        weekKey,
        insight: {
          status: insight?.status || 'pending',
          headline: insight?.headline || '',
          body: insight?.body || '',
          insights: insight?.insights || [],
          correlations: insight?.correlations || [],
          sourceSummary: insight?.sourceSummary || {},
          generatedAt: insight?.generatedAt || null,
        },
      });
    } catch (error) {
      console.error('[SignalsRoutes] GET /weekly-insight:', error);
      res.status(500).json({ success: false, message: req.apiCopy?.serverError });
    }
  },
);

router.post(
  '/weekly-insight/schedule',
  protect,
  requireActiveSubscription(true),
  weeklyInsightLimiter,
  async (req, res) => {
    try {
      const consent = await getSignalConsentForUser(req.user._id);
      if (!isWeeklyInsightsAllowed(consent)) {
        return res.status(403).json({ success: false, message: req.apiCopy?.weeklyInsightsDisabled });
      }
      const weekKey = normalizeIsoWeekKey(
        String(req.body?.weekKey || '').trim(),
        getPreviousIsoWeekKey(),
      );
      if (!weekKey) {
        return res.status(400).json({ success: false, message: req.apiCopy?.invalidWeekKey });
      }
      const job = await scheduleWeeklyPatternInsightJob({
        userId: req.user._id,
        weekKey,
        runAt: new Date(),
      });
      if (!job) {
        return res.status(400).json({ success: false, message: req.apiCopy?.invalidWeekKey });
      }
      res.json({ success: true, jobId: job._id, weekKey, status: job.status });
    } catch (error) {
      console.error('[SignalsRoutes] POST /weekly-insight/schedule:', error);
      res.status(500).json({ success: false, message: req.apiCopy?.serverError });
    }
  },
);

router.get(
  '/monthly-insight',
  protect,
  requireActiveSubscription(true),
  weeklyInsightLimiter,
  async (req, res) => {
    try {
      const consent = await getSignalConsentForUser(req.user._id);
      if (!isWeeklyInsightsAllowed(consent)) {
        return res.status(403).json({ success: false, message: req.apiCopy?.monthlyInsightsDisabled });
      }

      const language = req.appLanguage || resolveRequestLanguage(req);
      const monthKey = normalizeMonthKey(
        String(req.query?.monthKey || '').trim(),
        getPreviousMonthKey(),
      );
      if (!monthKey) {
        return res.status(400).json({ success: false, message: req.apiCopy?.invalidMonthKey });
      }

      const insight = await getMonthlyPatternInsight({
        userId: req.user._id,
        monthKey,
        language,
      });

      res.json({
        success: true,
        monthKey,
        insight: {
          status: insight?.status || 'pending',
          headline: insight?.headline || '',
          body: insight?.body || '',
          insights: insight?.insights || [],
          correlations: insight?.correlations || [],
          sourceSummary: insight?.sourceSummary || {},
          generatedAt: insight?.generatedAt || null,
        },
      });
    } catch (error) {
      console.error('[SignalsRoutes] GET /monthly-insight:', error);
      res.status(500).json({ success: false, message: req.apiCopy?.serverError });
    }
  },
);

export default router;
