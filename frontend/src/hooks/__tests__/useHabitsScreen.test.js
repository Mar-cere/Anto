/**
 * Tests unitarios para el hook useHabitsScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  StyleSheet: { create: (s) => s },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 1, Light: 0 },
  NotificationFeedbackType: { Success: 1, Warning: 2 },
}));

const mockNavigation = {
  navigate: jest.fn(),
  setParams: jest.fn(),
  reset: jest.fn(),
};
const mockRoute = { params: {} };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: { data: { habits: [] }, habits: [] } }),
    post: jest.fn().mockResolvedValue({ data: { _id: '1', title: 'Test' } }),
    patch: jest.fn().mockResolvedValue({ success: true, data: { _id: '1', status: {} } }),
    delete: jest.fn().mockResolvedValue({}),
  },
  ENDPOINTS: {
    HABITS: '/api/habits',
    HABIT_BY_ID: (id) => `/api/habits/${id}`,
  },
}));
jest.mock('../../constants/routes', () => ({ ROUTES: { SIGN_IN: 'SignIn' } }));
jest.mock('../useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isConnected: true, isInternetReachable: true }),
}));
jest.mock('../../utils/apiErrorHandler', () => ({
  getApiErrorMessage: (e) => e?.message || 'Error',
  isAuthError: () => false,
}));
jest.mock('../../utils/notifications', () => ({
  scheduleHabitNotification: jest.fn().mockResolvedValue(undefined),
  cancelHabitNotifications: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../screens/habits/habitsScreenConstants', () => ({
  FILTER_TYPES: { ACTIVE: 'active', ARCHIVED: 'archived' },
  getDefaultFormData: () => ({ title: '', description: '', icon: 'exercise', frequency: 'daily', reminder: '' }),
  SESSION_EXPIRED_DELAY: 100,
  TEXTS: {
    NO_TOKEN: 'No token',
    ERROR_LOAD: 'Error load',
    SESSION_EXPIRED: 'Session',
    SESSION_EXPIRED_MESSAGE: 'Message',
    ERROR_CREATE: 'Error',
    ERROR_CREATE_MESSAGE: 'Error create',
    ERROR_UPDATE: 'Error',
    ERROR_UPDATE_MESSAGE: 'Error update',
    ERROR_ARCHIVE: 'Error',
    ERROR_ARCHIVE_MESSAGE: 'Error archive',
    ERROR_DELETE: 'Error',
    ERROR_DELETE_MESSAGE: 'Error delete',
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve('token')),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useHabitsScreen } from '../useHabitsScreen';
import { api } from '../../config/api';

describe('useHabitsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = {};
    api.get.mockResolvedValue({ data: { data: { habits: [] }, habits: [] } });
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem.mockResolvedValue('token');
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useHabitsScreen({ route: mockRoute, navigation: mockNavigation }));
    await act(() => Promise.resolve()); // flush loadHabits
    expect(result.current).toMatchObject({
      habits: expect.any(Array),
      modalVisible: false,
      filterType: 'active',
      formData: expect.any(Object),
    });
    expect(typeof result.current.loadHabits).toBe('function');
    expect(typeof result.current.onRefresh).toBe('function');
    expect(typeof result.current.handleHabitPress).toBe('function');
    expect(typeof result.current.handleAddHabit).toBe('function');
    expect(typeof result.current.setFilterType).toBe('function');
    expect(typeof result.current.openModal).toBe('function');
  });

  it('loadHabits debe cargar hábitos desde api', async () => {
    const habits = [{ _id: '1', title: 'H1' }];
    api.get.mockResolvedValue({ data: { data: { habits }, habits } });
    const { result } = renderHook(() => useHabitsScreen({ route: mockRoute, navigation: mockNavigation }));
    await act(async () => {
      await result.current.loadHabits();
    });
    expect(result.current.loading).toBe(false);
    expect(api.get).toHaveBeenCalled();
    expect(result.current.habits).toEqual(habits);
  });

  it('openModal debe poner modalVisible en true y resetear formData', () => {
    const { result } = renderHook(() => useHabitsScreen({ route: mockRoute, navigation: mockNavigation }));
    expect(result.current.modalVisible).toBe(false);
    act(() => {
      result.current.openModal();
    });
    expect(result.current.modalVisible).toBe(true);
  });

  it('setFilterType debe actualizar el filtro', () => {
    const { result } = renderHook(() => useHabitsScreen({ route: mockRoute, navigation: mockNavigation }));
    expect(result.current.filterType).toBe('active');
    act(() => {
      result.current.setFilterType('archived');
    });
    expect(result.current.filterType).toBe('archived');
  });
});
