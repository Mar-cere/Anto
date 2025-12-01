/**
 * Rutas de Health Check
 * 
 * Endpoints para verificar el estado de salud del servidor
 * y sus dependencias.
 * 
 * @author AntoApp Team
 */

import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Helper: obtener estado de MongoDB
const getMongoDBStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 mongodb:
 *                   type: string
 *                   example: connected
 *                 services:
 *                   type: object
 *                 version:
 *                   type: string
 *       503:
 *         description: Servidor con problemas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: getMongoDBStatus(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
  };
  
  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/health/detailed
 * Health check detallado (solo en desarrollo o con autenticación)
 */
router.get('/detailed', async (req, res) => {
  // Solo permitir en desarrollo o con autenticación
  if (process.env.NODE_ENV === 'production' && !req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: getMongoDBStatus(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
    },
    node: {
      version: process.version,
      platform: process.platform,
    },
    services: {
      mongodb: getMongoDBStatus() === 'connected',
      // Agregar más servicios aquí si es necesario
    },
  };
  
  const allServicesOk = Object.values(health.services).every(status => status === true);
  const statusCode = allServicesOk ? 200 : 503;
  health.status = allServicesOk ? 'ok' : 'degraded';
  
  res.status(statusCode).json(health);
});

export default router;

