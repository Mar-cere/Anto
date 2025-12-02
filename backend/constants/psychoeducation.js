/**
 * Módulos de Psicoeducación Estructurada
 * 
 * Información educativa sobre condiciones de salud mental,
 * síntomas, causas y tratamiento
 */

export const PSYCHOEDUCATION_MODULES = {
  // Ansiedad
  anxiety: {
    whatIs: 'La ansiedad es una respuesta natural del cuerpo al estrés. Se vuelve problemática cuando es excesiva o persistente.',
    symptoms: [
      'Físicos: palpitaciones, sudoración, tensión muscular, dificultad para respirar',
      'Cognitivos: preocupación excesiva, pensamientos catastróficos, dificultad para concentrarse',
      'Conductuales: evitación, inquietud, necesidad de control'
    ],
    causes: [
      'Factores genéticos y familiares',
      'Experiencias traumáticas o estresantes',
      'Estrés crónico',
      'Pensamientos negativos recurrentes',
      'Cambios importantes en la vida'
    ],
    treatment: [
      'Terapia cognitivo-conductual (TCC)',
      'Técnicas de relajación y respiración',
      'Exposición gradual a situaciones temidas',
      'Medicación (si es necesario y bajo supervisión médica)',
      'Ejercicio regular y hábitos saludables'
    ],
    whenToSeekHelp: 'Si la ansiedad interfiere con tu vida diaria, trabajo, relaciones o bienestar general, es importante buscar ayuda profesional.'
  },
  
  // Depresión
  depression: {
    whatIs: 'La depresión es más que tristeza. Es un trastorno del estado de ánimo que afecta cómo piensas, sientes y actúas.',
    symptoms: [
      'Estado de ánimo bajo persistente',
      'Pérdida de interés o placer en actividades',
      'Cambios en el sueño (insomnio o exceso de sueño)',
      'Cambios en el apetito (aumento o disminución)',
      'Fatiga o pérdida de energía',
      'Sentimientos de inutilidad o culpa',
      'Dificultad para concentrarse o tomar decisiones',
      'Pensamientos de muerte o suicidio'
    ],
    causes: [
      'Factores biológicos (química cerebral)',
      'Factores genéticos',
      'Eventos de vida estresantes',
      'Pensamientos negativos y patrones cognitivos',
      'Aislamiento social',
      'Problemas médicos o medicamentos'
    ],
    treatment: [
      'Terapia (TCC, terapia interpersonal)',
      'Activación conductual',
      'Medicación antidepresiva (bajo supervisión médica)',
      'Ejercicio regular',
      'Apoyo social',
      'Técnicas de autocuidado'
    ],
    whenToSeekHelp: 'Si experimentas síntomas de depresión durante más de dos semanas o si tienes pensamientos de autolesión, busca ayuda profesional inmediatamente.'
  },
  
  // Regulación emocional
  emotionRegulation: {
    whatIs: 'La regulación emocional es la capacidad de manejar y responder a las emociones de forma saludable.',
    skills: [
      'Identificar y nombrar emociones',
      'Entender la función de las emociones',
      'Reducir vulnerabilidad emocional',
      'Aumentar emociones positivas',
      'Aceptar emociones difíciles',
      'Modular la intensidad emocional'
    ],
    techniques: [
      'Mindfulness y atención plena',
      'Respiración profunda y relajación',
      'Reestructuración cognitiva',
      'Activación conductual',
      'Tolerancia al malestar',
      'Comunicación asertiva'
    ],
    benefits: [
      'Mejor manejo del estrés',
      'Relaciones más saludables',
      'Mayor bienestar general',
      'Mejor toma de decisiones',
      'Reducción de conflictos'
    ]
  },
  
  // Estrés
  stress: {
    whatIs: 'El estrés es la respuesta del cuerpo a demandas o desafíos. Puede ser positivo (eustrés) o negativo (distrés).',
    symptoms: [
      'Físicos: dolores de cabeza, tensión muscular, fatiga',
      'Emocionales: irritabilidad, ansiedad, tristeza',
      'Cognitivos: preocupación, dificultad para concentrarse',
      'Conductuales: cambios en el sueño o apetito, aislamiento'
    ],
    causes: [
      'Presiones laborales o académicas',
      'Problemas financieros',
      'Relaciones interpersonales',
      'Cambios importantes en la vida',
      'Problemas de salud',
      'Falta de tiempo o recursos'
    ],
    management: [
      'Identificar fuentes de estrés',
      'Técnicas de relajación',
      'Gestión del tiempo',
      'Ejercicio regular',
      'Sueño adecuado',
      'Apoyo social',
      'Establecer límites saludables'
    ]
  },
  
  // Trauma
  trauma: {
    whatIs: 'El trauma es una respuesta emocional a un evento extremadamente estresante o perturbador que abruma la capacidad de afrontamiento.',
    symptoms: [
      'Reviviscencia del evento (flashbacks, pesadillas)',
      'Evitación de recordatorios del trauma',
      'Hipervigilancia o estado de alerta constante',
      'Cambios negativos en pensamientos y estado de ánimo',
      'Reacciones físicas intensas a recordatorios'
    ],
    types: [
      'Trauma agudo: resultado de un solo evento',
      'Trauma crónico: exposición repetida a eventos traumáticos',
      'Trauma complejo: múltiples eventos traumáticos durante el desarrollo'
    ],
    treatment: [
      'Terapia especializada en trauma (EMDR, TCC para trauma)',
      'Terapia de exposición',
      'Terapia de procesamiento cognitivo',
      'Técnicas de estabilización',
      'Apoyo social y grupos de apoyo'
    ],
    whenToSeekHelp: 'Si experimentas síntomas de trauma que interfieren con tu vida diaria, es importante buscar ayuda de un profesional especializado en trauma.'
  }
};

/**
 * Obtiene información psicoeducativa sobre un tema
 * @param {string} topic - Tema sobre el cual obtener información
 * @returns {Object|null} Módulo de psicoeducación o null
 */
export const getPsychoeducationModule = (topic) => {
  const normalizedTopic = topic.toLowerCase().trim();
  return PSYCHOEDUCATION_MODULES[normalizedTopic] || null;
};

/**
 * Obtiene todos los temas disponibles de psicoeducación
 * @returns {Array} Lista de temas disponibles
 */
export const getAvailableTopics = () => {
  return Object.keys(PSYCHOEDUCATION_MODULES);
};

