/**
 * Cliente API y auth (tipado).
 * Contratos con el backend: ver src/types/api.types.ts
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearPersistedChatSession } from '../utils/chatSessionStorage';
import { Platform } from 'react-native';
import type {
  User,
  LoginCredentials,
  LoginResultType,
  CheckAuthResult,
  ApiError,
  ApiGetResponse,
} from '../types/api.types';
import {
  getApiErrorMessage,
  isNetworkError,
  isAuthError,
  isRateLimitError,
  isServerError,
  API_ERROR_MESSAGES,
  HTTP_STATUS,
} from '../utils/apiErrorHandler';

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const isSimulator =
    Platform.OS === 'ios' &&
    (Platform as { isPad?: boolean }).isPad === undefined &&
    !(Platform as { isTVOS?: boolean }).isTVOS;
  const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;
  if (isDevelopment && isSimulator) {
    return 'http://localhost:5001';
  }
  return 'https://anto-ion2.onrender.com';
};

export const API_URL = getApiUrl();

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('🌐 Usando API_URL:', API_URL);
  console.log('📱 Plataforma:', Platform.OS);
  console.log('🔧 Modo: development');
}

/** Endpoints del API (paths). Funciones para rutas con :id reciben string. */
export const ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION_CODE: '/api/auth/resend-verification-code',
  HEALTH: '/health',
  ME: '/api/users/me',
  PROFILE: '/api/users/me',
  UPDATE_PROFILE: '/api/users/me',
  ONBOARDING_PREFERENCES: '/api/users/me/onboarding-preferences',
  TASKS: '/api/tasks',
  TASKS_PENDING: '/api/tasks/pending',
  TASK_BY_ID: (id: string) => `/api/tasks/${id}`,
  HABITS: '/api/habits',
  HABITS_ACTIVE: '/api/habits/active',
  HABIT_BY_ID: (id: string) => `/api/habits/${id}`,
  HABIT_COMPLETE: (id: string) => `/api/habits/${id}/complete`,
  JOURNALS: '/api/journals',
  JOURNAL_BY_ID: (id: string) => `/api/journals/${id}`,
  JOURNALS_STATS: '/api/journals/stats',
  JOURNAL_ARCHIVE: (id: string) => `/api/journals/${id}/archive`,
  CHAT: '/api/chat',
  CHAT_MESSAGES: '/api/chat/messages',
  CHAT_CONVERSATIONS: '/api/chat/conversations',
  CHAT_CONVERSATION_BY_ID: (id: string) => `/api/chat/conversations/${id}`,
  CHAT_MESSAGE_STATUS: '/api/chat/messages/status',
  CHAT_MESSAGE_FEEDBACK: (messageId: string) => `/api/chat/messages/${messageId}/feedback`,
  CHAT_SEARCH: '/api/chat/messages/search',
  EMERGENCY_CONTACTS: '/api/users/me/emergency-contacts',
  EMERGENCY_CONTACT_BY_ID: (id: string) => `/api/users/me/emergency-contacts/${id}`,
  EMERGENCY_CONTACT_TOGGLE: (id: string) => `/api/users/me/emergency-contacts/${id}/toggle`,
  EMERGENCY_CONTACT_TEST: (id: string) => `/api/users/me/emergency-contacts/${id}/test`,
  EMERGENCY_CONTACT_TEST_WHATSAPP: (id: string) =>
    `/api/users/me/emergency-contacts/${id}/test-whatsapp`,
  EMERGENCY_CONTACTS_TEST_ALERT: '/api/users/me/emergency-contacts/test-alert',
  CRISIS_SUMMARY: '/api/crisis/summary',
  CRISIS_TRENDS: '/api/crisis/trends',
  CRISIS_BY_MONTH: '/api/crisis/by-month',
  CRISIS_HISTORY: '/api/crisis/history',
  CRISIS_ALERTS_STATS: '/api/crisis/alerts-stats',
  CRISIS_FOLLOWUP_STATS: '/api/crisis/followup-stats',
  CRISIS_EMOTION_DISTRIBUTION: '/api/crisis/emotion-distribution',
  PUSH_TOKEN: '/api/notifications/push-token',
  TEST_NOTIFICATION_WARNING: '/api/notifications/test/crisis-warning',
  TEST_NOTIFICATION_MEDIUM: '/api/notifications/test/crisis-medium',
  TEST_NOTIFICATION_FOLLOWUP: '/api/notifications/test/followup',
  EMERGENCY_ALERTS: '/api/users/me/emergency-alerts',
  EMERGENCY_ALERTS_STATS: '/api/users/me/emergency-alerts/stats',
  EMERGENCY_ALERTS_PATTERNS: '/api/users/me/emergency-alerts/patterns',
  METRICS_SYSTEM: '/api/metrics/system',
  METRICS_HEALTH: '/api/metrics/health',
  METRICS_ME: '/api/metrics/me',
  METRICS_BY_TYPE: (type: string) => `/api/metrics/type/${type}`,
  THERAPEUTIC_TECHNIQUES: '/api/therapeutic-techniques',
  THERAPEUTIC_TECHNIQUES_BY_EMOTION: (emotion: string) =>
    `/api/therapeutic-techniques/emotion/${emotion}`,
  THERAPEUTIC_TECHNIQUES_USE: '/api/therapeutic-techniques/use',
  THERAPEUTIC_TECHNIQUES_HISTORY: '/api/therapeutic-techniques/history',
  PAYMENT_PLANS: '/api/payments/plans',
  PAYMENT_CREATE_CHECKOUT: '/api/payments/create-checkout-session',
  PAYMENT_SUBSCRIPTION_STATUS: '/api/payments/subscription-status',
  PAYMENT_TRIAL_INFO: '/api/payments/trial-info',
  PAYMENT_CANCEL_SUBSCRIPTION: '/api/payments/cancel-subscription',
  PAYMENT_UPDATE_METHOD: '/api/payments/update-payment-method',
  PAYMENT_TRANSACTIONS: '/api/payments/transactions',
  PAYMENT_TRANSACTIONS_STATS: '/api/payments/transactions/stats',
  PAYMENT_VALIDATE_RECEIPT: '/api/payments/validate-receipt',
  THERAPEUTIC_TECHNIQUES_STATS: '/api/therapeutic-techniques/stats',
} as const;

