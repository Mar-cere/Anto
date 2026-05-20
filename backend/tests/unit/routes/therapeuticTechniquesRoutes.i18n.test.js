/**
 * Rutas de técnicas: idioma sin MongoDB.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      preferences: { language: 'en' },
    };
    next();
  },
}));

const { default: therapeuticTechniquesRoutes } = await import(
  '../../../routes/therapeuticTechniquesRoutes.js'
);

const app = express();
app.use(express.json());
app.use('/api/therapeutic-techniques', therapeuticTechniquesRoutes);

describe('Therapeutic Techniques Routes i18n', () => {
  it('GET / devuelve catálogo en inglés con X-App-Language', async () => {
    const response = await request(app)
      .get('/api/therapeutic-techniques')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.language).toBe('en');
    expect(response.body.count).toBeGreaterThan(0);
    const grounding = response.body.data.find((t) =>
      /grounding.*5-4-3-2-1/i.test(t.name),
    );
    expect(grounding?.interactiveExercise).toBe('grounding');
    expect(grounding?.steps?.[0]).toMatch(/SEE/i);
  });

  it('GET /emotion/ansiedad respeta idioma del header', async () => {
    const response = await request(app)
      .get('/api/therapeutic-techniques/emotion/ansiedad')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.language).toBe('en');
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('GET /psychoeducation/anxiety devuelve módulo en inglés', async () => {
    const response = await request(app)
      .get('/api/therapeutic-techniques/psychoeducation/anxiety')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.language).toBe('en');
    expect(response.body.data.whatIs).toMatch(/anxiety|stress/i);
  });

  it('GET /psychoeducation lista temas con language', async () => {
    const response = await request(app)
      .get('/api/therapeutic-techniques/psychoeducation')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.language).toBe('en');
    expect(response.body.data).toContain('anxiety');
  });
});
