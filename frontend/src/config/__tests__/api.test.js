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
} from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ERROR_MESSAGES } from '../../utils/apiErrorHandler';

// Mock fetch global
global.fetch = jest.fn();

describe('api config', () => {
  beforeEach(() => {
    fetch.mockClear();
    AsyncStorage.clear();
  });

  describe('ENDPOINTS', () => {
    it('debe tener todos los endpoints definidos', () => {
      expect(ENDPOINTS.LOGIN).toBe('/api/auth/login');
      expect(ENDPOINTS.REGISTER).toBe('/api/auth/register');
      expect(ENDPOINTS.HEALTH).toBe('/health');
      expect(ENDPOINTS.ME).toBe('/api/users/me');
      expect(ENDPOINTS.TASKS).toBe('/api/tasks');
      expect(ENDPOINTS.HABITS).toBe('/api/habits');
    });

    it('debe generar endpoints dinámicos correctamente', () => {
      expect(ENDPOINTS.TASK_BY_ID('123')).toBe('/api/tasks/123');
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
});

