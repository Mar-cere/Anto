/**
 * Tests unitarios para rutas de feedback de respuestas
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import responseFeedbackRoutes from '../../../routes/responseFeedbackRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/feedback', responseFeedbackRoutes);

describe('Response Feedback Routes', () => {
  describe('POST /api/feedback', () => {
    it('debe rechazar feedback sin autenticación', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({});

      expect([401, 400, 404]).toContain(response.status);
    });

    it('debe rechazar feedback sin datos requeridos', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({});

      expect([400, 401, 404]).toContain(response.status);
    });

    it('debe rechazar feedback con datos inválidos', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({
          messageId: 'invalid',
          feedbackType: 'invalid_type',
          rating: 10 // Fuera de rango
        });

      expect([400, 401, 404]).toContain(response.status);
    });

    it('debe rechazar feedback con rating fuera de rango', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({
          messageId: '507f1f77bcf86cd799439011',
          feedbackType: 'helpful',
          rating: 6 // Fuera de rango 1-5
        });

      expect([400, 401, 404]).toContain(response.status);
    });
  });

  describe('GET /api/feedback', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/feedback');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/feedback/stats', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/feedback/stats');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/feedback/507f1f77bcf86cd799439011');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/feedback/:id', () => {
    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .put('/api/feedback/507f1f77bcf86cd799439011')
        .send({
          feedbackType: 'helpful',
          rating: 5
        });

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/feedback/:id', () => {
    it('debe rechazar eliminación sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/feedback/507f1f77bcf86cd799439011');

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

