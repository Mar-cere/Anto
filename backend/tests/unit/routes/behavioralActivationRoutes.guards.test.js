/**
 * Guardas HTTP de activación conductual (#88) con auth mock.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const userId = '507f1f77bcf86cd799439011';
const logId = '507f1f77bcf86cd799439033';
const mockPlan = { slots: [{ slotId: 'slot-1', status: 'completed' }] };

const linkBaSlotToProduct = jest.fn();
const syncBaEcosystemFromLog = jest.fn();
const reconcileWeekPlanWithLinkedProducts = jest.fn(async ({ plan }) => ({ plan }));

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { _id: userId, userId };
    next();
  },
}));

await jest.unstable_mockModule('../../../services/behavioralActivationProductBridgeService.js', () => ({
  linkBaSlotToProduct,
  syncBaEcosystemFromLog,
  reconcileWeekPlanWithLinkedProducts,
}));

const { default: behavioralActivationRoutes } = await import(
  '../../../routes/behavioralActivationRoutes.js'
);

const app = express();
app.use(express.json());
app.use('/api/behavioral-activation-logs', behavioralActivationRoutes);

describe('Behavioral activation routes guards (#88)', () => {
  const linkBody = {
    slotId: 'slot-1',
    productKind: 'task',
    logId,
  };

  beforeEach(() => {
    linkBaSlotToProduct.mockReset();
    syncBaEcosystemFromLog.mockReset();
  });

  it('POST link-product conflicto devuelve BA_SLOT_LINK_CONFLICT', async () => {
    linkBaSlotToProduct.mockRejectedValue(
      Object.assign(new Error('slot_has_task'), { code: 'SLOT_LINK_CONFLICT' }),
    );

    const response = await request(app)
      .post('/api/behavioral-activation-logs/week-plan/link-product')
      .set('X-App-Language', 'es')
      .send(linkBody);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('BA_SLOT_LINK_CONFLICT');
    expect(String(response.body.error || '')).toMatch(/vinculad|conflict/i);
  });

  it('POST link-product slot inexistente devuelve BA_SLOT_NOT_FOUND', async () => {
    linkBaSlotToProduct.mockRejectedValue(
      Object.assign(new Error('slot_not_found'), { code: 'SLOT_NOT_FOUND' }),
    );

    const response = await request(app)
      .post('/api/behavioral-activation-logs/week-plan/link-product')
      .set('X-App-Language', 'es')
      .send(linkBody);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('BA_SLOT_NOT_FOUND');
  });

  it('POST link-product éxito devuelve plan', async () => {
    linkBaSlotToProduct.mockResolvedValue({
      productKind: 'task',
      plan: mockPlan,
      task: { _id: '507f1f77bcf86cd799439044' },
    });

    const response = await request(app)
      .post('/api/behavioral-activation-logs/week-plan/link-product')
      .set('X-App-Language', 'es')
      .send(linkBody);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.plan).toEqual(mockPlan);
  });

  it('POST sync-from-log sin slot devuelve BA_SLOT_NOT_FOUND', async () => {
    syncBaEcosystemFromLog.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/behavioral-activation-logs/week-plan/sync-from-log')
      .set('X-App-Language', 'es')
      .send({ slotId: 'missing', logId });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('BA_SLOT_NOT_FOUND');
  });
});
