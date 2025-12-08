/**
 * Tests unitarios para rutas de técnicas terapéuticas
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import therapeuticTechniquesRoutes from '../../../routes/therapeuticTechniquesRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/therapeutic-techniques', therapeuticTechniquesRoutes);

describe('Therapeutic Techniques Routes', () => {
  describe('GET /api/therapeutic-techniques', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/therapeutic-techniques');

      expect([401, 400]).toContain(response.status);
    });
  });

  describe('GET /api/therapeutic-techniques/:id', () => {
    it('debe rechazar consulta sin autenticación', async () => {
      const response = await request(app)
        .get('/api/therapeutic-techniques/123');

      expect([401, 400, 404]).toContain(response.status);
    });
  });

  describe('POST /api/therapeutic-techniques/:id/use', () => {
    it('debe rechazar uso sin autenticación', async () => {
      const response = await request(app)
        .post('/api/therapeutic-techniques/123/use')
        .send({});

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

