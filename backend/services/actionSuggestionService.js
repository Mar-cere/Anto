import {
  getInterventionCatalogEntry,
  getInterventionCatalogLabel,
} from '../constants/interventionCatalog.js';
import {
  getPsychoeducationCardFields,
  normalizePsychoeducationTopic,
} from '../constants/psychoeducation.js';
import { rankInterventionIds } from './interventionRankingService.js';

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
      /(?:estrés|estres(?:ado|ada)?|agotad[oa]|(?:trabajo|laboral).*agotad|presión\s+(?:laboral|en\s+el\s+trabajo|académica)|demasiadas\s+responsabilidades|sobrecarga\s+(?:laboral|de\s+trabajo)|\bstress(?:ed)?\b|burned?\s+out|overwhelmed|too\s+many\s+responsibilities|work\s+pressure)/i,
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

/** Señales de cadena pensamiento → consecuencia; activa ABC (#86). */
export const CONTEXTUAL_ABC_PATTERN =
  /(?:pienso\s+lo\s+peor|siempre\s+pienso|peor\s+escenario|worst.?case|keep\s+thinking\s+the\s+worst|automatic\s+thought|pensamiento\s+autom[aá]tico|repaso\s+(?:una\s+y\s+otra|sin\s+parar)|darle\s+vueltas|no\s+paro\s+de\s+(?:pensar|darle\s+vueltas)|can'?t\s+stop\s+thinking|going\s+over\s+and\s+over|reaccion[eé]\s+mal|reacted\s+badly|qu[eé]\s+pas[oó]\s+en\s+mi\s+cabeza|what\s+went\s+through\s+my\s+mind)/i;

/** Señales de evitación/miedo; activa jerarquía de exposición (#87). */
export const CONTEXTUAL_EXPOSURE_PATTERN =
  /(?:evit(?:o|ar|ación|ando)|miedo\s+a|temor\s+a|fobia|p[aá]nico|me\s+da\s+(?:mucho\s+)?miedo|no\s+puedo\s+(?:entrar|salir|hacer|decir)|afraid\s+of|avoid(?:ing)?|panic\s+about|scared\s+to|social\s+anxiety|ansiedad\s+social|me\s+paraliza|me\s+bloquea)/i;

const TCC_MEDIUM_EMOTIONS = new Set(['tristeza', 'enojo', 'culpa']);
const ABC_RECORD_ID = 'abc_record';
const EXPOSURE_HIERARCHY_ID = 'exposure_hierarchy';

export function shouldBoostExposureSuggestion(userContent = '') {
  return CONTEXTUAL_EXPOSURE_PATTERN.test(String(userContent || ''));
}

/** Señal TCC fuerte (#86/#87): permite sugerencias en 1.er turno aunque intensidad < 7. */
export function shouldBypassTccSuggestionCadence(userContent = '') {
  return (
    shouldBoostAbcSuggestion(userContent) || shouldBoostExposureSuggestion(userContent)
  );
}

export function applyExposureSuggestionPolicy(ids, { emotion, intensityLevel, userContent } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return ids;
  if (emotion !== 'ansiedad' || intensityLevel !== 'medium') return ids.slice(0, 3);

  const contextualAvoidance = shouldBoostExposureSuggestion(userContent);
  let list = [...ids];

  if (!list.includes(EXPOSURE_HIERARCHY_ID) && contextualAvoidance) {
    list = [EXPOSURE_HIERARCHY_ID, ...list];
  }

  if (!list.includes(EXPOSURE_HIERARCHY_ID)) return list.slice(0, 3);

  if (contextualAvoidance) {
    list = [EXPOSURE_HIERARCHY_ID, ...list.filter((id) => id !== EXPOSURE_HIERARCHY_ID)];
  }

  return list.slice(0, 3);
}

export function shouldBoostAbcSuggestion(userContent = '') {
  return CONTEXTUAL_ABC_PATTERN.test(String(userContent || ''));
}

/**
 * Prioriza ABC en intensidad media TCC: fija primer slot y/o inyecta si hay señal cognitiva.
 */
export function applyAbcSuggestionPolicy(ids, { emotion, intensityLevel, userContent } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return ids;
  if (intensityLevel !== 'medium' || !TCC_MEDIUM_EMOTIONS.has(emotion)) return ids.slice(0, 3);

  const contextualThought = shouldBoostAbcSuggestion(userContent);
  let list = [...ids];

  if (!list.includes(ABC_RECORD_ID) && contextualThought) {
    list = [ABC_RECORD_ID, ...list];
  }

  if (!list.includes(ABC_RECORD_ID)) return list.slice(0, 3);

  list = [ABC_RECORD_ID, ...list.filter((id) => id !== ABC_RECORD_ID)];
  return list.slice(0, 3);
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
    /(?:\bsad\b|\bdepressed\b|\bhopeless\b|feel(?:ing)?\s+(?:sad|low|down)|\blow\b.*\bfeel)/i.test(
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
          general: ['exposure_hierarchy', 'mindfulness_reminder', 'self_care'],
          trabajo: ['task_organization', 'time_management'],
          relaciones: ['communication_tool', 'boundary_setting']
        }
      },
      tristeza: {
        high: {
          general: ['self_compassion_exercise', 'support_contact'],
          relaciones: ['self_compassion_exercise', 'communication_tool'],
          pérdida: ['grief_support', 'memory_exercise']
        },
        medium: {
          general: ['abc_record', 'gratitude_journal', 'activity_suggestion'],
          relaciones: ['abc_record', 'communication_tool', 'self_care'],
          pérdida: ['grief_support', 'self_compassion_exercise']
        }
      },
      enojo: {
        high: {
          general: ['timeout_technique', 'breathing_exercise'],
          relaciones: ['timeout_technique', 'communication_tool'],
          trabajo: ['timeout_technique', 'boundary_setting']
        },
        medium: {
          general: ['abc_record', 'anger_management', 'physical_activity'],
          relaciones: ['abc_record', 'communication_tool', 'boundary_setting'],
          trabajo: ['abc_record', 'boundary_setting', 'task_break']
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
        duelo: ['grief_support', 'memory_exercise'],
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
      return ranked.slice(0, 3);
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
    const techniqueLimit = contextualPsycho.length > 0 ? 1 : 2;
    const enriched = [...actions].slice(0, techniqueLimit);

    const emotionPsycho = [];
    if (emotion === 'ansiedad') emotionPsycho.push('psychoeducation_anxiety');
    if (emotion === 'tristeza') emotionPsycho.push('psychoeducation_depression');
    if (emotion === 'enojo') emotionPsycho.push('psychoeducation_anger');
    if (emotion === 'miedo') emotionPsycho.push('psychoeducation_anxiety');

    appendUniqueIds(enriched, [...contextualPsycho, ...emotionPsycho]);

    const rankingScores = options?.rankingScores;
    const ranked =
      rankingScores instanceof Map && rankingScores.size > 0
        ? rankInterventionIds(enriched, rankingScores)
        : enriched;
    return applyExposureSuggestionPolicy(
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
    );
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
    CONTEXTUAL_PSYCHOEDUCATION_RULES.forEach(({ id }) => ids.add(id));
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
          screen: entry.screen,
          params: entry.params,
          interventionType: entry.type,
          tags: entry.tags,
        };
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

