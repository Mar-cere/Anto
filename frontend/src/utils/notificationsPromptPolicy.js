export const NOTIFICATIONS_PROMPT_DEFAULT_DAYS = [2, 3];

export function getNotificationsPromptVisitsKey(userId) {
  return `notificationsPromptVisits:${userId || 'anon'}`;
}

export function getNotificationsPromptNextAtKey(userId) {
  return `notificationsPromptNextAt:${userId || 'anon'}`;
}

export function computeNextPromptAt({
  now = Date.now(),
  random = Math.random,
  days = NOTIFICATIONS_PROMPT_DEFAULT_DAYS,
} = {}) {
  const pick = typeof random === 'function' ? random() : 0;
  const selectedDays = pick < 0.5 ? days[0] : days[1];
  return now + selectedDays * 24 * 60 * 60 * 1000;
}

export function shouldShowNotificationsPrompt({
  hasUser = true,
  isOverlayBlocking = false,
  dashVisitsCount = 0,
  notificationsEnabled = true,
  nextAt = 0,
  legacyDismissed = false,
  now = Date.now(),
} = {}) {
  if (!hasUser) return { show: false, reason: 'no-user' };
  if (isOverlayBlocking) return { show: false, reason: 'overlay-blocking' };

  // No mostrar demasiado pronto: esperar al menos 2 visitas al dashboard
  if (dashVisitsCount > 0 && dashVisitsCount < 2) return { show: false, reason: 'too-early' };

  // Cooldown activo
  if (Number(nextAt || 0) > now) return { show: false, reason: 'cooldown' };

  // Dismiss legacy (versiones previas) → suprimir y migrar a cooldown desde afuera
  if (legacyDismissed) return { show: false, reason: 'legacy-dismissed' };

  // Solo si no están habilitadas
  if (notificationsEnabled) return { show: false, reason: 'already-enabled' };

  return { show: true, reason: 'eligible' };
}

