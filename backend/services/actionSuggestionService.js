import { getInterventionCatalogEntry } from '../constants/interventionCatalog.js';

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
          general: ['mindfulness_reminder', 'self_care'],
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
          general: ['gratitude_journal', 'activity_suggestion'],
          relaciones: ['communication_tool', 'self_care'],
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
          general: ['anger_management', 'physical_activity'],
          relaciones: ['communication_tool', 'boundary_setting'],
          trabajo: ['boundary_setting', 'task_break']
        }
      },
      culpa: {
        high: {
          general: ['self_compassion_exercise', 'forgiveness_work'],
          relaciones: ['self_compassion_exercise', 'communication_tool']
        },
        medium: {
          general: ['self_compassion_exercise', 'values_exploration'],
          relaciones: ['communication_tool', 'apology_guide']
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
        social: ['social_anxiety_tool', 'exposure_guide'],
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
   * @param {Object} emotionalAnalysis - Análisis emocional completo
   * @param {Object} contextualAnalysis - Análisis contextual (opcional)
   * @returns {Array} Array de sugerencias de acciones
   */
  generateSuggestions(emotionalAnalysis, contextualAnalysis = {}) {
    if (!emotionalAnalysis) {
      return [];
    }

    const emotion = emotionalAnalysis.mainEmotion;
    const intensity = emotionalAnalysis.intensity || 5;
    const topic = emotionalAnalysis.topic || 'general';
    const subtype = emotionalAnalysis.subtype;

    // Determinar nivel de intensidad
    const intensityLevel = intensity >= 8 ? 'high' : intensity >= 5 ? 'medium' : 'low';

    // Obtener acciones base según emoción e intensidad
    const emotionMappings = this.actionMappings[emotion];
    if (!emotionMappings) {
      return [];
    }

    const intensityMappings = emotionMappings[intensityLevel];
    if (!intensityMappings) {
      return [];
    }

    // Obtener acciones para el tema específico o general
    let actions = intensityMappings[topic] || intensityMappings.general || [];

    // Ajustar según subtipo si existe
    if (subtype) {
      actions = this.adjustActionsBySubtype(actions, emotion, subtype);
    }

    // Limitar a máximo 3 sugerencias
    const enriched = [...actions];
    // Fase 2 (#127): psicoeducación mínima según emoción (sin LLM, bajo riesgo).
    // Se agrega al final para no romper los defaults actuales.
    if (emotion === 'ansiedad') enriched.push('psychoeducation_anxiety');
    if (emotion === 'tristeza') enriched.push('psychoeducation_depression');
    if (emotion === 'enojo') enriched.push('psychoeducation_stress');
    if (emotion === 'miedo') enriched.push('psychoeducation_anxiety');
    return enriched.slice(0, 3);
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
    return [...ids].filter(Boolean);
  }

  /**
   * Formatea las sugerencias para mostrar en la UI
   * @param {Array} actionIds - IDs de acciones
   * @returns {Array} Array de objetos con información formateada
   */
  formatSuggestions(actionIds) {
    return actionIds.map((raw) => {
      const id = String(raw || '').trim();
      const entry = getInterventionCatalogEntry(id);
      if (entry) {
        return {
          id: entry.id,
          label: entry.label,
          icon: entry.icon,
          screen: entry.screen,
          params: entry.params,
          interventionType: entry.type,
          tags: entry.tags,
        };
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

