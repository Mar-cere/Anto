/**
 * Rutas de crisis: mensajes de error según X-App-Language (sin MongoDB).
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      preferences: { language: 'es' },
    };
    next();
  },
}));

const { default: crisisRoutes } = await import('../../../routes/crisisRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/crisis', crisisRoutes);

describe('Crisis Routes i18n', () => {
  it('devuelve mensaje de validación en inglés con X-App-Language', async () => {
    const response = await request(app)
      .get('/api/crisis/summary?days=9999')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid query parameters');
  });

  it('devuelve mensaje de validación en español por defecto', async () => {
    const response = await request(app)
      .get('/api/crisis/trends?period=invalid');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Parámetros de consulta inválidos');
  });
});
