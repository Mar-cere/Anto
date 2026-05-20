/**
 * Auth: validación y mensajes localizados.
 */
import request from 'supertest';
import express from 'express';
import authRoutes from '../../../routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth routes i18n', () => {
  it('POST /register devuelve invalidData en inglés', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('X-App-Language', 'en')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid data');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('POST /login devuelve mensajes Joi en inglés', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-App-Language', 'en')
      .send({ email: 'not-an-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid data');
    expect(response.body.errors.some((e) => /email/i.test(e))).toBe(true);
  });
});
