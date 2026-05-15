import Transaction from '../models/Transaction.js';

/**
 * Cuenta pagos de suscripción completados previos (excluye el id de transacción actual si se indica).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string|null|undefined} excludeProviderTransactionId
 */
export async function countPriorCompletedSubscriptionPayments(userId, excludeProviderTransactionId) {
  const filter = {
    userId,
    type: 'subscription',
    status: 'completed',
  };
  if (excludeProviderTransactionId) {
    filter.providerTransactionId = { $ne: String(excludeProviderTransactionId) };
  }
  return Transaction.countDocuments(filter);
}

/**
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string|null|undefined} excludeProviderTransactionId
 */
export async function isSubscriptionRenewalPayment(userId, excludeProviderTransactionId) {
  const prior = await countPriorCompletedSubscriptionPayments(userId, excludeProviderTransactionId);
  return prior > 0;
}
