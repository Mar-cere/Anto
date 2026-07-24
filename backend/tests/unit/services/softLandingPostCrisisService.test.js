import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockGetWindow = jest.fn();
const mockIsInWindow = jest.fn();
const mockUserFindById = jest.fn();
const mockUserUpdateOne = jest.fn();
const mockRecordMetric = jest.fn();

await jest.unstable_mockModule('../../../config/features.js', () => ({
  default: { softLandingPostCrisis: true },
  features: { softLandingPostCrisis: true },
}));

await jest.unstable_mockModule('../../../utils/postCrisisWindowGuard.js', () => ({
  getPostCrisisWindow: mockGetWindow,
  isUserInPostCrisisWindow: mockIsInWindow,
}));

await jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: mockUserFindById,
    updateOne: mockUserUpdateOne,
  },
}));

await jest.unstable_mockModule('../../../services/metricsService.js', () => ({
  default: { recordMetric: mockRecordMetric },
}));

const {
  isSoftLandingActive,
  buildSoftLandingFocusPayload,
  resolveSoftLandingForTurn,
  dismissSoftLandingStrip,
} = await import('../../../services/softLandingPostCrisisService.js');

describe('softLandingPostCrisisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecordMetric.mockResolvedValue(undefined);
    mockUserUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockIsInWindow.mockResolvedValue(true);
    const anchor = new Date(Date.now() - 3600000);
    mockGetWindow.mockResolvedValue({
      active: true,
      anchorAt: anchor,
      endsAt: new Date(anchor.getTime() + 48 * 3600000),
    });
  });

  it('isSoftLandingActive delega en ventana', async () => {
    expect(await isSoftLandingActive('u1')).toBe(true);
    mockIsInWindow.mockResolvedValue(false);
    expect(await isSoftLandingActive('u1')).toBe(false);
  });

  it('buildSoftLandingFocusPayload incluye mensaje', async () => {
    const payload = await buildSoftLandingFocusPayload('u1', { language: 'es' });
    expect(payload.active).toBe(true);
    expect(payload.message).toMatch(/Estoy aquí/i);
  });

  it('resolveSoftLandingForTurn emite strip una vez', async () => {
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({ softLandingState: {} }),
      }),
    });
    const first = await resolveSoftLandingForTurn({ userId: 'u1', language: 'es' });
    expect(first.softLandingActive).toBe(true);
    expect(first.softLanding.strip).toBeTruthy();
    expect(first.softLandingPromptSnippet).toMatch(/Soft landing/i);

    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({
          softLandingState: {
            stripAckAnchorAt: (await mockGetWindow()).anchorAt,
          },
        }),
      }),
    });
    const second = await resolveSoftLandingForTurn({ userId: 'u1', language: 'es' });
    expect(second.softLanding.strip).toBeNull();
  });

  it('suppressStrip no emite strip', async () => {
    mockUserFindById.mockReturnValue({
      select: () => ({ lean: async () => ({ softLandingState: {} }) }),
    });
    const r = await resolveSoftLandingForTurn({
      userId: 'u1',
      suppressStrip: true,
    });
    expect(r.softLandingActive).toBe(true);
    expect(r.softLanding.strip).toBeNull();
  });

  it('dismissSoftLandingStrip es idempotente', async () => {
    const r = await dismissSoftLandingStrip('u1');
    expect(r.success).toBe(true);
    expect(mockUserUpdateOne).toHaveBeenCalled();
  });

  it('dedupe soft_landing_entered por ancla (focus)', async () => {
    const anchor = (await mockGetWindow()).anchorAt;
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({ softLandingState: {} }),
      }),
    });
    await buildSoftLandingFocusPayload('u1', { language: 'es' });
    expect(mockRecordMetric).toHaveBeenCalledWith(
      'soft_landing_entered',
      expect.any(Object),
      'u1',
      expect.any(Object),
    );

    mockRecordMetric.mockClear();
    mockUserUpdateOne.mockClear();
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({
          softLandingState: { enteredAckAnchorAt: anchor },
        }),
      }),
    });
    await buildSoftLandingFocusPayload('u1', { language: 'es' });
    expect(mockUserUpdateOne).not.toHaveBeenCalled();
    expect(mockRecordMetric).not.toHaveBeenCalledWith(
      'soft_landing_entered',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('carrera strip: sin modifiedCount no emite strip ni métrica', async () => {
    mockUserFindById.mockReturnValue({
      select: () => ({ lean: async () => ({ softLandingState: {} }) }),
    });
    mockUserUpdateOne.mockResolvedValue({ modifiedCount: 0 });
    const r = await resolveSoftLandingForTurn({ userId: 'u1', language: 'es' });
    expect(r.softLandingActive).toBe(true);
    expect(r.softLanding.strip).toBeNull();
    expect(mockRecordMetric).not.toHaveBeenCalledWith(
      'soft_landing_strip_shown',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
