/**
 * Cliente API para gestión de sesiones programadas (#15).
 * Permite crear, listar, actualizar, eliminar, pausar y reanudar
 * recordatorios de sesiones terapéuticas en horarios fijos.
 */
import { api, ENDPOINTS } from '../config/api';

// Límites de configuración
const LIMITS = {
  MIN_LABEL_LENGTH: 1,
  MAX_LABEL_LENGTH: 50,
  MIN_DAY_OF_WEEK: 0,
  MAX_DAY_OF_WEEK: 6,
  MIN_PAUSE_DAYS: 1,
  MAX_PAUSE_DAYS: 90,
};

// Pattern para validar formato de hora HH:mm (24h)
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Sanitiza texto removiendo caracteres problemáticos.
 * @private
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[\r\n\t]+/g, ' ') // Remover saltos de línea y tabs
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[<>{}]/g, '') // Remover caracteres problemáticos
    .trim();
}

/**
 * Sanitiza una sesión antes de enviarla al backend.
 * Protege contra datos inválidos y asegura conformidad con el schema.
 * @private
 * @throws {Error} Si el input es inválido
 */
function sanitizeSessionInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid session input: must be an object');
  }

  // Validar dayOfWeek (requerido para creación)
  if (input.dayOfWeek !== undefined) {
    const dayOfWeek = Number(input.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < LIMITS.MIN_DAY_OF_WEEK || dayOfWeek > LIMITS.MAX_DAY_OF_WEEK) {
      throw new Error(`dayOfWeek must be an integer between ${LIMITS.MIN_DAY_OF_WEEK} and ${LIMITS.MAX_DAY_OF_WEEK}`);
    }
  }

  // Validar time (requerido para creación)
  if (input.time !== undefined) {
    const time = String(input.time).trim();
    if (!TIME_PATTERN.test(time)) {
      throw new Error('time must be in HH:mm format (24-hour)');
    }
  }

  const sanitized = {};

  if (input.dayOfWeek !== undefined) {
    sanitized.dayOfWeek = Number(input.dayOfWeek);
  }

  if (input.time !== undefined) {
    sanitized.time = String(input.time).trim();
  }

  // Validar y añadir label si presente
  if (input.label !== undefined && input.label !== null) {
    const label = sanitizeText(String(input.label));
    if (label.length > 0) {
      if (label.length > LIMITS.MAX_LABEL_LENGTH) {
        throw new Error(`Label cannot exceed ${LIMITS.MAX_LABEL_LENGTH} characters`);
      }
      sanitized.label = label.slice(0, LIMITS.MAX_LABEL_LENGTH);
    }
  }

  // Validar y añadir isActive si presente
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') {
      throw new Error('isActive must be a boolean');
    }
    sanitized.isActive = input.isActive;
  }

  // Validar y añadir notificationId si presente
  if (input.notificationId !== undefined && input.notificationId !== null) {
    sanitized.notificationId = String(input.notificationId).trim();
  }

  return sanitized;
}

/**
 * Sanitiza una sesión recibida del backend.
 * @private
 * @returns {Object|null} Sesión sanitizada o null si inválida
 */
function sanitizeSessionOutput(session) {
  if (!session || typeof session !== 'object') return null;

  // Validar que tenga al menos id, dayOfWeek, time
  if (!session.id || session.dayOfWeek === undefined || !session.time) return null;

  return {
    id: String(session.id),
    dayOfWeek: Number(session.dayOfWeek),
    time: String(session.time).trim(),
    isActive: Boolean(session.isActive !== false),
    label: session.label ? sanitizeText(String(session.label)).slice(0, LIMITS.MAX_LABEL_LENGTH) : null,
    notificationId: session.notificationId ? String(session.notificationId) : null,
    isPausedGlobally: Boolean(session.isPausedGlobally),
    createdAt: session.createdAt ? new Date(session.createdAt) : null,
    updatedAt: session.updatedAt ? new Date(session.updatedAt) : null,
  };
}

