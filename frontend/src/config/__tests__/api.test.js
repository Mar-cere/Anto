/**
 * Tests unitarios para configuración de API
 * 
 * @author AntoApp Team
 */

import { ENDPOINTS, checkServerConnection, API_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
});

