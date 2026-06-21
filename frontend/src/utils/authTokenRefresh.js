import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAppLanguage } from './appLanguage';
import { HTTP_STATUS } from './apiErrorHandler';

const REFRESH_ENDPOINT = '/api/auth/refresh';

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const isSimulator =
    Platform.OS === 'ios' &&
    Platform.isPad === undefined &&
    !Platform.isTVOS;
  const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;
  if (isDevelopment && isSimulator) {
    return 'http://localhost:5001';
  }
  return 'https://anto-ion2.onrender.com';
};

export const AUTH_STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  REFRESH_TOKEN: 'refreshToken',
};

let refreshPromise = null;
let onSessionInvalidated = null;

export function registerOnSessionInvalidated(handler) {
  onSessionInvalidated = typeof handler === 'function' ? handler : null;
}

export function notifySessionInvalidated() {
  onSessionInvalidated?.();
}

const TOKEN_EXPIRED_MARKERS = [
  'token expirado',
  'token inválido',
  'token invalid',
  'invalid or expired token',
  'token inválido o expirado',
];

const TOKEN_MISSING_MARKERS = ['token no proporcionado', 'not authenticated'];

export function isTokenExpiredError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (TOKEN_MISSING_MARKERS.some((marker) => message.includes(marker))) {
    return false;
  }
  if (TOKEN_EXPIRED_MARKERS.some((marker) => message.includes(marker))) {
    return true;
  }
  const status = error?.response?.status;
  return status === HTTP_STATUS.UNAUTHORIZED;
}

export async function clearAuthSession() {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.USER_TOKEN),
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.USER_DATA),
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
  ]);
}

async function persistRefreshedSession(accessToken, user) {
  const writes = [[AUTH_STORAGE_KEYS.USER_TOKEN, accessToken]];
  if (user) {
    writes.push([AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(user)]);
  }
  await Promise.all(writes.map(([key, value]) => AsyncStorage.setItem(key, value)));
}

async function requestRefreshToken(refreshToken) {
  const appLanguage = await getAppLanguage();
  const response = await fetch(`${getApiUrl()}${REFRESH_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-App-Language': appLanguage,
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Renueva el access token usando refreshToken en AsyncStorage.
 * Serializa llamadas concurrentes para evitar múltiples refresh en paralelo.
 * @returns {Promise<boolean>} true si se renovó la sesión
 */
export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return false;
    }

    const data = await requestRefreshToken(refreshToken);
    const accessToken = data?.accessToken || data?.token;
    if (!accessToken) {
      return false;
    }

    await persistRefreshedSession(accessToken, data?.user);
    return true;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
