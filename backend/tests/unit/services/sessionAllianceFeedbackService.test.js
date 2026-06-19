/**
 * Tests — WAI post-sesión (#98)
 */
import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockUserUpdate = jest.fn();
const mockUserFindById = jest.fn();
const mockRecordMetric = jest.fn().mockResolvedValue(undefined);

function mockUserLean(sessionWai = {}) {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ stats: { sessionWai } }),
    }),
  });
}

await jest.unstable_mockModule('../../../models/SessionAllianceFeedback.js', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    create: mockCreate,
  },
}));

await jest.unstable_mockModule('../../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: mockUserFindById,
    updateOne: mockUserUpdate,
  },
}));

await jest.unstable_mockModule('../../../services/metricsService.js', () => ({
  __esModule: true,
  default: { recordMetric: mockRecordMetric },
}));

const {
  isSessionWaiExcludedFromInsight,
  meetsSessionWaiThreshold,
  buildSessionWaiClientPayload,
  submitSessionAllianceFeedback,
  skipSessionAllianceFeedback,
} = await import('../../../services/sessionAllianceFeedbackService.js');

const userId = '507f1f77bcf86cd799439011';
const conversationId = '507f1f77bcf86cd799439012';

const baseInsight = {
  eligible: true,
  userTurns: 4,
  userChars: 120,
  durationMinutes: 12,
  headlineSource: 'rules',
  sessionPhase: 'default',
  crisisTier: null,
  dominantEmotion: { key: 'ansiedad', intensity: 6 },
};

describe('sessionAllianceFeedbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserLean({});
    mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockCreate.mockImplementation(async (doc) => ({
      toObject: () => ({ ...doc, _id: '507f1f77bcf86cd799439099' }),
    }));
    mockUserUpdate.mockResolvedValue({ acknowledged: true });
  });

  it('excluye crisis y recuperación post-crisis', () => {
    expect(isSessionWaiExcludedFromInsight({ ...baseInsight, crisisTier: 'high' })).toBe(true);
    expect(
      isSessionWaiExcludedFromInsight({ ...baseInsight, sessionPhase: 'crisis_recovered' }),
    ).toBe(true);
    expect(isSessionWaiExcludedFromInsight({ ...baseInsight, sessionPhase: 'acute' })).toBe(true);
    expect(isSessionWaiExcludedFromInsight(baseInsight)).toBe(false);
  });

  it('rechaza scores incompletos o fuera de rango', async () => {
    const result = await submitSessionAllianceFeedback(userId, conversationId, {
      insight: baseInsight,
      scores: { heard: 4, safe: 5, useful: 3, noPressure: 6 },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('invalid_scores');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('recordatorio tras skip previo en otra conversación', async () => {
    mockUserLean({
      pendingReminder: true,
      lastSkippedConversationId: '507f1f77bcf86cd799439099',
      lastSkippedAt: new Date('2026-06-01'),
    });

    const payload = await buildSessionWaiClientPayload({
      userId,
      conversationId,
      insight: baseInsight,
      language: 'es',
    });
    expect(payload.reminder.show).toBe(true);
    expect(payload.reminder.hadPreviousSkip).toBe(true);
  });

  it('umbral WAI más estricto que insight base', () => {
    expect(meetsSessionWaiThreshold({ userTurns: 2, userChars: 100 })).toBe(false);
    expect(meetsSessionWaiThreshold({ userTurns: 3, userChars: 79 })).toBe(false);
    expect(meetsSessionWaiThreshold({ userTurns: 3, userChars: 80 })).toBe(true);
  });

  it('buildSessionWaiClientPayload elegible en sesión sustantiva', async () => {
    const payload = await buildSessionWaiClientPayload({
      userId,
      conversationId,
      insight: baseInsight,
      language: 'es',
    });
    expect(payload.eligible).toBe(true);
    expect(payload.axisKeys).toHaveLength(4);
    expect(payload.alreadyRecorded).toBe(false);
  });

  it('submit guarda scores 1–5 y limpia recordatorio', async () => {
    const result = await submitSessionAllianceFeedback(userId, conversationId, {
      insight: baseInsight,
      language: 'es',
      scores: { heard: 4, safe: 5, useful: 4, noPressure: 5 },
    });
    expect(result.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalled();
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ 'stats.sessionWai.pendingReminder': false }),
      }),
    );
    expect(mockRecordMetric).toHaveBeenCalledWith(
      'session_wai_submitted',
      expect.any(Object),
      userId,
    );
  });

  it('skip registra omisión y activa recordatorio', async () => {
    const result = await skipSessionAllianceFeedback(userId, conversationId, {
      insight: baseInsight,
      language: 'es',
    });
    expect(result.ok).toBe(true);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({
          'stats.sessionWai.pendingReminder': true,
          'stats.sessionWai.lastSkippedConversationId': conversationId,
        }),
      }),
    );
    expect(mockRecordMetric).toHaveBeenCalledWith(
      'session_wai_skipped',
      expect.any(Object),
      userId,
    );
  });
});
