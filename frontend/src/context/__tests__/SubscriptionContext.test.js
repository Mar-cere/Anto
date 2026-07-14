/**
 * Tests para SubscriptionContext
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { SubscriptionProvider, useSubscription } from '../SubscriptionContext';

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { _id: 'user-1', createdAt: new Date().toISOString() } })),
}));

jest.mock('../../services/paymentService', () => ({
  __esModule: true,
  default: {
    getSubscriptionStatus: jest.fn(),
    getTrialInfo: jest.fn(),
    refreshSubscriptionStatusAfterPayment: jest.fn(),
  },
  setSubscriptionStatusChangeHandler: jest.fn(),
}));

import paymentService, { setSubscriptionStatusChangeHandler } from '../../services/paymentService';
import { useAuth } from '../AuthContext';

function wrapper({ children }) {
  return <SubscriptionProvider>{children}</SubscriptionProvider>;
}

describe('SubscriptionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { _id: 'user-1', createdAt: new Date().toISOString() } });
    paymentService.getSubscriptionStatus.mockResolvedValue({
      success: true,
      hasSubscription: false,
      status: 'free',
    });
    paymentService.getTrialInfo.mockResolvedValue({
      success: true,
      isInTrial: true,
      daysRemaining: 5,
    });
    paymentService.refreshSubscriptionStatusAfterPayment.mockResolvedValue({
      success: true,
      hasSubscription: true,
      status: 'premium',
      plan: 'yearly',
      isActive: true,
    });
  });

  it('carga suscripción y trial al montar con usuario autenticado', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(paymentService.getSubscriptionStatus).toHaveBeenCalled();
    expect(paymentService.getTrialInfo).toHaveBeenCalled();
    expect(result.current.trialInfo).toMatchObject({ isInTrial: true });
  });

  it('syncAfterPayment actualiza estado premium global', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.syncAfterPayment({
        status: 'premium',
        plan: 'yearly',
        isActive: true,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2027-01-01T00:00:00.000Z',
      });
    });

    expect(paymentService.refreshSubscriptionStatusAfterPayment).toHaveBeenCalled();
    expect(result.current.hasPremiumAccess).toBe(true);
    expect(result.current.subscriptionStatus).toMatchObject({ status: 'premium', plan: 'yearly' });
  });

  it('registra handler global para validate-receipt', async () => {
    renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(setSubscriptionStatusChangeHandler).toHaveBeenCalled();
    });
  });
});
