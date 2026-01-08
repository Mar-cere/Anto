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
      },
      depression_protocol: {
        name: 'Protocolo de Depresión (CBT)',
        description: 'Protocolo estructurado basado en TCC para síntomas depresivos',
        steps: [
          {
            step: 1,
            name: 'Evaluación y Validación',
            intervention: 'evaluación_depresión',
            description: 'Evaluar síntomas y validar la experiencia',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Activación Conductual',
            intervention: 'activación_conductual',
            description: 'Identificar y programar actividades agradables',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Reestructuración Cognitiva',
            intervention: 'reestructuración_cognitiva',
            description: 'Identificar y desafiar pensamientos negativos',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Desarrollo de Habilidades',
            intervention: 'habilidades_afrontamiento',
            description: 'Desarrollar estrategias de afrontamiento',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Prevención de Recaídas',
            intervention: 'prevención_recaídas',
            description: 'Identificar señales de alerta y plan de acción',
            nextStep: null
          }
        ]
      },
      anxiety_protocol: {
        name: 'Protocolo de Ansiedad Generalizada (CBT)',
        description: 'Protocolo estructurado para ansiedad generalizada',
        steps: [
          {
            step: 1,
            name: 'Psicoeducación sobre Ansiedad',
            intervention: 'psicoeducación_ansiedad',
            description: 'Explicar qué es la ansiedad y cómo funciona',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Identificación de Preocupaciones',
            intervention: 'identificación_preocupaciones',
            description: 'Identificar preocupaciones específicas y patrones',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Técnicas de Relajación',
            intervention: 'relajación',
            description: 'Aprender técnicas de respiración y relajación',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Reestructuración Cognitiva',
            intervention: 'reestructuración_ansiedad',
            description: 'Desafiar pensamientos ansiosos y generar alternativas',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Exposición Gradual',
            intervention: 'exposición_gradual',
            description: 'Enfrentar situaciones temidas de manera gradual',
            nextStep: 6
          },
          {
            step: 6,
            name: 'Mantenimiento',
            intervention: 'mantenimiento_ansiedad',
            description: 'Estrategias de mantenimiento y prevención',
            nextStep: null
          }
        ]
      },
      anger_protocol: {
        name: 'Protocolo de Manejo de Ira',
        description: 'Protocolo para manejo de enojo e ira',
        steps: [
          {
            step: 1,
            name: 'Reconocimiento de Señales',
            intervention: 'reconocimiento_señales',
            description: 'Identificar señales físicas y emocionales de ira',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Técnicas de Enfriamiento',
            intervention: 'enfriamiento',
            description: 'Aplicar técnicas inmediatas para reducir intensidad',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Identificación de Disparadores',
            intervention: 'disparadores_ira',
            description: 'Identificar situaciones y pensamientos que disparan la ira',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Reestructuración Cognitiva',
            intervention: 'reestructuración_ira',
            description: 'Desafiar pensamientos que intensifican la ira',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Habilidades de Comunicación',
            intervention: 'comunicación_asertiva',
            description: 'Desarrollar comunicación asertiva en lugar de agresiva',
            nextStep: null
          }
        ]
      },
      self_compassion_protocol: {
        name: 'Protocolo de Autocompasión',
        description: 'Protocolo basado en terapia de autocompasión',
        steps: [
          {
            step: 1,
            name: 'Reconocimiento del Sufrimiento',
            intervention: 'reconocimiento_sufrimiento',
            description: 'Reconocer y validar el propio sufrimiento',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Humanidad Común',
            intervention: 'humanidad_común',
            description: 'Reconocer que el sufrimiento es parte de la experiencia humana',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Mindfulness',
            intervention: 'mindfulness_autocompasión',
            description: 'Observar pensamientos y emociones sin juicio',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Amabilidad Consigo Mismo',
            intervention: 'amabilidad',
            description: 'Practicar amabilidad y cuidado hacia uno mismo',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Integración',
            intervention: 'integración_autocompasión',
            description: 'Integrar autocompasión en la vida diaria',
            nextStep: null
          }
        ]
      },
      sleep_protocol: {
        name: 'Protocolo de Higiene del Sueño',
        description: 'Protocolo para mejorar problemas de sueño',
        steps: [
          {
            step: 1,
            name: 'Evaluación del Sueño',
            intervention: 'evaluación_sueño',
            description: 'Evaluar patrones y problemas de sueño',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Higiene del Sueño',
            intervention: 'higiene_sueño',
            description: 'Establecer rutinas y hábitos saludables',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Control de Estímulos',
            intervention: 'control_estímulos',
            description: 'Asociar la cama solo con dormir',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Relajación Pre-Sueño',
            intervention: 'relajación_sueño',
            description: 'Técnicas de relajación antes de dormir',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Manejo de Pensamientos',
            intervention: 'pensamientos_sueño',
            description: 'Manejar preocupaciones y pensamientos que interfieren',
            nextStep: null
          }
        ]
      },
      trauma_protocol: {
        name: 'Protocolo de Trauma (Adaptado)',
        description: 'Protocolo basado en TCC para trauma y TEPT',
        steps: [
          {
            step: 1,
            name: 'Estabilización y Seguridad',
            intervention: 'estabilización_trauma',
            description: 'Establecer sensación de seguridad y estabilidad',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Psicoeducación sobre Trauma',
            intervention: 'psicoeducación_trauma',
            description: 'Explicar cómo el trauma afecta el cuerpo y la mente',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Técnicas de Grounding',
            intervention: 'grounding_trauma',
            description: 'Aprender técnicas para mantenerse presente durante activaciones',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Regulación Emocional',
            intervention: 'regulación_trauma',
            description: 'Desarrollar habilidades para regular emociones intensas',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Procesamiento Gradual',
            intervention: 'procesamiento_trauma',
            description: 'Procesar recuerdos traumáticos de manera gradual y segura',
            nextStep: 6
          },
          {
            step: 6,
            name: 'Reintegración',
            intervention: 'reintegración_trauma',
            description: 'Integrar experiencias y desarrollar narrativa coherente',
            nextStep: null
          }
        ]
      },
      ocd_protocol: {
        name: 'Protocolo de TOC (Terapia de Exposición y Prevención de Respuesta)',
        description: 'Protocolo basado en ERP para trastorno obsesivo-compulsivo',
        steps: [
          {
            step: 1,
            name: 'Psicoeducación sobre TOC',
            intervention: 'psicoeducación_toc',
            description: 'Explicar qué es el TOC y cómo funciona el ciclo obsesión-compulsión',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Identificación de Obsesiones y Compulsiones',
            intervention: 'identificación_toc',
            description: 'Identificar obsesiones, compulsiones y disparadores',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Creación de Jerarquía de Exposición',
            intervention: 'jerarquía_toc',
            description: 'Crear lista graduada de situaciones temidas',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Exposición Gradual',
            intervention: 'exposición_toc',
            description: 'Exponerse gradualmente a situaciones temidas',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Prevención de Respuesta',
            intervention: 'prevención_respuesta',
            description: 'Resistir la compulsión mientras se está expuesto',
            nextStep: 6
          },
          {
            step: 6,
            name: 'Reestructuración Cognitiva',
            intervention: 'reestructuración_toc',
            description: 'Desafiar creencias sobre las obsesiones y compulsiones',
            nextStep: 7
          },
          {
            step: 7,
            name: 'Mantenimiento',
            intervention: 'mantenimiento_toc',
            description: 'Estrategias para mantener el progreso y prevenir recaídas',
            nextStep: null
          }
        ]
      },
      ptsd_protocol: {
        name: 'Protocolo de TEPT (Terapia Prolongada Adaptada)',
        description: 'Protocolo para síntomas de TEPT',
        steps: [
          {
            step: 1,
            name: 'Evaluación y Estabilización',
            intervention: 'evaluación_ptsd',
            description: 'Evaluar síntomas y establecer estabilidad emocional',
            nextStep: 2
          },
          {
            step: 2,
            name: 'Psicoeducación sobre TEPT',
            intervention: 'psicoeducación_ptsd',
            description: 'Explicar síntomas de TEPT y cómo afectan la vida diaria',
            nextStep: 3
          },
          {
            step: 3,
            name: 'Habilidades de Afrontamiento',
            intervention: 'afrontamiento_ptsd',
            description: 'Desarrollar habilidades para manejar síntomas',
            nextStep: 4
          },
          {
            step: 4,
            name: 'Exposición Imaginaria',
            intervention: 'exposición_imaginaria',
            description: 'Procesar recuerdos traumáticos de manera segura',
            nextStep: 5
          },
          {
            step: 5,
            name: 'Exposición In Vivo',
            intervention: 'exposición_invivo',
            description: 'Enfrentar situaciones evitadas relacionadas con el trauma',
            nextStep: 6
          },
          {
            step: 6,
            name: 'Reestructuración Cognitiva',
            intervention: 'reestructuración_ptsd',
            description: 'Desafiar creencias negativas sobre el trauma',
            nextStep: 7
          },
          {
            step: 7,
            name: 'Prevención de Recaídas',
            intervention: 'prevención_ptsd',
            description: 'Desarrollar plan para mantener el progreso',
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
    const content = contextualAnalysis?.content || '';

    // Protocolo de pánico para ansiedad intensa con síntomas físicos o crisis
    const hasPanicKeywords = /(?:ataque.*de.*pánico|no.*puedo.*respirar|me.*ahogo|palpitaciones|siento.*que.*me.*voy.*a.*morir)/i.test(content);
    
    if (emotion === 'ansiedad' && intensity >= 8 && 
        (hasPanicKeywords || 
         subtype === 'anticipatoria' || 
         contextualAnalysis?.intencion?.tipo === 'CRISIS' ||
         intensity >= 9)) {
      return 'panic_protocol';
    }

    // Protocolo de depresión para tristeza persistente o intensa
    const hasDepressionKeywords = /(?:deprimido|sin.*esperanza|sin.*energía|no.*tengo.*ganas|perdí.*interés)/i.test(content);
    if (emotion === 'tristeza' && intensity >= 7 && 
        (hasDepressionKeywords || intensity >= 8 || subtype === 'depresión')) {
      return 'depression_protocol';
    }

    // Protocolo de ansiedad generalizada
    const hasAnxietyKeywords = /(?:preocupado|ansioso|nervioso|me.*preocupo.*demasiado|no.*puedo.*dejar.*de.*preocuparme)/i.test(content);
    if (emotion === 'ansiedad' && intensity >= 6 && 
        (hasAnxietyKeywords || subtype === 'generalizada')) {
      return 'anxiety_protocol';
    }

    // Protocolo de manejo de ira
    const hasAngerKeywords = /(?:enojado|furioso|ira|rabia|me.*molesta|me.*irrita)/i.test(content);
    if (emotion === 'enojo' && intensity >= 7 && hasAngerKeywords) {
      return 'anger_protocol';
    }

    // Protocolo de culpa para culpa intensa
    if (emotion === 'culpa' && intensity >= 8 && subtype === 'autoculpa') {
      return 'guilt_protocol';
    }

    // Protocolo de soledad para tristeza con subtipo soledad
    if (emotion === 'tristeza' && intensity >= 7 && subtype === 'soledad') {
      return 'loneliness_protocol';
    }

    // Protocolo de autocompasión para autocrítica excesiva
    const hasSelfCriticismKeywords = /(?:soy.*un.*fracaso|no.*sirvo|soy.*inútil|me.*critico|autocrítica)/i.test(content);
    if (hasSelfCriticismKeywords && intensity >= 6) {
      return 'self_compassion_protocol';
    }

    // Protocolo de sueño para problemas de sueño mencionados
    const hasSleepKeywords = /(?:problemas.*dormir|insomnio|no.*puedo.*dormir|sueño.*interrumpido|duermo.*mal)/i.test(content);
    if (hasSleepKeywords) {
      return 'sleep_protocol';
    }

    // Protocolo de trauma para síntomas de trauma/TEPT
    const hasTraumaKeywords = /(?:trauma|ptsd|tpt|recuerdo.*traumático|flashback|revivir|experiencia.*traumática)/i.test(content);
    const hasTraumaSymptoms = /(?:pesadillas|evitar|hipervigilancia|entumecimiento|disociación)/i.test(content);
    if ((hasTraumaKeywords || hasTraumaSymptoms) && intensity >= 7) {
      // Distinguir entre trauma general y TEPT
      if (hasTraumaKeywords && /(?:ptsd|tpt|trastorno.*estrés.*postraumático)/i.test(content)) {
        return 'ptsd_protocol';
      }
      return 'trauma_protocol';
    }

    // Protocolo de TOC para síntomas obsesivo-compulsivos
    const hasOCDKeywords = /(?:toc|obsesión|compulsión|ritual|verificar.*muchas.*veces|pensamiento.*obsesivo|comportamiento.*compulsivo)/i.test(content);
    const hasOCDSymptoms = /(?:tengo.*que.*hacer|no.*puedo.*dejar.*de|me.*obsesiona|ritual|verificar.*repetidamente)/i.test(content);
    if ((hasOCDKeywords || hasOCDSymptoms) && intensity >= 6) {
      return 'ocd_protocol';
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

