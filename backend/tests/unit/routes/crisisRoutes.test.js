/**
 * Tests unitarios para rutas de crisis
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import crisisRoutes from '../../../routes/crisisRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/crisis', crisisRoutes);

describe('Crisis Routes', () => {
  describe('GET /api/crisis/summary', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/crisis/summary');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('GET /api/crisis/trends', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/crisis/trends');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('GET /api/crisis/history', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/crisis/history');

      expect([401, 400]).toContain(response.status);
    });
  });
});

