/**
 * Prevención de Recaídas - Patrones y Estrategias
 * 
 * Detecta señales de recaída y proporciona intervenciones preventivas
 */

export const RELAPSE_WARNING_SIGNS = {
  // Señales emocionales
  emotional: {
    patterns: [
      /(?:volví.*a.*sentirme.*mal|estoy.*peor|retrocedí|empeoré)/i,
      /(?:igual.*que.*antes|como.*siempre|nada.*cambió)/i,
      /(?:me.*siento.*igual|volví.*a.*estar|estoy.*como.*antes)/i
    ],
    indicators: [
      'Aumento de intensidad emocional negativa',
      'Retorno a emociones previas',
      'Pérdida de progreso emocional'
    ]
  },
  
  // Señales conductuales
  behavioral: {
    patterns: [
      /(?:volví.*a|empecé.*de.*nuevo|retomé)/i,
      /(?:no.*puedo.*mantener|no.*sirvo|fracasé)/i,
      /(?:dejé.*de|abandoné|ya.*no.*hago)/i
    ],
    indicators: [
      'Retorno a conductas evitativas',
      'Abandono de actividades saludables',
      'Aislamiento social'
    ]
  },
  
  // Señales cognitivas
  cognitive: {
    patterns: [
      /(?:pensamientos.*negativos|no.*puedo|nunca.*podré)/i,
      /(?:soy.*un.*fracaso|no.*sirvo|nada.*funciona)/i,
      /(?:siempre.*seré|nunca.*cambiaré|no.*tengo.*solución)/i
    ],
    indicators: [
      'Retorno de pensamientos negativos',
      'Pérdida de perspectiva',
      'Catastrofización'
    ]
  }
};

export const RELAPSE_PREVENTION = {
  // Plan de prevención de recaídas
  relapsePreventionPlan: {
    steps: [
      '1. Identificar señales tempranas de advertencia',
      '2. Listar estrategias de afrontamiento que funcionan',
      '3. Identificar situaciones de alto riesgo',
      '4. Crear plan de acción para momentos difíciles',
      '5. Establecer red de apoyo',
      '6. Programar seguimiento regular'
    ]
  },
  
  // Intervenciones cuando se detecta recaída
  interventions: {
    normalize: 'Las recaídas son parte del proceso de cambio. No significa que hayas fallado.',
    reframe: 'Esta es una oportunidad para aprender qué funciona y qué no.',
    activate: '¿Qué estrategia que funcionó antes podrías usar ahora?',
    support: 'No estás solo en esto. Estoy aquí para apoyarte.'
  },
  
  // Mensajes de prevención
  preventionMessages: {
    earlyWarning: 'Noto que algunas señales están apareciendo. ¿Qué estrategias te han funcionado antes?',
    support: 'Las recaídas son normales. Lo importante es cómo respondemos a ellas.',
    hope: 'Has superado dificultades antes. Puedes hacerlo de nuevo.'
  }
};

/**
 * Detecta señales de recaída en un mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Object|null} Objeto con señales detectadas o null
 */
export const detectRelapseSigns = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return null;
  }

  const content = messageContent.toLowerCase();
  const detectedSigns = {
    emotional: false,
    behavioral: false,
    cognitive: false,
    patterns: []
  };
  
  // Detectar señales emocionales
  for (const pattern of RELAPSE_WARNING_SIGNS.emotional.patterns) {
    if (pattern.test(content)) {
      detectedSigns.emotional = true;
      detectedSigns.patterns.push('emotional');
      break;
    }
  }
  
  // Detectar señales conductuales
  for (const pattern of RELAPSE_WARNING_SIGNS.behavioral.patterns) {
    if (pattern.test(content)) {
      detectedSigns.behavioral = true;
      detectedSigns.patterns.push('behavioral');
      break;
    }
  }
  
  // Detectar señales cognitivas
  for (const pattern of RELAPSE_WARNING_SIGNS.cognitive.patterns) {
    if (pattern.test(content)) {
      detectedSigns.cognitive = true;
      detectedSigns.patterns.push('cognitive');
      break;
    }
  }
  
  if (detectedSigns.patterns.length > 0) {
    return detectedSigns;
  }
  
  return null;
};

/**
 * Obtiene una intervención apropiada para prevenir o manejar recaídas
 * @param {Object} detectedSigns - Señales detectadas
 * @returns {Object} Intervención apropiada
 */
export const getRelapseIntervention = (detectedSigns) => {
  if (!detectedSigns || detectedSigns.patterns.length === 0) {
    return null;
  }
  
  // Si hay múltiples señales, es más urgente
  const urgency = detectedSigns.patterns.length > 1 ? 'high' : 'medium';
  
  return {
    urgency,
    message: RELAPSE_PREVENTION.interventions.normalize,
    action: RELAPSE_PREVENTION.interventions.activate,
    support: RELAPSE_PREVENTION.interventions.support
  };
};

