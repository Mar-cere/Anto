import { subscriptionLooksCurrentlyUsable } from '../subscriptionAccess';

describe('subscriptionLooksCurrentlyUsable', () => {
  it('deniega sin success o sin hasSubscription', () => {
    expect(subscriptionLooksCurrentlyUsable(null)).toBe(false);
    expect(subscriptionLooksCurrentlyUsable({ success: true, hasSubscription: false })).toBe(false);
  });

  it('deniega isActive false', () => {
    expect(
      subscriptionLooksCurrentlyUsable({
        success: true,
        hasSubscription: true,
        status: 'active',
        isActive: false,
        subscriptionEndDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(false);
  });

  it('permite premium con periodo vigente', () => {
    expect(
      subscriptionLooksCurrentlyUsable({
        success: true,
        hasSubscription: true,
        status: 'premium',
        isActive: true,
        subscriptionEndDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);
  });

  it('permite trial User con isInTrial vigente', () => {
    expect(
      subscriptionLooksCurrentlyUsable({
        success: true,
        hasSubscription: true,
        status: 'trial',
        isActive: true,
        isInTrial: true,
        trialEndDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(true);
  });
});
