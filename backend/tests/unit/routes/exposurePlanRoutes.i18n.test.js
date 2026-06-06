import request from 'supertest';
import express from 'express';
import exposurePlanRoutes from '../../../routes/exposurePlanRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/exposure-plans', exposurePlanRoutes);

describe('Exposure plan routes i18n (#87)', () => {
  it('POST sin auth rechaza (401)', async () => {
    const response = await request(app)
      .post('/api/exposure-plans')
      .set('X-App-Language', 'en')
      .send({
        title: 'Public speaking',
        steps: ['Step one', 'Step two'],
      });

    expect(response.status).toBe(401);
  });

  it('GET export sin auth rechaza (401)', async () => {
    const response = await request(app)
      .get('/api/exposure-plans/export')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(401);
  });
});
