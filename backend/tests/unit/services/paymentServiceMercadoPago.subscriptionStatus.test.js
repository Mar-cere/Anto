import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSubscriptionFindOne = jest.fn();
const mockUserFindById = jest.fn();

jest.unstable_mockModule('../../../models/Subscription.js', () => ({
  default: { findOne: (...args) => mockSubscriptionFindOne(...args) },
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: (...args) => mockUserFindById(...args),
  },
}));

const { default: paymentServiceMercadoPago } = await import(
  '../../../services/paymentServiceMercadoPago.js'
);

describe('paymentServiceMercadoPago.getSubscriptionStatus — días de trial', () => {
  const userId = '507f1f77bcf86cd799439011';
  const now = new Date('2026-05-19T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    mockSubscriptionFindOne.mockReset();
    mockUserFindById.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('usa trialEnd (no currentPeriodEnd) cuando status es trialing', async () => {
    const trialEnd = new Date('2026-05-22T23:59:59.000Z');
    const currentPeriodEnd = new Date('2026-05-19T18:00:00.000Z');

    mockSubscriptionFindOne.mockReturnValue({
      lean: () =>
        Promise.resolve({
          status: 'trialing',
          trialStart: new Date('2026-05-16T00:00:00.000Z'),
          trialEnd,
          currentPeriodEnd,
          plan: 'monthly',
        }),
    });
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            subscription: { status: 'trial', trialEndDate: trialEnd },
          }),
      }),
    });

    const status = await paymentServiceMercadoPago.getSubscriptionStatus(userId);

    expect(status.isInTrial).toBe(true);
    expect(status.daysRemaining).toBe(4);
    expect(status.trialEndDate).toEqual(trialEnd);
    expect(status.billingProvider).toBe('trial');
  });

  it('incluye daysRemaining en usuario solo con trial en User', async () => {
    const trialEnd = new Date('2026-05-22T23:59:59.000Z');

    mockSubscriptionFindOne.mockReturnValue({
      lean: () => Promise.resolve(null),
    });
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            subscription: {
              status: 'trial',
              trialEndDate: trialEnd,
            },
          }),
      }),
    });

    const status = await paymentServiceMercadoPago.getSubscriptionStatus(userId);

    expect(status.isInTrial).toBe(true);
    expect(status.daysRemaining).toBe(4);
    expect(status.trialEndDate).toEqual(trialEnd);
    expect(status.billingProvider).toBe('trial');
  });
});
