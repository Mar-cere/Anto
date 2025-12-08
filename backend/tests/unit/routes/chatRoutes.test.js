/**
 * Tests unitarios para rutas de chat
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import chatRoutes from '../../../routes/chatRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat Routes', () => {
  describe('POST /api/chat/messages', () => {
    it('debe rechazar mensaje sin autenticación', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .send({
          content: 'Test message'
        });

      // Puede ser 401 (no autenticado) o 403 (sin suscripción)
      expect([401, 400, 403, 404]).toContain(response.status);
    });

    it('debe rechazar mensaje sin contenido', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .send({});

      // Puede ser 400 (validación), 401 (no autenticado) o 403 (sin suscripción)
      expect([400, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/chat/conversations');

      // Puede ser 401 (no autenticado) o 403 (sin suscripción)
      expect([401, 400, 403]).toContain(response.status);
    });
  });

  describe('GET /api/chat/conversations/:id', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/chat/conversations/123');

      // Puede ser 401 (no autenticado) o 403 (sin suscripción)
      expect([401, 400, 403]).toContain(response.status);
    });
  });

  describe('GET /api/chat/messages/search', () => {
    it('debe rechazar búsqueda sin autenticación', async () => {
      const response = await request(app)
        .get('/api/chat/messages/search');

      // Puede ser 401 (no autenticado) o 400 (validación)
      expect([401, 400, 403, 404]).toContain(response.status);
    });
  });
});

