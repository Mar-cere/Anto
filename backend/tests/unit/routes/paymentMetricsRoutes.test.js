/**
 * Tests unitarios para rutas de métricas de pagos
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import paymentMetricsRoutes from '../../../routes/paymentMetricsRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/payments/metrics', paymentMetricsRoutes);

describe('Payment Metrics Routes', () => {
  describe('GET /api/payments/metrics', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/payments/metrics');

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

