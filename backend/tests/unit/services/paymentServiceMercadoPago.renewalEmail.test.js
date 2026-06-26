import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockTransactionFindOne = jest.fn();
const mockTransactionCreate = jest.fn();
const mockTransactionFindById = jest.fn();
const mockSubscriptionFindOne = jest.fn();

jest.unstable_mockModule('../../../models/Transaction.js', () => ({
  default: {
    findOne: (...args) => mockTransactionFindOne(...args),
    create: (...args) => mockTransactionCreate(...args),
    findById: (...args) => mockTransactionFindById(...args),
    updateOne: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../models/Subscription.js', () => ({
  default: {
    findOne: (...args) => mockSubscriptionFindOne(...args),
  },
}));

const paymentServiceMercadoPago = (
  await import('../../../services/paymentServiceMercadoPago.js')
).default;

describe('PaymentServiceMercadoPago renovaciones y correo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolveTransactionForPaymentWebhook enlaza renovación por preapproval_id', async () => {
    const checkoutTx = {
      _id: 'tx-checkout',
      userId: { email: 'ana@example.com' },
      plan: 'monthly',
      metadata: { preapprovalId: 'pre-123' },
    };

    mockTransactionFindOne
      .mockImplementationOnce(() => ({
        sort: () => ({
          populate: async () => null,
        }),
      }))
      .mockImplementationOnce(() => ({
        sort: () => ({
          populate: async () => checkoutTx,
        }),
      }));

    const result = await paymentServiceMercadoPago.resolveTransactionForPaymentWebhook({
      paymentId: 'pay-renewal-999',
      preferenceId: null,
      payerEmail: 'ana@example.com',
      preapprovalId: 'pre-123',
    });

    expect(result).toBe(checkoutTx);
  });

  it('ensureMercadoPagoPaymentTransaction crea transacción nueva en renovación', async () => {
    const linkedTransaction = {
      _id: 'tx-original',
      userId: { _id: 'user-1', email: 'ana@example.com' },
      plan: 'monthly',
      amount: 4990,
      currency: 'clp',
      status: 'completed',
      providerTransactionId: 'pay-month-1',
      metadata: {
        preapprovalId: 'pre-123',
        preapprovalPlanId: 'plan-monthly',
        paymentId: 'pay-month-1',
        userEmail: 'ana@example.com',
      },
    };

    mockTransactionFindOne.mockImplementationOnce(() => ({
      sort: () => ({
        populate: async () => null,
      }),
    }));

    mockTransactionCreate.mockResolvedValue({ _id: 'tx-renewal' });
    mockTransactionFindById.mockImplementationOnce(() => ({
      populate: async () => ({
        _id: 'tx-renewal',
        userId: linkedTransaction.userId,
        plan: 'monthly',
        metadata: { isRenewal: true },
      }),
    }));

    const result = await paymentServiceMercadoPago.ensureMercadoPagoPaymentTransaction({
      paymentId: 'pay-month-2',
      effectivePaymentData: { transaction_amount: 4990, currency_id: 'CLP', preapproval_id: 'pre-123' },
      linkedTransaction,
    });

    expect(mockTransactionCreate).toHaveBeenCalledTimes(1);
    expect(mockTransactionCreate.mock.calls[0][0]).toMatchObject({
      userId: 'user-1',
      providerTransactionId: 'pay-month-2',
      plan: 'monthly',
      metadata: expect.objectContaining({
        isRenewal: true,
        preapprovalId: 'pre-123',
        renewalOfTransactionId: 'tx-original',
      }),
    });
    expect(result._id).toBe('tx-renewal');
  });

  it('ensureMercadoPagoPaymentTransaction reutiliza checkout pendiente en primer cobro', async () => {
    const pendingCheckout = {
      _id: 'tx-pending',
      status: 'pending',
      providerTransactionId: 'plan-monthly',
      metadata: { preapprovalPlanId: 'plan-monthly' },
    };

    mockTransactionFindOne.mockImplementationOnce(() => ({
      sort: () => ({
        populate: async () => null,
      }),
    }));

    const result = await paymentServiceMercadoPago.ensureMercadoPagoPaymentTransaction({
      paymentId: 'pay-first',
      effectivePaymentData: { transaction_amount: 4990 },
      linkedTransaction: pendingCheckout,
    });

    expect(mockTransactionCreate).not.toHaveBeenCalled();
    expect(result).toBe(pendingCheckout);
  });
});
