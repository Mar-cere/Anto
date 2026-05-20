/**
 * Resumen semanal y mensual de actividad del usuario (chat, emociones, técnicas, tareas, hábitos, diario).
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { buildDashboardFocus } from '../services/dashboardFocusService.js';
import { getLastSessionSummaryForUser } from '../services/lastSessionSummaryService.js';
import { buildUserSummary } from '../services/userSummaryService.js';
import { localizeLastSessionSummaryForDisplay } from '../utils/focusDashboardCopy.js';
import { resolveSummaryRequestLanguage, summaryApiCopy } from '../utils/summaryApiCopy.js';

const router = express.Router();

/**
 * GET /api/summary?period=week|month
 * Semana: opcional date=YYYY-MM-DD (cualquier día de esa semana; por defecto hoy).
 * Mes: opcional year=2026&month=1-12 (por defecto mes actual).
 */
/**
 * GET /api/summary/focus
 * Panel “foco actual”: resumen de semana, prioridad (reglas + LLM opcional), tareas, chats, escalas (último autoinforme).
 */
/**
 * GET /api/summary/last-session
 * Continuidad del último chat (#4 + #47), persistida; null si aún no hay. (Ruta histórica; no es el resumen semanal/mensual.)
 */
router.get('/last-session', authenticateToken, async (req, res) => {
  const language = resolveSummaryRequestLanguage(req);
  const copy = summaryApiCopy(language);
  try {
    const raw = await getLastSessionSummaryForUser(req.user._id);
    const data = localizeLastSessionSummaryForDisplay(raw, language);
    return res.json({ success: true, data, language });
  } catch (err) {
    console.error('[summaryRoutes] Error /last-session:', err);
    return res.status(500).json({
      success: false,
      message: copy.lastSessionError,
    });
  }
});

router.get('/focus', authenticateToken, async (req, res) => {
  const language = resolveSummaryRequestLanguage(req);
  const copy = summaryApiCopy(language);
  try {
    const data = await buildDashboardFocus(req.user._id, { language });
    return res.json({ success: true, data, language });
  } catch (err) {
    console.error('[summaryRoutes] Error /focus:', err);
    return res.status(500).json({
      success: false,
      message: copy.focusError,
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  const language = resolveSummaryRequestLanguage(req);
  const copy = summaryApiCopy(language);
  try {
    const period = String(req.query.period || '').toLowerCase();
    if (period !== 'week' && period !== 'month') {
      return res.status(400).json({
        success: false,
        message: copy.periodRequired,
      });
    }
    const payload = {
      period,
      date: req.query.date,
      year: req.query.year != null ? Number(req.query.year) : undefined,
      month: req.query.month != null ? Number(req.query.month) : undefined,
      language,
    };

    const data = await buildUserSummary(req.user._id, payload);
    return res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'INVALID_DATE') {
      return res.status(400).json({
        success: false,
        message: copy.invalidDate,
      });
    }
    if (err.code === 'INVALID_MONTH') {
      return res.status(400).json({
        success: false,
        message: copy.invalidMonth,
      });
    }
    console.error('[summaryRoutes] Error:', err);
    return res.status(500).json({
      success: false,
      message: copy.summaryError,
    });
  }
});

export default router;
