/**
 * Tests unitarios para el hook useSubscriptionScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'android' },
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn(),
    getInitialURL: jest.fn().mockResolvedValue(null),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  StyleSheet: { create: (s) => s },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));

import { renderHook, act } from '@testing-library/react-native';
import { useSubscription } from '../../context/SubscriptionContext';
import { useSubscriptionScreen } from '../useSubscriptionScreen';

const mockNavigation = { goBack: jest.fn(), replace: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: () => {}, // no ejecutar callback en tests para evitar re-renders infinitos
}));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn() }));
jest.mock('../../services/paymentService', () => ({
  __esModule: true,
  default: {
    getSubscriptionStatus: jest.fn().mockResolvedValue({ success: true, hasSubscription: false }),
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
    restorePurchases: jest.fn(),
    purchaseWithStoreKit: jest.fn(),
    refreshSubscriptionStatusAfterPayment: jest.fn(),
  },
}));
jest.mock('../../services/storeKitService', () => ({
  __esModule: true,
  default: { isAvailable: () => false },
}));
jest.mock('../../utils/apiErrorHandler', () => ({ getApiErrorMessage: (e) => e?.message || 'Error' }));

jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('../../context/SubscriptionContext', () => ({
  useSubscription: jest.fn(() => ({
    subscriptionStatus: { success: true, hasSubscription: false },
    trialInfo: null,
    loading: false,
    hasPremiumAccess: false,
    hasChatAccess: () => false,
    refreshSubscription: jest.fn().mockResolvedValue({ success: true, hasSubscription: false }),
    refreshTrialInfo: jest.fn(),
    refreshAll: jest.fn(),
    syncAfterPayment: jest.fn().mockResolvedValue({ success: true, hasSubscription: true, status: 'premium' }),
    applySubscriptionStatus: jest.fn(),
  })),
}));

describe('useSubscriptionScreen', () => {
  const flushInitialEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { default: paymentService } = require('../../services/paymentService');
    paymentService.getSubscriptionStatus.mockResolvedValue({ success: true, hasSubscription: false });
    useSubscription.mockReturnValue({
      subscriptionStatus: { success: true, hasSubscription: false },
      trialInfo: null,
      loading: false,
      hasPremiumAccess: false,
      hasChatAccess: () => false,
      refreshSubscription: jest.fn().mockResolvedValue({ success: true, hasSubscription: false }),
      refreshTrialInfo: jest.fn(),
      refreshAll: jest.fn(),
      syncAfterPayment: jest.fn().mockResolvedValue({ success: true, hasSubscription: true, status: 'premium' }),
      applySubscriptionStatus: jest.fn(),
    });
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useSubscriptionScreen());
    await flushInitialEffects();
    expect(result.current).toMatchObject({
      plans: expect.any(Array),
      subscriptionStatus: expect.anything(),
      loading: expect.any(Boolean),
      error: null,
      subscribing: false,
      selectedPlan: null,
      showPaymentWebView: false,
      paymentUrl: null,
    });
    expect(typeof result.current.loadData).toBe('function');
    expect(typeof result.current.handleSubscribe).toBe('function');
    expect(typeof result.current.handleCancelSubscription).toBe('function');
    expect(typeof result.current.handleRestorePurchases).toBe('function');
    expect(typeof result.current.handlePaymentSuccess).toBe('function');
    expect(typeof result.current.handlePaymentCancel).toBe('function');
    expect(typeof result.current.handlePaymentError).toBe('function');
    expect(typeof result.current.setShowPaymentWebView).toBe('function');
    expect(typeof result.current.setPaymentUrl).toBe('function');
  });

  it('loadData debe cargar planes y estado de suscripción', async () => {
    const { result } = renderHook(() => useSubscriptionScreen());
    await flushInitialEffects();
    await act(async () => {
      await result.current.loadData();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.plans).toHaveLength(4);
    expect(result.current.plans[0]).toHaveProperty('id', 'monthly');
    expect(result.current.plans[0]).toHaveProperty('name');
    expect(result.current.plans[0]).toHaveProperty('formattedAmount');
  });

  it('loadData debe dejar subscriptionStatus cuando el contexto tiene premium', async () => {
    useSubscription.mockReturnValue({
      subscriptionStatus: {
        success: true,
        hasSubscription: true,
        status: 'premium',
        plan: 'yearly',
      },
      trialInfo: null,
      loading: false,
      hasPremiumAccess: true,
      hasChatAccess: () => true,
      refreshSubscription: jest.fn().mockResolvedValue({
        success: true,
        hasSubscription: true,
        status: 'premium',
        plan: 'yearly',
      }),
      refreshTrialInfo: jest.fn(),
      refreshAll: jest.fn(),
      syncAfterPayment: jest.fn(),
      applySubscriptionStatus: jest.fn(),
    });
    const { result } = renderHook(() => useSubscriptionScreen());
    await flushInitialEffects();
    await act(async () => {
      await result.current.loadData();
    });
    expect(result.current.subscriptionStatus).toMatchObject({
      success: true,
      hasSubscription: true,
      status: 'premium',
      plan: 'yearly',
    });
  });

  it('loadData invoca refreshSubscription del contexto', async () => {
    const refreshSubscription = jest.fn().mockResolvedValue({ success: true, hasSubscription: false });
    useSubscription.mockReturnValue({
      subscriptionStatus: null,
      trialInfo: null,
      loading: false,
      hasPremiumAccess: false,
      hasChatAccess: () => false,
      refreshSubscription,
      refreshTrialInfo: jest.fn(),
      refreshAll: jest.fn(),
      syncAfterPayment: jest.fn(),
      applySubscriptionStatus: jest.fn(),
    });
    const { result } = renderHook(() => useSubscriptionScreen());
    await flushInitialEffects();
    await act(async () => {
      await result.current.loadData();
    });
    expect(refreshSubscription).toHaveBeenCalled();
  });
});
