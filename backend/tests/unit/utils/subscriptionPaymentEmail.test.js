import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const countDocumentsMock = jest.fn();

jest.unstable_mockModule('../../../models/Transaction.js', () => ({
  default: {
    countDocuments: countDocumentsMock,
  },
}));

const {
  countPriorCompletedSubscriptionPayments,
  isSubscriptionRenewalPayment,
} = await import('../../../utils/subscriptionPaymentEmail.js');

describe('subscriptionPaymentEmail', () => {
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    countDocumentsMock.mockReset();
  });

  it('sin pagos previos no es renovación', async () => {
    countDocumentsMock.mockResolvedValue(0);

    expect(await countPriorCompletedSubscriptionPayments(userId)).toBe(0);
    expect(await isSubscriptionRenewalPayment(userId, 'new-txn')).toBe(false);

    expect(countDocumentsMock).toHaveBeenCalledWith({
      userId,
      type: 'subscription',
      status: 'completed',
      providerTransactionId: { $ne: 'new-txn' },
    });
  });

  it('con pago previo distinto es renovación', async () => {
    countDocumentsMock.mockResolvedValue(1);

    expect(await isSubscriptionRenewalPayment(userId, 'new-txn')).toBe(true);

    countDocumentsMock.mockResolvedValue(0);
    expect(await isSubscriptionRenewalPayment(userId, 'only-txn')).toBe(false);
  });
});
