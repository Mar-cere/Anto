import request from 'supertest';
import express from 'express';
import automaticThoughtRoutes from '../../../routes/automaticThoughtRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/automatic-thought-logs', automaticThoughtRoutes);

describe('Automatic thought routes i18n (#89)', () => {
  it('POST sin auth rechaza (401)', async () => {
    const response = await request(app)
      .post('/api/automatic-thought-logs')
      .set('X-App-Language', 'en')
      .send({
        situation: 'Meeting',
        automaticThought: 'They will judge me',
      });

    expect(response.status).toBe(401);
  });

  it('GET export sin auth rechaza (401)', async () => {
    const response = await request(app)
      .get('/api/automatic-thought-logs/export')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(401);
  });

  it('GET distortion-options sin auth rechaza (401)', async () => {
    const response = await request(app)
      .get('/api/automatic-thought-logs/distortion-options')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(401);
  });

  it('POST tcc-lite-draft sin auth rechaza (401)', async () => {
    const response = await request(app)
      .post('/api/automatic-thought-logs/tcc-lite-draft')
      .set('X-App-Language', 'es')
      .send({ conversationHistory: [] });

    expect(response.status).toBe(401);
  });
});
