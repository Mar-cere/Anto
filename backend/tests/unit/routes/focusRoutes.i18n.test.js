/**
 * Tests i18n para rutas de focos de acompañamiento.
 * Verifica que los endpoints respondan en español e inglés.
 */
import request from 'supertest';
import express from 'express';
import focusRoutes from '../../../routes/focusRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/focus', focusRoutes);

describe('Focus routes i18n', () => {
  it('GET /api/focus/themes sin auth rechaza 401 en ES', async () => {
    const res = await request(app)
      .get('/api/focus/themes')
      .set('X-App-Language', 'es');
    expect(res.status).toBe(401);
  });

  it('GET /api/focus/themes sin auth rechaza 401 en EN', async () => {
    const res = await request(app)
      .get('/api/focus/themes')
      .set('X-App-Language', 'en');
    expect(res.status).toBe(401);
  });

  it('GET /api/focus/active sin auth rechaza 401 en ES', async () => {
    const res = await request(app)
      .get('/api/focus/active')
      .set('X-App-Language', 'es');
    expect(res.status).toBe(401);
  });

  it('GET /api/focus/active sin auth rechaza 401 en EN', async () => {
    const res = await request(app)
      .get('/api/focus/active')
      .set('X-App-Language', 'en');
    expect(res.status).toBe(401);
  });

  it('POST /api/focus/active sin auth rechaza 401 en ES', async () => {
    const res = await request(app)
      .post('/api/focus/active')
      .set('X-App-Language', 'es')
      .send({ themeId: 'anxiety' });
    expect(res.status).toBe(401);
  });

  it('POST /api/focus/active sin auth rechaza 401 en EN', async () => {
    const res = await request(app)
      .post('/api/focus/active')
      .set('X-App-Language', 'en')
      .send({ themeId: 'anxiety' });
    expect(res.status).toBe(401);
  });

  it('PATCH /api/focus/active sin auth rechaza 401 en ES', async () => {
    const res = await request(app)
      .patch('/api/focus/active')
      .set('X-App-Language', 'es')
      .send({ customGoal: 'Mi objetivo' });
    expect(res.status).toBe(401);
  });

  it('PATCH /api/focus/active sin auth rechaza 401 en EN', async () => {
    const res = await request(app)
      .patch('/api/focus/active')
      .set('X-App-Language', 'en')
      .send({ customGoal: 'My goal' });
    expect(res.status).toBe(401);
  });

  it('POST /api/focus/active/complete sin auth rechaza 401 en ES', async () => {
    const res = await request(app)
      .post('/api/focus/active/complete')
      .set('X-App-Language', 'es');
    expect(res.status).toBe(401);
  });

  it('POST /api/focus/active/complete sin auth rechaza 401 en EN', async () => {
    const res = await request(app)
      .post('/api/focus/active/complete')
      .set('X-App-Language', 'en');
    expect(res.status).toBe(401);
  });
});
