import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_STORAGE_KEYS,
  ACCESS_TOKEN_REFRESH_BUFFER_MS,
  clearAuthSession,
  ensureValidAccessToken,
  getAccessTokenExpiryMs,
  isAccessTokenStale,
  isTokenExpiredError,
  notifySessionInvalidated,
  refreshAccessToken,
  registerOnSessionInvalidated,
} from '../authTokenRefresh';

global.fetch = jest.fn();

function makeJwt({ exp }) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${header}.${payload}.test-signature`;
}

describe('authTokenRefresh', () => {
  beforeEach(() => {
    fetch.mockReset();
    AsyncStorage.clear();
  });

  describe('getAccessTokenExpiryMs / isAccessTokenStale', () => {
    it('lee exp del JWT', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJwt({ exp });
      expect(getAccessTokenExpiryMs(token)).toBe(exp * 1000);
    });

    it('marca token como stale si expira dentro del buffer', () => {
      const exp = Math.floor((Date.now() + 30 * 60 * 1000) / 1000);
      const token = makeJwt({ exp });
      expect(isAccessTokenStale(token, ACCESS_TOKEN_REFRESH_BUFFER_MS)).toBe(true);
    });

    it('no marca token vigente como stale', () => {
      const exp = Math.floor((Date.now() + 2 * ACCESS_TOKEN_REFRESH_BUFFER_MS) / 1000);
      const token = makeJwt({ exp });
      expect(isAccessTokenStale(token, ACCESS_TOKEN_REFRESH_BUFFER_MS)).toBe(false);
    });
  });

  describe('ensureValidAccessToken', () => {
    it('renueva proactivamente si el access token está por expirar', async () => {
      const exp = Math.floor((Date.now() + 10 * 60 * 1000) / 1000);
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_TOKEN, makeJwt({ exp }));
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'fresh-access' }),
      });

      const ok = await ensureValidAccessToken();

      expect(ok).toBe(true);
      expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER_TOKEN)).toBe('fresh-access');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('no llama refresh si el token sigue vigente', async () => {
      const exp = Math.floor((Date.now() + 3 * ACCESS_TOKEN_REFRESH_BUFFER_MS) / 1000);
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_TOKEN, makeJwt({ exp }));
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');

      const ok = await ensureValidAccessToken();

      expect(ok).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('isTokenExpiredError', () => {
    it('detecta 401', () => {
      expect(isTokenExpiredError({ response: { status: 401 } })).toBe(true);
    });

    it('detecta mensaje Token expirado', () => {
      expect(isTokenExpiredError(new Error('Token expirado'))).toBe(true);
    });

    it('detecta mensajes de refresh fallido del backend', () => {
      expect(isTokenExpiredError(new Error('Token inválido o expirado'))).toBe(true);
      expect(isTokenExpiredError(new Error('Invalid or expired token'))).toBe(true);
    });

    it('no reintenta cuando falta token en la petición', () => {
      expect(isTokenExpiredError(new Error('Token no proporcionado'))).toBe(false);
    });

    it('no trata 403 como token expirado', () => {
      expect(isTokenExpiredError({ response: { status: 403 }, message: 'Forbidden' })).toBe(false);
    });

    it('ignora otros errores', () => {
      expect(isTokenExpiredError(new Error('Network request failed'))).toBe(false);
    });
  });

  describe('registerOnSessionInvalidated', () => {
    it('notifica al handler registrado', () => {
      const handler = jest.fn();
      registerOnSessionInvalidated(handler);
      notifySessionInvalidated();
      expect(handler).toHaveBeenCalledTimes(1);
      registerOnSessionInvalidated(null);
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

    it('serializa refreshes concurrentes en una sola petición', async () => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');
      fetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ accessToken: 'new-access' }),
                }),
              20,
            );
          }),
      );

      const [first, second] = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
      ]);

      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
