/**
 * Resumen semanal y mensual de actividad del usuario (chat, emociones, técnicas, tareas, hábitos, diario).
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { buildDashboardFocus } from '../services/dashboardFocusService.js';
import { buildUserSummary } from '../services/userSummaryService.js';

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
router.get('/focus', authenticateToken, async (req, res) => {
  try {
    const data = await buildDashboardFocus(req.user._id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[summaryRoutes] Error /focus:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el foco del panel'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const period = String(req.query.period || '').toLowerCase();
    if (period !== 'week' && period !== 'month') {
      return res.status(400).json({
        success: false,
        message: 'Query period es requerido: week o month'
      });
    }

    const payload = {
      period,
      date: req.query.date,
      year: req.query.year != null ? Number(req.query.year) : undefined,
      month: req.query.month != null ? Number(req.query.month) : undefined
    };

    const data = await buildUserSummary(req.user._id, payload);
    return res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'INVALID_DATE') {
      return res.status(400).json({
        success: false,
        message: 'Parámetro date inválido; use YYYY-MM-DD'
      });
    }
    if (err.code === 'INVALID_MONTH') {
      return res.status(400).json({
        success: false,
        message: 'Parámetros year (2000–2100) y month (1–12) inválidos'
      });
    }
    console.error('[summaryRoutes] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el resumen'
    });
  }
});

export default router;
