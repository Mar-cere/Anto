/**
 * Tests unitarios para el hook useSettingsScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  StyleSheet: { create: (s) => s },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));
jest.mock('../../context/ThemeContext', () => ({
  preferenceToApiTheme: (p) => (p === 'system' ? 'auto' : p),
  useTheme: () => ({ setPreference: jest.fn().mockResolvedValue(undefined) }),
}));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn() }));

import { renderHook, act } from '@testing-library/react-native';
import { api } from '../../config/api';
import { useSettingsScreen } from '../useSettingsScreen';

const mockReplace = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = { replace: mockReplace, goBack: mockGoBack };
const mockLogout = jest.fn();
const mockRefreshSession = jest.fn();
const mockApplyLocalUser = jest.fn().mockResolvedValue(undefined);
const mockAuth = {
  user: {
    id: '1',
    preferences: { responseStyle: 'balanced', timezone: 'Etc/UTC' },
  },
  refreshSession: mockRefreshSession,
  applyLocalUser: mockApplyLocalUser,
  logout: mockLogout,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));
jest.mock('../../config/api', () => ({
  api: {
    put: jest.fn().mockResolvedValue({
      message: 'ok',
      user: {
        id: '1',
        preferences: { responseStyle: 'balanced', chatPreferences: {} },
      },
    }),
    delete: jest.fn().mockResolvedValue({}),
  },
  ENDPOINTS: {
    UPDATE_PROFILE: '/api/users/me',
    ME: '/api/users/me',
    TEST_NOTIFICATION_WARNING: '/api/notifications/test/crisis-warning',
    TEST_NOTIFICATION_MEDIUM: '/api/notifications/test/crisis-medium',
    TEST_NOTIFICATION_FOLLOWUP: '/api/notifications/test/followup',
  },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
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
jest.mock('../../utils/apiErrorHandler', () => ({
  getApiErrorMessage: (e) => e?.message || 'Error',
}));

const mockShowToast = jest.fn();
jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('useSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowToast.mockClear();
    mockApplyLocalUser.mockClear();
    mockAuth.user = {
      id: '1',
      preferences: { responseStyle: 'balanced', timezone: 'Etc/UTC' },
    };
  });

  it('debe retornar las claves esperadas', () => {
    const { result } = renderHook(() =>
      useSettingsScreen({ navigation: mockNavigation }),
    );
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
    expect(typeof result.current.handleTogglePushNotifications).toBe(
      'function',
    );
    expect(typeof result.current.handleUpdateNotificationPreferences).toBe(
      'function',
    );
    expect(typeof result.current.handleSetResponseStyle).toBe('function');
    expect(typeof result.current.handleChatPreferenceChange).toBe('function');
    expect(typeof result.current.handleTestNotification).toBe('function');
  });

  it('handleLogout debe llamar authLogout y navigation.replace(SignIn)', async () => {
    const { result } = renderHook(() =>
      useSettingsScreen({ navigation: mockNavigation }),
    );
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('SignIn');
  });

  it('setShowLogoutModal debe actualizar estado', () => {
    const { result } = renderHook(() =>
      useSettingsScreen({ navigation: mockNavigation }),
    );
    expect(result.current.showLogoutModal).toBe(false);
    act(() => {
      result.current.setShowLogoutModal(true);
    });
    expect(result.current.showLogoutModal).toBe(true);
  });

  it('setShowDeleteModal debe actualizar estado', () => {
    const { result } = renderHook(() =>
      useSettingsScreen({ navigation: mockNavigation }),
    );
    expect(result.current.showDeleteModal).toBe(false);
    act(() => {
      result.current.setShowDeleteModal(true);
    });
    expect(result.current.showDeleteModal).toBe(true);
  });

  describe('handleUpdateNotificationPreferences', () => {
    it('fusiona tipos y envía PUT con notificationPreferences completas', async () => {
      mockAuth.user = {
        id: '1',
        preferences: { notifications: true, timezone: 'Etc/UTC' },
        notificationPreferences: {
          enabled: true,
          morning: { enabled: false, hour: 9, minute: 0 },
          evening: { enabled: false, hour: 20, minute: 0 },
          types: {
            dailyReminders: true,
            habitReminders: true,
            taskReminders: true,
            motivationalMessages: true,
            betweenSessionsMessages: true,
          },
        },
      };

      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );

      await act(async () => {
        await result.current.handleUpdateNotificationPreferences({
          types: { habitReminders: false },
        });
      });

      expect(api.put).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          notificationPreferences: expect.objectContaining({
            types: expect.objectContaining({
              dailyReminders: true,
              habitReminders: false,
            }),
          }),
        }),
      );
    });

    it('con enabled false alinea preferences.notifications a false', async () => {
      mockAuth.user = {
        id: '1',
        preferences: { notifications: true, timezone: 'Etc/UTC' },
        notificationPreferences: {
          enabled: true,
          types: {
            dailyReminders: true,
            habitReminders: true,
            taskReminders: true,
            motivationalMessages: true,
            betweenSessionsMessages: true,
          },
        },
      };

      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );

      await act(async () => {
        await result.current.handleUpdateNotificationPreferences({
          enabled: false,
        });
      });

      expect(api.put).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          preferences: expect.objectContaining({ notifications: false }),
          notificationPreferences: expect.objectContaining({ enabled: false }),
        }),
      );
    });
  });

  describe('handleSetResponseStyle', () => {
    beforeEach(() => {
      mockAuth.user = {
        id: '1',
        preferences: { responseStyle: 'balanced', timezone: 'Etc/UTC' },
      };
    });

    it('envía PUT con responseStyle válido', async () => {
      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );
      await act(async () => {
        await result.current.handleSetResponseStyle('brief');
      });
      expect(api.put).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          preferences: expect.objectContaining({ responseStyle: 'brief' }),
        }),
      );
    });

    it('recorta espacios en la clave antes del PUT', async () => {
      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );
      await act(async () => {
        await result.current.handleSetResponseStyle('  brief  ');
      });
      expect(api.put).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          preferences: expect.objectContaining({ responseStyle: 'brief' }),
        }),
      );
    });

    it('sin usuario no llama al API', async () => {
      mockAuth.user = null;
      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );
      jest.clearAllMocks();
      await act(async () => {
        await result.current.handleSetResponseStyle('brief');
      });
      expect(api.put).not.toHaveBeenCalled();
    });

    it('no llama al API con clave inválida', async () => {
      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );
      jest.clearAllMocks();
      await act(async () => {
        await result.current.handleSetResponseStyle('no-existe');
      });
      expect(api.put).not.toHaveBeenCalled();
    });

    it('aplica usuario local tras PUT sin refreshSession', async () => {
      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );
      await act(async () => {
        await result.current.handleSetResponseStyle('brief');
      });
      expect(mockApplyLocalUser).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.objectContaining({ responseStyle: 'balanced' }),
        }),
      );
      expect(mockRefreshSession).not.toHaveBeenCalled();
    });
  });

  describe('handleSetCountryPreference', () => {
    it('envía PUT con country ISO y aplica usuario local', async () => {
      mockAuth.user = {
        id: '1',
        preferences: { regionCountry: 'AR', timezone: 'Etc/UTC' },
      };
      api.put.mockResolvedValueOnce({
        message: 'ok',
        user: {
          id: '1',
          preferences: { country: 'CL', regionCountry: 'AR' },
        },
      });

      const { result } = renderHook(() =>
        useSettingsScreen({ navigation: mockNavigation }),
      );

      await act(async () => {
        await result.current.handleSetCountryPreference('CL');
      });

      expect(api.put).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          preferences: expect.objectContaining({ country: 'CL' }),
        }),
      );
      expect(mockApplyLocalUser).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.objectContaining({ country: 'CL' }),
        }),
      );
      expect(mockRefreshSession).not.toHaveBeenCalled();
    });
  });
});
