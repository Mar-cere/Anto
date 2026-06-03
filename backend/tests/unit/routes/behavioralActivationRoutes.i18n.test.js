import request from 'supertest';
import express from 'express';
import behavioralActivationRoutes from '../../../routes/behavioralActivationRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/behavioral-activation-logs', behavioralActivationRoutes);

describe('Behavioral activation routes i18n (#88)', () => {
  it('POST sin auth rechaza (401)', async () => {
    const response = await request(app)
      .post('/api/behavioral-activation-logs')
      .set('X-App-Language', 'en')
      .send({
        activityDescription: 'Walk',
        moodBefore: 3,
        moodAfter: 5,
      });

    expect(response.status).toBe(401);
  });

  it('GET export sin auth rechaza (401)', async () => {
    const response = await request(app)
      .get('/api/behavioral-activation-logs/export')
      .set('X-App-Language', 'en');

    expect(response.status).toBe(401);
  });
});
