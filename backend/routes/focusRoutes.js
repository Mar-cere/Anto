/**
 * Rutas de focos de acompañamiento (#2): gestión de temas temporales
 * que vertebran el proceso del usuario.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody, validationErrorBody } from '../utils/apiValidation.js';
import { focusApiCopy } from '../utils/focusApiCopy.js';
import { getStartFocusSchema, getUpdateFocusSchema } from '../utils/focusSchemas.js';
import {
  getFocusThemes,
  getActiveFocus,
  startFocus,
  updateActiveFocus,
  completeFocus,
} from '../services/focusService.js';

const router = express.Router();

router.use(attachApiCopy(focusApiCopy));
router.use(authenticateToken);

const startLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: (req) => focusApiCopy(resolveRequestLanguage(req)).rateLimitStart || 'Too many requests',
});

const updateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: (req) => focusApiCopy(resolveRequestLanguage(req)).rateLimitUpdate || 'Too many requests',
});

/**
 * GET /api/focus/themes
 * Obtener catálogo de temas de foco disponibles.
 */
router.get('/themes', async (req, res) => {
  const copy = req.apiCopy;
  const language = resolveRequestLanguage(req);
  
  try {
    const themes = await getFocusThemes(language);
    return res.json({ success: true, message: copy.themesSuccess, data: themes });
  } catch (err) {
    console.error('[focusRoutes] Error /themes:', err);
    return res.status(500).json({ success: false, message: copy.themesError });
  }
});

/**
 * GET /api/focus/active
 * Obtener foco activo del usuario con datos enriquecidos.
 */
router.get('/active', async (req, res) => {
  const copy = req.apiCopy;
  const language = resolveRequestLanguage(req);
  
  try {
    const focus = await getActiveFocus(req.user._id, language);
    return res.json({ success: true, message: copy.activeSuccess, data: focus });
  } catch (err) {
    console.error('[focusRoutes] Error /active GET:', err);
    return res.status(500).json({ success: false, message: copy.activeError });
  }
});

/**
 * POST /api/focus/active
 * Iniciar un nuevo foco de acompañamiento.
 * Body: { themeId, durationWeeks?, customGoal? }
 */
router.post('/active', startLimiter, async (req, res) => {
  const copy = req.apiCopy;
  
  try {
    const { error, value } = validateBody(getStartFocusSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const focus = await startFocus(req.user._id, value);
    return res.status(201).json({ success: true, message: copy.startedSuccess, data: focus });
  } catch (err) {
    console.error('[focusRoutes] Error /active POST:', err);
    
    if (err.code === 'INVALID_THEME') {
      return res.status(400).json({ success: false, message: copy.invalidTheme });
    }
    if (err.code === 'ALREADY_ACTIVE') {
      return res.status(400).json({ success: false, message: copy.alreadyActive });
    }
    
    return res.status(500).json({ success: false, message: copy.startError });
  }
});

/**
 * PATCH /api/focus/active
 * Actualizar foco activo (customGoal o status).
 * Body: { customGoal?, status? }
 */
router.patch('/active', updateLimiter, async (req, res) => {
  const copy = req.apiCopy;
  
  try {
    const { error, value } = validateBody(getUpdateFocusSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const focus = await updateActiveFocus(req.user._id, value);
    return res.json({ success: true, message: copy.updatedSuccess, data: focus });
  } catch (err) {
    console.error('[focusRoutes] Error /active PATCH:', err);
    
    if (err.code === 'NO_ACTIVE_FOCUS') {
      return res.status(400).json({ success: false, message: copy.noActiveFocus });
    }
    if (err.code === 'INVALID_STATUS') {
      return res.status(400).json({ success: false, message: copy.invalidStatus });
    }
    
    return res.status(500).json({ success: false, message: copy.updateError });
  }
});

/**
 * POST /api/focus/active/complete
 * Completar el foco activo.
 */
router.post('/active/complete', updateLimiter, async (req, res) => {
  const copy = req.apiCopy;
  
  try {
    const focus = await completeFocus(req.user._id);
    return res.json({ success: true, message: copy.completedSuccess, data: focus });
  } catch (err) {
    console.error('[focusRoutes] Error /active/complete:', err);
    
    if (err.code === 'NO_ACTIVE_FOCUS') {
      return res.status(400).json({ success: false, message: copy.noActiveFocus });
    }
    if (err.code === 'CANNOT_COMPLETE') {
      return res.status(400).json({ success: false, message: copy.cannotCompleteNonActive });
    }
    
    return res.status(500).json({ success: false, message: copy.completeError });
  }
});

export default router;
