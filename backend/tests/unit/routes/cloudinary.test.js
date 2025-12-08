/**
 * Tests unitarios para rutas de Cloudinary
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import cloudinaryRoutes from '../../../routes/cloudinary.js';

const app = express();
app.use(express.json());
app.use('/api/cloudinary', cloudinaryRoutes);

describe('Cloudinary Routes', () => {
  describe('POST /api/cloudinary/upload', () => {
    it('debe rechazar subida sin autenticación', async () => {
      const response = await request(app)
        .post('/api/cloudinary/upload')
        .send({});

      expect([401, 400, 404]).toContain(response.status);
    });
  });
});

