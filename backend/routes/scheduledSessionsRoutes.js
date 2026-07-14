/**
 * Rutas REST para gestión de sesiones programadas (#15).
 * CRUD completo: crear, listar, actualizar, eliminar, pausar, reanudar.
 * 
 * ## Límites y Rate Limiting
 * 
 * - Configuración: 10 req / 1 minuto (global para todas las operaciones CRUD)
 * - Máximo 10 sesiones totales por usuario
 * - Máximo 7 sesiones activas simultáneas
 * - Pausa: 1-90 días
 * 
 * ## Validaciones
 * 
 * - dayOfWeek: 0-6 (domingo-sábado)
 * - time: HH:mm formato 24h
 * - label: max 50 caracteres, sin newlines/tabs/caracteres problemáticos
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody, validationErrorBody } from '../utils/apiValidation.js';
import { scheduledSessionsApiCopy } from '../utils/scheduledSessionsApiCopy.js';
import {
  getCreateSessionSchema,
  getUpdateSessionSchema,
  getPauseSessionsSchema,
} from '../utils/scheduledSessionsSchemas.js';
import {
  getScheduledSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  pauseAllSessions,
  resumeAllSessions,
} from '../services/scheduledSessionsService.js';

const router = express.Router();
router.use(attachApiCopy(scheduledSessionsApiCopy));
router.use(authenticateToken);

// Rate limiter global para todas las operaciones
const crudLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10,
  message: (req) => scheduledSessionsApiCopy(resolveRequestLanguage(req)).rateLimitExceeded,
});

/**
 * GET /api/scheduled-sessions
 * Lista todas las sesiones programadas del usuario autenticado.
 */
router.get('/', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const sessions = await getScheduledSessions(req.user._id);

    return res.status(200).json({
      success: true,
      message: copy.listSuccess,
      data: sessions,
      count: sessions.length,
    });
  } catch (err) {
    console.error('[scheduledSessionsRoutes] Error listing sessions:', err);
    return res.status(500).json({ message: copy.listError });
  }
});

/**
 * POST /api/scheduled-sessions
 * Crea una nueva sesión programada.
 */
router.post('/', crudLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getCreateSessionSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const session = await createSession(req.user._id, value);

    return res.status(201).json({
      success: true,
      message: copy.createdSuccess,
      data: session,
    });
  } catch (err) {
    console.error('[scheduledSessionsRoutes] Error creating session:', err);

    // Errores de validación de input
    if (err.code === 'INVALID_INPUT') {
      return res.status(400).json({ message: err.message || copy.createError });
    }
    // Errores de negocio con códigos específicos
    if (err.code === 'LIMIT_REACHED') {
      return res.status(400).json({ message: copy.limitReached });
    }
    if (err.code === 'ACTIVE_LIMIT_REACHED') {
      return res.status(400).json({ message: copy.activeLimitReached });
    }
    if (err.code === 'DUPLICATE_TIME') {
      return res.status(400).json({ message: copy.duplicateTime });
    }
    // Errores de base de datos
    if (err.code === 'SAVE_ERROR' || err.code === 'DATA_CORRUPTED') {
      return res.status(500).json({ message: copy.internalError });
    }

    return res.status(500).json({ message: copy.createError });
  }
});

/**
 * PUT /api/scheduled-sessions/:sessionId
 * Actualiza una sesión programada existente.
 */
