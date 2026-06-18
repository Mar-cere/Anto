/**
 * Check-in emocional diario (dashboard).
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { dailyMoodApiCopy } from '../utils/dailyMoodApiCopy.js';
import {
  getTodayDailyMoodCheckIn,
  upsertTodayDailyMoodCheckIn,
} from '../services/dailyMoodCheckInService.js';
import { recordEngagementSignal } from '../services/engagementStreakService.js';
import { ENGAGEMENT_SIGNAL } from '../utils/engagementStreakWeights.js';

const router = express.Router();

router.use(attachApiCopy(dailyMoodApiCopy));

const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: (req) => dailyMoodApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: (req) => dailyMoodApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

router.get('/today', readLimiter, async (req, res) => {
  const language = resolveRequestLanguage(req);
  try {
    const timezone =
      typeof req.query.timezone === 'string' ? req.query.timezone.trim() : null;
    const checkIn = await getTodayDailyMoodCheckIn(req.user._id, {
      timezone,
      language,
    });
    return res.json({ success: true, checkIn });
  } catch (error) {
    console.error('[dailyMoodRoutes] GET /today:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.todayError });
  }
});

router.put('/today', writeLimiter, async (req, res) => {
  const language = resolveRequestLanguage(req);
  try {
    const mood = req.body?.mood;
    const timezone =
      typeof req.body?.timezone === 'string' ? req.body.timezone.trim() : null;
    const result = await upsertTodayDailyMoodCheckIn(req.user._id, mood, {
      timezone,
      language,
      source: 'dashboard',
    });
    if (result.error === 'invalidMood') {
      return res.status(400).json({
        success: false,
        message: req.apiCopy.invalidMood,
        code: result.error,
      });
    }
    recordEngagementSignal(req.user._id, ENGAGEMENT_SIGNAL.MOOD_CHECKIN).catch(() => {});
    return res.json({ success: true, checkIn: result.checkIn });
  } catch (error) {
    console.error('[dailyMoodRoutes] PUT /today:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.saveError });
  }
});

export default router;