/**
 * Obtiene todas las sesiones programadas del usuario autenticado.
 * 
 * @returns {Promise<Array>} Lista de sesiones sanitizadas
 * @throws {Error} Si hay error de red o autenticación
 * 
 * @example
 * const sessions = await fetchScheduledSessions();
 * console.log(sessions); // [{ id: '...', dayOfWeek: 1, time: '10:00', ... }]
 */
export async function fetchScheduledSessions() {
  try {
    const response = await api.get(ENDPOINTS.SCHEDULED_SESSIONS);

    // Validar respuesta
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid API response format');
    }

    const sessions = response.data || [];
    
    if (!Array.isArray(sessions)) {
      console.warn('[fetchScheduledSessions] API returned non-array data:', sessions);
      return [];
    }

    // Sanitizar y filtrar sesiones inválidas
    return sessions
      .map(sanitizeSessionOutput)
      .filter((session) => session !== null);
  } catch (error) {
    console.error('[fetchScheduledSessions] Error fetching sessions:', error);
    throw error;
  }
}

/**
 * Crea una nueva sesión programada.
 * 
 * @param {Object} sessionData - Datos de la sesión
 * @param {number} sessionData.dayOfWeek - Día de la semana (0-6, domingo-sábado)
 * @param {string} sessionData.time - Hora en formato HH:mm (24h)
 * @param {string} [sessionData.label] - Etiqueta opcional (max 50 chars)
 * @returns {Promise<Object>} Sesión creada sanitizada
 * @throws {Error} Si hay error de validación, red o autenticación
 * 
 * @example
 * const session = await createScheduledSession({
 *   dayOfWeek: 1, // Lunes
 *   time: '10:00',
 *   label: 'Sesión mañana'
 * });
 */
export async function createScheduledSession(sessionData) {
  try {
    const sanitized = sanitizeSessionInput(sessionData);

    // Validar que tenga dayOfWeek y time (requeridos para creación)
    if (sanitized.dayOfWeek === undefined) {
      throw new Error('dayOfWeek is required');
    }
    if (!sanitized.time) {
      throw new Error('time is required');
    }

    const response = await api.post(ENDPOINTS.SCHEDULED_SESSIONS, sanitized);

    // Validar respuesta
    if (!response || typeof response !== 'object' || !response.data) {
      throw new Error('Invalid API response format');
    }

    const session = sanitizeSessionOutput(response.data);
    if (!session) {
      throw new Error('Invalid session data received from API');
    }

    return session;
  } catch (error) {
    console.error('[createScheduledSession] Error creating session:', error);
    throw error;
  }
}

/**
 * Actualiza una sesión programada existente.
 * 
 * @param {string} sessionId - ID de la sesión a actualizar
 * @param {Object} updates - Campos a actualizar
 * @param {number} [updates.dayOfWeek] - Día de la semana (0-6)
 * @param {string} [updates.time] - Hora en formato HH:mm
 * @param {boolean} [updates.isActive] - Estado activo/inactivo
 * @param {string} [updates.label] - Etiqueta
 * @returns {Promise<Object>} Sesión actualizada sanitizada
 * @throws {Error} Si hay error de validación, red o autenticación
 * 
 * @example
 * const updated = await updateScheduledSession('session-id-123', {
 *   time: '11:00',
 *   label: 'Nueva etiqueta'
 * });
 */
export async function updateScheduledSession(sessionId, updates) {
  try {
    // Validar sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error('Invalid sessionId');
    }

    const sanitized = sanitizeSessionInput(updates);

    // Validar que tenga al menos un campo
    if (Object.keys(sanitized).length === 0) {
      throw new Error('At least one field must be updated');
    }

    const response = await api.put(ENDPOINTS.SCHEDULED_SESSION_BY_ID(sessionId.trim()), sanitized);

    // Validar respuesta
    if (!response || typeof response !== 'object' || !response.data) {
      throw new Error('Invalid API response format');
    }

    const session = sanitizeSessionOutput(response.data);
    if (!session) {
      throw new Error('Invalid session data received from API');
    }

    return session;
  } catch (error) {
    console.error('[updateScheduledSession] Error updating session:', error);
    throw error;
  }
}

