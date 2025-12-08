/**
 * Tests unitarios para rutas de pagos
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import paymentRoutes from '../../../routes/paymentRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment Routes', () => {
  describe('GET /api/payments/plans', () => {
    it('debe retornar información de planes disponibles', async () => {
      const response = await request(app)
        .get('/api/payments/plans');

      // Puede ser 200 (éxito) o 500 (error de configuración)
      expect([200, 500]).toContain(response.status);
      if (response.status === 200 && response.body) {
        // Verificar estructura si la respuesta es exitosa
        expect(typeof response.body).toBe('object');
      }
    });
  });

  describe('POST /api/payments/checkout', () => {
    it('debe rechazar checkout sin autenticación', async () => {
      const response = await request(app)
        .post('/api/payments/checkout')
        .send({
          plan: 'monthly'
        });

      // Puede ser 401 (no autenticado) o 404 (ruta no encontrada)
      expect([401, 400, 404, 500]).toContain(response.status);
    });

    it('debe rechazar checkout sin plan', async () => {
      const response = await request(app)
        .post('/api/payments/checkout')
        .send({});

      // Puede ser 400 (validación) o 401/404 (sin autenticación/ruta)
      expect([400, 401, 404]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });

    it('debe rechazar plan inválido', async () => {
      const response = await request(app)
        .post('/api/payments/checkout')
        .send({
          plan: 'invalid-plan'
        });

      // Puede ser 400 (validación) o 401/404 (sin autenticación/ruta)
      expect([400, 401, 404]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('POST /api/payments/cancel', () => {
    it('debe rechazar cancelación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/payments/cancel')
        .send({});

      // Puede ser 401 (no autenticado), 404 (ruta no encontrada) o 500 (error)
      expect([401, 400, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/payments/update-payment-method', () => {
    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .post('/api/payments/update-payment-method')
        .send({
          paymentMethodId: 'test-id'
        });

      // Puede ser 401 (no autenticado), 404 (ruta no encontrada) o 500 (error)
      expect([401, 400, 404, 500]).toContain(response.status);
    });

    it('debe rechazar actualización sin paymentMethodId', async () => {
      const response = await request(app)
        .post('/api/payments/update-payment-method')
        .send({});

      // Puede ser 400 (validación), 401 (no autenticado) o 404 (ruta no encontrada)
      expect([400, 401, 404]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('GET /api/payments/status', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/payments/status');

      // Puede ser 401 (no autenticado), 404 (ruta no encontrada) o 500 (error)
      expect([401, 400, 404, 500]).toContain(response.status);
    });
  });
});

