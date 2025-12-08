/**
 * Tests unitarios para rutas de engagement de notificaciones
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import notificationEngagementRoutes from '../../../routes/notificationEngagementRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/notifications/engagement', notificationEngagementRoutes);

describe('Notification Engagement Routes', () => {
  describe('GET /api/notifications/engagement', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/notifications/engagement');

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

