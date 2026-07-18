import request from 'supertest';
import express from 'express';
import experientialPatternsRoutes from '../../../routes/experientialPatternsRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/experiential-patterns', experientialPatternsRoutes);

describe('ExperientialPatterns routes i18n', () => {
  it('GET / rechaza sin auth en inglés', async () => {
    const res = await request(app).get('/api/experiential-patterns').set('X-App-Language', 'en');
    expect(res.status).toBe(401);
  });

  it('GET / rechaza sin auth en español', async () => {
    const res = await request(app).get('/api/experiential-patterns').set('X-App-Language', 'es');
    expect(res.status).toBe(401);
  });

  it('POST / rechaza sin auth en inglés', async () => {
    const res = await request(app)
      .post('/api/experiential-patterns')
      .set('X-App-Language', 'en')
      .send({ statement: 'Mornings were the hardest' });
    expect(res.status).toBe(401);
  });

  it('PATCH /consent rechaza sin auth', async () => {
    const res = await request(app)
      .patch('/api/experiential-patterns/consent')
      .set('X-App-Language', 'en')
      .send({ enabled: true });
    expect(res.status).toBe(401);
  });
});
