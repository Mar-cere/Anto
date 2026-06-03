import request from 'supertest';
import express from 'express';
import abcRecordRoutes from '../../../routes/abcRecordRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/abc-records', abcRecordRoutes);

describe('ABC record routes i18n', () => {
  it('POST sin auth sigue rechazando (401) antes del copy', async () => {
    const response = await request(app)
      .post('/api/abc-records')
      .set('X-App-Language', 'en')
      .send({
        activatingEvent: 'test situation',
        beliefs: 'test thought',
      });

    expect(response.status).toBe(401);
  });

  it('GET export sin auth rechaza (401)', async () => {
    const response = await request(app)
      .get('/api/abc-records/export')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(401);
  });
});
