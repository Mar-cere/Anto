/**
 * Tests unitarios para el hook useProfileScreen
 */
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Dimensions: { get: jest.fn(() => ({ width: 390, height: 844, scale: 2, fontScale: 1 })) },
  StyleSheet: { create: (s) => s, flatten: (x) => x, hairlineWidth: 1 },
  Animated: {
    Value: jest.fn().mockImplementation((initial) => ({ _value: initial })),
    timing: jest.fn().mockReturnValue({ start: jest.fn() }),
    sequence: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
    })),
  },
  Easing: {
    out: jest.fn((x) => x),
    in: jest.fn((x) => x),
    ease: 'ease',
  },
}));

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
  },
  ENDPOINTS: {
    SUMMARY_LAST_SESSION: '/api/summary/last-session',
  },
}));
jest.mock('../../../constants/routes', () => ({ ROUTES: { SIGN_IN: 'SignIn' } }));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../../services/paymentService', () => ({
  __esModule: true,
  default: {
    getSubscriptionStatus: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { api } from '../../../config/api';
import paymentService from '../../../services/paymentService';
import { toastHookWrapper } from '../../../test-utils/toastHookWrapper';
import { useProfileScreen } from '../useProfileScreen';

const hookOptions = { wrapper: toastHookWrapper };

const mockAlert = Alert.alert;
const mockReset = jest.fn();
const mockNavigation = {
  reset: mockReset,
};

describe('useProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    AsyncStorage.clear();
    api.get.mockResolvedValue({ success: true, data: null });
    paymentService.getSubscriptionStatus.mockResolvedValue({ success: true });
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useProfileScreen(mockNavigation), hookOptions);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current).toMatchObject({
      loading: expect.any(Boolean),
      refreshing: expect.any(Boolean),
      userData: expect.any(Object),
      detailedStats: expect.any(Object),
      subscriptionStatus: expect.anything(),
      lastSessionSummary: null,
    });
    expect(typeof result.current.handleRefresh).toBe('function');
    expect(typeof result.current.handleLogout).toBe('function');
    expect(typeof result.current.openChatFromLastSession).toBe('function');
  });

  it('al montar debe cargar estado de suscripción', async () => {
    const { result } = renderHook(() => useProfileScreen(mockNavigation), hookOptions);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(paymentService.getSubscriptionStatus).toHaveBeenCalled();
    expect(result.current.subscriptionStatus).toMatchObject({ success: true });
    expect(result.current.loading).toBe(false);
  });

  it('handleLogout muestra Alert y al confirmar limpia storage y navega a SignIn', async () => {
    let logoutCallback;
    mockAlert.mockImplementation((_title, _msg, buttons) => {
      const logoutBtn = buttons.find((b) => b.style === 'destructive');
      if (logoutBtn?.onPress) logoutCallback = logoutBtn.onPress;
    });
    await AsyncStorage.setItem('userToken', 'token');
    await AsyncStorage.setItem('userData', '{}');
    const { result } = renderHook(() => useProfileScreen(mockNavigation), hookOptions);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    act(() => {
      result.current.handleLogout();
    });
    await act(async () => {
      await logoutCallback();
    });
    expect(await AsyncStorage.getItem('userToken')).toBeNull();
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  });
});
