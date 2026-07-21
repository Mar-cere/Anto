import {
  getSubscriptionCancelAction,
  resolveSubscriptionCancelUiAction,
  subscriptionLooksCurrentlyUsable,
} from '../subscriptionAccess';

describe('getSubscriptionCancelAction', () => {
  const usablePremium = {
    success: true,
    hasSubscription: true,
    status: 'premium',
    isActive: true,
    subscriptionEndDate: new Date(Date.now() + 86400000).toISOString(),
  };

  it('oculta cancelación en trial', () => {
    expect(
      getSubscriptionCancelAction({
        success: true,
        hasSubscription: true,
        status: 'trial',
        isActive: true,
        isInTrial: true,
        billingProvider: 'trial',
        trialEndDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe('none');
  });

  it('usa App Store para billingProvider apple', () => {
    expect(
      getSubscriptionCancelAction({
        ...usablePremium,
        billingProvider: 'apple',
      }),
    ).toBe('app_store');
  });

  it('usa API para Mercado Pago', () => {
    expect(
      getSubscriptionCancelAction({
        ...usablePremium,
        billingProvider: 'mercadopago',
      }),
    ).toBe('api');
  });

  it('devuelve null si el proveedor es unknown', () => {
    expect(
      getSubscriptionCancelAction({
        ...usablePremium,
        billingProvider: 'unknown',
      }),
    ).toBeNull();
  });
});

describe('resolveSubscriptionCancelUiAction', () => {
  const usablePremium = {
    success: true,
    hasSubscription: true,
    status: 'premium',
    isActive: true,
    subscriptionEndDate: new Date(Date.now() + 86400000).toISOString(),
  };

  it('en iOS con apple abre App Store', () => {
    expect(
      resolveSubscriptionCancelUiAction(
        { ...usablePremium, billingProvider: 'apple' },
        'ios',
      ),
    ).toBe('app_store');
  });

  it('en Android con apple no abre App Store', () => {
    expect(
      resolveSubscriptionCancelUiAction(
        { ...usablePremium, billingProvider: 'apple' },
        'android',
      ),
    ).toBe('not_cancellable');
  });

  it('unknown en iOS cae a App Store; en Android a API', () => {
    const status = { ...usablePremium, billingProvider: 'unknown' };
    expect(resolveSubscriptionCancelUiAction(status, 'ios')).toBe('app_store');
    expect(resolveSubscriptionCancelUiAction(status, 'android')).toBe('api');
  });
});

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
