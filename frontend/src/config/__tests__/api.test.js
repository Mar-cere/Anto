/**
 * Tests unitarios para configuración de API
 * 
 * @author AntoApp Team
 */

import {
  ENDPOINTS,
  checkServerConnection,
  API_URL,
  handleApiError,
  getApiErrorMessage,
  api,
} from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ERROR_MESSAGES } from '../../utils/apiErrorHandler';
import { AUTH_STORAGE_KEYS } from '../../utils/authTokenRefresh';

// Mock fetch global
global.fetch = jest.fn();

const jsonResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  text: async () => JSON.stringify(data),
  json: async () => data,
});

const errorResponse = (status, message) => ({
  ok: false,
  status,
  json: async () => ({ message }),
});

describe('api config', () => {
  beforeEach(() => {
    fetch.mockClear();
    AsyncStorage.clear();
  });

  describe('ENDPOINTS', () => {
    it('debe tener todos los endpoints definidos', () => {
      expect(ENDPOINTS.LOGIN).toBe('/api/auth/login');
      expect(ENDPOINTS.REFRESH).toBe('/api/auth/refresh');
      expect(ENDPOINTS.REGISTER).toBe('/api/auth/register');
      expect(ENDPOINTS.HEALTH).toBe('/health');
      expect(ENDPOINTS.ME).toBe('/api/users/me');
      expect(ENDPOINTS.TASKS).toBe('/api/tasks');
      expect(ENDPOINTS.HABITS).toBe('/api/habits');
    });

    it('debe generar endpoints dinámicos correctamente', () => {
      expect(ENDPOINTS.TASK_BY_ID('123')).toBe('/api/tasks/123');
      expect(ENDPOINTS.TASK_SUBTASKS_GENERATE('123')).toBe('/api/tasks/123/subtasks/generate');
      expect(ENDPOINTS.HABIT_BY_ID('456')).toBe('/api/habits/456');
      expect(ENDPOINTS.EMERGENCY_CONTACT_BY_ID('789')).toBe('/api/users/me/emergency-contacts/789');
    });
  });

  describe('API_URL', () => {
    it('debe estar definida', () => {
      expect(API_URL).toBeDefined();
      expect(typeof API_URL).toBe('string');
    });
  });

  describe('checkServerConnection', () => {
    it('debe retornar true cuando el servidor responde correctamente', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      });

      const result = await checkServerConnection();
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/health'));
    });

    it('debe retornar false cuando el servidor no responde', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkServerConnection();
      
      expect(result).toBe(false);
    });

    it('debe retornar false cuando el servidor responde con error', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'error' })
      });

      const result = await checkServerConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('handleApiError / getApiErrorMessage', () => {
    it('handleApiError debe ser función que devuelve string', () => {
      expect(typeof handleApiError).toBe('function');
      const msg = handleApiError(new Error('Network request failed'));
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
    it('debe devolver mensaje de red para error sin response', () => {
      const err = new Error('Network request failed');
      expect(handleApiError(err)).toBe(API_ERROR_MESSAGES.NETWORK);
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.NETWORK);
    });
    it('debe devolver mensaje del servidor cuando response.data.message existe', () => {
      const err = new Error('Bad request');
      err.response = { status: 400, data: { message: 'El email ya está en uso' } };
      expect(handleApiError(err)).toBe('El email ya está en uso');
    });
    it('getApiErrorMessage con isOffline debe devolver mensaje de red', () => {
      const err = new Error('Any');
      expect(getApiErrorMessage(err, { isOffline: true })).toBe(API_ERROR_MESSAGES.NETWORK);
    });
  });

  describe('refresh automático en peticiones autenticadas', () => {
    it('reintenta GET tras renovar token cuando expiró', async () => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_TOKEN, 'expired-access');
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');

      fetch
        .mockResolvedValueOnce(errorResponse(401, 'Token expirado'))
        .mockResolvedValueOnce(
          jsonResponse({ accessToken: 'new-access', user: { _id: 'u1' } }),
        )
        .mockResolvedValueOnce(jsonResponse({ _id: 'u1', email: 'a@b.com' }));

      const me = await api.get(ENDPOINTS.ME);

      expect(me).toEqual({ _id: 'u1', email: 'a@b.com' });
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_TOKEN)).toBe('new-access');
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(String(fetch.mock.calls[1][0])).toContain('/api/auth/refresh');
    });

    it('limpia sesión si el refresh falla', async () => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_TOKEN, 'expired-access');
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, '{"_id":"u1"}');
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'expired-refresh');

      fetch
        .mockResolvedValueOnce(errorResponse(401, 'Token expirado'))
        .mockResolvedValueOnce(errorResponse(401, 'Token inválido o expirado'));

      await expect(api.get(ENDPOINTS.TASKS)).rejects.toThrow('Token expirado');
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_TOKEN)).toBeNull();
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    });
  });
});

