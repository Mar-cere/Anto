/**
 * Sesión de proceso del dashboard (cold start) y UI del check-in de ánimo.
 */

/** @type {string|null} */
let sessionId = null;

/**
 * @typedef {{ sessionId: string, collapsed: boolean }} MoodCheckInUiState
 */

/** @type {MoodCheckInUiState|null} */
let moodCheckInUiState = null;

/** Retardo antes de auto-colapsar tras guardar ánimo (ms). */
export const MOOD_CHECKIN_AUTO_COLLAPSE_MS = 700;

/**
 * Token estable mientras viva el proceso JS.
 * @returns {string}
 */
export function getDashboardSessionId() {
  if (!sessionId) {
    sessionId = `dash-${Date.now()}`;
  }
  return sessionId;
}

/**
 * @returns {MoodCheckInUiState|null}
 */
export function getMoodCheckInUiState() {
  return moodCheckInUiState;
}

/**
 * @param {{ hasMood: boolean, sessionId: string, state?: MoodCheckInUiState|null }} opts
 * @returns {boolean}
 */
export function shouldExpandMoodCheckInOnMount({ hasMood, sessionId: sid, state = null } = {}) {
  if (!hasMood) return true;
  const current = String(sid || '').trim();
  if (!current) return true;
  if (!state || String(state.sessionId || '') !== current) return true;
  return state.collapsed !== true;
}

/**
 * Marca el check-in como colapsado en la sesión actual.
 */
export function markMoodCheckInCollapsed() {
  moodCheckInUiState = {
    sessionId: getDashboardSessionId(),
    collapsed: true,
  };
}

/**
 * Marca el check-in como expandido en la sesión actual.
 */
export function markMoodCheckInExpanded() {
  moodCheckInUiState = {
    sessionId: getDashboardSessionId(),
    collapsed: false,
  };
}

/**
 * Solo tests: reinicia token y estado de UI.
 */
export function __resetDashboardSessionForTests() {
  sessionId = null;
  moodCheckInUiState = null;
}
