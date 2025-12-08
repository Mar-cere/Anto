/**
 * Tests unitarios para rutas de notificaciones
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import notificationRoutes from '../../../routes/notificationRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification Routes', () => {
  describe('GET /api/notifications', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/notifications');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/notifications', () => {
    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({});

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

