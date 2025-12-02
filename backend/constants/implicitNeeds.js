/**
 * Detección de Necesidades No Expresadas
 * 
 * Detecta necesidades implícitas en los mensajes del usuario
 * que no se expresan directamente
 */

export const IMPLICIT_NEEDS_PATTERNS = {
  // Necesidad de validación
  validation: [
    /(?:nadie.*entiende|no.*me.*comprenden|me.*siento.*solo)/i,
    /(?:nadie.*me.*escucha|no.*tengo.*con.*quién.*hablar)/i,
    /(?:nadie.*me.*cree|no.*me.*toman.*en.*serio)/i,
    /(?:siento.*que.*no.*importo|nadie.*se.*preocupa)/i
  ],
  
  // Necesidad de control
  control: [
    /(?:no.*puedo.*controlar|siento.*que.*no.*tengo.*control)/i,
    /(?:todo.*está.*fuera.*de.*control|no.*puedo.*manejar)/i,
    /(?:las.*cosas.*se.*salen.*de.*control|no.*puedo.*controlar.*nada)/i
  ],
  
  // Necesidad de conexión
  connection: [
    /(?:me.*siento.*solo|aislado|desconectado)/i,
    /(?:no.*tengo.*a.*nadie|me.*siento.*abandonado)/i,
    /(?:nadie.*me.*entiende|me.*siento.*desconectado)/i,
    /(?:no.*tengo.*amigos|me.*siento.*solo)/i
  ],
  
  // Necesidad de propósito
  purpose: [
    /(?:no.*tengo.*sentido|para.*qué.*sirvo|no.*tengo.*propósito)/i,
    /(?:mi.*vida.*no.*tiene.*sentido|no.*sé.*para.*qué.*estoy)/i,
    /(?:no.*sé.*qué.*hacer|no.*tengo.*razón.*de.*ser)/i
  ],
  
  // Necesidad de seguridad
  safety: [
    /(?:no.*me.*siento.*seguro|tengo.*miedo|me.*siento.*vulnerable)/i,
    /(?:no.*puedo.*confiar|me.*siento.*amenazado)/i,
    /(?:siento.*peligro|me.*siento.*inseguro)/i
  ],
  
  // Necesidad de aceptación
  acceptance: [
    /(?:no.*me.*aceptan|me.*rechazan|no.*encajo)/i,
    /(?:nadie.*me.*quiere|me.*siento.*rechazado)/i,
    /(?:no.*pertenezco|me.*siento.*fuera.*de.*lugar)/i
  ],
  
  // Necesidad de competencia
  competence: [
    /(?:no.*sirvo|no.*puedo|no.*soy.*capaz)/i,
    /(?:soy.*un.*fracaso|no.*hago.*nada.*bien)/i,
    /(?:no.*tengo.*habilidades|no.*soy.*bueno.*en)/i
  ]
};

export const IMPLICIT_NEEDS_INTERVENTIONS = {
  validation: {
    approach: 'Validar la experiencia, reconocer sentimientos, ofrecer comprensión',
    prompts: [
      'Entiendo que te sientes incomprendido. Tu experiencia es válida y merece ser escuchada.',
      'Es difícil cuando sientes que nadie te entiende. Estoy aquí para escucharte.',
      'Tus sentimientos son importantes y válidos. ¿Qué te gustaría que entendiera?'
    ]
  },
  
  control: {
    approach: 'Explorar áreas de control, identificar lo que sí se puede controlar',
    prompts: [
      'Entiendo que sientes que las cosas están fuera de control. ¿Qué pequeña cosa sí puedes controlar?',
      'Aunque muchas cosas estén fuera de tu control, hay algunas que sí puedes manejar. ¿Cuáles son?',
      'Es normal sentirse abrumado cuando sientes que no tienes control. ¿Qué te gustaría poder controlar?'
    ]
  },
  
  connection: {
    approach: 'Explorar conexiones existentes, identificar oportunidades de conexión',
    prompts: [
      'Entiendo que te sientes solo. ¿Hay alguien en tu vida con quien te gustaría conectar más?',
      'La soledad puede ser muy difícil. ¿Qué tipo de conexión sientes que te falta?',
      'Aunque te sientas solo ahora, hay formas de construir conexiones. ¿Qué te gustaría explorar?'
    ]
  },
  
  purpose: {
    approach: 'Explorar valores, identificar lo que da sentido, construir propósito',
    prompts: [
      'Entiendo que sientes que tu vida no tiene sentido. ¿Qué cosas solían darte sentido?',
      'El propósito puede cambiar con el tiempo. ¿Qué es importante para ti ahora?',
      'Aunque no veas el propósito ahora, podemos explorar qué te da significado. ¿Qué te gustaría descubrir?'
    ]
  },
  
  safety: {
    approach: 'Crear sensación de seguridad, identificar recursos de apoyo',
    prompts: [
      'Entiendo que no te sientes seguro. ¿Qué te ayudaría a sentirte más seguro?',
      'La seguridad es fundamental. ¿Hay algo específico que te está haciendo sentir inseguro?',
      'Es importante sentirte seguro. ¿Qué recursos o apoyos tienes disponibles?'
    ]
  },
  
  acceptance: {
    approach: 'Validar la necesidad de pertenencia, explorar autoaceptación',
    prompts: [
      'Entiendo que te sientes rechazado. Tu valor no depende de la aceptación de otros.',
      'Es difícil cuando sientes que no encajas. ¿Qué te gustaría que otros entendieran sobre ti?',
      'Aunque te sientas rechazado, mereces aceptación y pertenencia. ¿Cómo podemos trabajar en eso?'
    ]
  },
  
  competence: {
    approach: 'Identificar fortalezas, reconocer logros, construir confianza',
    prompts: [
      'Entiendo que sientes que no eres capaz. ¿Qué cosas has logrado en el pasado?',
      'Aunque sientas que no sirves, tienes habilidades y fortalezas. ¿Qué reconoces en ti?',
      'Es normal dudar de nuestras capacidades. ¿Qué pequeña cosa podrías hacer para demostrarte que sí puedes?'
    ]
  }
};

/**
 * Detecta necesidades implícitas en un mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Array} Array de necesidades detectadas
 */
export const detectImplicitNeeds = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return [];
  }

  const content = messageContent.toLowerCase();
  const detectedNeeds = [];
  
  for (const [needType, patterns] of Object.entries(IMPLICIT_NEEDS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        detectedNeeds.push({
          type: needType,
          intervention: IMPLICIT_NEEDS_INTERVENTIONS[needType],
          confidence: 0.7
        });
        break; // Solo agregar una vez por tipo
      }
    }
  }
  
  return detectedNeeds;
};

/**
 * Obtiene una intervención apropiada para una necesidad implícita
 * @param {string} needType - Tipo de necesidad detectada
 * @returns {Object|null} Intervención apropiada o null
 */
export const getImplicitNeedIntervention = (needType) => {
  return IMPLICIT_NEEDS_INTERVENTIONS[needType] || null;
};

