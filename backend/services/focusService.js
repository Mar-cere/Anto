/**
 * Servicio de focos de acompañamiento (#2): lógica de ciclo de vida,
 * cálculo de semana actual, progreso y transiciones.
 */
import User from '../models/User.js';
import { FOCUS_THEMES, FOCUS_THEMES_ARRAY, FOCUS_STATUS, getFocusTheme, isValidFocusTheme } from '../constants/focusThemes.js';

const CUSTOM_GOAL_MAX_LEN = 200;

/**
 * Normaliza customGoal persistido (trim, sin control chars ni <>{}, tope 200).
 * @param {unknown} value
 * @returns {string|null|undefined} undefined si no vino en el payload
 */
export function normalizePersistedCustomGoal(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const cleaned = String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, CUSTOM_GOAL_MAX_LEN);
}

/**
 * Calcular número de semana actual basado en startedAt y duración.
 * @param {Date} startedAt - Fecha de inicio del foco
 * @param {number} durationWeeks - Duración total en semanas
 * @returns {number} Número de semana (1-indexed, máximo durationWeeks)
 */
function calculateCurrentWeek(startedAt, durationWeeks) {
  if (!startedAt) return 1;
  
  const now = new Date();
  const start = new Date(startedAt);
  
  // Blindar: si la fecha de inicio es futura, devolver semana 1
  if (start > now) return 1;
  
  const elapsed = now - start;
  const elapsedWeeks = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000));
  const weekNumber = Math.min(Math.max(1, elapsedWeeks + 1), durationWeeks);
  return weekNumber;
}

/**
 * Calcular porcentaje de progreso (0-100).
 */
function calculateProgress(weekNumber, durationWeeks) {
  if (durationWeeks <= 0) return 0;
  return Math.min(100, Math.round((weekNumber / durationWeeks) * 100));
}

/**
 * Obtener todos los temas disponibles con copy localizado.
 * @param {string} language - 'es' o 'en'
 * @returns {Array} Array de temas con copy
 */
export async function getFocusThemes(language = 'es') {
  const copy = await import('../utils/focusApiCopy.js').then(m => m.focusApiCopy(language));
  
  return FOCUS_THEMES_ARRAY.map((theme) => ({
    id: theme.id,
    icon: theme.icon,
    durationWeeks: theme.durationWeeks,
    accentKey: theme.accentKey,
    order: theme.order,
    name: copy.themes[theme.id]?.name || theme.id,
    description: copy.themes[theme.id]?.description || '',
    onboardingPrompt: copy.themes[theme.id]?.onboardingPrompt || '',
  }));
}

/**
 * Obtener foco activo del usuario con datos enriquecidos.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {string} language - 'es' o 'en'
 * @returns {Object|null} Datos del foco activo o null
 */
export async function getActiveFocus(userId, language = 'es') {
  const user = await User.findById(userId).select('activeFocus').lean();
  if (!user?.activeFocus?.themeId) {
    return null;
  }

  const focus = user.activeFocus;
  const theme = getFocusTheme(focus.themeId);
  
  // Blindar: si el tema ya no existe en el catálogo, devolver null
  if (!theme) {
    console.warn(`[focusService] Theme ${focus.themeId} not found in catalog for user ${userId}`);
    return null;
  }

  const copy = await import('../utils/focusApiCopy.js').then(m => m.focusApiCopy(language));
  const currentWeek = focus.status === FOCUS_STATUS.ACTIVE 
    ? calculateCurrentWeek(focus.startedAt, focus.durationWeeks)
    : focus.weekNumber;

  return {
    themeId: focus.themeId,
    themeName: copy.themes[focus.themeId]?.name || focus.themeId,
    themeDescription: copy.themes[focus.themeId]?.description || '',
    icon: theme.icon,
    accentKey: theme.accentKey,
    startedAt: focus.startedAt,
    durationWeeks: focus.durationWeeks,
    weekNumber: currentWeek,
    progress: calculateProgress(currentWeek, focus.durationWeeks),
    customGoal: focus.customGoal || null,
    status: focus.status,
    completedAt: focus.completedAt,
    suggestedInterventions: theme.suggestedInterventions || [],
  };
}

/**
 * Iniciar un nuevo foco de acompañamiento.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {Object} payload - { themeId, durationWeeks?, customGoal? }
 * @returns {Object} Foco iniciado
 * @throws {Error} Si ya hay un foco activo o tema inválido
 */