/**
 * Elimina una sesión programada.
 * 
 * @param {string} sessionId - ID de la sesión a eliminar
 * @param {boolean} [hardDelete=false] - Si true, elimina permanentemente. Si false, marca como inactiva.
 * @returns {Promise<Object>} Sesión eliminada
 * @throws {Error} Si hay error de validación, red o autenticación
 * 
 * @example
 * await deleteScheduledSession('session-id-123'); // Soft delete
 * await deleteScheduledSession('session-id-123', true); // Hard delete
 */
export async function deleteScheduledSession(sessionId, hardDelete = false) {
  try {
    // Validar sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error('Invalid sessionId');
    }

    // Validar hardDelete
    if (typeof hardDelete !== 'boolean') {
      hardDelete = false;
    }

    const params = hardDelete ? { hard: 'true' } : {};
    const response = await api.delete(ENDPOINTS.SCHEDULED_SESSION_BY_ID(sessionId.trim()), { params });

    // Validar respuesta
    if (!response || typeof response !== 'object' || !response.data) {
      throw new Error('Invalid API response format');
    }

    return sanitizeSessionOutput(response.data);
  } catch (error) {
    console.error('[deleteScheduledSession] Error deleting session:', error);
    throw error;
  }
}

/**
 * Pausa todas las sesiones programadas por N días.
 * 
 * @param {number} pauseDays - Días de pausa (1-90)
 * @returns {Promise<Object>} Estado de pausa { pausedUntil, pauseDays }
 * @throws {Error} Si hay error de validación, red o autenticación
 * 
 * @example
 * const result = await pauseAllSessions(7);
 * console.log(result); // { pausedUntil: Date, pauseDays: 7 }
 */
export async function pauseAllSessions(pauseDays) {
  try {
    // Validar pauseDays
    const numPauseDays = Number(pauseDays);
    if (!Number.isInteger(numPauseDays) || numPauseDays < LIMITS.MIN_PAUSE_DAYS || numPauseDays > LIMITS.MAX_PAUSE_DAYS) {
      throw new Error(`pauseDays must be an integer between ${LIMITS.MIN_PAUSE_DAYS} and ${LIMITS.MAX_PAUSE_DAYS}`);
    }

    const response = await api.post(`${ENDPOINTS.SCHEDULED_SESSIONS}/pause`, { pauseDays: numPauseDays });

    // Validar respuesta
    if (!response || typeof response !== 'object' || !response.data) {
      throw new Error('Invalid API response format');
    }

    return {
      pausedUntil: response.data.pausedUntil ? new Date(response.data.pausedUntil) : null,
      pauseDays: Number(response.data.pauseDays),
    };
  } catch (error) {
    console.error('[pauseAllSessions] Error pausing sessions:', error);
    throw error;
  }
}

/**
 * Reanuda todas las sesiones programadas (remueve pausa global).
 * 
 * @returns {Promise<Object>} Estado de reanudación { resumed: true, wasAlreadyResumed: boolean }
 * @throws {Error} Si hay error de red o autenticación
 * 
 * @example
 * const result = await resumeAllSessions();
 * console.log(result); // { resumed: true, wasAlreadyResumed: false }
 */
export async function resumeAllSessions() {
  try {
    const response = await api.post(`${ENDPOINTS.SCHEDULED_SESSIONS}/resume`);

    // Validar respuesta
    if (!response || typeof response !== 'object' || !response.data) {
      throw new Error('Invalid API response format');
    }

    return {
      resumed: Boolean(response.data.resumed),
      wasAlreadyResumed: Boolean(response.data.wasAlreadyResumed),
    };
  } catch (error) {
    console.error('[resumeAllSessions] Error resuming sessions:', error);
    throw error;
  }
}
