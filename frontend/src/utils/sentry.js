/**
 * Sentry en cliente (#27 / Bloque C).
 * Solo se activa con EXPO_PUBLIC_SENTRY_DSN; no envía texto de mensajes de chat.
 */
import * as Sentry from '@sentry/react-native';

let initialized = false;

function scrubEvent(event) {
  if (!event) return event;
  const scrubKeys = ['message', 'content', 'password', 'token', 'authorization'];
  const scrubValue = (value) => {
    if (typeof value !== 'string') return value;
    if (value.length > 120) return '[redacted]';
    return value;
  };

  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (!crumb?.data || typeof crumb.data !== 'object') return crumb;
      const data = { ...crumb.data };
      for (const key of Object.keys(data)) {
        if (scrubKeys.some((k) => key.toLowerCase().includes(k))) {
          data[key] = '[redacted]';
        } else {
          data[key] = scrubValue(data[key]);
        }
      }
      return { ...crumb, data };
    });
  }

  if (event.extra && typeof event.extra === 'object') {
    const extra = { ...event.extra };
    for (const key of Object.keys(extra)) {
      if (scrubKeys.some((k) => key.toLowerCase().includes(k))) {
        extra[key] = '[redacted]';
      }
    }
    event.extra = extra;
  }

  return event;
}

export function isClientSentryEnabled() {
  return initialized;
}

export function initializeClientSentry() {
  if (initialized) return false;

  const dsn = String(process.env.EXPO_PUBLIC_SENTRY_DSN || '').trim();
  if (!dsn) return false;

  const forceDev = process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true';
  if (__DEV__ && !forceDev) return false;

  Sentry.init({
    dsn,
    enableInExpoDevelopment: forceDev,
    debug: __DEV__ && forceDev,
    tracesSampleRate: 0.1,
    beforeSend: scrubEvent,
  });

  initialized = true;
  return true;
}

export function captureBoundaryError(error, errorInfo) {
  if (!initialized || !error) return;
  Sentry.withScope((scope) => {
    scope.setTag('area', 'error_boundary');
    if (errorInfo?.componentStack) {
      scope.setContext('react', { componentStack: String(errorInfo.componentStack).slice(0, 2000) });
    }
    Sentry.captureException(error);
  });
}

/**
 * Errores críticos de chat (envío, parseo, navegación). Sin contenido del mensaje.
 */
export function captureChatError(error, context = {}) {
  if (!initialized || !error) return;
  Sentry.withScope((scope) => {
    scope.setTag('area', 'chat');
    scope.setContext('chat', {
      code: context.code ? String(context.code) : undefined,
      phase: context.phase ? String(context.phase) : undefined,
      guest: context.guest === true,
    });
    Sentry.captureException(error);
  });
}

export { Sentry };
