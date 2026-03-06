/**
 * Tests unitarios para el hook useSettingsScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  StyleSheet: { create: (s) => s },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn() }));

import { renderHook, act } from '@testing-library/react-native';
import { useSettingsScreen } from '../useSettingsScreen';

const mockReplace = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = { replace: mockReplace, goBack: mockGoBack };
const mockLogout = jest.fn();
const mockUpdateUser = jest.fn();
const mockAuth = {
  user: { id: '1', preferences: { responseStyle: 'balanced' } },
  updateUser: mockUpdateUser,
  logout: mockLogout,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));
jest.mock('../../config/api', () => ({
  api: { put: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({}) },
  ENDPOINTS: {
    UPDATE_PROFILE: '/api/users/me',
    ME: '/api/users/me',
    TEST_NOTIFICATION_WARNING: '/api/notifications/test/crisis-warning',
    TEST_NOTIFICATION_MEDIUM: '/api/notifications/test/crisis-medium',
    TEST_NOTIFICATION_FOLLOWUP: '/api/notifications/test/followup',
  },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/pushNotificationService', () => ({
  areNotificationsEnabled: jest.fn().mockResolvedValue(false),
  getStoredPushToken: jest.fn().mockResolvedValue(null),
  requestNotificationPermissions: jest.fn().mockResolvedValue(false),
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../utils/apiErrorHandler', () => ({ getApiErrorMessage: (e) => e?.message || 'Error' }));
jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));

describe('useSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.user = { id: '1', preferences: { responseStyle: 'balanced' } };
  });

  it('debe retornar las claves esperadas', () => {
    const { result } = renderHook(() => useSettingsScreen({ navigation: mockNavigation }));
    expect(result.current).toMatchObject({
      user: expect.any(Object),
      showLogoutModal: false,
      showDeleteModal: false,
      pushNotificationsEnabled: false,
    });
    expect(typeof result.current.setShowLogoutModal).toBe('function');
    expect(typeof result.current.setShowDeleteModal).toBe('function');
    expect(typeof result.current.handleLogout).toBe('function');
    expect(typeof result.current.handleDeleteAccount).toBe('function');
    expect(typeof result.current.handleTogglePushNotifications).toBe('function');
    expect(typeof result.current.handleCycleResponseStyle).toBe('function');
    expect(typeof result.current.handleTestNotification).toBe('function');
  });

  it('handleLogout debe llamar authLogout y navigation.replace(SignIn)', async () => {
    const { result } = renderHook(() => useSettingsScreen({ navigation: mockNavigation }));
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('SignIn');
  });

  it('setShowLogoutModal debe actualizar estado', () => {
    const { result } = renderHook(() => useSettingsScreen({ navigation: mockNavigation }));
    expect(result.current.showLogoutModal).toBe(false);
    act(() => {
      result.current.setShowLogoutModal(true);
    });
    expect(result.current.showLogoutModal).toBe(true);
  });

  it('setShowDeleteModal debe actualizar estado', () => {
    const { result } = renderHook(() => useSettingsScreen({ navigation: mockNavigation }));
    expect(result.current.showDeleteModal).toBe(false);
    act(() => {
      result.current.setShowDeleteModal(true);
    });
    expect(result.current.showDeleteModal).toBe(true);
  });
});
