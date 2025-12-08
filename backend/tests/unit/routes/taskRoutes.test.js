/**
 * Tests unitarios para rutas de tareas
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import taskRoutes from '../../../routes/taskRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Task Routes', () => {
  describe('GET /api/tasks', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/tasks');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('POST /api/tasks', () => {
    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test task',
          description: 'Test description'
        });

      expect([401, 400]).toContain(response.status);
    });

    it('debe rechazar creación sin título', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          description: 'Test description'
        });

      // Puede ser 400 (validación) o 401 (sin autenticación)
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .put('/api/tasks/123')
        .send({
          title: 'Updated task'
        });

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('debe rechazar eliminación sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/tasks/123');

      expect([401, 400]).toContain(response.status);
    });
  });
});

