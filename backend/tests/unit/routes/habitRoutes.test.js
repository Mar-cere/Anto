/**
 * Tests unitarios para rutas de hábitos
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import habitRoutes from '../../../routes/habitRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/habits', habitRoutes);

describe('Habit Routes', () => {
  describe('GET /api/habits', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/habits');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('POST /api/habits', () => {
    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Test habit',
          frequency: 'daily'
        });

      expect([401, 400]).toContain(response.status);
    });

    it('debe rechazar creación sin datos requeridos', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({});

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .put('/api/habits/123')
        .send({
          name: 'Updated habit'
        });

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('debe rechazar eliminación sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/habits/123');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('POST /api/habits/:id/complete', () => {
    it('debe rechazar completado sin autenticación', async () => {
      const response = await request(app)
        .post('/api/habits/123/complete')
        .send({});

      expect([401, 400]).toContain(response.status);
    });
  });
});