const REQUEST_TIMEOUT = typeof __DEV__ !== 'undefined' && __DEV__ ? 30000 : 15000;

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('userToken');
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('Token de autenticación:', token ? 'Presente' : 'No presente');
  }
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok && response.status !== 304) {
    let errorData: { message?: string; error?: string };
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: `Error del servidor: ${response.status} - ${response.statusText}`,
      };
    }
    const errorMessage =
      errorData.error ||
      errorData.message ||
      `Error del servidor: ${response.status}`;
    const err = new Error(errorMessage) as ApiError;
    err.response = { status: response.status, data: errorData };
    if (typeof console !== 'undefined') {
      console.error(`[API] ${endpoint} - Error:`, errorMessage);
    }
    throw err;
  }
  if (response.status === 304) {
    return { notModified: true } as T;
  }
  return response.json() as Promise<T>;
}

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    let errorData: { message?: string; error?: string };
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: `Error del servidor: ${response.status} - ${response.statusText}`,
      };
    }
    const errorMessage =
      errorData.error ||
      errorData.message ||
      `Error del servidor: ${response.status}`;
    const err = new Error(errorMessage) as ApiError;
    err.response = { status: response.status, data: errorData };
    console.error(`[API] ${endpoint} - Error:`, errorMessage);
    throw err;
  }
  return response.json() as Promise<T>;
}

export const api = {
  post: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[API] POST ${endpoint}`);
      }
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      const responseData = await parseJsonResponse<T>(response, endpoint);
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[API] POST ${endpoint} - Success`);
      }
      return responseData;
    } catch (error) {
      console.error(`[API] POST ${endpoint} - Error:`, (error as Error).message);
      throw error;
    }
  },

  get: async <T = unknown>(endpoint: string, params: Record<string, string> = {}): Promise<ApiGetResponse<T>> => {
    try {
      const headers = await getAuthHeaders();
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_URL}${endpoint}?${queryString}` : `${API_URL}${endpoint}`;
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[API] GET ${endpoint}`);
      }
      const response = await fetch(url, { method: 'GET', headers });
      const data = await handleResponse<ApiGetResponse<T>>(response, endpoint);
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[API] GET ${endpoint} - Success`);
      }
      return data;
    } catch (error) {
      console.error(`[API] GET ${endpoint} - Error:`, (error as Error).message);
      throw error;
    }
  },

  put: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return parseJsonResponse<T>(response, endpoint);
    } catch (error) {
      console.error(`[API] PUT ${endpoint} - Error:`, (error as Error).message);
      throw error;
    }
  },

  delete: async <T = unknown>(endpoint: string): Promise<T> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      return parseJsonResponse<T>(response, endpoint);
    } catch (error) {
      console.error(`[API] DELETE ${endpoint} - Error:`, (error as Error).message);
      throw error;
    }
  },

  patch: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      return parseJsonResponse<T>(response, endpoint);
    } catch (error) {
      console.error(`[API] PATCH ${endpoint} - Error:`, (error as Error).message);
      throw error;
    }
  },
};

export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return (data as { status?: string }).status === 'ok';
  } catch (error) {
    console.error('Error verificando conexión:', error);
    return false;
  }
};

export const login = async (credentials: LoginCredentials): Promise<LoginResultType> => {
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[Auth] Iniciando login');
    }
    const data = await api.post<{ token?: string; accessToken?: string; user: User }>(
      ENDPOINTS.LOGIN,
      credentials
    );
    const token = data.token ?? data.accessToken;
    if (token && data.user) {
      await clearPersistedChatSession();
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[Auth] Login exitoso');
      }
      return {
        success: true as const,
        data: { token, user: data.user },
      };
    }
    throw new Error('Respuesta del servidor incompleta');
  } catch (error) {
    console.error('[Auth] Error en login:', (error as Error).message);
    return {
      success: false as const,
      error: (error as Error).message,
    };
  }
};

export const logout = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await clearPersistedChatSession();
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    return { success: true };
  } catch (error) {
    console.error('Error en logout:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const checkAuthStatus = async (): Promise<CheckAuthResult> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[Auth] Verificando autenticación:', token ? 'Token presente' : 'Sin token');
    }
    if (token && userData) {
      return {
        isAuthenticated: true,
        user: JSON.parse(userData) as User,
        token,
      };
    }
    return { isAuthenticated: false };
  } catch (error) {
    console.error('[Auth] Error verificando autenticación:', (error as Error).message);
    return { isAuthenticated: false };
  }
};

export { getApiErrorMessage as handleApiError } from '../utils/apiErrorHandler';
export {
  getApiErrorMessage,
  isNetworkError,
  isAuthError,
  isRateLimitError,
  isServerError,
  API_ERROR_MESSAGES,
  HTTP_STATUS,
} from '../utils/apiErrorHandler';

export default api;