router.put('/:sessionId', crudLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { sessionId } = req.params;

    // Validar que sessionId no esté vacío
    if (!sessionId || sessionId.trim().length === 0) {
      return res.status(400).json({ message: copy.notFound });
    }

    const { error, value } = validateBody(getUpdateSessionSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const session = await updateSession(req.user._id, sessionId, value);

    return res.status(200).json({
      success: true,
      message: copy.updatedSuccess,
      data: session,
    });
  } catch (err) {
    console.error('[scheduledSessionsRoutes] Error updating session:', err);

    // Errores de validación de input
    if (err.code === 'INVALID_INPUT') {
      return res.status(400).json({ message: err.message || copy.updateError });
    }
    if (err.code === 'SESSION_NOT_FOUND') {
      return res.status(404).json({ message: copy.notFound });
    }
    if (err.code === 'ACTIVE_LIMIT_REACHED') {
      return res.status(400).json({ message: copy.activeLimitReached });
    }
    if (err.code === 'DUPLICATE_TIME') {
      return res.status(400).json({ message: copy.duplicateTime });
    }
    // Errores de base de datos
    if (err.code === 'SAVE_ERROR' || err.code === 'DATA_CORRUPTED') {
      return res.status(500).json({ message: copy.internalError });
    }

    return res.status(500).json({ message: copy.updateError });
  }
});

/**
 * DELETE /api/scheduled-sessions/:sessionId
 * Elimina una sesión programada.
 * Query param opcional:
 * - hard: si es "true", elimina permanentemente. Si no, marca como inactiva (soft delete).
 */
router.delete('/:sessionId', crudLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { sessionId } = req.params;
    const { hard } = req.query;

    if (!sessionId || sessionId.trim().length === 0) {
      return res.status(400).json({ message: copy.notFound });
    }

    const hardDelete = hard === 'true';
    const session = await deleteSession(req.user._id, sessionId, hardDelete);

    return res.status(200).json({
      success: true,
      message: copy.deletedSuccess,
      data: session,
    });
  } catch (err) {
    console.error('[scheduledSessionsRoutes] Error deleting session:', err);

    // Errores de validación de input
    if (err.code === 'INVALID_INPUT') {
      return res.status(400).json({ message: err.message || copy.deleteError });
    }
    if (err.code === 'SESSION_NOT_FOUND') {
      return res.status(404).json({ message: copy.notFound });
    }
    // Errores de base de datos
    if (err.code === 'SAVE_ERROR' || err.code === 'DATA_CORRUPTED') {
      return res.status(500).json({ message: copy.internalError });
    }

    return res.status(500).json({ message: copy.deleteError });
  }
});

/**
 * POST /api/scheduled-sessions/pause
 * Pausa todas las sesiones programadas por N días.
 * Body: { pauseDays: number (1-90) }
 */
router.post('/pause', crudLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getPauseSessionsSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const result = await pauseAllSessions(req.user._id, value.pauseDays);

    return res.status(200).json({
      success: true,
      message: copy.pausedSuccess,
      data: result,
    });
  } catch (err) {
    console.error('[scheduledSessionsRoutes] Error pausing sessions:', err);

    // Errores de validación de input
    if (err.code === 'INVALID_INPUT') {
      return res.status(400).json({ message: err.message || copy.pauseError });
    }
    if (err.code === 'INVALID_PAUSE_DAYS') {
      return res.status(400).json({ message: copy.joiPauseDaysRange });
    }
    // Errores de base de datos
    if (err.code === 'SAVE_ERROR') {
      return res.status(500).json({ message: copy.internalError });
    }

    return res.status(500).json({ message: copy.pauseError });
  }
});

/**
 * POST /api/scheduled-sessions/resume
 * Reanudar todas las sesiones (remover pausa global).
 */
router.post('/resume', crudLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const result = await resumeAllSessions(req.user._id);

    return res.status(200).json({
      success: true,
      message: copy.resumedSuccess,
      data: result,
    });
  } catch (err) {
    console.error('[scheduledSessionsRoutes] Error resuming sessions:', err);
    
    // Errores de validación de input
    if (err.code === 'INVALID_INPUT') {
      return res.status(400).json({ message: err.message || copy.resumeError });
    }
    // Errores de base de datos
    if (err.code === 'SAVE_ERROR') {
      return res.status(500).json({ message: copy.internalError });
    }
    
    return res.status(500).json({ message: copy.resumeError });
  }
});

export default router;
