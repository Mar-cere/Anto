import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración de URL del API
// Prioridad: Variable de entorno > Detección automática > URL por defecto
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla (útil para diferentes entornos)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Detectar si estamos en simulador (solo para desarrollo local)
  const isSimulator = Platform.OS === 'ios' && Platform.isPad === undefined && !Platform.isTVOS;
  const isDevelopment = __DEV__; // Variable global de React Native/Expo
  
  // En desarrollo y simulador, usar localhost; en producción, usar Render
  if (isDevelopment && isSimulator) {
    return 'http://localhost:5001';
  }
  
  // URL de producción en Render
  return 'https://anto-ion2.onrender.com';
};

export const API_URL = getApiUrl();

// Solo loguear en desarrollo
if (__DEV__) {
  console.log('🌐 Usando API_URL:', API_URL);
  console.log('📱 Plataforma:', Platform.OS);
  console.log('🔧 Modo: development');
}

export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  HEALTH: '/health',
  
  // Users
  ME: '/api/users/me',
  PROFILE: '/api/users/me',
  UPDATE_PROFILE: '/api/users/me',
  
  // Tareas
  TASKS: '/api/tasks',
  TASKS_PENDING: '/api/tasks/pending',
  TASK_BY_ID: (id) => `/api/tasks/${id}`,
  
  // Hábitos
  HABITS: '/api/habits',
  HABITS_ACTIVE: '/api/habits/active',
  HABIT_BY_ID: (id) => `/api/habits/${id}`,
  HABIT_COMPLETE: (id) => `/api/habits/${id}/complete`,

  // Chat
  CHAT: '/api/chat',
  CHAT_MESSAGES: '/api/chat/messages',
  CHAT_CONVERSATIONS: '/api/chat/conversations',
  CHAT_CONVERSATION_BY_ID: (id) => `/api/chat/conversations/${id}`,
  CHAT_MESSAGE_STATUS: '/api/chat/messages/status',
  CHAT_SEARCH: '/api/chat/messages/search',
  
  // Emergency Contacts
  EMERGENCY_CONTACTS: '/api/users/me/emergency-contacts',
  EMERGENCY_CONTACT_BY_ID: (id) => `/api/users/me/emergency-contacts/${id}`,
  EMERGENCY_CONTACT_TOGGLE: (id) => `/api/users/me/emergency-contacts/${id}/toggle`,
  EMERGENCY_CONTACT_TEST: (id) => `/api/users/me/emergency-contacts/${id}/test`,
  EMERGENCY_CONTACT_TEST_WHATSAPP: (id) => `/api/users/me/emergency-contacts/${id}/test-whatsapp`,
  EMERGENCY_CONTACTS_TEST_ALERT: '/api/users/me/emergency-contacts/test-alert',
  
  // Crisis Metrics
  CRISIS_SUMMARY: '/api/crisis/summary',
  CRISIS_TRENDS: '/api/crisis/trends',
  CRISIS_BY_MONTH: '/api/crisis/by-month',
  CRISIS_HISTORY: '/api/crisis/history',
  CRISIS_ALERTS_STATS: '/api/crisis/alerts-stats',
  CRISIS_FOLLOWUP_STATS: '/api/crisis/followup-stats',
  CRISIS_EMOTION_DISTRIBUTION: '/api/crisis/emotion-distribution',
  
  // Push Notifications
  PUSH_TOKEN: '/api/notifications/push-token',
  // Testing (solo desarrollo)
  TEST_NOTIFICATION_WARNING: '/api/notifications/test/crisis-warning',
  TEST_NOTIFICATION_MEDIUM: '/api/notifications/test/crisis-medium',
  TEST_NOTIFICATION_FOLLOWUP: '/api/notifications/test/followup',
  
  // Emergency Alerts History
  EMERGENCY_ALERTS: '/api/users/me/emergency-alerts',
  EMERGENCY_ALERTS_STATS: '/api/users/me/emergency-alerts/stats',
  EMERGENCY_ALERTS_PATTERNS: '/api/users/me/emergency-alerts/patterns',
  
  // Metrics
  METRICS_SYSTEM: '/api/metrics/system',
  METRICS_HEALTH: '/api/metrics/health',
  METRICS_ME: '/api/metrics/me',
  METRICS_BY_TYPE: (type) => `/api/metrics/type/${type}`,
  
  // Therapeutic Techniques
  THERAPEUTIC_TECHNIQUES: '/api/therapeutic-techniques',
  THERAPEUTIC_TECHNIQUES_BY_EMOTION: (emotion) => `/api/therapeutic-techniques/emotion/${emotion}`,
  THERAPEUTIC_TECHNIQUES_USE: '/api/therapeutic-techniques/use',
  THERAPEUTIC_TECHNIQUES_HISTORY: '/api/therapeutic-techniques/history',
  
  // Payments & Subscriptions
  PAYMENT_PLANS: '/api/payments/plans',
  PAYMENT_CREATE_CHECKOUT: '/api/payments/create-checkout-session',
  PAYMENT_SUBSCRIPTION_STATUS: '/api/payments/subscription-status',
  PAYMENT_TRIAL_INFO: '/api/payments/trial-info',
  PAYMENT_CANCEL_SUBSCRIPTION: '/api/payments/cancel-subscription',
  PAYMENT_UPDATE_METHOD: '/api/payments/update-payment-method',
  PAYMENT_TRANSACTIONS: '/api/payments/transactions',
  PAYMENT_TRANSACTIONS_STATS: '/api/payments/transactions/stats',
  
  // Therapeutic Techniques Stats
  THERAPEUTIC_TECHNIQUES_STATS: '/api/therapeutic-techniques/stats',
};

