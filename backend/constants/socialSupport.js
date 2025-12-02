/**
 * Detección y Fortalecimiento de Apoyo Social
 * 
 * Evalúa el apoyo social del usuario y proporciona
 * intervenciones para fortalecerlo
 */

export const SOCIAL_SUPPORT_ASSESSMENT = {
  // Dimensiones de apoyo social
  dimensions: {
    emotional: {
      name: 'Apoyo emocional',
      description: 'Escucha, comprensión, validación',
      questions: [
        '¿Tienes personas en tu vida con las que puedes hablar sobre tus sentimientos?',
        '¿Hay alguien que te escucha cuando necesitas hablar?',
        '¿Tienes alguien que te comprende y valida tus emociones?'
      ]
    },
    instrumental: {
      name: 'Apoyo práctico',
      description: 'Ayuda con tareas, recursos',
      questions: [
        '¿Tienes personas que te ayudan cuando necesitas apoyo práctico?',
        '¿Hay alguien que te ayuda con tareas o responsabilidades cuando lo necesitas?',
        '¿Tienes acceso a recursos o ayuda cuando la necesitas?'
      ]
    },
    informational: {
      name: 'Apoyo informativo',
      description: 'Consejos, información',
      questions: [
        '¿Tienes personas que te dan buenos consejos cuando los necesitas?',
        '¿Hay alguien que te proporciona información útil?',
        '¿Tienes acceso a información que necesitas?'
      ]
    },
    companionship: {
      name: 'Compañía',
      description: 'Actividades juntos, tiempo compartido',
      questions: [
        '¿Tienes personas con las que puedes hacer actividades que disfrutas?',
        '¿Hay alguien con quien puedes pasar tiempo y disfrutar?',
        '¿Tienes compañía cuando la necesitas?'
      ]
    }
  },
  
  // Preguntas de evaluación general
  questions: [
    '¿Tienes personas en tu vida con las que puedes hablar sobre tus sentimientos?',
    '¿Hay alguien que te apoya cuando pasas por momentos difíciles?',
    '¿Tienes personas con las que puedes hacer actividades que disfrutas?',
    '¿Te sientes solo/a a menudo?',
    '¿Tienes una red de apoyo en la que puedes confiar?'
  ],
  
  // Intervenciones según nivel de apoyo
  interventions: {
    high: {
      approach: 'Reconocer y fortalecer la red de apoyo existente',
      prompts: [
        'Es maravilloso que tengas una red de apoyo. ¿Cómo puedes fortalecer esas conexiones?',
        'Tu red de apoyo es un recurso valioso. ¿Cómo puedes aprovecharla mejor?',
        'Tener apoyo es importante. ¿Qué puedes hacer para mantener esas relaciones?'
      ]
    },
    medium: {
      approach: 'Identificar oportunidades para fortalecer conexiones',
      prompts: [
        'Tienes algunas conexiones. ¿Cómo puedes profundizar en ellas?',
        'Hay oportunidades para fortalecer tu red de apoyo. ¿Qué te gustaría explorar?',
        'Puedes construir sobre las conexiones que ya tienes. ¿Qué te gustaría hacer?'
      ]
    },
    low: {
      approach: 'Explorar formas de construir nuevas conexiones, grupos de apoyo, actividades sociales',
      prompts: [
        'Entiendo que te sientes solo. ¿Qué tipo de conexión te gustaría tener?',
        'Construir una red de apoyo toma tiempo. ¿Qué pequeño paso podrías dar?',
        'Hay formas de construir conexiones. ¿Qué actividades o grupos te interesan?'
      ]
    }
  }
};

/**
 * Detecta señales de aislamiento social en un mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Object|null} Objeto con señales detectadas o null
 */
export const detectSocialIsolation = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return null;
  }

  const content = messageContent.toLowerCase();
  
  // Patrones que indican aislamiento social
  const isolationPatterns = [
    /(?:me.*siento.*solo|aislado|desconectado)/i,
    /(?:no.*tengo.*a.*nadie|me.*siento.*abandonado)/i,
    /(?:nadie.*me.*entiende|no.*tengo.*amigos)/i,
    /(?:me.*siento.*solo|no.*tengo.*con.*quién.*hablar)/i,
    /(?:estoy.*solo|no.*tengo.*apoyo)/i
  ];
  
  for (const pattern of isolationPatterns) {
    if (pattern.test(content)) {
      return {
        detected: true,
        level: 'low',
        needsIntervention: true
      };
    }
  }
  
  return null;
};

/**
 * Evalúa el nivel de apoyo social basado en el mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Object} Evaluación del apoyo social
 */
export const assessSocialSupport = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return { level: 'unknown', confidence: 0 };
  }

  const content = messageContent.toLowerCase();
  
  // Patrones de alto apoyo social
  const highSupportPatterns = [
    /(?:tengo.*apoyo|mi.*familia|mis.*amigos|me.*ayudan)/i,
    /(?:tengo.*con.*quién.*hablar|tengo.*personas)/i
  ];
  
  // Patrones de bajo apoyo social
  const lowSupportPatterns = [
    /(?:me.*siento.*solo|aislado|no.*tengo.*a.*nadie)/i,
    /(?:no.*tengo.*apoyo|nadie.*me.*entiende)/i
  ];
  
  let highCount = 0;
  let lowCount = 0;
  
  for (const pattern of highSupportPatterns) {
    if (pattern.test(content)) {
      highCount++;
    }
  }
  
  for (const pattern of lowSupportPatterns) {
    if (pattern.test(content)) {
      lowCount++;
    }
  }
  
  if (lowCount > highCount) {
    return { level: 'low', confidence: 0.7, needsIntervention: true };
  } else if (highCount > lowCount) {
    return { level: 'high', confidence: 0.7, needsIntervention: false };
  }
  
  return { level: 'medium', confidence: 0.5, needsIntervention: true };
};

/**
 * Obtiene una intervención apropiada según el nivel de apoyo social
 * @param {string} level - Nivel de apoyo ('high', 'medium', 'low')
 * @returns {Object|null} Intervención apropiada o null
 */
export const getSocialSupportIntervention = (level) => {
  return SOCIAL_SUPPORT_ASSESSMENT.interventions[level] || null;
};

