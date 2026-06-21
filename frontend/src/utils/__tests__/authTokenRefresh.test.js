import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_STORAGE_KEYS,
  clearAuthSession,
  isTokenExpiredError,
  refreshAccessToken,
} from '../authTokenRefresh';

global.fetch = jest.fn();

describe('authTokenRefresh', () => {
  beforeEach(() => {
    fetch.mockReset();
    AsyncStorage.clear();
  });

  describe('isTokenExpiredError', () => {
    it('detecta 401', () => {
      expect(isTokenExpiredError({ response: { status: 401 } })).toBe(true);
    });

    it('detecta mensaje Token expirado', () => {
      expect(isTokenExpiredError(new Error('Token expirado'))).toBe(true);
    });

    it('ignora otros errores', () => {
      expect(isTokenExpiredError(new Error('Network request failed'))).toBe(false);
    });
  });

  describe('clearAuthSession', () => {
    it('elimina token, userData y refreshToken', async () => {
      await AsyncStorage.multiSet([
        [AUTH_STORAGE_KEYS.USER_TOKEN, 'old'],
        [AUTH_STORAGE_KEYS.USER_DATA, '{}'],
        [AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'refresh'],
      ]);

      await clearAuthSession();

      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_TOKEN)).toBeNull();
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA)).toBeNull();
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('renueva access token y actualiza userData', async () => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-access',
          user: { _id: 'u1', email: 'a@b.com' },
        }),
      });

      const ok = await refreshAccessToken();

      expect(ok).toBe(true);
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_TOKEN)).toBe('new-access');
      expect(JSON.parse(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA))).toEqual({
        _id: 'u1',
        email: 'a@b.com',
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('devuelve false si no hay refreshToken', async () => {
      expect(await refreshAccessToken()).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('devuelve false si el servidor rechaza el refresh', async () => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'expired');
      fetch.mockResolvedValueOnce({ ok: false, status: 401 });

      expect(await refreshAccessToken()).toBe(false);
    });
  });
});
