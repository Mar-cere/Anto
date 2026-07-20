/**
 * Casos golden de regresión del system prompt (#119).
 * No llaman a OpenAI: validan que el ensamblado del prompt conserve reglas sensibles.
 */

import { CLARIFY_MIN_USER_MESSAGE_CHARS } from '../../services/chat/lowConfidenceClarifyTemplate.js';
import { SENSITIVE_VNP_INTENSITY_MIN } from '../../services/chat/sensitiveResponseTemplate.js';

const longLowConfUser =
  'Llevo días mal y no sé si quiero solo desahogarme o que me orientes con algo concreto.';

const screenshotProgressEs =
  'Nada he podido avanzar con mis cosas, mi pareja esta yendo a psicóloga y se siente relativamente mejor';
const screenshotProgressEsComma =
  'Nada, he podido avanzar con mis cosas, mi pareja está yendo a psicóloga y se siente relativamente mejor';
const screenshotProgressEn =
  "Nothing much, I've been able to make progress with my stuff, my partner is going to a psychologist and feels relatively better";
const screenshotNegationEs =
  'Nada no he podido avanzar con mis cosas esta semana y me frustra';

export const PROMPT_GOLDEN_CASES = [
  {
    id: 'core_anchors_es_default',
    message: { content: 'Hoy quiero hablar un rato de cómo me siento' },
    context: {
      emotional: { mainEmotion: 'neutral', intensity: 4 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.85 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      currentMessage: 'Hoy quiero hablar un rato de cómo me siento',
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### IDIOMA DE RESPUESTA',
        '### POLÍTICA DE GROUNDING',
        '### Reescritura anti-robot',
        '### Jerarquía canónica de reglas',
        '### Mapa de herramientas de la app',
        'como máximo una',
        'Invitar al desahogo',
        '### Acciones de producto'
      ],
      noneOf: []
    }
  },
  {
    id: 'core_anchors_en_profile',
    message: { content: 'I want to talk about how I feel today' },
    context: {
      profile: { preferences: { language: 'en' } },
      emotional: { mainEmotion: 'neutral', intensity: 4 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.85 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      currentMessage: 'I want to talk about how I feel today',
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### RESPONSE LANGUAGE',
        '### GROUNDING POLICY',
        '### Message comprehension',
        '### Canonical rule hierarchy',
        '### App toolkit map',
        '### Product actions'
      ],
      noneOf: []
    }
  },
  {
    id: 'soft_check_in_active_anchors',
    message: { content: 'sigo un poco mal pero ya no tan intenso' },
    context: {
      softCrisisCheckInActive: true,
      emotional: { mainEmotion: 'ansiedad', intensity: 6 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
        urgencia: 'NORMAL',
        tema: { categoria: 'EMOCIONAL' }
      },
      currentMessage: 'sigo un poco mal pero ya no tan intenso',
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Modo check-in suave (#19)', 'propongas tareas'],
      noneOf: ['tool disponible, prefiere NO usarla']
    }
  },
  {
    id: 'technique_and_gratitude_snippet_anchors',
    message: { content: 'Estoy ansiosa y quizás escribir ayuda' },
    context: {
      techniqueSuggestionPromptSnippet: `

### Tarjetas de técnica este turno
La app puede mostrar una tarjeta de: respiración.
No inventes otras técnicas. No empujes si solo quieren hablar. Sin IDs internos en la respuesta.`,
      gratitudeJournalPromptSnippet: `

### Tarjeta de diario / gratitud
Puede aparecer una tarjeta voluntaria de diario o gratitud. No prometas que se guardó. Invita solo si encaja.`,
      emotional: { mainEmotion: 'ansiedad', intensity: 6 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
        urgencia: 'NORMAL',
        tema: { categoria: 'EMOCIONAL' }
      },
      currentMessage: 'Estoy ansiosa y quizás escribir ayuda',
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### Tarjetas de técnica este turno',
        'tarjeta de: respiración',
        '### Tarjeta de diario / gratitud',
        'No prometas que se guardó',
        'Pomodoro'
      ],
      noneOf: ['breathing_exercise']
    }
  },
  {
    id: 'product_action_tool_enabled_policy',
    message: { content: 'Quiero guardar ordenar el escritorio en mis tareas' },
    context: {
      productActionToolEnabled: true,
      emotional: { mainEmotion: 'neutral', intensity: 4 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.8 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      sessionIntention: 'plan',
      currentMessage: 'Quiero guardar ordenar el escritorio en mis tareas',
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### Acciones de producto (tareas/hábitos) — tool disponible',
        'propose_product_action',
        'como máximo una vez'
      ],
      noneOf: []
    }
  },
  {
    id: 'screenshot_nada_he_podido_progress',
    message: { content: screenshotProgressEs },
    context: {
      emotional: { mainEmotion: 'neutral', intensity: 5 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.7 },
        urgencia: 'NORMAL',
        tema: { categoria: 'RELACIONES' }
      },
      currentMessage: screenshotProgressEs,
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### Comprensión del mensaje',
        'Nada',
        'he podido',
        'no reformules como estancamiento',
        '### Literal polarity caution'
      ],
      noneOf: []
    }
  },
  {
    id: 'screenshot_nada_comma_progress',
    message: { content: screenshotProgressEsComma },
    context: {
      emotional: { mainEmotion: 'neutral', intensity: 5 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.7 },
        urgencia: 'NORMAL',
        tema: { categoria: 'RELACIONES' }
      },
      currentMessage: screenshotProgressEsComma,
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### Comprensión del mensaje',
        '### Literal polarity caution',
        'no reformules como estancamiento'
      ],
      noneOf: []
    }
  },
  {
    id: 'screenshot_nothing_much_progress_en',
    message: { content: screenshotProgressEn },
    context: {
      profile: { preferences: { language: 'en' } },
      emotional: { mainEmotion: 'neutral', intensity: 5 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.7 },
        urgencia: 'NORMAL',
        tema: { categoria: 'RELACIONES' }
      },
      currentMessage: screenshotProgressEn,
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        '### Message comprehension',
        '### Literal polarity caution',
        'reframe as being stuck'
      ],
      noneOf: []
    }
  },
  {
    id: 'screenshot_nada_no_he_podido_negation',
    message: { content: screenshotNegationEs },
    context: {
      emotional: { mainEmotion: 'tristeza', intensity: 6 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.75 },
        urgencia: 'NORMAL',
        tema: { categoria: 'EMOCIONAL' }
      },
      currentMessage: screenshotNegationEs,
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Comprensión del mensaje'],
      noneOf: ['### Literal polarity caution']
    }
  },
  {
    id: 'force_short_mode_anchors',
    message: { content: 'ok' },
    context: {
      forceShortMode: true,
      emotional: { mainEmotion: 'neutral', intensity: 3 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.9 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      currentMessage: 'ok',
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        'PREFERENCIA DE SESIÓN',
        'como máximo una pregunta',
        'no inventes hipótesis'
      ],
      noneOf: []
    }
  },
  {
    id: 'crisis_overrides_short_and_allows_safety_q',
    message: { content: 'tengo un plan para no seguir viviendo' },
    context: {
      forceShortMode: true,
      emotional: { mainEmotion: 'tristeza', intensity: 9 },
      contextual: {
        intencion: { tipo: 'CRISIS', confianza: 0.9 },
        urgencia: 'ALTA',
        tema: { categoria: 'SALUD' }
      },
      crisis: { riskLevel: 'MEDIUM', country: 'GENERAL' },
      currentMessage: 'tengo un plan para no seguir viviendo',
      history: [],
      memory: {}
    },
    expect: {
      allOf: [
        'NIVEL DE RIESGO: MEDIUM',
        'EXCEPCIÓN a',
        'preguntas de seguridad del protocolo',
        'PREVALECE sobre ritmo'
      ],
      noneOf: []
    }
  },
  {
    id: 'vnp_high_intensity',
    message: { content: 'no aguanto más este dolor' },
    context: {
      emotional: { mainEmotion: 'tristeza', intensity: SENSITIVE_VNP_INTENSITY_MIN },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
        urgencia: 'NORMAL',
        tema: { categoria: 'EMOCIONAL' }
      },
      currentMessage: 'no aguanto más este dolor',
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Turno sensible', 'Normalizar sin minimizar', 'Una sola pregunta'],
      noneOf: []
    }
  },
  {
    id: 'low_confidence_clarify',
    message: { content: longLowConfUser },
    context: {
      emotional: { mainEmotion: 'neutral', intensity: 5 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      currentMessage: longLowConfUser,
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Baja certeza interpretativa', 'una sola pregunta concreta'],
      noneOf: []
    }
  },
  {
    id: 'understanding_non_baseline',
    message: { content: 'necesito hablar con alguien' },
    context: {
      emotional: { mainEmotion: 'ansiedad', intensity: 6 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
        urgencia: 'NORMAL',
        tema: { categoria: 'EMOCIONAL' }
      },
      currentMessage: 'necesito hablar con alguien',
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Entendimiento previo a responder', 'AYUDA_EMOCIONAL'],
      noneOf: []
    }
  },
  {
    id: 'crisis_medium_prepended',
    message: { content: 'tengo un plan para no seguir viviendo' },
    context: {
      emotional: { mainEmotion: 'tristeza', intensity: 9 },
      contextual: {
        intencion: { tipo: 'CRISIS', confianza: 0.9 },
        urgencia: 'ALTA',
        tema: { categoria: 'SALUD' }
      },
      crisis: { riskLevel: 'MEDIUM', country: 'GENERAL' },
      currentMessage: 'tengo un plan para no seguir viviendo',
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['SITUACIÓN DE CRISIS', 'NIVEL DE RIESGO: MEDIUM', '### Turno sensible'],
      noneOf: []
    }
  },
  {
    id: 'session_phase_acute_closure_policy',
    message: { content: 'no puedo más' },
    context: {
      sessionPhase: 'acute',
      emotional: { mainEmotion: 'ansiedad', intensity: 8 },
      contextual: {
        intencion: { tipo: 'CRISIS', confianza: 0.95 },
        urgencia: 'ALTA',
        tema: { categoria: 'SALUD' }
      },
      sessionRetention: {
        likelyFarewell: false,
        nearThreadLimit: false,
        suggestBridgeClosing: true,
        suggestFatigueClosing: true,
        suggestThematicMicroClosure: true,
        suggestCheckpointPause: true,
        suggestReturningUserWarmOpen: false,
        suggestFirstTimeExpectation: false
      },
      conversationPattern: {},
      currentMessage: 'no puedo más',
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Cierre con avance (fase de seguridad)', 'no síntesis de cierre de tramo'],
      noneOf: ['Varios turnos ya compartidos', 'Hilo ya largo:']
    }
  },
  {
    id: 'early_greeting_no_closure_pressure',
    message: { content: 'Hoy estoy bien' },
    context: {
      emotional: { mainEmotion: 'neutral', intensity: 4 },
      contextual: {
        intencion: { tipo: 'GREETING', confianza: 0.85 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      sessionPhase: 'default',
      sessionRetention: {
        userTurnCount: 1,
        totalMessages: 2,
        priorConversationCount: 3,
        suggestReturningUserWarmOpen: true,
        suggestBridgeClosing: false,
        suggestFatigueClosing: false,
        suggestThematicMicroClosure: false,
        suggestCheckpointPause: false,
        likelyFarewell: false
      },
      conversationPattern: { closureRisk: false, questionStreakCount: 0 },
      currentMessage: 'Hoy estoy bien',
      history: [{ role: 'assistant', content: 'Hola, ¿qué tal estás hoy?' }],
      memory: {}
    },
    expect: {
      allOf: ['### Ritmo del turno (inicio de hilo)', 'Sesión y retorno (apertura)'],
      noneOf: [
        '### Cierre con avance (cuando el tramo ya aterrizó)',
        'sentir que el tramo tuvo una conclusión',
        'podemos cerrar aquí este tramo'
      ]
    }
  },
  {
    id: 'panic_attack_recovery_no_closure_prompt',
    message: { content: 'Ya va bajando' },
    context: {
      sessionPhase: 'default',
      emotional: { mainEmotion: 'ansiedad', intensity: 5 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.85 },
        urgencia: 'NORMAL',
        tema: { categoria: 'SALUD' }
      },
      crisis: { riskLevel: 'LOW', country: 'GENERAL' },
      sessionRetention: {
        userTurnCount: 5,
        totalMessages: 10,
        priorConversationCount: 1,
        suggestBridgeClosing: false,
        suggestFatigueClosing: false,
        suggestThematicMicroClosure: false,
        suggestCheckpointPause: false,
        likelyFarewell: false
      },
      conversationPattern: { closureRisk: false, questionStreakCount: 0 },
      currentMessage: 'Ya va bajando',
      safetyHistory: [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Hola, ¿cómo estás hoy?' },
        { role: 'user', content: 'Hoy mal' },
        { role: 'assistant', content: 'Vaya, hoy se siente pesado.' },
        { role: 'user', content: 'Todo, tuve crisis de panico' },
        { role: 'assistant', content: 'Eso puede dejarte muy sacudido.' },
        { role: 'user', content: 'Acaba de pasar' },
        { role: 'assistant', content: 'Entonces tu cuerpo sigue en alerta.' },
        { role: 'user', content: 'Ya va bajando' }
      ],
      history: [],
      memory: {}
    },
    expect: {
      allOf: ['### Hilo reciente (resumen breve', 'crisis de panico'],
      noneOf: [
        'podemos cerrar aquí este tramo',
        'retomarlo cuando quieras desde este punto',
        'La carga emocional o temática parece más baja',
        'Varios turnos ya compartidos'
      ]
    }
  }
];

/** Asegura que el caso de baja certeza cumple longitud mínima del módulo #57. */
if (longLowConfUser.length < CLARIFY_MIN_USER_MESSAGE_CHARS) {
  throw new Error('promptRegression.fixtures: longLowConfUser demasiado corto para #57');
}
