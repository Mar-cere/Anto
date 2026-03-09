/**
 * Tests unitarios para el hook useProfileScreen
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Animated: {
    Value: jest.fn().mockImplementation((initial) => ({ _value: initial })),
    timing: jest.fn().mockReturnValue({ start: jest.fn() }),
    sequence: jest.fn().mockImplementation((arr) => ({
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
    delete: jest.fn(),
  },
  ENDPOINTS: {
    EMERGENCY_CONTACTS: '/api/users/me/emergency-contacts',
    EMERGENCY_CONTACT_BY_ID: (id) => `/api/users/me/emergency-contacts/${id}`,
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
jest.mock('../../../styles/globalStyles', () => ({ colors: {} }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { api } from '../../../config/api';
import paymentService from '../../../services/paymentService';
import { useProfileScreen } from '../useProfileScreen';

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
    api.get.mockResolvedValue({ contacts: [] });
    api.delete.mockResolvedValue({});
    paymentService.getSubscriptionStatus.mockResolvedValue({ success: true });
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current).toMatchObject({
      loading: expect.any(Boolean),
      refreshing: expect.any(Boolean),
      userData: expect.any(Object),
      detailedStats: expect.any(Object),
      emergencyContacts: expect.any(Array),
      loadingContacts: expect.any(Boolean),
      subscriptionStatus: expect.anything(),
      showEmergencyContactsModal: expect.any(Boolean),
      showEditContactModal: expect.any(Boolean),
      selectedContact: null,
    });
    expect(typeof result.current.setShowEmergencyContactsModal).toBe('function');
    expect(typeof result.current.setShowEditContactModal).toBe('function');
    expect(typeof result.current.loadUserData).toBe('function');
    expect(typeof result.current.handleRefresh).toBe('function');
    expect(typeof result.current.handleDeleteContact).toBe('function');
    expect(typeof result.current.handleEmergencyContactsSaved).toBe('function');
    expect(typeof result.current.handleLogout).toBe('function');
    expect(typeof result.current.openEditContact).toBe('function');
    expect(typeof result.current.closeEditContact).toBe('function');
  });

  it('al montar debe cargar contactos y estado de suscripción', async () => {
    api.get.mockResolvedValue({ contacts: [{ id: '1', name: 'Contact' }] });
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(api.get).toHaveBeenCalledWith('/api/users/me/emergency-contacts');
    expect(paymentService.getSubscriptionStatus).toHaveBeenCalled();
    expect(result.current.emergencyContacts).toEqual([{ id: '1', name: 'Contact' }]);
    expect(result.current.subscriptionStatus).toMatchObject({ success: true });
    expect(result.current.loading).toBe(false);
  });

  it('loadUserData rellena userData y detailedStats desde AsyncStorage', async () => {
    const stored = {
      username: 'user',
      email: 'u@u.com',
      stats: {
        habitsStreak: 5,
        bestStreak: 10,
        tasksCompleted: 3,
        habitsActive: 2,
        habitsCompleted: 1,
        tasksThisWeek: 2,
        totalTasks: 10,
        totalHabits: 2,
      },
    };
    await AsyncStorage.setItem('userData', JSON.stringify(stored));
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.userData.username).toBe('user');
    expect(result.current.userData.email).toBe('u@u.com');
    expect(result.current.detailedStats.currentStreak).toBe(5);
    expect(result.current.detailedStats.bestStreak).toBe(10);
  });

  it('handleRefresh pone refreshing y vuelve a cargar datos', async () => {
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(api.get).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.handleRefresh();
    });
    expect(result.current.refreshing).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(result.current.refreshing).toBe(false);
  });

  it('handleDeleteContact muestra Alert y al confirmar elimina y recarga contactos', async () => {
    let confirmCallback;
    mockAlert.mockImplementation((title, msg, buttons) => {
      if (Array.isArray(buttons)) {
        const deleteBtn = buttons.find((b) => b.style === 'destructive');
        if (deleteBtn && deleteBtn.onPress) confirmCallback = deleteBtn.onPress;
      }
    });
    api.delete.mockResolvedValue({});
    api.get.mockResolvedValue({ contacts: [] });
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    act(() => {
      result.current.handleDeleteContact('contact-123');
    });
    expect(mockAlert).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Array)
    );
    expect(confirmCallback).toBeDefined();
    await act(async () => {
      await confirmCallback();
    });
    expect(api.delete).toHaveBeenCalledWith('/api/users/me/emergency-contacts/contact-123');
    expect(api.get).toHaveBeenCalledWith('/api/users/me/emergency-contacts');
    expect(mockAlert).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });

  it('handleLogout muestra Alert y al confirmar limpia storage y navega a SignIn', async () => {
    let logoutCallback;
    mockAlert.mockImplementation((title, msg, buttons) => {
      const logoutBtn = buttons.find((b) => b.style === 'destructive');
      if (logoutBtn && logoutBtn.onPress) logoutCallback = logoutBtn.onPress;
    });
    await AsyncStorage.setItem('userToken', 'token');
    await AsyncStorage.setItem('userData', '{}');
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    act(() => {
      result.current.handleLogout();
    });
    expect(mockAlert).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Array)
    );
    await act(async () => {
      await logoutCallback();
    });
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    expect(token).toBeNull();
    expect(userData).toBeNull();
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  });

  it('openEditContact y closeEditContact actualizan selectedContact y modal', async () => {
    const contact = { id: 'c1', name: 'Test' };
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.showEditContactModal).toBe(false);
    expect(result.current.selectedContact).toBeNull();
    act(() => {
      result.current.openEditContact(contact);
    });
    expect(result.current.selectedContact).toEqual(contact);
    expect(result.current.showEditContactModal).toBe(true);
    act(() => {
      result.current.closeEditContact();
    });
    expect(result.current.selectedContact).toBeNull();
    expect(result.current.showEditContactModal).toBe(false);
  });

  it('handleEmergencyContactsSaved recarga contactos', async () => {
    api.get.mockResolvedValue({ contacts: [{ id: '2' }] });
    const { result } = renderHook(() => useProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    const callCount = api.get.mock.calls.length;
    await act(async () => {
      result.current.handleEmergencyContactsSaved();
    });
    expect(api.get).toHaveBeenCalledTimes(callCount + 1);
    expect(api.get).toHaveBeenLastCalledWith('/api/users/me/emergency-contacts');
  });
});
