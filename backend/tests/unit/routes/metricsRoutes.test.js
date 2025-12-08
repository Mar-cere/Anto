/**
 * Tests unitarios para rutas de métricas
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import metricsRoutes from '../../../routes/metricsRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/metrics', metricsRoutes);

describe('Metrics Routes', () => {
  describe('GET /api/metrics/system', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/metrics/system');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('GET /api/metrics/health', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/metrics/health');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('GET /api/metrics/me', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/metrics/me');

      expect([401, 400]).toContain(response.status);
    });
  });
});

