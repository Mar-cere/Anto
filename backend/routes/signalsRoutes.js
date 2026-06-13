/**
 * Rutas de señales multimodales (#215 / #216 / #217 / #208).
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
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
  scheduleWeeklyPatternInsightJob,
  getPreviousIsoWeekKey,
} from '../services/weeklyPatternInsightService.js';
import { signalsApiCopy } from '../utils/signalsApiCopy.js';

const router = express.Router();
router.use(attachApiCopy(signalsApiCopy));

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
    const consent = await updateSignalConsentForUser(req.user._id, req.body || {});
    res.json({ success: true, consent });
  } catch (error) {
    console.error('[SignalsRoutes] PATCH /consent:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError });
  }
});

router.post('/typing-telemetry', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const consent = await getSignalConsentForUser(req.user._id);
    if (!isTypingTelemetryAllowed(consent)) {
      return res.status(403).json({ success: false, message: req.apiCopy?.consentRequired });
    }

    const conversationId = String(req.body?.conversationId || '').trim();
    const doc = await recordTypingTelemetryEvent({
      userId: req.user._id,
      conversationId: isValidObjectId(conversationId) ? conversationId : null,
      sessionId: String(req.body?.sessionId || '').slice(0, 64) || null,
      payload: req.body?.metrics || req.body,
    });

    if (!doc) {
      return res.json({ success: true, recorded: false });
    }
    res.json({ success: true, recorded: true, id: doc._id });
  } catch (error) {
    console.error('[SignalsRoutes] POST /typing-telemetry:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError });
  }
});

router.post('/digital-phenotype/sync', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const consent = await getSignalConsentForUser(req.user._id);
    if (!isDigitalHealthAllowed(consent)) {
      return res.status(403).json({ success: false, message: req.apiCopy?.consentRequired });
    }

    const doc = await upsertDigitalPhenotypeSnapshot({
      userId: req.user._id,
      payload: req.body || {},
    });
    res.json({ success: true, synced: !!doc, dayKey: doc?.dayKey || null });
  } catch (error) {
    console.error('[SignalsRoutes] POST /digital-phenotype/sync:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError });
  }
});

router.get('/weekly-insight', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const consent = await getSignalConsentForUser(req.user._id);
    if (!isWeeklyInsightsAllowed(consent)) {
      return res.status(403).json({ success: false, message: req.apiCopy?.weeklyInsightsDisabled });
    }

    const language = req.appLanguage || resolveRequestLanguage(req);
    const weekKey = String(req.query?.weekKey || getPreviousIsoWeekKey()).trim();
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
});

router.post('/weekly-insight/schedule', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const consent = await getSignalConsentForUser(req.user._id);
    if (!isWeeklyInsightsAllowed(consent)) {
      return res.status(403).json({ success: false, message: req.apiCopy?.weeklyInsightsDisabled });
    }
    const weekKey = String(req.body?.weekKey || getPreviousIsoWeekKey()).trim();
    const job = await scheduleWeeklyPatternInsightJob({
      userId: req.user._id,
      weekKey,
      runAt: new Date(),
    });
    res.json({ success: true, jobId: job?._id, weekKey, status: job?.status });
  } catch (error) {
    console.error('[SignalsRoutes] POST /weekly-insight/schedule:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError });
  }
});

export default router;
