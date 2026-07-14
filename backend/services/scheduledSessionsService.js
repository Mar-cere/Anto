/**
 * Servicio de sesiones programadas (#15): lógica de negocio para gestionar
 * recordatorios configurables tipo "tu espacio con Anto" en horarios fijos.
 */
import crypto from 'crypto';
import User from '../models/User.js';

const MAX_TOTAL_SESSIONS = 10;
const MAX_ACTIVE_SESSIONS = 7;
const MAX_PAUSE_DAYS = 90;

/**
 * Obtener todas las sesiones programadas del usuario.
 * @param {string|ObjectId} userId - ID del usuario
 * @returns {Array} Array de sesiones programadas
 */
export async function getScheduledSessions(userId) {
  // Validar userId
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'object')) {
    throw new Error('Invalid userId');
  }

  const user = await User.findById(userId).select('preferences.notifications.scheduledSessions').lean();
  
  if (!user?.preferences?.notifications?.scheduledSessions) {
    return [];
  }

  const { sessions = [], pausedUntil } = user.preferences.notifications.scheduledSessions;
  
  // Validar que sessions sea array
  if (!Array.isArray(sessions)) {
    console.warn(`[getScheduledSessions] sessions is not an array for user ${userId}`);
    return [];
  }
  
  // Filtrar sesiones activas si están pausadas globalmente
  const now = new Date();
  const isPaused = Boolean(pausedUntil && new Date(pausedUntil) > now);
  
  return sessions.map((session) => ({
    ...session,
    isPausedGlobally: isPaused,
  }));
}

/**
 * Obtener una sesión específica por ID.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {string} sessionId - ID de la sesión
 * @returns {Object|null} Sesión encontrada o null
 */
export async function getSessionById(userId, sessionId) {
  const sessions = await getScheduledSessions(userId);
  return sessions.find((s) => s.id === sessionId) || null;
}

/**
 * Crear una nueva sesión programada.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {Object} payload - { dayOfWeek, time, label? }
 * @returns {Object} Sesión creada
 * @throws {Error} Si se alcanzó el límite o ya existe una sesión para ese día/hora
 */
