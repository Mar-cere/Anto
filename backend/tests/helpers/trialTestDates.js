/**
 * Fechas de trial alineadas con APP_TRIAL_DAYS para tests.
 */
import { APP_TRIAL_DURATION_MS } from '../../constants/subscription.js';

/**
 * @param {number} [offsetMs=0]
 * @returns {Date}
 */
export function futureTrialEndDate(offsetMs = 0) {
  return new Date(Date.now() + APP_TRIAL_DURATION_MS + offsetMs);
}

/**
 * Suscripción trial mínima para fixtures de integración.
 * @param {Partial<{ status: string, trialStartDate: Date, trialEndDate: Date }>} [overrides]
 */
export function trialSubscriptionFixture(overrides = {}) {
  const now = new Date();
  return {
    status: 'trial',
    trialStartDate: now,
    trialEndDate: futureTrialEndDate(),
    trialGrantedAt: now,
    ...overrides,
  };
}

/**
 * Periodo trialing alineado con APP_TRIAL_DAYS (modelo Subscription).
 */
export function futureTrialingPeriodFixture() {
  const now = new Date();
  const end = futureTrialEndDate();
  return {
    currentPeriodStart: now,
    currentPeriodEnd: end,
    trialStart: now,
    trialEnd: end,
  };
}

/**
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {Record<string, unknown>} [overrides]
 */
export function trialingSubscriptionDocFixture(userId, overrides = {}) {
  return {
    userId,
    plan: 'monthly',
    status: 'trialing',
    ...futureTrialingPeriodFixture(),
    ...overrides,
  };
}
