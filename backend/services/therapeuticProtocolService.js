/**
 * Servicio de Protocolos Terapéuticos Multi-Turno
 * Gestiona secuencias estructuradas de intervenciones terapéuticas
 * que se desarrollan a lo largo de múltiples mensajes
 */
class TherapeuticProtocolService {
  constructor() {
    // Protocolos disponibles
    this.protocols = {
      panic_protocol: {
        name: 'Protocolo de Crisis de Pánico',
        steps: [
          {
            step: 1,
            name: 'Validación y Grounding',
            intervention: 'validación_grounding',
            description: 'Validar la experiencia y ayudar a conectar con el presente',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Exploración de Pensamientos',
            intervention: 'exploración_pensamientos',
            description: 'Identificar pensamientos catastróficos y reestructurarlos',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Técnica de Respiración',
            intervention: 'respiración_controlada',
            description: 'Aplicar técnica de respiración para regular el sistema nervioso',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Cierre y Refuerzo',
            intervention: 'cierre_refuerzo',
            description: 'Cerrar la intervención y reforzar recursos',
            nextStep: null // Fin del protocolo
          }
        ]
      },
      guilt_protocol: {
        name: 'Protocolo de Culpa Intensa',
        steps: [
          {
            step: 1,
            name: 'Validación de la Emoción',
            intervention: 'validación_culpa',
            description: 'Validar que la culpa es una emoción válida',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Exploración de Responsabilidad',
            intervention: 'exploración_responsabilidad',
            description: 'Distinguir entre responsabilidad real y autoculpa excesiva',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Autocompasión',
            intervention: 'autocompasión',
            description: 'Aplicar técnica de autocompasión',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Acción Reparadora',
            intervention: 'acción_reparadora',
            description: 'Explorar acciones constructivas si es apropiado',
            nextStep: null
          }
        ]
      },
      loneliness_protocol: {
        name: 'Protocolo de Soledad',
        steps: [
          {
            step: 1,
            name: 'Validación y Normalización',
            intervention: 'validación_soledad',
            description: 'Validar la experiencia de soledad',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Exploración de Necesidades',
            intervention: 'exploración_necesidades',
            description: 'Identificar qué tipo de conexión se necesita',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Recursos y Estrategias',
            intervention: 'recursos_conexión',
            description: 'Explorar formas de conectar con otros o con uno mismo',
            nextStep: null
          }
        ]
      }
    };

    // Almacenar protocolos activos por usuario (userId -> protocolo activo)
    this.activeProtocols = new Map();
  }

  /**
   * Inicia un protocolo terapéutico para un usuario
   * @param {string} userId - ID del usuario
   * @param {string} protocolName - Nombre del protocolo
   * @returns {Object|null} Protocolo iniciado o null si no existe
   */
  startProtocol(userId, protocolName) {
    const protocol = this.protocols[protocolName];
    if (!protocol) {
      return null;
    }

    const activeProtocol = {
      protocolName,
      currentStep: 1,
      startedAt: new Date(),
      steps: protocol.steps
    };

    this.activeProtocols.set(userId, activeProtocol);
    return activeProtocol;
  }

  /**
   * Obtiene el protocolo activo de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Object|null} Protocolo activo o null
   */
  getActiveProtocol(userId) {
    return this.activeProtocols.get(userId) || null;
  }

  /**
   * Avanza al siguiente paso del protocolo
   * @param {string} userId - ID del usuario
   * @returns {Object|null} Siguiente paso o null si el protocolo terminó
   */
  advanceProtocol(userId) {
    const activeProtocol = this.activeProtocols.get(userId);
    if (!activeProtocol) {
      return null;
    }

    const currentStepData = activeProtocol.steps.find(s => s.step === activeProtocol.currentStep);
    if (!currentStepData || !currentStepData.nextStep) {
      // Protocolo terminado
      this.activeProtocols.delete(userId);
      return null;
    }

    activeProtocol.currentStep = currentStepData.nextStep;
    return activeProtocol.steps.find(s => s.step === activeProtocol.currentStep);
  }

  /**
   * Finaliza un protocolo activo
   * @param {string} userId - ID del usuario
   */
  endProtocol(userId) {
    this.activeProtocols.delete(userId);
  }

  /**
   * Determina si se debe iniciar un protocolo basado en el análisis emocional
   * @param {Object} emotionalAnalysis - Análisis emocional
   * @param {Object} contextualAnalysis - Análisis contextual
   * @returns {string|null} Nombre del protocolo a iniciar o null
   */
  shouldStartProtocol(emotionalAnalysis, contextualAnalysis) {
    const emotion = emotionalAnalysis?.mainEmotion;
    const intensity = emotionalAnalysis?.intensity || 0;
    const subtype = emotionalAnalysis?.subtype;

    // Protocolo de pánico para ansiedad intensa con síntomas físicos
    if (emotion === 'ansiedad' && intensity >= 9 && 
        (subtype === 'anticipatoria' || contextualAnalysis?.intencion?.tipo === 'CRISIS')) {
      return 'panic_protocol';
    }

    // Protocolo de culpa para culpa intensa
    if (emotion === 'culpa' && intensity >= 8 && subtype === 'autoculpa') {
      return 'guilt_protocol';
    }

    // Protocolo de soledad para tristeza con subtipo soledad
    if (emotion === 'tristeza' && intensity >= 7 && subtype === 'soledad') {
      return 'loneliness_protocol';
    }

    return null;
  }

  /**
   * Obtiene la intervención para el paso actual del protocolo
   * @param {string} userId - ID del usuario
   * @returns {Object|null} Intervención del paso actual
   */
  getCurrentIntervention(userId) {
    const activeProtocol = this.getActiveProtocol(userId);
    if (!activeProtocol) {
      return null;
    }

    return activeProtocol.steps.find(s => s.step === activeProtocol.currentStep);
  }
}

export default new TherapeuticProtocolService();

