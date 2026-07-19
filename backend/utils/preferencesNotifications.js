/**
 * preferences.notifications pasó de boolean a objeto
 * ({ enabled, emailEnabled, pushEnabled, scheduledSessions }).
 * Normaliza entradas legacy y unifica lecturas.
 */

function asPlainObject(value) {
  // Boolean legacy: conservar enabled para no perder opt-out en merges parciales.
  if (typeof value === 'boolean') {
    return { enabled: value };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  return { ...value };
}

/**
 * @param {unknown} value
 * @param {unknown} [previous]
 * @returns {object|undefined}
 */
export function normalizePreferencesNotifications(value, previous = {}) {
  if (value === undefined) {
    return undefined;
  }

  const prev = asPlainObject(previous);

  if (typeof value === 'boolean') {
    return {
      ...prev,
      enabled: value,
    };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      ...prev,
      ...asPlainObject(value),
    };
  }

  // null / tipos inválidos: conservar estado previo normalizado
  return prev;
}

/**
 * @param {unknown} notifications - boolean legacy u objeto actual
 * @returns {boolean}
 */
export function isPreferencesNotificationsEnabled(notifications) {
  if (notifications === false) return false;
  if (notifications === true || notifications == null) return true;
  if (typeof notifications === 'object') {
    return notifications.enabled !== false;
  }
  return true;
}