export async function createSession(userId, payload) {
  // Validar userId
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'object')) {
    const error = new Error('Invalid userId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar payload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const error = new Error('Invalid payload');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  const { dayOfWeek, time, label } = payload;

  // Validar dayOfWeek (ya validado por Joi, pero reforzamos aquí)
  if (typeof dayOfWeek !== 'number' || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    const error = new Error('Invalid dayOfWeek');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar time (ya validado por Joi, pero reforzamos aquí)
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim())) {
    const error = new Error('Invalid time format');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // Inicializar subdocumento si no existe
  if (!user.preferences.notifications.scheduledSessions) {
    user.preferences.notifications.scheduledSessions = {
      enabled: true,
      sessions: [],
      lastNotificationAt: null,
      pausedUntil: null,
    };
  }

  const { sessions } = user.preferences.notifications.scheduledSessions;

  // Validar que sessions sea array
  if (!Array.isArray(sessions)) {
    const error = new Error('Sessions data corrupted');
    error.code = 'DATA_CORRUPTED';
    throw error;
  }

  // Validar límite total de sesiones
  if (sessions.length >= MAX_TOTAL_SESSIONS) {
    const error = new Error('Maximum number of scheduled sessions reached');
    error.code = 'LIMIT_REACHED';
    throw error;
  }

  // Validar límite de sesiones activas
  const activeSessions = sessions.filter((s) => s && s.isActive === true);
  if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
    const error = new Error('Maximum number of active sessions reached');
    error.code = 'ACTIVE_LIMIT_REACHED';
    throw error;
  }

  // Validar que no exista una sesión para ese día/hora
  const trimmedTime = time.trim();
  const duplicate = sessions.find((s) => s && s.dayOfWeek === dayOfWeek && s.time === trimmedTime);
  if (duplicate) {
    const error = new Error('A session is already scheduled for this day and time');
    error.code = 'DUPLICATE_TIME';
    throw error;
  }

  // Crear nueva sesión
  const newSession = {
    id: crypto.randomBytes(16).toString('hex'),
    dayOfWeek,
    time: trimmedTime,
    isActive: true,
    label: label && typeof label === 'string' ? label.trim() : null,
    notificationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  sessions.push(newSession);
  user.markModified('preferences.notifications.scheduledSessions');
  
  try {
    await user.save();
  } catch (err) {
    console.error('[createSession] Error saving user:', err);
    const error = new Error('Failed to save session');
    error.code = 'SAVE_ERROR';
    error.details = err.message;
    throw error;
  }

  return newSession;
}

/**
 * Actualizar una sesión existente.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {string} sessionId - ID de la sesión
 * @param {Object} updates - { dayOfWeek?, time?, isActive?, label?, notificationId? }
 * @returns {Object} Sesión actualizada
 * @throws {Error} Si la sesión no existe o hay un duplicado
 */
export async function updateSession(userId, sessionId, updates) {
  // Validar userId
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'object')) {
    const error = new Error('Invalid userId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar sessionId
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    const error = new Error('Invalid sessionId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar updates
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    const error = new Error('Invalid updates');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const sessions = user.preferences.notifications.scheduledSessions?.sessions || [];

  // Validar que sessions sea array
  if (!Array.isArray(sessions)) {
    const error = new Error('Sessions data corrupted');
    error.code = 'DATA_CORRUPTED';
    throw error;
  }

  const sessionIndex = sessions.findIndex((s) => s && s.id === sessionId.trim());

  if (sessionIndex === -1) {
    const error = new Error('Session not found');
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  const session = sessions[sessionIndex];

  // Si se actualiza dayOfWeek, validar tipo
  if (updates.dayOfWeek !== undefined) {
    if (typeof updates.dayOfWeek !== 'number' || !Number.isInteger(updates.dayOfWeek) || updates.dayOfWeek < 0 || updates.dayOfWeek > 6) {
      const error = new Error('Invalid dayOfWeek');
      error.code = 'INVALID_INPUT';
      throw error;
    }
  }

  // Si se actualiza time, validar formato
  if (updates.time !== undefined) {
    if (typeof updates.time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(updates.time.trim())) {
      const error = new Error('Invalid time format');
      error.code = 'INVALID_INPUT';
      throw error;
    }
  }

  // Si se actualiza dayOfWeek o time, validar duplicados
  const newDayOfWeek = updates.dayOfWeek !== undefined ? updates.dayOfWeek : session.dayOfWeek;
  const newTime = updates.time !== undefined ? updates.time.trim() : session.time;

  if (updates.dayOfWeek !== undefined || updates.time !== undefined) {
    const duplicate = sessions.find(
      (s, idx) => idx !== sessionIndex && s && s.dayOfWeek === newDayOfWeek && s.time === newTime
    );
    if (duplicate) {
      const error = new Error('A session is already scheduled for this day and time');
      error.code = 'DUPLICATE_TIME';
      throw error;
    }
  }

  // Si se activa una sesión, validar límite de activas
  if (updates.isActive === true && !session.isActive) {
    const activeSessions = sessions.filter((s, idx) => idx !== sessionIndex && s && s.isActive === true);
    if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
      const error = new Error('Maximum number of active sessions reached');
      error.code = 'ACTIVE_LIMIT_REACHED';
      throw error;
    }
  }

  // Aplicar actualizaciones
  if (updates.dayOfWeek !== undefined) session.dayOfWeek = updates.dayOfWeek;
  if (updates.time !== undefined) session.time = updates.time.trim();
  if (updates.isActive !== undefined) {
    if (typeof updates.isActive !== 'boolean') {
      const error = new Error('Invalid isActive value');
      error.code = 'INVALID_INPUT';
      throw error;
    }
    session.isActive = updates.isActive;
  }
  if (updates.label !== undefined) {
    session.label = updates.label && typeof updates.label === 'string' ? updates.label.trim() : null;
  }
  if (updates.notificationId !== undefined) {
    session.notificationId = updates.notificationId && typeof updates.notificationId === 'string' ? updates.notificationId.trim() : null;
  }
  session.updatedAt = new Date();

  user.markModified('preferences.notifications.scheduledSessions');
  
  try {
    await user.save();
  } catch (err) {
    console.error('[updateSession] Error saving user:', err);
    const error = new Error('Failed to update session');
    error.code = 'SAVE_ERROR';
    error.details = err.message;
    throw error;
  }

  return session;
}

/**
 * Eliminar una sesión (soft delete: isActive=false, o hard delete).
 * @param {string|ObjectId} userId - ID del usuario
 * @param {string} sessionId - ID de la sesión
 * @param {boolean} hardDelete - Si true, elimina permanentemente. Si false, marca como inactiva.
 * @returns {Object} Sesión eliminada
 * @throws {Error} Si la sesión no existe
 */
export async function deleteSession(userId, sessionId, hardDelete = false) {
  // Validar userId
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'object')) {
    const error = new Error('Invalid userId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar sessionId
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    const error = new Error('Invalid sessionId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar hardDelete
  if (typeof hardDelete !== 'boolean') {
    hardDelete = false;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const sessions = user.preferences.notifications.scheduledSessions?.sessions || [];

  // Validar que sessions sea array
  if (!Array.isArray(sessions)) {
    const error = new Error('Sessions data corrupted');
    error.code = 'DATA_CORRUPTED';
    throw error;
  }

  const sessionIndex = sessions.findIndex((s) => s && s.id === sessionId.trim());

  if (sessionIndex === -1) {
    const error = new Error('Session not found');
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  const session = sessions[sessionIndex];

  if (hardDelete) {
    // Hard delete: remover del array
    sessions.splice(sessionIndex, 1);
  } else {
    // Soft delete: marcar como inactiva
    session.isActive = false;
    session.updatedAt = new Date();
  }

  user.markModified('preferences.notifications.scheduledSessions');
  
  try {
    await user.save();
  } catch (err) {
    console.error('[deleteSession] Error saving user:', err);
    const error = new Error('Failed to delete session');
    error.code = 'SAVE_ERROR';
    error.details = err.message;
    throw error;
  }

  return session;
}

/**
 * Pausar todas las sesiones por N días.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {number} pauseDays - Días de pausa (1-90)
 * @returns {Object} Estado actualizado { pausedUntil }
 * @throws {Error} Si pauseDays es inválido
 */
export async function pauseAllSessions(userId, pauseDays) {
  // Validar userId
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'object')) {
    const error = new Error('Invalid userId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  // Validar pauseDays (tipo, NaN, Infinity, rango)
  if (typeof pauseDays !== 'number' || isNaN(pauseDays) || !isFinite(pauseDays)) {
    const error = new Error('pauseDays must be a valid number');
    error.code = 'INVALID_PAUSE_DAYS';
    throw error;
  }

  // Normalizar a entero y validar rango
  const normalizedPauseDays = Math.floor(pauseDays);
  if (normalizedPauseDays < 1 || normalizedPauseDays > MAX_PAUSE_DAYS) {
    const error = new Error(`pauseDays must be between 1 and ${MAX_PAUSE_DAYS}`);
    error.code = 'INVALID_PAUSE_DAYS';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // Inicializar subdocumento si no existe
  if (!user.preferences.notifications.scheduledSessions) {
    user.preferences.notifications.scheduledSessions = {
      enabled: true,
      sessions: [],
      lastNotificationAt: null,
      pausedUntil: null,
    };
  }

  const pausedUntil = new Date();
  pausedUntil.setDate(pausedUntil.getDate() + normalizedPauseDays);

  user.preferences.notifications.scheduledSessions.pausedUntil = pausedUntil;
  user.markModified('preferences.notifications.scheduledSessions');
  
  try {
    await user.save();
  } catch (err) {
    console.error('[pauseAllSessions] Error saving user:', err);
    const error = new Error('Failed to pause sessions');
    error.code = 'SAVE_ERROR';
    error.details = err.message;
    throw error;
  }

  return {
    pausedUntil,
    pauseDays: normalizedPauseDays,
  };
}

/**
 * Reanudar sesiones (remover pausa global).
 * @param {string|ObjectId} userId - ID del usuario
 * @returns {Object} Estado actualizado { resumed: true }
 */
export async function resumeAllSessions(userId) {
  // Validar userId
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'object')) {
    const error = new Error('Invalid userId');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (!user.preferences.notifications.scheduledSessions) {
    // No hay nada que reanudar
    return { resumed: true, wasAlreadyResumed: true };
  }

  const wasAlreadyResumed = !user.preferences.notifications.scheduledSessions.pausedUntil;

  user.preferences.notifications.scheduledSessions.pausedUntil = null;
  user.markModified('preferences.notifications.scheduledSessions');
  
  try {
    await user.save();
  } catch (err) {
    console.error('[resumeAllSessions] Error saving user:', err);
    const error = new Error('Failed to resume sessions');
    error.code = 'SAVE_ERROR';
    error.details = err.message;
    throw error;
  }

  return {
    resumed: true,
    wasAlreadyResumed,
  };
}
