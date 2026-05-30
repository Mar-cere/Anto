/**
 * Fixtures de usuarios para tests
 * 
 * Datos de ejemplo para usar en tests.
 * 
 * @author AntoApp Team
 */

import { APP_TRIAL_DURATION_MS } from '../../constants/subscription.js';

export const validUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123456!',
};

export const invalidUser = {
  username: 'ab', // Muy corto
  email: 'invalid-email', // Email inválido
  password: '123', // Muy corto
};

export const userWithSubscription = {
  username: 'premiumuser',
  email: 'premium@example.com',
  password: 'Test123456!',
  subscription: {
    status: 'active',
    plan: 'monthly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  },
};

export const userInTrial = {
  username: 'trialuser',
  email: 'trial@example.com',
  password: 'Test123456!',
  trialEndDate: new Date(Date.now() + APP_TRIAL_DURATION_MS),
};

export const expiredTrialUser = {
  username: 'expireduser',
  email: 'expired@example.com',
  password: 'Test123456!',
  trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
};

export default {
  validUser,
  invalidUser,
  userWithSubscription,
  userInTrial,
  expiredTrialUser,
};

