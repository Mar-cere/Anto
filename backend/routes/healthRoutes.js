/**
 * Rutas de Health Check
 *
 * Endpoints para verificar el estado de salud del servidor
 * y sus dependencias.
 *
 * @author AntoApp Team
 */

import express from 'express';
import { getAppTrialPublicConfig } from '../constants/subscription.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import {
  buildDetailedHealthSnapshot,
  buildPublicHealthSnapshot,
  getHealthHttpStatus,
} from '../services/healthProbeService.js';
import { getCrisisRoutingOpsSnapshot } from '../services/crisisRoutingOpsService.js';
import {
  buildCrisisResourcesClientPayload,
  parseCrisisResourcesCountryQuery,
} from '../services/crisisResourcesService.js';

const router = express.Router();

const detailedLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiadas solicitudes de health detallado. Intenta de nuevo en unos minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

const crisisResourcesLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Demasiadas solicitudes de recursos de crisis. Intenta de nuevo en unos minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/health/app-config
 * Config pública de la app (sin auth). Usada por FAQ y copy de trial.
 */
router.get('/app-config', (req, res) => {
  res.json({
    success: true,
    ...getAppTrialPublicConfig(),
  });
});

router.get('/', async (req, res) => {
  const health = buildPublicHealthSnapshot();
  res.status(getHealthHttpStatus(health)).json(health);
});

/**
 * GET /api/health/detailed
 * Health check detallado (solo en desarrollo o con autenticación)
 */
router.get('/detailed', detailedLimiter, async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const health = buildDetailedHealthSnapshot();
  res.status(getHealthHttpStatus(health)).json(health);
});

/**
 * GET /api/health/crisis-routing
 * Métricas ops de enrutamiento crisis (camino A vs B) y acciones en segundo plano.
 */
router.get('/crisis-routing', detailedLimiter, async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const snapshot = await getCrisisRoutingOpsSnapshot({
    windowHours: req.query.windowHours,
    source: req.query.source,
  });
  res.json(snapshot);
});

/**
 * GET /api/health/crisis-resources
 * Recursos de emergencia estructurados (público; opcional ?country=ISO).
 */
router.get('/crisis-resources', crisisResourcesLimiter, (req, res) => {
  const countryIso = parseCrisisResourcesCountryQuery(req.query.country);
  const preferences = countryIso ? { country: countryIso } : null;
  const language = req.query.language || req.appLanguage || 'es';

  res.json({
    success: true,
    crisisResources: buildCrisisResourcesClientPayload({
      preferences,
      phone: null,
      language,
      riskLevel: null,
      hardStop: false,
    }),
  });
});

export default router;
