/**
 * Guardas HTTP de exposición (#87 / #190) con auth mock.
 */
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';

const userId = '507f1f77bcf86cd799439011';
const planId = '507f1f77bcf86cd799439022';

const mockPlan = {
  _id: new mongoose.Types.ObjectId(planId),
  userId: new mongoose.Types.ObjectId(userId),
  currentStepIndex: 0,
  steps: [
    { status: 'in_progress', attempts: [], description: 'Paso 1' },
    { status: 'pending', attempts: [], description: 'Paso 2' },
  ],
  save: jest.fn().mockResolvedValue(true),
};

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { _id: userId, userId };
    next();
  },
}));

await jest.unstable_mockModule('../../../models/ExposurePlan.js', () => ({
  default: {
    findOne: jest.fn().mockResolvedValue(mockPlan),
  },
}));

const { default: exposurePlanRoutes } = await import('../../../routes/exposurePlanRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/exposure-plans', exposurePlanRoutes);

describe('Exposure plan routes guards (#87 / #190)', () => {
  beforeEach(() => {
    mockPlan.currentStepIndex = 0;
    mockPlan.steps = [
      { status: 'in_progress', attempts: [], description: 'Paso 1' },
      { status: 'pending', attempts: [], description: 'Paso 2' },
    ];
    mockPlan.save.mockClear();
  });

  it('POST complete sin intento devuelve stepNeedsAttempt', async () => {
    const response = await request(app)
      .post(`/api/exposure-plans/${planId}/steps/0/complete`)
      .set('X-App-Language', 'es');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('STEP_NEEDS_ATTEMPT');
    expect(String(response.body.error || '')).toMatch(/intento/i);
    expect(mockPlan.save).not.toHaveBeenCalled();
  });

  it('POST attempt en paso futuro devuelve stepLocked', async () => {
    const response = await request(app)
      .post(`/api/exposure-plans/${planId}/attempts`)
      .set('X-App-Language', 'es')
      .send({ stepIndex: 1, peakSuds: 50, endSuds: 30 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('STEP_LOCKED');
    expect(String(response.body.error || '')).toMatch(/anterior|locked/i);
  });

  it('POST complete en paso futuro devuelve stepLocked', async () => {
    mockPlan.steps[0].attempts = [{ peakSuds: 60, endSuds: 30 }];
    const response = await request(app)
      .post(`/api/exposure-plans/${planId}/steps/1/complete`)
      .set('X-App-Language', 'es');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('STEP_LOCKED');
    expect(mockPlan.save).not.toHaveBeenCalled();
  });

  it('POST complete con intento avanza el paso actual', async () => {
    mockPlan.steps[0].attempts = [{ peakSuds: 70, endSuds: 40 }];
    const response = await request(app)
      .post(`/api/exposure-plans/${planId}/steps/0/complete`)
      .set('X-App-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockPlan.steps[0].status).toBe('completed');
    expect(mockPlan.currentStepIndex).toBe(1);
    expect(mockPlan.save).toHaveBeenCalled();
  });
});
