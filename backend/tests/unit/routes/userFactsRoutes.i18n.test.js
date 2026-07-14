/**
 * Tests i18n para rutas de user-facts.
 * Valida que los endpoints respondan correctamente en ES/EN.
 */

import request from 'supertest';
import express from 'express';
import userFactsRoutes from '../../../routes/userFactsRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/user-facts', userFactsRoutes);

describe('UserFacts routes i18n', () => {
  describe('POST /api/user-facts', () => {
    it('debe rechazar sin auth con mensaje en inglés', async () => {
      const res = await request(app)
        .post('/api/user-facts')
        .set('X-App-Language', 'en')
        .send({ fact: 'I work as a teacher' });

      expect(res.status).toBe(401);
    });

    it('debe rechazar sin auth con mensaje en español', async () => {
      const res = await request(app)
        .post('/api/user-facts')
        .set('X-App-Language', 'es')
        .send({ fact: 'Trabajo como profesor' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user-facts', () => {
    it('debe rechazar sin auth en inglés', async () => {
      const res = await request(app)
        .get('/api/user-facts')
        .set('X-App-Language', 'en');

      expect(res.status).toBe(401);
    });

    it('debe rechazar sin auth en español', async () => {
      const res = await request(app)
        .get('/api/user-facts')
        .set('X-App-Language', 'es');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user-facts/:id', () => {
    it('debe rechazar sin auth en inglés', async () => {
      const res = await request(app)
        .put('/api/user-facts/507f1f77bcf86cd799439011')
        .set('X-App-Language', 'en')
        .send({ fact: 'Updated fact' });

      expect(res.status).toBe(401);
    });

    it('debe rechazar sin auth en español', async () => {
      const res = await request(app)
        .put('/api/user-facts/507f1f77bcf86cd799439011')
        .set('X-App-Language', 'es')
        .send({ fact: 'Hecho actualizado' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/user-facts/:id', () => {
    it('debe rechazar sin auth en inglés', async () => {
      const res = await request(app)
        .delete('/api/user-facts/507f1f77bcf86cd799439011')
        .set('X-App-Language', 'en');

      expect(res.status).toBe(401);
    });

    it('debe rechazar sin auth en español', async () => {
      const res = await request(app)
        .delete('/api/user-facts/507f1f77bcf86cd799439011')
        .set('X-App-Language', 'es');

      expect(res.status).toBe(401);
    });
  });
});
