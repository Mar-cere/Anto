/**
 * POST /api/metrics/commitment — telemetría de compromisos (#202 v1.1).
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const userId = '507f1f77bcf86cd799439011';
const recordMetric = jest.fn().mockResolvedValue(undefined);

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { _id: userId };
    next();
  },
}));

await jest.unstable_mockModule('../../../services/metricsService.js', () => ({
  default: { recordMetric },
}));

const { default: metricsRoutes } = await import('../../../routes/metricsRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/metrics', metricsRoutes);

describe('POST /api/metrics/commitment', () => {
  beforeEach(() => {
    recordMetric.mockClear();
  });

  it('registra commitment_follow_up_shown con surface dashboard', async () => {
    const response = await request(app)
      .post('/api/metrics/commitment')
      .send({ event: 'follow_up_shown', surface: 'dashboard' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(recordMetric).toHaveBeenCalledWith(
      'commitment_follow_up_shown',
      { surface: 'dashboard' },
      userId,
    );
  });

  it('rechaza follow_up_shown con surface distinta de dashboard', async () => {
    const response = await request(app)
      .post('/api/metrics/commitment')
      .send({ event: 'follow_up_shown', surface: 'chat' });

    expect(response.status).toBe(400);
    expect(recordMetric).not.toHaveBeenCalled();
  });
});
