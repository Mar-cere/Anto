/**
 * Fallback de aclaratoria breve para sugerencias históricas sin rationaleShort.
 * Alineado con backend/utils/actionSuggestionRationale.js (defaults).
 */
const DEFAULTS = {
  es: {
    automatic_thought_record: 'Para mirar con calma la idea que te está dando vueltas.',
    behavioral_activation: 'Un paso mínimo cuando cuesta moverse.',
    breathing_exercise: 'Para que el cuerpo baje un poco el ritmo.',
    grounding_technique: 'Para volver aquí cuando la mente se va lejos.',
    abc_record: 'Para acomodar qué pasó y cómo te pegó.',
    exposure_hierarchy: 'Para acercarte de a poco, a tu ritmo.',
    gratitude_journal: 'Para notar algo pequeño que te sostenga hoy.',
    self_compassion_exercise: 'Para tratarte con más suavidad cuando te exiges mucho.',
    mindfulness_reminder: 'Un minuto de atención, sin exigirte nada.',
  },
  en: {
    automatic_thought_record: 'To gently look at the idea looping in your mind.',
    behavioral_activation: 'A tiny step when moving feels hard.',
    breathing_exercise: 'To help your body slow down a little.',
    grounding_technique: 'To come back here when your mind drifts away.',
    abc_record: 'To sort what happened and how it hit you.',
    exposure_hierarchy: 'To move closer little by little, at your pace.',
    gratitude_journal: 'To notice one small thing that can support you today.',
    self_compassion_exercise: 'To treat yourself more gently when you’re being hard on yourself.',
    mindfulness_reminder: 'A minute of attention, with no pressure.',
  },
};

/**
 * @param {string} id
 * @param {string} [language='es']
 * @returns {string|null}
 */
export function getSuggestionRationaleFallback(id, language = 'es') {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const key = String(id || '').trim();
  if (!key) return null;
  return DEFAULTS[lang]?.[key] || DEFAULTS.es[key] || null;
}
