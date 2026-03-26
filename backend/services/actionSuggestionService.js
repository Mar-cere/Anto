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
    return actions.slice(0, 3);
  }

  /**
   * Ajusta las acciones según el subtipo emocional
   * @param {Array} actions - Acciones base
   * @param {string} emotion - Emoción principal
   * @param {string} subtype - Subtipo emocional
   * @returns {Array} Acciones ajustadas
   */
  adjustActionsBySubtype(actions, emotion, subtype) {
    // Ajustes específicos por subtipo
    const subtypeAdjustments = {
      ansiedad: {
        social: ['social_anxiety_tool', 'exposure_guide'],
        anticipatoria: ['grounding_technique', 'present_moment_exercise'],
        rendimiento: ['performance_anxiety_tool', 'self_compassion_exercise']
      },
      tristeza: {
        duelo: ['grief_support', 'memory_exercise'],
        soledad: ['connection_exercise', 'support_contact'],
        fracaso: ['self_compassion_exercise', 'reframing_tool']
      }
    };

    const adjustments = subtypeAdjustments[emotion]?.[subtype];
    if (adjustments) {
      // Combinar acciones base con ajustes específicos
      return [...new Set([...actions, ...adjustments])];
    }

    return actions;
  }

  /**
   * Formatea las sugerencias para mostrar en la UI
   * @param {Array} actionIds - IDs de acciones
   * @returns {Array} Array de objetos con información formateada
   */
  formatSuggestions(actionIds) {
    const actionLabels = {
      breathing_exercise: { label: 'Ejercicio de Respiración', icon: '🌬️', screen: 'BreathingExercise' },
      grounding_technique: { label: 'Técnica de Grounding', icon: '🌍', screen: 'GroundingTechnique' },
      mindfulness_reminder: { label: 'Recordatorio de Mindfulness', icon: '🧘', screen: 'Mindfulness' },
      self_care: { label: 'Autocuidado', icon: '💆', screen: 'SelfCare' },
      self_compassion_exercise: { label: 'Ejercicio de Autocompasión', icon: '💚', screen: 'SelfCompassion' },
      support_contact: { label: 'Contactar Apoyo', icon: '📞', screen: 'Profile' },
      gratitude_journal: { label: 'Diario de Gratitud', icon: '📔', screen: 'GratitudeJournal' },
      activity_suggestion: { label: 'Actividad Sugerida', icon: '🎯', screen: 'ActivitySuggestion' },
      timeout_technique: { label: 'Técnica de Tiempo Fuera', icon: '⏸️', screen: 'TimeoutTechnique' },
      communication_tool: { label: 'Herramienta de Comunicación', icon: '💬', screen: 'CommunicationTool' },
      boundary_setting: { label: 'Establecer Límites', icon: '🛡️', screen: 'BoundarySetting' },
      task_break: { label: 'Tomar un Descanso', icon: '☕', screen: 'TaskBreak' },
      grief_support: { label: 'Apoyo en Duelo', icon: '🕯️', screen: 'GriefSupport' },
      memory_exercise: { label: 'Ejercicio de Memoria', icon: '💭', screen: 'MemoryExercise' },
      connection_exercise: { label: 'Ejercicio de Conexión', icon: '🤝', screen: 'ConnectionExercise' },
      social_activity: { label: 'Actividad Social', icon: '👥', screen: 'SocialActivity' }
      ,
      // Fallbacks "humanizados" para acciones que no tienen pantalla dedicada.
      // Importante: nunca mostrar IDs internos crudos en UI.
      performance_anxiety_tool: { label: 'Ansiedad por Rendimiento (guía breve)', icon: '🎤', screen: null },
      present_moment_exercise: { label: 'Volver al Presente (ejercicio breve)', icon: '🫧', screen: null },
      social_anxiety_tool: { label: 'Ansiedad Social (guía breve)', icon: '🧑‍🤝‍🧑', screen: null },
      exposure_guide: { label: 'Exposición Gradual (guía breve)', icon: '🪜', screen: null },
      reframing_tool: { label: 'Reencuadre (cambiar perspectiva)', icon: '🔁', screen: null },
      task_organization: { label: 'Organizar Tareas (pasos rápidos)', icon: '🗂️', screen: null },
      time_management: { label: 'Gestión del Tiempo (tip rápido)', icon: '⏱️', screen: null },
      anger_management: { label: 'Manejar el Enojo (guía breve)', icon: '🧯', screen: null },
      physical_activity: { label: 'Movimiento Suave', icon: '🚶', screen: null },
      forgiveness_work: { label: 'Perdón (ejercicio breve)', icon: '🕊️', screen: null },
      values_exploration: { label: 'Explorar Valores (guía breve)', icon: '🧭', screen: null },
      apology_guide: { label: 'Pedir Disculpas (guía breve)', icon: '🙏', screen: null }
    };

    return actionIds.map(id => ({
      id,
      ...(actionLabels[id] || { label: id, icon: '💡', screen: null })
    }));
  }
}

export default new ActionSuggestionService();

