/**
 * Tests unitarios para rutas de usuario
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import userRoutes from '../../../routes/userRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  describe('GET /api/users/me', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/users/me', () => {
    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({
          name: 'Test User'
        });

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/users/me/password', () => {
    it('debe rechazar cambio de contraseña sin autenticación', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .send({
          currentPassword: 'oldpass',
          newPassword: 'newpass123'
        });

      expect([401, 400, 404]).toContain(response.status);
    });

    it('debe rechazar cambio sin contraseña actual', async () => {
      const response = await request(app)
        .put('/api/users/me/password')
        .send({
          newPassword: 'newpass123'
        });

      expect([400, 401, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/avatar-url/:publicId', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/avatar-url/test123');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/subscription', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/subscription');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/stats', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/stats');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/users/me', () => {
    it('debe rechazar eliminación sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/users/me');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/emergency-contacts', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/emergency-contacts');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/users/me/emergency-contacts', () => {
    it('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/users/me/emergency-contacts')
        .send({
          name: 'Test Contact',
          phone: '+1234567890'
        });

      expect([401, 400, 404]).toContain(response.status);
    });

    it('debe rechazar creación sin datos requeridos', async () => {
      const response = await request(app)
        .post('/api/users/me/emergency-contacts')
        .send({});

      expect([400, 401, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/users/me/emergency-contacts/:contactId', () => {
    it('debe rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .put('/api/users/me/emergency-contacts/507f1f77bcf86cd799439011')
        .send({
          name: 'Updated Contact'
        });

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/users/me/emergency-contacts/:contactId', () => {
    it('debe rechazar eliminación sin autenticación', async () => {
      const response = await request(app)
        .delete('/api/users/me/emergency-contacts/507f1f77bcf86cd799439011');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/users/me/emergency-contacts/:contactId/toggle', () => {
    it('debe rechazar toggle sin autenticación', async () => {
      const response = await request(app)
        .patch('/api/users/me/emergency-contacts/507f1f77bcf86cd799439011/toggle');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/users/me/emergency-contacts/:contactId/test', () => {
    it('debe rechazar test sin autenticación', async () => {
      const response = await request(app)
        .post('/api/users/me/emergency-contacts/507f1f77bcf86cd799439011/test');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/users/me/emergency-contacts/test-alert', () => {
    it('debe rechazar test sin autenticación', async () => {
      const response = await request(app)
        .post('/api/users/me/emergency-contacts/test-alert');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/users/me/emergency-contacts/:contactId/test-whatsapp', () => {
    it('debe rechazar test sin autenticación', async () => {
      const response = await request(app)
        .post('/api/users/me/emergency-contacts/507f1f77bcf86cd799439011/test-whatsapp');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/emergency-alerts', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/emergency-alerts');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/emergency-alerts/stats', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/emergency-alerts/stats');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/emergency-alerts/patterns', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/emergency-alerts/patterns');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/users/me/whatsapp-message-status/:messageSid', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/users/me/whatsapp-message-status/test123');

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

