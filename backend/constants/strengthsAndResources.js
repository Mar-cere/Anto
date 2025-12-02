/**
 * Fortalezas y Recursos del Usuario
 * 
 * Identifica y trabaja con las fortalezas y recursos
 * que el usuario ya posee
 */

export const STRENGTHS_IDENTIFICATION = {
  // Fortalezas personales
  personal: [
    {
      name: 'Resiliencia',
      description: 'Capacidad de recuperarse de dificultades',
      questions: [
        '¿Qué has hecho en el pasado para superar dificultades?',
        '¿Qué te ayudó a seguir adelante en momentos difíciles?'
      ]
    },
    {
      name: 'Perseverancia',
      description: 'Seguir adelante a pesar de obstáculos',
      questions: [
        '¿Qué cosas has logrado a pesar de las dificultades?',
        '¿Qué te ha motivado a no rendirte?'
      ]
    },
    {
      name: 'Autocuidado',
      description: 'Buscar ayuda cuando la necesitas',
      questions: [
        '¿Qué haces para cuidarte?',
        '¿Qué te ayuda a sentirte mejor?'
      ]
    },
    {
      name: 'Reflexión',
      description: 'Capacidad de pensar sobre tus experiencias',
      questions: [
        '¿Qué has aprendido de tus experiencias?',
        '¿Cómo reflexionas sobre lo que te pasa?'
      ]
    },
    {
      name: 'Empatía',
      description: 'Capacidad de entender a otros',
      questions: [
        '¿Cómo ayudas a otros?',
        '¿Qué te hace sentir conectado con los demás?'
      ]
    }
  ],
  
  // Recursos sociales
  social: [
    {
      name: 'Red de apoyo',
      description: 'Familia, amigos, comunidad',
      questions: [
        '¿Quién está en tu vida que te apoya?',
        '¿Con quién puedes contar cuando lo necesitas?'
      ]
    },
    {
      name: 'Relaciones significativas',
      description: 'Conexiones profundas con otros',
      questions: [
        '¿Qué relaciones son importantes para ti?',
        '¿Quién te hace sentir comprendido?'
      ]
    },
    {
      name: 'Grupos de apoyo',
      description: 'Comunidades o grupos con intereses similares',
      questions: [
        '¿Hay grupos o comunidades a las que perteneces?',
        '¿Dónde encuentras sentido de pertenencia?'
      ]
    }
  ],
  
  // Recursos internos
  internal: [
    {
      name: 'Habilidades de afrontamiento',
      description: 'Estrategias que has usado antes',
      questions: [
        '¿Qué estrategias te han funcionado en el pasado?',
        '¿Qué haces cuando te sientes abrumado?'
      ]
    },
    {
      name: 'Experiencias de superación',
      description: 'Momentos en que superaste dificultades',
      questions: [
        '¿Qué dificultades has superado antes?',
        '¿Qué aprendiste de esas experiencias?'
      ]
    },
    {
      name: 'Valores y creencias',
      description: 'Lo que guía tus decisiones',
      questions: [
        '¿Qué es importante para ti?',
        '¿Qué valores guían tu vida?'
      ]
    },
    {
      name: 'Intereses y pasatiempos',
      description: 'Actividades que disfrutas',
      questions: [
        '¿Qué actividades te dan placer?',
        '¿Qué te gusta hacer en tu tiempo libre?'
      ]
    },
    {
      name: 'Logros y éxitos',
      description: 'Cosas de las que te sientes orgulloso',
      questions: [
        '¿De qué logros te sientes orgulloso?',
        '¿Qué has conseguido que te enorgullece?'
      ]
    }
  ]
};

/**
 * Preguntas para identificar fortalezas
 */
export const STRENGTHS_QUESTIONS = [
  '¿Qué has hecho en el pasado que te ayudó a superar dificultades?',
  '¿Qué cualidades tuyas te han ayudado en momentos difíciles?',
  '¿Quién o qué te ha apoyado en el pasado?',
  '¿Qué logros te enorgullecen?',
  '¿Qué habilidades tienes que te ayudan a enfrentar desafíos?',
  '¿Qué recursos internos o externos tienes disponibles?'
];

/**
 * Identifica fortalezas mencionadas en un mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Array} Array de fortalezas detectadas
 */
export const identifyStrengths = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return [];
  }

  const content = messageContent.toLowerCase();
  const detectedStrengths = [];
  
  // Patrones que indican fortalezas
  const strengthPatterns = {
    resilience: /(?:superé|logré|pude|conseguí|me.*recuperé)/i,
    support: /(?:tengo.*apoyo|mi.*familia|mis.*amigos|me.*ayudan)/i,
    skills: /(?:sé.*hacer|puedo|soy.*bueno|tengo.*habilidad)/i,
    values: /(?:es.*importante|valoro|creo.*en|me.*importa)/i,
    achievements: /(?:logré|conseguí|completé|terminé|gané)/i
  };
  
  for (const [strengthType, pattern] of Object.entries(strengthPatterns)) {
    if (pattern.test(content)) {
      detectedStrengths.push({
        type: strengthType,
        confidence: 0.6
      });
    }
  }
  
  return detectedStrengths;
};

/**
 * Genera preguntas para explorar fortalezas
 * @param {string} context - Contexto del mensaje
 * @returns {string} Pregunta apropiada
 */
export const generateStrengthQuestion = (context = 'general') => {
  const questions = STRENGTHS_QUESTIONS;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

