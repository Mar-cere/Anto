/**
 * Sentry en cliente (#27 / Bloque C).
 * Solo se activa con EXPO_PUBLIC_SENTRY_DSN; no envía texto de mensajes de chat.
 */
import * as Sentry from '@sentry/react-native';

let initialized = false;

const SCRUB_KEYS = ['message', 'content', 'password', 'token', 'authorization', 'bearer'];
const SKIP_CHAT_CAPTURE_CODES = new Set([
  'ABORTED',
  'ABORTERROR',
  'NETWORK_ERROR',
  'ECONNREFUSED',
  'RATE_LIMIT',
  'MESSAGE_IN_FLIGHT',
  'STREAM_INCOMPLETE',
  'ETIMEDOUT',
  'TIMEOUT',
  'GUEST_SESSION_INVALID',
  'GUEST_LIMIT_REACHED',
  'GUEST_CONTENT_TOO_LONG',
  'SUBSCRIPTION_REQUIRED',
  'UNAUTHORIZED',
  'NO_AUTH',
]);

function scrubString(value) {
  if (typeof value !== 'string') return value;
  if (value.length > 120) return '[redacted]';
  return value;
}

export function scrubSentryEvent(event) {
  if (!event) return event;

  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (!crumb?.data || typeof crumb.data !== 'object') return crumb;
      const data = { ...crumb.data };
      for (const key of Object.keys(data)) {
        if (SCRUB_KEYS.some((k) => key.toLowerCase().includes(k))) {
          data[key] = '[redacted]';
        } else {
          data[key] = scrubString(data[key]);
        }
      }
      return { ...crumb, data };
    });
  }

  if (event.extra && typeof event.extra === 'object') {
    const extra = { ...event.extra };
    for (const key of Object.keys(extra)) {
      if (SCRUB_KEYS.some((k) => key.toLowerCase().includes(k))) {
        extra[key] = '[redacted]';
      }
    }
    event.extra = extra;
  }

  if (Array.isArray(event.exception?.values)) {
    event.exception.values = event.exception.values.map((ex) => ({
      ...ex,
      value: scrubString(ex?.value),
    }));
  }

  return event;
}

function isValidSentryDsn(dsn) {
  return /^https:\/\/[a-z0-9]+@/i.test(dsn);
}

export function isClientSentryEnabled() {
  return initialized;
}

export function initializeClientSentry() {
  if (initialized) return false;

  const dsn = String(process.env.EXPO_PUBLIC_SENTRY_DSN || '').trim();
  if (!dsn || !isValidSentryDsn(dsn)) return false;

  const forceDev = process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true';
  if (__DEV__ && !forceDev) return false;

  Sentry.init({
    dsn,
    enableInExpoDevelopment: forceDev,
    debug: __DEV__ && forceDev,
    tracesSampleRate: 0.1,
    beforeSend: scrubSentryEvent,
  });

  initialized = true;
  return true;
}

function buildSafeCaptureError(error, fallbackCode) {
  const code = fallbackCode || (error instanceof Error ? error.name : 'ClientError');
  return new Error(String(code).slice(0, 64) || 'ClientError');
}

export function captureBoundaryError(error, errorInfo) {
  if (!initialized || !error) return;
  Sentry.withScope((scope) => {
    scope.setTag('area', 'error_boundary');
    if (errorInfo?.componentStack) {
      scope.setContext('react', { componentStack: String(errorInfo.componentStack).slice(0, 2000) });
    }
    Sentry.captureException(buildSafeCaptureError(error, 'ErrorBoundary'));
  });
}

/**
 * Errores críticos de chat (envío, parseo, navegación). Sin contenido del mensaje.
 */
export function captureChatError(error, context = {}) {
  if (!initialized || !error) return;

  const code = context.code ? String(context.code).trim().toUpperCase() : '';
  if (code && SKIP_CHAT_CAPTURE_CODES.has(code)) return;

  Sentry.withScope((scope) => {
    scope.setTag('area', 'chat');
    scope.setContext('chat', {
      code: code || undefined,
      phase: context.phase ? String(context.phase).slice(0, 64) : undefined,
      guest: context.guest === true,
    });
    Sentry.captureException(buildSafeCaptureError(error, code || 'ChatError'));
  });
}

export { Sentry };
