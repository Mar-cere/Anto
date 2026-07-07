const HABIT_HINTS =
  /h[áa]bito|rutina\s+diaria|todos\s+los\s+d[ií]as|cada\s+d[ií]a|constancia\s+diaria|meditar|respiraci[oó]n/i;

/**
 * @param {string} title
 * @returns {boolean}
 */
export function commitmentLabelSuggestsHabit(title) {
  return HABIT_HINTS.test(String(title || ''));
}

/**
 * @param {string} title
 * @returns {string}
 */
export function buildCommitmentLabelFromProductTitle(title) {
  const t = String(title || '').trim().replace(/\s+/g, ' ');
  if (t.length >= 2) return t.slice(0, 240);
  return '';
}

/**
 * @param {{ title?: string, interventionId?: string|null }} opts
 * @returns {'task'|'habit'|null}
 */
export function suggestProductTypeForCommitment({ title, interventionId } = {}) {
  const id = String(interventionId || '').trim();
  if (id === 'behavioral_activation' || id === 'exposure_hierarchy') return 'task';
  if (commitmentLabelSuggestsHabit(title)) return 'habit';
  if (id === 'breathing_exercise' || id === 'grounding_technique') return 'habit';
  return 'task';
}
