import {
  getInterventionCatalogEntry,
  getInterventionCatalogLabel,
} from '../constants/interventionCatalog.js';
import {
  getPsychoeducationCardFields,
  normalizePsychoeducationTopic,
} from '../constants/psychoeducation.js';
import { getMicroGuideCardFields } from '../constants/microGuideContent.js';
import { rankInterventionIds } from './interventionRankingService.js';
import { hasActionableDistortionInMessage } from '../utils/automaticThoughtGuards.js';

/** Psicoed por señales en el mensaje (#85 / #127). */
export const CONTEXTUAL_PSYCHOEDUCATION_RULES = [
  {
    id: 'psychoeducation_sleep',
    pattern:
      /(?:insomnio|no\s+puedo\s+dormir|duermo\s+mal|durmiendo\s+mal|despierto\s+(?:a\s+(?:las|la)|(?:en\s+)?la\s+noche)|sueño\s+(?:muy\s+)?(?:mal|interrumpido|fragmentado)|me\s+cuesta\s+conciliar|insomnia|can'?t\s+sleep|sleep(?:ing)?\s+badly|wake\s+up\s+(?:at\s+)?night|trouble\s+falling\s+asleep)/i,
  },
  {
    id: 'psychoeducation_stress',
    pattern:
      /(?:estrés|estres(?:ado|ada)?|presión\s+(?:laboral|en\s+el\s+trabajo|académica)|demasiadas\s+responsabilidades|sobrecarga\s+(?:laboral|de\s+trabajo)|\bstress(?:ed)?\b|overwhelmed|too\s+many\s+responsibilities|work\s+pressure)/i,
  },
  {
    id: 'psychoeducation_burnout',
    pattern:
      /(?:burnout|burned?\s+out|agotamiento\s+(?:laboral|profesional|crónico)|saturad[oa]\s+del\s+trabajo|no\s+aguanto\s+más\s+(?:el\s+)?trabajo|emotional\s+exhaustion|compassion\s+fatigue)/i,
  },
  {
    id: 'psychoeducation_grief',
    pattern:
      /(?:duelo|luto|falleci[oó]|murió|perd[ií]\s+a|extra[ñn]o\s+(?:mucho|a)|grief|bereavement|passed away|lo\s+extra[ñn]o)/i,
  },
  {
    id: 'psychoeducation_trauma',
    pattern:
      /(?:trauma|flashback|revivir|experiencia\s+(?:muy\s+)?(?:difícil|traumática)|(?:ptsd|tept)\b|pesadillas\s+recurrentes|traumatic\s+experience|recurring\s+nightmares)/i,
  },
  {
    id: 'psychoeducation_emotion_regulation',
    pattern:
      /(?:desbord(?:o|a|ad[oa])|no\s+controlo\s+(?:mis\s+)?emociones|explot(?:o|é)\s+sin\s+querer|regul(?:ar|ación)\s+emocional|me\s+sobrepasa\s+lo\s+que\s+siento|emotionally\s+overwhelmed|can'?t\s+control\s+my\s+emotions|lash\s+out|emotion\s+regulation)/i,
  },
];

export function resolveContextualPsychoeducationIds(userContent = '') {
  const text = String(userContent || '');
  if (!text.trim()) return [];
  return CONTEXTUAL_PSYCHOEDUCATION_RULES.filter(({ pattern }) => pattern.test(text)).map(
    ({ id }) => id,
  );
}

/** Catálogo extendido #90–#99: micro-guías por señales en el mensaje. */
export const CONTEXTUAL_PROTOCOL_RULES = [
  {
    id: 'grief_roadmap',
    pattern:
      /(?:duelo|falleci[oó]|murió|perd[ií]|luto|extra[ñn]ar(?:lo|la)?|grief|bereavement|passed away|lo\s+extra[ñn]o)/i,
  },
  {
    id: 'relapse_prevention',
    pattern:
      /(?:reca[íi]d|volver\s+a\s+(?:fumar|beber|consumir)|disparador|trigger|craving|antojo|relapse|tentaci[oó]n\s+fuerte)/i,
  },
  {
    id: 'dbt_stop_skill',
    pattern:
      /(?:impulso\s+(?:fuerte|de)|me\s+voy\s+a\s+explotar|urges?|STOP\b|desbord(?:o|a)|no\s+aguanto\s+m[aá]s|lash\s+out)/i,
  },
  {
    id: 'act_values_check',
    pattern:
      /(?:mis\s+valores|qu[eé]\s+importa\s+de\s+verdad|sentido\s+de\s+vida|values|what\s+matters\s+to\s+me|life\s+meaning)/i,
  },
  {
    id: 'sleep_diary_lite',
    pattern:
      /(?:insomnio|no\s+puedo\s+dormir|duermo\s+mal|despierto\s+(?:a\s+(?:las|la)|en\s+la\s+noche)|insomnia|can'?t\s+sleep|sleep\s+diary)/i,
  },
  {
    id: 'mindfulness_sequence',
    pattern:
      /(?:mindfulness|atenci[oó]n\s+plena|meditar|meditation|pr[aá]ctica\s+de\s+atenci[oó]n)/i,
  },
  {
    id: 'assertive_i_messages',
    pattern:
      /(?:decir\s+no|asertiv|l[ií]mite\s+claro|I-messages?|assertive|no\s+s[eé]\s+c[oó]mo\s+decirle)/i,
  },
  {
    id: 'problem_solving_psst',
    pattern:
      /(?:no\s+s[eé]\s+qu[eé]\s+hacer|decidir\s+entre|opciones|pros\s+y\s+contras|problem\s+solving|stuck\s+deciding)/i,
  },
];

export function resolveContextualProtocolIds(userContent = '', max = 2) {
  const text = String(userContent || '');
  if (!text.trim()) return [];
  const cap = Math.max(1, Math.min(Number(max) || 2, CONTEXTUAL_PROTOCOL_RULES.length));
  return CONTEXTUAL_PROTOCOL_RULES.filter(({ pattern }) => pattern.test(text))
    .map(({ id }) => id)
    .slice(0, cap);
}

/** Señales de cadena pensamiento → consecuencia; activa ABC (#86). */
export const CONTEXTUAL_ABC_PATTERN =
  /(?:pienso\s+lo\s+peor|siempre\s+pienso|peor\s+escenario|worst.?case|keep\s+thinking\s+the\s+worst|automatic\s+thought|pensamiento\s+autom[aá]tico|repaso\s+(?:una\s+y\s+otra|sin\s+parar)|darle\s+vueltas|no\s+paro\s+de\s+(?:pensar|darle\s+vueltas)|can'?t\s+stop\s+thinking|going\s+over\s+and\s+over|reaccion[eé]\s+mal|reacted\s+badly|qu[eé]\s+pas[oó]\s+en\s+mi\s+cabeza|what\s+went\s+through\s+my\s+mind)/i;

/** Señales de evitación/miedo; activa jerarquía de exposición (#87). */
export const CONTEXTUAL_EXPOSURE_PATTERN =
  /(?:evit(?:o|ar|ación|ando)|miedo\s+a|temor\s+a|fobia|p[aá]nico|me\s+da\s+(?:mucho\s+)?miedo|no\s+puedo\s+(?:entrar|salir|hacer|decir)|afraid\s+of|avoid(?:ing)?|panic\s+about|scared\s+to|social\s+anxiety|ansiedad\s+social|me\s+paraliza|me\s+bloquea)/i;

const TCC_MEDIUM_EMOTIONS = new Set(['tristeza', 'enojo', 'culpa']);
/** Emociones elegibles para pensamiento automático (#89). */
const AT_MEDIUM_EMOTIONS = new Set(['ansiedad', 'tristeza', 'enojo', 'culpa', 'miedo']);
const ABC_RECORD_ID = 'abc_record';
const EXPOSURE_HIERARCHY_ID = 'exposure_hierarchy';
const BEHAVIORAL_ACTIVATION_ID = 'behavioral_activation';
const AUTOMATIC_THOUGHT_RECORD_ID = 'automatic_thought_record';

/** Máximo de sugerencias por bloque en el chat (técnicas + psicoed). */
export const MAX_CHAT_ACTION_SUGGESTIONS = 2;

const PSYCHO_MESSAGE_PRIORITY = [
  { id: 'psychoeducation_sleep', pattern: /(?:insomnio|dormir|sueño|sleep)/i },
  { id: 'psychoeducation_anxiety', pattern: /(?:p[aá]nico|ansiedad|ansios)/i },
  { id: 'psychoeducation_stress', pattern: /(?:estr[eé]s|agotad|overwhelmed)/i },
  {
    id: 'psychoeducation_emotion_regulation',
    pattern: /(?:desbord|explot.*sin\s+querer|regulaci[oó]n\s+emocional)/i,
  },
  { id: 'psychoeducation_anger', pattern: /(?:enojad|enfad|furios|angry)/i },
  { id: 'psychoeducation_depression', pattern: /(?:triste|sin\s+energ|desmotivad|low\s+mood)/i },
  { id: 'psychoeducation_trauma', pattern: /(?:flashback|trauma|tept|ptsd)/i },
  { id: 'psychoeducation_grief', pattern: /(?:duelo|luto|falleci|extra[ñn]o|grief|bereavement)/i },
  { id: 'psychoeducation_burnout', pattern: /(?:burnout|agotamiento|burned?\s+out)/i },
];

function pickPreferredRequiredPsycho(psychoRequired, list, { emotion, userContent } = {}) {
  const candidates = psychoRequired.filter((id) => list.includes(id));
  const text = String(userContent || '');
  for (const { id, pattern } of PSYCHO_MESSAGE_PRIORITY) {
    if (candidates.includes(id) && pattern.test(text)) return id;
  }
  const emotionPsycho =
    emotion === 'ansiedad' || emotion === 'miedo'
      ? 'psychoeducation_anxiety'
      : emotion === 'tristeza'
        ? 'psychoeducation_depression'
        : emotion === 'enojo'
          ? 'psychoeducation_anger'
          : null;
  if (emotionPsycho && candidates.includes(emotionPsycho)) return emotionPsycho;
  return candidates[0] || null;
}

function prioritizeSuggestionBlock(
  ids,
  {
    max = MAX_CHAT_ACTION_SUGGESTIONS,
    psychoRequired = [],
    emotion = null,
    userContent = '',
  } = {},
) {
  const list = [...ids];
  psychoRequired.forEach((psychoId) => {
    if (psychoId && !list.includes(psychoId)) list.push(psychoId);
  });
  if (list.length <= max) return list;

  const requiredPsycho = pickPreferredRequiredPsycho(psychoRequired, list, {
    emotion,
    userContent,
  });
  const techniques = list.filter((id) => !String(id).startsWith('psychoeducation_'));
  const psychos = list.filter((id) => String(id).startsWith('psychoeducation_'));
  const out = [];

  if (techniques.length > 0) out.push(techniques[0]);
  if (requiredPsycho && out.length < max) {
    out.push(requiredPsycho);
  } else if (psychos.length > 0 && out.length < max) {
    out.push(psychos[0]);
  } else if (techniques.length > 1 && out.length < max) {
    out.push(techniques[1]);
  }
  return out.slice(0, max);
}

function isMundanePhysicalHealthMessage(userContent = '') {
  return /(?:resfriad[oa]|gripe|catarro|fiebre|mocos|tos\b|(?:estoy|tengo)\s+enferm[oa]|me\s+agarr[oó]\s+(?:un|la)\s+gripe|common\s+cold|just\s+a\s+cold|\bflu\b|congesti[oó]n)/i.test(
    String(userContent || ''),
  );
}

/** Psicoed por emoción solo con señal fuerte; evita tarjetas en cansancio físico banal. */
export function shouldAttachEmotionPsychoeducation(emotion, userContent = '', intensity = 5) {
  if (isMundanePhysicalHealthMessage(userContent)) return false;
  if (resolveContextualPsychoeducationIds(userContent).length > 0) return true;
  if (intensity >= 8) return true;
  if (emotion === 'tristeza' && shouldBoostBaSuggestion(userContent)) return true;
  if (emotion === 'ansiedad' && shouldBoostExposureSuggestion(userContent)) return true;
  if (emotion === 'enojo' && intensity >= 7) return true;
  return false;
}

/** Señales de apatía / baja activación; activa BA (#88). */
export const CONTEXTUAL_BA_PATTERN =
  /(?:desmotivad[oa]|sin\s+ganas|sin\s+energ[ií]a|no\s+hago\s+nada|me\s+cuesta\s+(?:levantarme|salir|empezar)|ap[aá]tic[oa]|anhedonia|nothing\s+brings\s+joy|no\s+motivation|can'?t\s+get\s+(?:out\s+of\s+bed|started)|feel\s+numb|me\s+siento\s+apagad[oa]|sin\s+fuerzas|no\s+tengo\s+energ[ií]a)/i;

export function shouldBoostBaSuggestion(userContent = '') {
  return CONTEXTUAL_BA_PATTERN.test(String(userContent || ''));
}

export function shouldBoostExposureSuggestion(userContent = '') {
  return CONTEXTUAL_EXPOSURE_PATTERN.test(String(userContent || ''));
}

export function shouldBoostAutomaticThoughtSuggestion(userContent = '') {
  const text = String(userContent || '');
  if (!text.trim()) return false;
  if (shouldBoostAbcSuggestion(text)) return true;
  // Apatía pura (#88): «hacer nada» puede coincidir con patrón todo/nada sin señal cognitiva.
  if (shouldBoostBaSuggestion(text) && !shouldBoostAbcSuggestion(text)) return false;
  return hasActionableDistortionInMessage(text);
}

/** Señal TCC fuerte (#86/#87/#88/#89): solo en el primer mensaje del hilo. */
export function shouldBypassTccSuggestionCadence(userContent = '', conversationHistory = []) {
  const userTurns = conversationHistory?.filter((msg) => msg.role === 'user').length || 0;
  if (userTurns > 1) return false;
  return (
    shouldBoostAbcSuggestion(userContent) ||
    shouldBoostExposureSuggestion(userContent) ||
    shouldBoostBaSuggestion(userContent) ||
    shouldBoostAutomaticThoughtSuggestion(userContent)
  );
}

export function applyExposureSuggestionPolicy(ids, { emotion, intensityLevel, userContent } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return ids;
  if (emotion !== 'ansiedad') return ids.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  const contextualAvoidance = shouldBoostExposureSuggestion(userContent);
  const eligibleIntensity =
    intensityLevel === 'medium' || (intensityLevel === 'high' && contextualAvoidance);
  if (!eligibleIntensity) return ids.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  let list = [...ids];

  if (!list.includes(EXPOSURE_HIERARCHY_ID) && contextualAvoidance) {
    list = [EXPOSURE_HIERARCHY_ID, ...list];
  }

  if (!list.includes(EXPOSURE_HIERARCHY_ID)) return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  if (contextualAvoidance) {
    list = [EXPOSURE_HIERARCHY_ID, ...list.filter((id) => id !== EXPOSURE_HIERARCHY_ID)];
  }

  return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
}

export function applyBaSuggestionPolicy(ids, { emotion, intensityLevel, userContent } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return ids;
  if (emotion !== 'tristeza' || intensityLevel !== 'medium') return ids.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  const contextualLowActivation = shouldBoostBaSuggestion(userContent);
  let list = [...ids];

  if (!list.includes(BEHAVIORAL_ACTIVATION_ID) && contextualLowActivation) {
    list = [BEHAVIORAL_ACTIVATION_ID, ...list];
  }

  if (!list.includes(BEHAVIORAL_ACTIVATION_ID)) return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  if (list[0] === ABC_RECORD_ID) return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  if (contextualLowActivation) {
    list = [
      BEHAVIORAL_ACTIVATION_ID,
      ...list.filter((id) => id !== BEHAVIORAL_ACTIVATION_ID),
    ];
  }

  return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
}

export function shouldBoostAbcSuggestion(userContent = '') {
  return CONTEXTUAL_ABC_PATTERN.test(String(userContent || ''));
}

/**
 * Prioriza ABC en intensidad media TCC: fija primer slot y/o inyecta si hay señal cognitiva.
 */
export function applyAbcSuggestionPolicy(ids, { emotion, intensityLevel, userContent } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return ids;
  if (intensityLevel !== 'medium' || !TCC_MEDIUM_EMOTIONS.has(emotion)) return ids.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  const contextualThought = shouldBoostAbcSuggestion(userContent);
  let list = [...ids];

  if (!list.includes(ABC_RECORD_ID) && contextualThought) {
    list = [ABC_RECORD_ID, ...list];
  }

  if (!list.includes(ABC_RECORD_ID)) return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  if (contextualThought) {
    list = [ABC_RECORD_ID, ...list.filter((id) => id !== ABC_RECORD_ID)];
  }

  return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
}

/**
 * Prioriza registro de pensamiento automático (#89) cuando hay distorsión detectada
 * o señal cognitiva explícita en intensidad media TCC.
 */
export function applyAutomaticThoughtSuggestionPolicy(
  ids,
  { emotion, intensityLevel, userContent } = {},
) {
  if (!Array.isArray(ids) || ids.length === 0) return ids;
  if (intensityLevel !== 'medium' || !AT_MEDIUM_EMOTIONS.has(emotion)) return ids.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  const text = String(userContent || '');
  const hasDistortion = hasActionableDistortionInMessage(text);
  const hasCognitiveSignal = shouldBoostAbcSuggestion(text);
  if (!hasDistortion && !hasCognitiveSignal) return ids.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);

  let list = [...ids];

  // Evitación (#87) prevalece sobre AT cuando exposición ya es primera.
  if (list[0] === EXPOSURE_HIERARCHY_ID && shouldBoostExposureSuggestion(text)) {
    if (
      !list.includes(AUTOMATIC_THOUGHT_RECORD_ID) &&
      shouldBoostAutomaticThoughtSuggestion(text)
    ) {
      list.splice(1, 0, AUTOMATIC_THOUGHT_RECORD_ID);
    }
    return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
  }

  // Apatía (#88) prevalece sobre AT cuando BA ya es primera.
  if (
    list[0] === BEHAVIORAL_ACTIVATION_ID &&
    shouldBoostBaSuggestion(text) &&
    !shouldBoostAbcSuggestion(text)
  ) {
    return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
  }

  if (!list.includes(AUTOMATIC_THOUGHT_RECORD_ID)) {
    list = [AUTOMATIC_THOUGHT_RECORD_ID, ...list];
  }

  if (hasDistortion) {
    list = [
      AUTOMATIC_THOUGHT_RECORD_ID,
      ...list.filter((id) => id !== AUTOMATIC_THOUGHT_RECORD_ID),
    ];
    return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
  }

  if (list[0] === ABC_RECORD_ID) {
    return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
  }

  if (hasCognitiveSignal && list.includes(ABC_RECORD_ID)) {
    list = list.filter((id) => id !== AUTOMATIC_THOUGHT_RECORD_ID);
    const abcIndex = list.indexOf(ABC_RECORD_ID);
    list.splice(abcIndex + 1, 0, AUTOMATIC_THOUGHT_RECORD_ID);
  }

  return list.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
}

/** Emoción con reglas de sugerencias; cae a ansiedad/enojo si el texto lo indica (#85). */
export function resolveSuggestionEmotion(mainEmotion, userContent = '') {
  const known = new Set([
    'ansiedad',
    'tristeza',
    'enojo',
    'culpa',
    'soledad',
  ]);
  if (known.has(mainEmotion)) return mainEmotion;
  const text = String(userContent || '');
  if (/(?:\bansios[oa]\b|\banxious\b|\bnervios[oa]\b|\bnervous\b)/i.test(text)) {
    return 'ansiedad';
  }
  if (
    /(?:\bmiedo\b|temor|fobia|\bfear\b|\bphobia\b|ansiedad\s+social|social\s+anxiety)/i.test(
      text,
    )
  ) {
    return 'ansiedad';
  }
  if (mainEmotion === 'miedo') return 'ansiedad';
  if (
    /(?:desbord|explot(?:o|é)\s+sin\s+querer|no\s+controlo\s+(?:mis\s+)?emociones|emotionally\s+overwhelmed|can'?t\s+control\s+my\s+emotions|lash\s+out)/i.test(
      text,
    )
  ) {
    return 'enojo';
  }
  if (
    /(?:estrés|estres|agotad|insomnio|duermo\s+mal|durmiendo\s+mal|despierto.*(?:noche|dormir)|sobrecarga|demasiadas\s+responsabilidades|\bstress(?:ed)?\b|burned?\s+out|insomnia|can'?t\s+sleep)/i.test(
      text,
    )
  ) {
    return 'ansiedad';
  }
  if (
    /(?:\bsad\b|\bdepressed\b|\bhopeless\b|feel(?:ing)?\s+(?:sad|low|down)|\blow\b.*\bfeel|feel\s+numb|no\s+motivation)/i.test(
      text,
    )
  ) {
    return 'tristeza';
  }
  if (
    /(?:\bangry\b|\bfurious\b|\birritated\b|\bmad\b|\blash(?:ed)?\s+out|\breacted\s+badly)/i.test(
      text,
    )
  ) {
    return 'enojo';
  }
  if (/(?:\bguilty\b|\bguilt\b)/i.test(text)) {
    return 'culpa';
  }
  return mainEmotion;
}

function appendUniqueIds(list, ids) {
  ids.forEach((id) => {
    if (id && !list.includes(id)) list.push(id);
  });
  return list;
}

/**
 * Servicio de Sugerencias de Acciones
 * Conecta el análisis emocional con otras partes de la app
 * para sugerir acciones específicas según la emoción, intensidad y tema
 */
class ActionSuggestionService {
  constructor() {
    // Mapeo de emociones + intensidad + tema -> acciones sugeridas
    this.actionMappings = {
      ansiedad: {
        high: {
          general: ['breathing_exercise', 'grounding_technique'],
          trabajo: ['breathing_exercise', 'task_break'],
          relaciones: ['breathing_exercise', 'communication_tool']
        },
        medium: {
          general: ['exposure_hierarchy', 'mindfulness_sequence', 'self_care'],
          trabajo: ['task_organization', 'problem_solving_psst'],
          relaciones: ['communication_tool', 'assertive_i_messages'],
        }
      },
      tristeza: {
        high: {
          general: ['self_compassion_exercise', 'support_contact'],
          relaciones: ['self_compassion_exercise', 'communication_tool'],
          pérdida: ['grief_support', 'memory_exercise']
        },
        medium: {
          general: ['behavioral_activation', 'abc_record', 'gratitude_journal'],
          relaciones: ['abc_record', 'communication_tool', 'self_care'],
          pérdida: ['grief_support', 'grief_roadmap', 'self_compassion_exercise'],
        }
      },
      enojo: {
        high: {
          general: ['timeout_technique', 'breathing_exercise'],
          relaciones: ['timeout_technique', 'communication_tool'],
          trabajo: ['timeout_technique', 'boundary_setting']
        },
        medium: {
          general: ['abc_record', 'anger_management', 'dbt_stop_skill'],
          relaciones: ['abc_record', 'communication_tool', 'assertive_i_messages'],
          trabajo: ['abc_record', 'boundary_setting', 'problem_solving_psst'],
        }
      },
      culpa: {
        high: {
          general: ['self_compassion_exercise', 'forgiveness_work'],
          relaciones: ['self_compassion_exercise', 'communication_tool']
        },
        medium: {
          general: ['abc_record', 'self_compassion_exercise', 'values_exploration'],
          relaciones: ['abc_record', 'communication_tool', 'apology_guide']
        }
      },
      soledad: {
        high: {
          general: ['support_contact', 'connection_exercise'],
          relaciones: ['communication_tool', 'support_contact']
        },
        medium: {
          general: ['social_activity', 'gratitude_journal'],
          relaciones: ['communication_tool', 'social_activity']
        }
      }
    };
    this.subtypeAdjustments = {
      ansiedad: {
        social: ['exposure_hierarchy', 'social_anxiety_tool', 'exposure_guide'],
        anticipatoria: ['grounding_technique', 'present_moment_exercise'],
        rendimiento: ['performance_anxiety_tool', 'self_compassion_exercise'],
      },
      tristeza: {
        duelo: ['grief_support', 'grief_roadmap', 'memory_exercise'],
        soledad: ['connection_exercise', 'support_contact'],
        fracaso: ['self_compassion_exercise', 'reframing_tool'],
      },
    };
  }

  /**
   * Genera sugerencias de acciones basadas en el análisis emocional
   * @param {Object} [options]
   * @param {Map<string, number>} [options.rankingScores] — prior del grafo #127
   * @param {string} [options.userContent] — mensaje del usuario (psicoed contextual)
   */
  generateSuggestions(emotionalAnalysis, contextualAnalysis = {}, options = {}) {
    if (!emotionalAnalysis) {
      return [];
    }

    const userContent = options?.userContent || contextualAnalysis?.userContent || '';
    const emotion = resolveSuggestionEmotion(emotionalAnalysis.mainEmotion, userContent);
    const intensity = emotionalAnalysis.intensity || 5;
    const topic = emotionalAnalysis.topic || 'general';
    const subtype = emotionalAnalysis.subtype;

    // Determinar nivel de intensidad
    const intensityLevel = intensity >= 8 ? 'high' : intensity >= 5 ? 'medium' : 'low';

    // Obtener acciones base según emoción e intensidad
    const emotionMappings = this.actionMappings[emotion];
    if (!emotionMappings) {
      const contextualOnly = resolveContextualPsychoeducationIds(userContent);
      if (contextualOnly.length === 0) return [];
      const fallback = ['mindfulness_reminder', ...contextualOnly];
      const rankingScores = options?.rankingScores;
      const ranked =
        rankingScores instanceof Map && rankingScores.size > 0
          ? rankInterventionIds(fallback, rankingScores)
          : fallback;
      return ranked.slice(0, MAX_CHAT_ACTION_SUGGESTIONS);
    }

    const intensityMappings =
      emotionMappings[intensityLevel] || emotionMappings.medium || emotionMappings.high;
    if (!intensityMappings) {
      return [];
    }

    // Obtener acciones para el tema específico o general
    let actions = intensityMappings[topic] || intensityMappings.general || [];

    // Ajustar según subtipo si existe
    if (subtype) {
      actions = this.adjustActionsBySubtype(actions, emotion, subtype);
    }

    const contextualPsycho = resolveContextualPsychoeducationIds(userContent);
    const attachEmotionPsycho = shouldAttachEmotionPsychoeducation(
      emotion,
      userContent,
      intensity,
    );
    const techniqueLimit = contextualPsycho.length > 0 || attachEmotionPsycho ? 1 : MAX_CHAT_ACTION_SUGGESTIONS;
    const enriched = [...actions].slice(0, techniqueLimit);

    const emotionPsycho = [];
    if (attachEmotionPsycho) {
      if (emotion === 'ansiedad' || emotion === 'miedo') {
        emotionPsycho.push('psychoeducation_anxiety');
      }
      if (emotion === 'tristeza') emotionPsycho.push('psychoeducation_depression');
      if (emotion === 'enojo') emotionPsycho.push('psychoeducation_anger');
    }

    appendUniqueIds(enriched, [...contextualPsycho, ...emotionPsycho]);
    appendUniqueIds(enriched, resolveContextualProtocolIds(userContent));

    const rankingScores = options?.rankingScores;
    const ranked =
      rankingScores instanceof Map && rankingScores.size > 0
        ? rankInterventionIds(enriched, rankingScores)
        : enriched;
    const psychoRequired = [...contextualPsycho, ...emotionPsycho];
    const afterPolicies = applyAutomaticThoughtSuggestionPolicy(
      applyExposureSuggestionPolicy(
        applyBaSuggestionPolicy(
          applyAbcSuggestionPolicy(ranked, {
            emotion,
            intensityLevel,
            userContent,
          }),
          {
            emotion,
            intensityLevel,
            userContent,
          },
        ),
        {
          emotion,
          intensityLevel,
          userContent,
        },
      ),
      {
        emotion,
        intensityLevel,
        userContent,
      },
    );
    return prioritizeSuggestionBlock(afterPolicies, {
      psychoRequired,
      emotion,
      userContent,
    });
  }

  /**
   * Ajusta las acciones según el subtipo emocional
   * @param {Array} actions - Acciones base
   * @param {string} emotion - Emoción principal
   * @param {string} subtype - Subtipo emocional
   * @returns {Array} Acciones ajustadas
   */
  adjustActionsBySubtype(actions, emotion, subtype) {
    const adjustments = this.subtypeAdjustments[emotion]?.[subtype];
    if (adjustments) {
      // Combinar acciones base con ajustes específicos
      return [...new Set([...actions, ...adjustments])];
    }

    return actions;
  }

  /**
   * Todos los IDs referenciados en reglas de sugerencia (para tests y auditoría #127).
   */
  getAllReferencedInterventionIds() {
    const ids = new Set();
    const walk = (node) => {
      if (Array.isArray(node)) {
        node.forEach((id) => ids.add(String(id || '').trim()));
        return;
      }
      if (node && typeof node === 'object') {
        Object.values(node).forEach(walk);
      }
    };
    walk(this.actionMappings);
    walk(this.subtypeAdjustments);
    ids.add('psychoeducation_anxiety');
    ids.add('psychoeducation_depression');
    ids.add('psychoeducation_stress');
    ids.add('psychoeducation_anger');
    ids.add('psychoeducation_sleep');
    ids.add('psychoeducation_emotion_regulation');
    ids.add('psychoeducation_trauma');
    ids.add('psychoeducation_grief');
    ids.add('psychoeducation_burnout');
    CONTEXTUAL_PSYCHOEDUCATION_RULES.forEach(({ id }) => ids.add(id));
    CONTEXTUAL_PROTOCOL_RULES.forEach(({ id }) => ids.add(id));
    return [...ids].filter(Boolean);
  }

  /**
   * Formatea las sugerencias para mostrar en la UI
   * @param {Array} actionIds - IDs de acciones
   * @returns {Array} Array de objetos con información formateada
   */
  formatSuggestions(actionIds, language = 'es') {
    return actionIds.map((raw) => {
      const id = String(raw || '').trim();
      const entry = getInterventionCatalogEntry(id);
      if (entry) {
        const base = {
          id: entry.id,
          label: getInterventionCatalogLabel(entry, language),
          icon: entry.icon,
          screen:
            entry.type === 'micro_guide' ? entry.screen || 'MicroGuide' : entry.screen,
          params:
            entry.type === 'micro_guide'
              ? { ...(entry.params || {}), guideId: entry.params?.guideId || entry.id }
              : entry.params,
          interventionType: entry.type,
          tags: entry.tags,
        };
        if (entry.type === 'micro_guide') {
          const card = getMicroGuideCardFields(entry.id, language);
          if (card) {
            return {
              ...base,
              ...card,
              label: card.previewTitle || base.label,
              description: card.previewSummary,
            };
          }
        }
        const psychoTopic = normalizePsychoeducationTopic(entry.params?.topic);
        if (entry.type === 'psychoeducation' && psychoTopic) {
          const card = getPsychoeducationCardFields(psychoTopic, language);
          if (card) {
            return {
              ...base,
              ...card,
              label: card.previewTitle || base.label,
              params: { ...(entry.params || {}), topic: psychoTopic },
              description: card.previewSummary,
            };
          }
        }
        return base;
      }
      return {
        id,
        label: id || 'Sugerencia',
        icon: '💡',
        screen: null,
        interventionType: 'unknown',
        tags: [],
      };
    });
  }
}

export default new ActionSuggestionService();

