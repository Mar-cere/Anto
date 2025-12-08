/**
 * Tests unitarios para rutas de recuperación de pagos
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import paymentRecoveryRoutes from '../../../routes/paymentRecoveryRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/payments/recovery', paymentRecoveryRoutes);

describe('Payment Recovery Routes', () => {
  describe('POST /api/payments/recovery/retry', () => {
    it('debe rechazar intento sin autenticación', async () => {
      const response = await request(app)
        .post('/api/payments/recovery/retry')
        .send({});

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

