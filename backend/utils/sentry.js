/**
 * Configuración de Sentry para Error Tracking
 * 
 * Proporciona integración con Sentry para monitoreo de errores en producción.
 * Solo se inicializa si SENTRY_DSN está configurado.
 * 
 * @author AntoApp Team
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from './logger.js';

let isInitialized = false;

/**
 * Inicializar Sentry si está configurado
 * 
 * @param {Object} app - Aplicación Express (opcional, para integración)
 */
export const initializeSentry = (app = null) => {
  // Solo inicializar en producción o si está explícitamente habilitado
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_SENTRY !== 'true') {
    logger.debug('Sentry deshabilitado (no es producción)');
    return;
  }
  
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.debug('Sentry no configurado (SENTRY_DSN no está definido)');
    return;
  }
  
  try {
    const integrations = [
      Sentry.httpIntegration({ tracing: true }),
    ];
    
    // Agregar integración de Express si la app está disponible
    if (app) {
      integrations.push(Sentry.expressIntegration({ app }));
    }
    
    // Agregar profiling si está disponible
    try {
      integrations.push(nodeProfilingIntegration());
    } catch (err) {
      logger.debug('Profiling no disponible:', err.message);
    }
    
    Sentry.init({
      dsn: dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations,
      beforeSend(event, hint) {
        // Filtrar información sensible
        if (event.request) {
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
            delete event.request.headers['x-api-key'];
          }
          if (event.request.data) {
            // Sanitizar datos sensibles
            event.request.data = sanitizeSensitiveData(event.request.data);
          }
        }
        
        // Sanitizar contexto de usuario
        if (event.user) {
          event.user = {
            id: event.user.id,
            username: event.user.username,
            // No incluir email u otros datos sensibles
          };
        }
        
        return event;
      },
      beforeSendTransaction(event) {
        // Filtrar transacciones sensibles
        if (event.request?.url?.includes('/api/auth')) {
          // No rastrear transacciones de autenticación
          return null;
        }
        return event;
      },
    });
    
    isInitialized = true;
    logger.info('✅ Sentry inicializado correctamente');
  } catch (error) {
    logger.warn('Error inicializando Sentry:', error.message);
  }
};

/**
 * Capturar excepción en Sentry
 * 
 * @param {Error} error - Error a capturar
 * @param {Object} context - Contexto adicional
 */
export const captureException = (error, context = {}) => {
  if (!isInitialized) {
    return;
  }
  
  try {
    Sentry.captureException(error, {
      extra: sanitizeSensitiveData(context),
    });
  } catch (err) {
    logger.warn('Error capturando excepción en Sentry:', err.message);
  }
};

/**
 * Capturar mensaje en Sentry
 * 
 * @param {string} message - Mensaje a capturar
 * @param {string} level - Nivel del mensaje (info, warning, error)
 * @param {Object} context - Contexto adicional
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!isInitialized) {
    return;
  }
  
  try {
    Sentry.captureMessage(message, {
      level,
      extra: sanitizeSensitiveData(context),
    });
  } catch (err) {
    logger.warn('Error capturando mensaje en Sentry:', err.message);
  }
};

/**
 * Agregar contexto de usuario a Sentry
 * 
 * @param {Object} user - Información del usuario
 */
export const setUser = (user) => {
  if (!isInitialized) {
    return;
  }
  
  try {
    Sentry.setUser({
      id: user._id?.toString() || user.id?.toString(),
      username: user.username,
      // No incluir email u otros datos sensibles por defecto
    });
  } catch (err) {
    logger.warn('Error estableciendo usuario en Sentry:', err.message);
  }
};

/**
 * Limpiar contexto de usuario de Sentry
 */
export const clearUser = () => {
  if (!isInitialized) {
    return;
  }
  
  try {
    Sentry.setUser(null);
  } catch (err) {
    logger.warn('Error limpiando usuario en Sentry:', err.message);
  }
};

/**
 * Agregar contexto adicional a Sentry
 * 
 * @param {string} key - Clave del contexto
 * @param {Object} value - Valor del contexto
 */
export const setContext = (key, value) => {
  if (!isInitialized) {
    return;
  }
  
  try {
    Sentry.setContext(key, sanitizeSensitiveData(value));
  } catch (err) {
    logger.warn('Error estableciendo contexto en Sentry:', err.message);
  }
};

/**
 * Agregar breadcrumb (rastro de navegación) a Sentry
 * 
 * @param {Object} breadcrumb - Breadcrumb a agregar
 */
export const addBreadcrumb = (breadcrumb) => {
  if (!isInitialized) {
    return;
  }
  
  try {
    Sentry.addBreadcrumb({
      ...breadcrumb,
      data: breadcrumb.data ? sanitizeSensitiveData(breadcrumb.data) : undefined,
    });
  } catch (err) {
    logger.warn('Error agregando breadcrumb en Sentry:', err.message);
  }
};

/**
 * Sanitizar datos sensibles antes de enviar a Sentry
 * 
 * @param {Object} data - Datos a sanitizar
 * @returns {Object} Datos sanitizados
 */
const sanitizeSensitiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'auth',
    'accessToken',
    'refreshToken',
    'jwt',
    'creditCard',
    'cvv',
    'ssn',
  ];
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }
  
  return sanitized;
};

export default {
  initializeSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  setContext,
  addBreadcrumb,
  isInitialized: () => isInitialized,
};
