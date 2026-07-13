/**
 * Rutas REST para gestión de hechos biográficos del usuario.
 * CRUD completo: crear, listar, actualizar, eliminar.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody, validationErrorBody } from '../utils/apiValidation.js';
import { userFactsApiCopy } from '../utils/userFactsApiCopy.js';
import { getCreateUserFactSchema, getUpdateUserFactSchema } from '../utils/userFactsSchemas.js';
import UserFact from '../models/UserFact.js';

const router = express.Router();
router.use(attachApiCopy(userFactsApiCopy));
router.use(authenticateToken);

// Rate limiters
const createLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo 30 hechos cada 15 min
  message: (req) => userFactsApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
});

const updateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: (req) => userFactsApiCopy(resolveRequestLanguage(req)).rateLimitUpdate,
});

const deleteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => userFactsApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
});

/**
 * POST /api/user-facts
 * Crea un nuevo hecho biográfico para el usuario autenticado.
 */
router.post('/', createLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getCreateUserFactSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const userFact = new UserFact({
      userId: req.user._id,
      fact: value.fact,
      category: value.category || 'other',
      source: value.source || 'user',
      conversationId: value.conversationId || null,
    });

    await userFact.save();

    return res.status(201).json({
      success: true,
      message: copy.createdSuccess,
      data: {
        _id: userFact._id,
        fact: userFact.fact,
        category: userFact.category,
        source: userFact.source,
        conversationId: userFact.conversationId,
        isActive: userFact.isActive,
        createdAt: userFact.createdAt,
      },
    });
  } catch (err) {
    console.error('[userFactsRoutes] Error creating fact:', err);
    return res.status(500).json({ message: copy.createError });
  }
});

/**
 * GET /api/user-facts
 * Lista los hechos biográficos del usuario autenticado.
 * Query params opcionales:
 * - category: filtrar por categoría
 * - includeInactive: incluir hechos inactivos (default: false)
 */
router.get('/', async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { category, includeInactive } = req.query;

    const filter = {
      userId: req.user._id,
    };

    if (category) {
      filter.category = category;
    }

    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    const facts = await UserFact.find(filter)
      .sort({ createdAt: -1 })
      .select('fact category source conversationId isActive createdAt updatedAt')
      .lean();

    return res.status(200).json({
      success: true,
      message: copy.listSuccess,
      data: facts,
      count: facts.length,
    });
  } catch (err) {
    console.error('[userFactsRoutes] Error listing facts:', err);
    return res.status(500).json({ message: copy.listError });
  }
});

/**
 * PUT /api/user-facts/:id
 * Actualiza un hecho biográfico existente.
 * Solo el propietario puede actualizar sus hechos.
 */
router.put('/:id', validateObjectId, updateLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getUpdateUserFactSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const fact = await UserFact.findById(req.params.id);

    if (!fact) {
      return res.status(404).json({ message: copy.notFound });
    }

    // Verificar propiedad
    if (fact.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: copy.unauthorized });
    }

    // Actualizar campos permitidos
    if (value.fact !== undefined) fact.fact = value.fact;
    if (value.category !== undefined) fact.category = value.category;
    if (value.isActive !== undefined) fact.isActive = value.isActive;

    await fact.save();

    return res.status(200).json({
      success: true,
      message: copy.updatedSuccess,
      data: {
        _id: fact._id,
        fact: fact.fact,
        category: fact.category,
        source: fact.source,
        conversationId: fact.conversationId,
        isActive: fact.isActive,
        createdAt: fact.createdAt,
        updatedAt: fact.updatedAt,
      },
    });
  } catch (err) {
    console.error('[userFactsRoutes] Error updating fact:', err);
    return res.status(500).json({ message: copy.updateError });
  }
});

/**
 * DELETE /api/user-facts/:id
 * Elimina (soft delete o hard delete) un hecho biográfico.
 * Por defecto hace soft delete (isActive = false).
 * Con ?hard=true hace eliminación física.
 */
router.delete('/:id', validateObjectId, deleteLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const fact = await UserFact.findById(req.params.id);

    if (!fact) {
      return res.status(404).json({ message: copy.notFound });
    }

    // Verificar propiedad
    if (fact.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: copy.unauthorized });
    }

    const hardDelete = req.query.hard === 'true';

    if (hardDelete) {
      await UserFact.findByIdAndDelete(req.params.id);
    } else {
      fact.isActive = false;
      await fact.save();
    }

    return res.status(200).json({
      success: true,
      message: copy.deletedSuccess,
      data: { _id: fact._id },
    });
  } catch (err) {
    console.error('[userFactsRoutes] Error deleting fact:', err);
    return res.status(500).json({ message: copy.deleteError });
  }
});

export default router;
