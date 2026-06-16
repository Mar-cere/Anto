/**
 * Rutas de compromisos entre sesiones (#202).
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { sessionCommitmentApiCopy } from '../utils/sessionCommitmentApiCopy.js';
import {
  createSessionCommitment,
  listSessionCommitments,
  updateSessionCommitment,
} from '../services/sessionCommitmentService.js';

const router = express.Router();

router.use(attachApiCopy(sessionCommitmentApiCopy));

const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: (req) => sessionCommitmentApiCopy(resolveRequestLanguage(req)).rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);

router.get('/', async (req, res) => {
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
      const status = result.error.startsWith('label') ? 400 : 400;
      return res.status(status).json({ success: false, message: msg, code: result.error });
    }
    return res.status(201).json({ success: true, commitment: result.commitment });
  } catch (error) {
    console.error('[sessionCommitmentRoutes] POST /:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.createError });
  }
});

router.patch('/:id', writeLimiter, async (req, res) => {
  try {
    const result = await updateSessionCommitment(req.user._id, req.params.id, req.body || {});
    if (result.error) {
      const msg = req.apiCopy[result.error] || req.apiCopy.updateError;
      const status = result.error === 'notFound' ? 404 : 400;
      return res.status(status).json({ success: false, message: msg, code: result.error });
    }
    return res.json({ success: true, commitment: result.commitment });
  } catch (error) {
    console.error('[sessionCommitmentRoutes] PATCH /:id:', error);
    return res.status(500).json({ success: false, message: req.apiCopy.updateError });
  }
});

export default router;
