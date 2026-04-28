/**
 * Intención de sesión (#72): desahogar, ordenar pensamiento, técnica o planificar.
 * Valores estables en API/BD; copy en español vive en prompts y en la app.
 */
export const SESSION_INTENTION_VALUES = ['vent', 'organize', 'technique', 'plan'];

/**
 * @param {unknown} v
 * @returns {'vent'|'organize'|'technique'|'plan'|null}
 */
export function normalizeSessionIntention(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return SESSION_INTENTION_VALUES.includes(s) ? s : null;
}

/**
 * True si el cliente envió el campo con intención de fijar algo (no omitido).
 * Usar para distinguir "no envió" vs "envió basura" en POST/PATCH.
 * @param {unknown} v
 */
export function wasSessionIntentionProvided(v) {
  if (v === undefined) return false;
  if (v === null) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  return true;
}

/**
 * Valor seguro para JSON al cliente o para prompt (null si corrupto/legacy).
 * @param {unknown} v
 */
export function sanitizeSessionIntentionForClient(v) {
  return normalizeSessionIntention(v);
}
