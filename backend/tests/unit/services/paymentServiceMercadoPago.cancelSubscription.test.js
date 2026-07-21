import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSubscriptionFindOne = jest.fn();
const mockUserFindById = jest.fn();
const mockCancelMercadoPagoPreapproval = jest.fn();

jest.unstable_mockModule('../../../models/Subscription.js', () => ({
  default: { findOne: (...args) => mockSubscriptionFindOne(...args) },
}));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: (...args) => mockUserFindById(...args),
  },
}));

jest.unstable_mockModule('../../../services/paymentAuditService.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../../../services/cacheService.js', () => ({
  default: {
    delete: jest.fn(),
    generateKey: jest.fn(() => 'k'),
  },
}));

const { default: paymentServiceMercadoPago } = await import(
  '../../../services/paymentServiceMercadoPago.js'
);

describe('paymentServiceMercadoPago.cancelSubscription', () => {
  const userId = '507f1f77bcf86cd799439011';
  const now = new Date('2026-07-21T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    mockSubscriptionFindOne.mockReset();
    mockUserFindById.mockReset();
    mockCancelMercadoPagoPreapproval.mockReset();
    paymentServiceMercadoPago.cancelMercadoPagoPreapproval = mockCancelMercadoPagoPreapproval;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rechaza trial sin suscripción de pago (409)', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null);
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            subscription: {
              status: 'trial',
              trialEndDate: new Date('2026-07-28T00:00:00.000Z'),
            },
          }),
      }),
    });

    await expect(paymentServiceMercadoPago.cancelSubscription(userId)).rejects.toMatchObject({
      code: 'TRIAL_NO_PAID_SUBSCRIPTION',
      statusCode: 409,
    });
  });

  it('rechaza Apple con CANCEL_VIA_APP_STORE (409)', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      mercadopagoSubscriptionId: null,
      status: 'active',
      metadata: { appleOriginalTransactionId: '1000000999' },
    });
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            subscription: {
              status: 'premium',
              subscriptionEndDate: new Date('2026-08-01T00:00:00.000Z'),
            },
          }),
      }),
    });

    await expect(paymentServiceMercadoPago.cancelSubscription(userId)).rejects.toMatchObject({
      code: 'CANCEL_VIA_APP_STORE',
      statusCode: 409,
    });
  });

  it('cancela preapproval de Mercado Pago cuando existe', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);
    const subscription = {
      mercadopagoSubscriptionId: 'pre_abc',
      status: 'active',
      metadata: {},
      cancel,
      canceledAt: new Date(now),
      cancelAtPeriodEnd: true,
    };
    mockSubscriptionFindOne.mockResolvedValue(subscription);
    mockUserFindById
      .mockReturnValueOnce({
        select: () => ({
          lean: () =>
            Promise.resolve({
              subscription: {
                status: 'premium',
                subscriptionEndDate: new Date('2026-08-01T00:00:00.000Z'),
              },
            }),
        }),
      })
      .mockResolvedValueOnce({
        subscription: { status: 'premium' },
        save: jest.fn().mockResolvedValue(undefined),
      });
    mockCancelMercadoPagoPreapproval.mockResolvedValue({ status: 'cancelled', id: 'pre_abc' });

    const result = await paymentServiceMercadoPago.cancelSubscription(userId, false);

    expect(mockCancelMercadoPagoPreapproval).toHaveBeenCalledWith('pre_abc');
    expect(cancel).toHaveBeenCalledWith(false);
    expect(result).toMatchObject({
      success: true,
      billingProvider: 'mercadopago',
      mercadopagoSubscriptionId: 'pre_abc',
    });
  });

  it('devuelve 404 si no hay suscripción', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null);
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ subscription: { status: 'free' } }),
      }),
    });

    await expect(paymentServiceMercadoPago.cancelSubscription(userId)).rejects.toMatchObject({
      code: 'SUBSCRIPTION_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('rechaza premium sin canal cancelable (409)', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null);
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            subscription: {
              status: 'premium',
              subscriptionEndDate: new Date('2026-08-01T00:00:00.000Z'),
            },
          }),
      }),
    });

    await expect(paymentServiceMercadoPago.cancelSubscription(userId)).rejects.toMatchObject({
      code: 'SUBSCRIPTION_NOT_CANCELLABLE',
      statusCode: 409,
    });
  });
});
