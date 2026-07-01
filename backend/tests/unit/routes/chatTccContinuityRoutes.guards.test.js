/**
 * Guardas HTTP GET /api/chat/tcc-continuity.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const userId = '507f1f77bcf86cd799439011';
const conversationId = '507f1f77bcf86cd799439022';

const buildChatTccContinuity = jest.fn();
const recordContinuityItemsShown = jest.fn().mockResolvedValue(undefined);

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { _id: userId };
    next();
  },
}));

await jest.unstable_mockModule('../../../middleware/checkSubscription.js', () => ({
  requireActiveSubscription: () => (_req, _res, next) => next(),
}));

await jest.unstable_mockModule('../../../services/chatTccContinuityService.js', () => ({
  buildChatTccContinuity,
  default: { buildChatTccContinuity },
}));

await jest.unstable_mockModule('../../../services/chatInterventionGraphService.js', () => ({
  default: { recordContinuityItemsShown },
  recordContinuityItemsShown,
}));

const { default: chatRoutes } = await import('../../../routes/chatRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat TCC continuity routes guards', () => {
  beforeEach(() => {
    buildChatTccContinuity.mockReset();
    recordContinuityItemsShown.mockClear();
  });

  it('GET tcc-continuity devuelve items en data', async () => {
    buildChatTccContinuity.mockResolvedValue({
      items: [
        {
          id: 'ba:s1',
          kind: 'behavioral_activation',
          interventionId: 'behavioral_activation',
          title: 'Hoy',
          subtitle: 'Caminar',
          screen: 'BehavioralActivation',
          params: { openWeekSlotId: 's1' },
          icon: '🚶',
        },
      ],
      generatedAt: '2026-06-17T12:00:00.000Z',
    });

    const response = await request(app)
      .get('/api/chat/tcc-continuity')
      .query({ conversationId })
      .set('X-App-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].screen).toBe('BehavioralActivation');
    expect(recordContinuityItemsShown).toHaveBeenCalled();
    expect(buildChatTccContinuity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        conversationId,
      }),
    );
  });

  it('GET tcc-continuity sin conversationId delega vacío al servicio', async () => {
    buildChatTccContinuity.mockResolvedValue({
      items: [],
      generatedAt: '2026-06-17T12:00:00.000Z',
    });

    const response = await request(app)
      .get('/api/chat/tcc-continuity')
      .set('X-App-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([]);
    expect(buildChatTccContinuity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        conversationId: null,
      }),
    );
    expect(recordContinuityItemsShown).not.toHaveBeenCalled();
  });
});
