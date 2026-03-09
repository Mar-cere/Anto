/**
 * Tests unitarios para el hook useEditProfileScreen
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Animated: {
    Value: jest.fn().mockImplementation((initial) => ({ _value: initial })),
    timing: jest.fn().mockReturnValue({ start: jest.fn() }),
  },
}));

jest.mock('../../../config/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
  ENDPOINTS: { ME: '/api/users/me', UPDATE_PROFILE: '/api/users/me' },
}));
jest.mock('../../../constants/routes', () => ({ ROUTES: { SIGN_IN: 'SignIn' } }));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'Success' },
}));

jest.mock('../../../styles/globalStyles', () => ({ colors: {} }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { api } from '../../../config/api';
import { useEditProfileScreen } from '../useEditProfileScreen';

const mockAlert = Alert.alert;

const mockReplace = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
const mockNavigation = {
  replace: mockReplace,
  goBack: jest.fn(),
  addListener: mockAddListener,
  dispatch: jest.fn(),
};

describe('useEditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    AsyncStorage.clear();
    AsyncStorage.setItem('userToken', 'fake-token');
    api.get.mockResolvedValue({
      data: { name: 'Test', username: 'testuser', email: 'test@test.com' },
    });
    api.put.mockResolvedValue({
      data: { name: 'Test', username: 'testuser', email: 'test@test.com' },
    });
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useEditProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current).toMatchObject({
      loading: expect.any(Boolean),
      editing: expect.any(Boolean),
      saving: expect.any(Boolean),
      saveSuccess: expect.any(Boolean),
      hasChanges: expect.any(Boolean),
      formData: expect.any(Object),
      errors: expect.any(Object),
      fadeAnim: expect.anything(),
      navigation: mockNavigation,
    });
    expect(typeof result.current.setEditing).toBe('function');
    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleFormChange).toBe('function');
  });

  it('al montar debe cargar datos del usuario si hay token', async () => {
    const { result } = renderHook(() => useEditProfileScreen(mockNavigation));
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(api.get).toHaveBeenCalledWith('/api/users/me');
    expect(result.current.loading).toBe(false);
    expect(result.current.formData).toMatchObject({
      name: 'Test',
      username: 'testuser',
      email: 'test@test.com',
    });
  });

  it('sin token debe mostrar alert y navegar a SignIn', async () => {
    await AsyncStorage.removeItem('userToken');
    const { result } = renderHook(() => useEditProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(mockAlert).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('SignIn');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('handleFormChange actualiza formData y marca hasChanges', async () => {
    const { result } = renderHook(() => useEditProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.hasChanges).toBe(false);
    act(() => {
      result.current.handleFormChange('name', 'New Name');
    });
    expect(result.current.formData.name).toBe('New Name');
    expect(result.current.hasChanges).toBe(true);
  });

  it('handleSave con datos válidos llama api.put y actualiza estado', async () => {
    const { result } = renderHook(() => useEditProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    act(() => {
      result.current.handleFormChange('name', 'Valid Name');
      result.current.handleFormChange('email', 'valid@email.com');
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(api.put).toHaveBeenCalledWith('/api/users/me', {
      name: 'Valid Name',
      email: 'valid@email.com',
    });
    expect(mockAlert).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Array)
    );
    expect(result.current.saveSuccess).toBe(true);
  });

  it('registra listener beforeRemove cuando hay hasChanges', async () => {
    const { result } = renderHook(() => useEditProfileScreen(mockNavigation));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(mockAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
  });
});