// Timeout configurable según ambiente
const REQUEST_TIMEOUT = __DEV__ ? 30000 : 15000; // 30s en dev, 15s en prod

const makeRequest = (url, options) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = REQUEST_TIMEOUT;

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Error parsing response'));
        }
      } else {
        reject(new Error(xhr.statusText || 'Request failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));

    xhr.open(options.method, url);
    
    Object.keys(options.headers).forEach(key => {
      xhr.setRequestHeader(key, options.headers[key]);
    });

    xhr.send(options.body);
  });
};

// Función auxiliar para obtener headers con autorización
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  // Solo loguear en desarrollo
  if (__DEV__) {
    console.log('Token de autenticación:', token ? 'Presente' : 'No presente');
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// API helper functions
export const api = {
  post: async (endpoint, data) => {
    try {
      if (__DEV__) {
        console.log(`[API] POST ${endpoint}`);
      }
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { 
            message: `Error del servidor: ${response.status} - ${response.statusText}`,
            error: response.statusText
          };
        }
        const errorMessage = errorData.error || errorData.message || `Error del servidor: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      const responseData = await response.json();
      if (__DEV__) {
        console.log(`[API] POST ${endpoint} - Success`);
      }
      return responseData;
    } catch (error) {
      // Siempre loguear errores, pero sin datos sensibles
      console.error(`[API] POST ${endpoint} - Error:`, error.message);
      throw error;
    }
  },

  get: async (endpoint, params = {}) => {
    try {
      const headers = await getAuthHeaders();
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_URL}${endpoint}?${queryString}` : `${API_URL}${endpoint}`;
      
      if (__DEV__) {
        console.log(`[API] GET ${endpoint}`);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Error del servidor: ${response.status} - ${response.statusText}` };
        }
        console.error(`[API] GET ${endpoint} - Error:`, errorData.message || response.status);
        throw new Error(errorData.message || `Error del servidor: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (__DEV__) {
        console.log(`[API] GET ${endpoint} - Success`);
      }
      return data;
    } catch (error) {
      console.error(`[API] GET ${endpoint} - Error:`, error.message);
      throw error;
    }
  },

  put: async (endpoint, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { 
            message: `Error del servidor: ${response.status} - ${response.statusText}`,
            error: response.statusText
          };
        }
        const errorMessage = errorData.error || errorData.message || `Error del servidor: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`[API] PUT ${endpoint} - Error:`, error.message);
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { 
            message: `Error del servidor: ${response.status} - ${response.statusText}`,
            error: response.statusText
          };
        }
        const errorMessage = errorData.error || errorData.message || `Error del servidor: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`[API] DELETE ${endpoint} - Error:`, error.message);
      throw error;
    }
  },

  patch: async (endpoint, data) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { 
            message: `Error del servidor: ${response.status} - ${response.statusText}`,
            error: response.statusText
          };
        }
        const errorMessage = errorData.error || errorData.message || `Error del servidor: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`[API] PATCH ${endpoint} - Error:`, error.message);
      throw error;
    }
  }
};

export const checkServerConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Error verificando conexión:', error);
    return false;
  }
};

export const login = async (credentials) => {
  try {
    if (__DEV__) {
      console.log('[Auth] Iniciando login');
    }
    
    // Usar el helper api.post en lugar de fetch directamente
    const data = await api.post(ENDPOINTS.LOGIN, credentials);

    if (data.token && data.user) {
      // Guardar el token
      await AsyncStorage.setItem('userToken', data.token);
      
      // Guardar los datos del usuario completos
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      if (__DEV__) {
        console.log('[Auth] Login exitoso');
      }

      return {
        success: true,
        data: {
          token: data.token,
          user: data.user
        }
      };
    } else {
      throw new Error('Respuesta del servidor incompleta');
    }
  } catch (error) {
    console.error('[Auth] Error en login:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    return { success: true };
  } catch (error) {
    console.error('Error en logout:', error);
    return { success: false, error: error.message };
  }
};

// Función para verificar el estado de autenticación
export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    
    if (__DEV__) {
      console.log('[Auth] Verificando autenticación:', token ? 'Token presente' : 'Sin token');
    }
    
    if (token && userData) {
      return {
        isAuthenticated: true,
        user: JSON.parse(userData),
        token
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    console.error('[Auth] Error verificando autenticación:', error.message);
    return { isAuthenticated: false };
  }
};

// También sería útil tener una función para verificar los datos guardados
const checkStoredData = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userData = await AsyncStorage.getItem('userData');
    if (__DEV__) {
      console.log('[Auth] Datos almacenados:', { hasToken: !!token, hasUserData: !!userData });
    }
    return { token, userData };
  } catch (error) {
    console.error('[Auth] Error verificando datos almacenados:', error.message);
    return { token: null, userData: null };
  }
};

export default api;