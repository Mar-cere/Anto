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
import {
  buildDetailedHealthSnapshot,
  buildPublicHealthSnapshot,
  getHealthHttpStatus,
} from '../services/healthProbeService.js';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del servidor
 *     tags: [Health]
 *     description: Verifica el estado de salud del servidor y sus dependencias
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *       503:
 *         description: Servidor con problemas
 */
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
router.get('/detailed', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const health = buildDetailedHealthSnapshot();
  res.status(getHealthHttpStatus(health)).json(health);
});

export default router;
