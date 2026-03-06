/**
 * Tests unitarios para el hook useSubscriptionScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'android' },
  Linking: { canOpenURL: jest.fn().mockResolvedValue(true), openURL: jest.fn() },
  StyleSheet: { create: (s) => s },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));

import { renderHook, act } from '@testing-library/react-native';
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
  },
}));
jest.mock('../../services/storeKitService', () => ({
  __esModule: true,
  default: { isAvailable: () => false },
}));
jest.mock('../../utils/apiErrorHandler', () => ({ getApiErrorMessage: (e) => e?.message || 'Error' }));

describe('useSubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { default: paymentService } = require('../../services/paymentService');
    paymentService.getSubscriptionStatus.mockResolvedValue({ success: true, hasSubscription: false });
  });

  it('debe retornar las claves esperadas', () => {
    const { result } = renderHook(() => useSubscriptionScreen());
    expect(result.current).toMatchObject({
      plans: expect.any(Array),
      subscriptionStatus: null,
      loading: true,
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

  it('loadData debe dejar subscriptionStatus cuando getSubscriptionStatus tiene success', async () => {
    const { result } = renderHook(() => useSubscriptionScreen());
    const { default: paymentService } = require('../../services/paymentService');
    paymentService.getSubscriptionStatus.mockResolvedValue({
      success: true,
      hasSubscription: true,
      status: 'premium',
      plan: 'yearly',
    });
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

  it('loadData debe poner subscriptionStatus en null si getSubscriptionStatus falla', async () => {
    const { result } = renderHook(() => useSubscriptionScreen());
    const { default: paymentService } = require('../../services/paymentService');
    paymentService.getSubscriptionStatus.mockRejectedValue(new Error('Network error'));
    await act(async () => {
      await result.current.loadData();
    });
    expect(result.current.subscriptionStatus).toBe(null);
    expect(result.current.plans).toHaveLength(4);
  });
});
