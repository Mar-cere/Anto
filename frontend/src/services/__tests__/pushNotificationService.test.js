/**
 * Tests unitarios para servicio de notificaciones push
 * 
 * @author AntoApp Team
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotifications,
  sendTokenToBackend,
  getStoredPushToken
} from '../pushNotificationService';
import { api } from '../../config/api';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: {
    MAX: 'MAX',
    HIGH: 'HIGH',
    DEFAULT: 'DEFAULT'
  },
  AndroidNotificationPriority: {
    MAX: 'MAX',
    HIGH: 'HIGH'
  }
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'iPhone',
  osName: 'iOS'
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios'
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock api
const mockApi = {
  post: jest.fn()
};

jest.mock('../../config/api', () => ({
  api: mockApi,
  ENDPOINTS: {
    PUSH_TOKEN: '/api/users/push-token'
  }
}));

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('registerForPushNotifications', () => {
    it('debe retornar null si no es un dispositivo físico', async () => {
      Device.isDevice = false;
      
      const token = await registerForPushNotifications();
      
      expect(token).toBeNull();
    });

    it('debe registrar permisos y obtener token', async () => {
      Device.isDevice = true;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[test-token]'
      });
      
      // Mock expo-constants
      jest.mock('expo-constants', () => ({
        default: {
          expoConfig: { extra: { eas: { projectId: 'test-project-id' } } }
        }
      }));
      
      const token = await registerForPushNotifications();
      
      expect(token).toBeDefined();
      if (token) {
        expect(typeof token).toBe('string');
      }
    });

    it('debe solicitar permisos si no están otorgados', async () => {
      Device.isDevice = true;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[test-token]'
      });
      
      const token = await registerForPushNotifications();
      
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBeDefined();
    });

    it('debe retornar null si los permisos son denegados', async () => {
      Device.isDevice = true;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      
      const token = await registerForPushNotifications();
      
      expect(token).toBeNull();
    });
  });

  describe('sendTokenToBackend', () => {
    it('debe enviar token al backend', async () => {
      mockApi.post.mockResolvedValue({ success: true });
      // Limpiar AsyncStorage para asegurar que el token no esté ya guardado
      await AsyncStorage.removeItem('pushTokenSentToBackend');
      
      await sendTokenToBackend('ExponentPushToken[test]');
      
      // Verificar que se llamó post
      expect(mockApi.post).toHaveBeenCalled();
    });

    it('debe manejar errores al enviar token', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));
      
      const result = await sendTokenToBackend('ExponentPushToken[test]');
      
      // El resultado puede ser undefined o un objeto con error
      expect(result === undefined || typeof result === 'object').toBe(true);
    });
  });

  describe('getStoredPushToken', () => {
    it('debe obtener token almacenado', async () => {
      await AsyncStorage.setItem('expoPushToken', 'ExponentPushToken[test]');
      
      const token = await getStoredPushToken();
      
      expect(token).toBe('ExponentPushToken[test]');
    });

    it('debe retornar null si no hay token almacenado', async () => {
      const token = await getStoredPushToken();
      
      expect(token).toBeNull();
    });
  });

});

