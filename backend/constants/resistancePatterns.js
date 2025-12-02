/**
 * Patrones de Resistencia al Cambio
 * 
 * Detecta diferentes tipos de resistencia que el usuario puede mostrar
 * durante el proceso terapéutico
 */

export const RESISTANCE_PATTERNS = {
  // Negación
  denial: [
    /(?:no.*tengo.*problema|no.*necesito.*ayuda|no.*me.*pasa.*nada|estoy.*bien|todo.*bien)/i,
    /(?:no.*es.*para.*tanto|exageras|no.*es.*tan.*grave)/i,
    /(?:no.*tengo.*nada|no.*me.*pasa|está.*todo.*bien|no.*hay.*problema)/i
  ],
  
  // Minimización
  minimization: [
    /(?:solo|nada.*más|solo.*un.*poco|no.*es.*nada)/i,
    /(?:otros.*tienen.*peor|no.*es.*tan.*malo|no.*es.*para.*tanto)/i,
    /(?:es.*solo|nada.*importante|no.*es.*grave|no.*es.*serio)/i
  ],
  
  // Evitación
  avoidance: [
    /(?:no.*quiero.*hablar|prefiero.*no|mejor.*no|no.*me.*gusta.*hablar)/i,
    /(?:cambiar.*de.*tema|no.*quiero.*pensar|no.*quiero.*hablar.*de.*eso)/i,
    /(?:mejor.*no.*hablamos|no.*quiero.*discutir|prefiero.*no.*hablar)/i
  ],
  
  // Ambivalencia
  ambivalence: [
    /(?:no.*sé|tal.*vez|quizás|a.*veces.*sí.*a.*veces.*no)/i,
    /(?:quiero.*pero.*no.*puedo|me.*gustaría.*pero)/i,
    /(?:no.*estoy.*seguro|no.*sé.*si|tal.*vez.*sí|tal.*vez.*no)/i
  ],
  
  // Desesperanza
  hopelessness: [
    /(?:nada.*funciona|ya.*lo.*intenté|no.*sirve.*de.*nada)/i,
    /(?:siempre.*será.*así|nunca.*cambiará|no.*tiene.*sentido)/i,
    /(?:para.*qué|no.*vale.*la.*pena|no.*tiene.*solución)/i
  ]
};

export const RESISTANCE_INTERVENTIONS = {
  denial: {
    approach: 'Validar sin confrontar, explorar suavemente',
    techniques: ['Escala de importancia', 'Preguntas exploratorias', 'Normalización'],
    prompts: [
      'Entiendo que no sientes que sea un problema. ¿Qué te trajo aquí hoy?',
      'A veces es difícil reconocer cuando algo nos afecta. ¿Hay algo que te gustaría cambiar?',
      'No hay problema si no lo ves como algo grave. ¿Qué te gustaría mejorar en tu vida?'
    ]
  },
  
  minimization: {
    approach: 'Validar la experiencia sin minimizar, explorar el impacto',
    techniques: ['Escala de impacto', 'Exploración de consecuencias', 'Validación'],
    prompts: [
      'Entiendo que puede no parecer mucho, pero si te está afectando, es válido. ¿Cómo te está impactando?',
      'Aunque pueda parecer pequeño, si te está molestando, vale la pena explorarlo. ¿Qué te gustaría cambiar?',
      'Cada experiencia es válida, sin importar qué tan grande o pequeña parezca. ¿Cómo te sientes al respecto?'
    ]
  },
  
  avoidance: {
    approach: 'Respetar el ritmo, ofrecer espacio seguro, explorar gradualmente',
    techniques: ['Validación del ritmo', 'Exploración gradual', 'Crear seguridad'],
    prompts: [
      'Entiendo que puede ser difícil hablar de ciertos temas. No hay prisa, podemos ir a tu ritmo.',
      'Es normal querer evitar temas difíciles. ¿Hay algo que te gustaría explorar cuando te sientas listo?',
      'Respeto que prefieras no hablar de eso ahora. ¿Hay algo más con lo que te gustaría trabajar?'
    ]
  },
  
  ambivalence: {
    approach: 'Entrevista motivacional, explorar pros y contras',
    techniques: ['Escala de importancia', 'Exploración de valores', 'Reflexión'],
    prompts: [
      'Por un lado... y por otro lado... ¿Qué te gustaría que fuera diferente?',
      'En una escala del 1 al 10, ¿qué tan importante es para ti hacer un cambio?',
      'Entiendo que tienes sentimientos encontrados. ¿Qué te gustaría lograr?'
    ]
  },
  
  hopelessness: {
    approach: 'Validar la desesperanza, identificar excepciones, construir esperanza',
    techniques: ['Búsqueda de excepciones', 'Revisión de logros pasados', 'Pequeños pasos'],
    prompts: [
      'Entiendo que te sientes sin esperanza. ¿Ha habido momentos en que las cosas fueron un poco mejor?',
      'Aunque ahora sientas que nada funciona, ¿qué pequeña cosa podrías intentar diferente?',
      'La desesperanza puede hacer que todo se vea imposible. ¿Qué pequeño paso podrías dar hoy?'
    ]
  }
};

/**
 * Detecta el tipo de resistencia en un mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Object|null} Objeto con tipo de resistencia detectada o null
 */
export const detectResistance = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return null;
  }

  const content = messageContent.toLowerCase();
  
  for (const [type, patterns] of Object.entries(RESISTANCE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return {
          type,
          intervention: RESISTANCE_INTERVENTIONS[type],
          confidence: 0.7
        };
      }
    }
  }
  
  return null;
};

/**
 * Obtiene una intervención apropiada para un tipo de resistencia
 * @param {string} resistanceType - Tipo de resistencia detectada
 * @returns {Object|null} Intervención apropiada o null
 */
export const getResistanceIntervention = (resistanceType) => {
  return RESISTANCE_INTERVENTIONS[resistanceType] || null;
};

