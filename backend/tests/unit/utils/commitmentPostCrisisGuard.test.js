import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockFindOne = jest.fn();

await jest.unstable_mockModule('mongoose', () => ({
  default: {
    models: { Metric: { findOne: mockFindOne } },
    Types: { ObjectId: class MockOid {} },
  },
}));

const { isUserInPostCrisisCommitmentCooldown } = await import(
  '../../../utils/commitmentPostCrisisGuard.js'
);

describe('commitmentPostCrisisGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve false sin userId', async () => {
    expect(await isUserInPostCrisisCommitmentCooldown(null)).toBe(false);
  });

  it('devuelve true si hay métrica de crisis reciente', async () => {
    mockFindOne.mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: 'x' }),
      }),
    });
    expect(await isUserInPostCrisisCommitmentCooldown('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('devuelve false sin métrica reciente', async () => {
    mockFindOne.mockReturnValue({
      select: () => ({
        lean: async () => null,
      }),
    });
    expect(await isUserInPostCrisisCommitmentCooldown('507f1f77bcf86cd799439011')).toBe(false);
  });
});