export async function startFocus(userId, payload) {
  const { themeId, durationWeeks, customGoal } = payload;

  if (!isValidFocusTheme(themeId)) {
    const error = new Error('Invalid focus theme');
    error.code = 'INVALID_THEME';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // Blindar: solo rechazar si hay un foco ACTIVE (permitir si es paused/completed)
  if (user.activeFocus?.themeId && user.activeFocus.status === FOCUS_STATUS.ACTIVE) {
    const error = new Error('User already has an active focus');
    error.code = 'ALREADY_ACTIVE';
    throw error;
  }

  const theme = getFocusTheme(themeId);
  const duration = durationWeeks || theme.durationWeeks || 4;

  user.activeFocus = {
    themeId,
    startedAt: new Date(),
    durationWeeks: duration,
    customGoal: normalizePersistedCustomGoal(customGoal) ?? null,
    weekNumber: 1,
    status: FOCUS_STATUS.ACTIVE,
    completedAt: null,
  };

  user.markModified('activeFocus');
  await user.save();

  return {
    themeId: user.activeFocus.themeId,
    startedAt: user.activeFocus.startedAt,
    durationWeeks: user.activeFocus.durationWeeks,
    customGoal: user.activeFocus.customGoal,
    status: user.activeFocus.status,
  };
}

/**
 * Actualizar foco activo (customGoal o status).
 * @param {string|ObjectId} userId - ID del usuario
 * @param {Object} payload - { customGoal?, status? }
 * @returns {Object} Foco actualizado
 * @throws {Error} Si no hay foco activo
 */
export async function updateActiveFocus(userId, payload) {
  const { customGoal, status } = payload;

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (!user.activeFocus?.themeId) {
    const error = new Error('No active focus');
    error.code = 'NO_ACTIVE_FOCUS';
    throw error;
  }

  if (customGoal !== undefined) {
    user.activeFocus.customGoal = normalizePersistedCustomGoal(customGoal);
  }

  if (status !== undefined) {
    if (status !== FOCUS_STATUS.ACTIVE && status !== FOCUS_STATUS.PAUSED) {
      const error = new Error('Invalid status for update');
      error.code = 'INVALID_STATUS';
      throw error;
    }
    user.activeFocus.status = status;
    
    // Actualizar weekNumber al reactivar
    if (status === FOCUS_STATUS.ACTIVE) {
      const currentWeek = calculateCurrentWeek(user.activeFocus.startedAt, user.activeFocus.durationWeeks);
      user.activeFocus.weekNumber = currentWeek;
    }
  }

  user.markModified('activeFocus');
  await user.save();

  return {
    themeId: user.activeFocus.themeId,
    customGoal: user.activeFocus.customGoal,
    status: user.activeFocus.status,
    weekNumber: user.activeFocus.weekNumber,
  };
}

/**
 * Completar el foco activo.
 * @param {string|ObjectId} userId - ID del usuario
 * @returns {Object} Foco completado
 * @throws {Error} Si no hay foco activo o no está en status active
 */
export async function completeFocus(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (!user.activeFocus?.themeId) {
    const error = new Error('No active focus');
    error.code = 'NO_ACTIVE_FOCUS';
    throw error;
  }

  if (user.activeFocus.status !== FOCUS_STATUS.ACTIVE) {
    const error = new Error('Cannot complete non-active focus');
    error.code = 'CANNOT_COMPLETE';
    throw error;
  }

  const currentWeek = calculateCurrentWeek(user.activeFocus.startedAt, user.activeFocus.durationWeeks);
  
  user.activeFocus.status = FOCUS_STATUS.COMPLETED;
  user.activeFocus.completedAt = new Date();
  user.activeFocus.weekNumber = currentWeek;

  user.markModified('activeFocus');
  await user.save();

  return {
    themeId: user.activeFocus.themeId,
    status: user.activeFocus.status,
    completedAt: user.activeFocus.completedAt,
    weekNumber: user.activeFocus.weekNumber,
    durationWeeks: user.activeFocus.durationWeeks,
  };
}

/**
 * Obtener contexto del foco para inyectar en prompts del chat.
 * @param {string|ObjectId} userId - ID del usuario
 * @returns {Object|null} Contexto del foco o null
 */
export async function getFocusContextForPrompt(userId) {
  const user = await User.findById(userId).select('activeFocus').lean();
  if (!user?.activeFocus?.themeId || user.activeFocus.status !== FOCUS_STATUS.ACTIVE) {
    return null;
  }

  const theme = getFocusTheme(user.activeFocus.themeId);
  if (!theme) return null;

  const currentWeek = calculateCurrentWeek(user.activeFocus.startedAt, user.activeFocus.durationWeeks);

  return {
    themeId: user.activeFocus.themeId,
    weekNumber: currentWeek,
    durationWeeks: user.activeFocus.durationWeeks,
    customGoal: user.activeFocus.customGoal,
  };
}
