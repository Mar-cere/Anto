import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockLean = jest.fn();
const mockSelect = jest.fn(() => ({ lean: mockLean }));
const mockSort = jest.fn(() => ({ select: mockSelect }));
const mockFindOne = jest.fn(() => ({ sort: mockSort }));

await jest.unstable_mockModule('mongoose', () => ({
  default: {
    models: { Metric: { findOne: mockFindOne } },
    Types: {
      ObjectId: class MockOid {
        constructor(id) {
          this.id = id;
        }
        static isValid(id) {
          return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
        }
      },
    },
  },
}));

const {
  isUserInPostCrisisWindow,
  isUserInPostCrisisCommitmentCooldown,
  getPostCrisisWindow,
  POST_CRISIS_WINDOW_MS,
} = await import('../../../utils/postCrisisWindowGuard.js');

describe('postCrisisWindowGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ lean: mockLean });
  });

  it('exporta ventana de 48 h', () => {
    expect(POST_CRISIS_WINDOW_MS).toBe(48 * 60 * 60 * 1000);
  });

  it('devuelve false sin userId', async () => {
    expect(await isUserInPostCrisisWindow(null)).toBe(false);
    expect(await isUserInPostCrisisCommitmentCooldown(null)).toBe(false);
  });

  it('devuelve inactive con ObjectId inválido', async () => {
    expect(await isUserInPostCrisisWindow('not-an-object-id')).toBe(false);
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('devuelve active si hay métrica reciente', async () => {
    const anchor = new Date(Date.now() - 60 * 60 * 1000);
    mockLean.mockResolvedValue({ timestamp: anchor });
    expect(await isUserInPostCrisisWindow('507f1f77bcf86cd799439011')).toBe(true);
    const window = await getPostCrisisWindow('507f1f77bcf86cd799439011');
    expect(window.active).toBe(true);
    expect(window.endsAt.getTime()).toBe(anchor.getTime() + POST_CRISIS_WINDOW_MS);
  });

  it('devuelve inactive sin métrica', async () => {
    mockLean.mockResolvedValue(null);
    expect(await isUserInPostCrisisCommitmentCooldown('507f1f77bcf86cd799439011')).toBe(false);
  });
});
