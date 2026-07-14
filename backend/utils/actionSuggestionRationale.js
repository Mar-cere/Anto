/**
 * Aclaratoria breve bajo sugerencias de técnica en el chat (#why-line).
 * Copy estático + variantes suaves según señales del mensaje.
 */
import { sanitizeObservationalText } from './clinicalContentGuardrails.js';

const MAX_LEN = 96;

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
    default: 'Puede ayudarte con lo que estás pasando.',
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
    default: 'It may help with what you’re going through.',
  },
};

const CONTEXT_RULES = [
  {
    id: 'automatic_thought_record',
    pattern:
      /(?:nunca\s+teng[oa]\s+la\s+raz[oó]n|siempre\s+(?:me\s+)?equivoc|me\s+invalid|no\s+me\s+(?:cree|escucha|toma\s+en\s+serio)|como\s+si\s+(?:estuviera|estoy)\s+loc[oa]|nunca\s+right|always\s+wrong|invalidat|gaslight|doesn'?t\s+take\s+me\s+seriously)/i,
    es: 'Para ver esa idea de que nunca tienes la razón.',
    en: 'To look at that idea that you’re never right.',
  },
  {
    id: 'automatic_thought_record',
    pattern:
      /(?:discut[ií]|pelea|pareja|novi[oa]|mi\s+(?:espos[oa]|marido)|argument|partner|spouse|boyfriend|girlfriend)/i,
    es: 'Para acomodar lo que quedó después de esa pelea.',
    en: 'To sort what stuck with you after that argument.',
  },
  {
    id: 'behavioral_activation',
    pattern:
      /(?:impotente|impotencia|sin\s+ganas|no\s+(?:puedo|quiero)\s+(?:hacer|salir)|apagad[oa]|paraliz|qued(?:o|arme)\s+quiet|helpless|powerless|no\s+energy|can'?t\s+(?:get\s+up|do\s+anything)|stuck\s+in\s+bed)/i,
    es: 'Un paso mínimo cuando te sientes sin salida.',
    en: 'A tiny step when you feel stuck and powerless.',
  },
  {
    id: 'breathing_exercise',
    pattern:
      /(?:ansios|nervios|coraz[oó]n\s+(?:acelera|a\s+mil)|no\s+(?:puedo|logro)\s+calmar|panic|anxious|heart\s+racing|can't\s+calm)/i,
    es: 'Para darle al cuerpo un poco de aire ahora.',
    en: 'To give your body a bit of breathing room now.',
  },
  {
    id: 'grounding_technique',
    pattern:
      /(?:desborda|me\s+pierdo|flashback|no\s+estoy\s+aqu[ií]|overwhelm|dissociat|spaced\s+out|not\s+here)/i,
    es: 'Para volver al presente cuando todo se siente de más.',
    en: 'To come back to the present when it all feels like too much.',
  },
  {
    id: 'abc_record',
    pattern:
      /(?:qu[eé]\s+pas[oó]|situaci[oó]n|trigger|disparador|conflicto)/i,
    es: 'Para ver qué pasó y cómo te afectó.',
    en: 'To see what happened and how it affected you.',
  },
];

function langKey(language) {
  return String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

/**
 * @param {{ id?: string, language?: string, userContent?: string }} opts
 * @returns {string|null}
 */
export function buildSuggestionRationaleShort({ id, language = 'es', userContent = '' } = {}) {
  const lang = langKey(language);
  const key = String(id || '').trim();
  if (!key) return null;

  const text = String(userContent || '');
  if (text.trim()) {
    for (const rule of CONTEXT_RULES) {
      if (rule.id === key && rule.pattern.test(text)) {
        const safe = sanitizeObservationalText(rule[lang], MAX_LEN);
        if (safe) return safe;
      }
    }
  }

  const table = DEFAULTS[lang] || DEFAULTS.es;
  const raw = table[key] || table.default;
  return sanitizeObservationalText(raw, MAX_LEN);
}

/**
 * Adjunta rationaleShort a sugerencias ya formateadas.
 * @param {Array<object>} suggestions
 * @param {{ language?: string, userContent?: string }} [opts]
 */
export function enrichSuggestionsWithRationaleShort(suggestions, opts = {}) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return suggestions || [];
  const language = opts.language || 'es';
  const userContent = opts.userContent || '';
  return suggestions.map((item) => {
    if (!item || typeof item !== 'object') return item;
    // Psicoed / micro-guía ya muestran resumen propio.
    if (
      item.interventionType === 'psychoeducation' ||
      item.interventionType === 'micro_guide' ||
      item.cardVariant === 'psychoeducation_native' ||
      item.cardVariant === 'micro_guide_native'
    ) {
      return item;
    }
    const rationaleShort = buildSuggestionRationaleShort({
      id: item.id,
      language,
      userContent,
    });
    if (!rationaleShort) return item;
    return { ...item, rationaleShort };
  });
}

export default {
  buildSuggestionRationaleShort,
  enrichSuggestionsWithRationaleShort,
};
