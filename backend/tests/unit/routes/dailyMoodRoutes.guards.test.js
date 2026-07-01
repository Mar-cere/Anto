/**
 * Guardas HTTP del check-in emocional diario (dashboard).
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const userId = '507f1f77bcf86cd799439011';

const getTodayDailyMoodCheckIn = jest.fn();
const upsertTodayDailyMoodCheckIn = jest.fn();

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { _id: userId };
    next();
  },
}));

await jest.unstable_mockModule('../../../services/dailyMoodCheckInService.js', () => ({
  getTodayDailyMoodCheckIn,
  upsertTodayDailyMoodCheckIn,
}));

const { default: dailyMoodRoutes } = await import('../../../routes/dailyMoodRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/daily-mood', dailyMoodRoutes);

describe('Daily mood routes guards', () => {
  beforeEach(() => {
    getTodayDailyMoodCheckIn.mockReset();
    upsertTodayDailyMoodCheckIn.mockReset();
  });

  it('GET /today devuelve checkIn localizado', async () => {
    getTodayDailyMoodCheckIn.mockResolvedValue({
      mood: 'calm',
      dateKey: '2026-06-17',
      label: 'Calma',
      acknowledgment: 'Qué bueno.',
      suggestChat: false,
    });

    const response = await request(app)
      .get('/api/daily-mood/today')
      .query({ timezone: 'America/Argentina/Buenos_Aires' })
      .set('X-App-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.checkIn.mood).toBe('calm');
    expect(getTodayDailyMoodCheckIn).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ timezone: 'America/Argentina/Buenos_Aires', language: 'es' }),
    );
  });

  it('PUT /today con mood inválido devuelve 400 e invalidMood', async () => {
    upsertTodayDailyMoodCheckIn.mockResolvedValue({ error: 'invalidMood' });

    const response = await request(app)
      .put('/api/daily-mood/today')
      .set('X-App-Language', 'es')
      .send({ mood: 'invalid', timezone: 'UTC' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('invalidMood');
    expect(response.body.message).toMatch(/no válido/i);
  });

  it('PUT /today guarda check-in válido', async () => {
    upsertTodayDailyMoodCheckIn.mockResolvedValue({
      checkIn: {
        mood: 'anxious',
        label: 'Tenso',
        suggestChat: true,
      },
    });

    const response = await request(app)
      .put('/api/daily-mood/today')
      .set('X-App-Language', 'en')
      .send({ mood: 'anxious', timezone: 'UTC' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.checkIn.mood).toBe('anxious');
    expect(upsertTodayDailyMoodCheckIn).toHaveBeenCalledWith(
      userId,
      'anxious',
      expect.objectContaining({ source: 'dashboard', language: 'en' }),
    );
  });
});
