/**
 * Intervenciones de Autoeficacia
 * 
 * Construye la confianza del usuario en sus propias capacidades
 * basado en la teoría de autoeficacia de Bandura
 */

export const SELF_EFFICACY_INTERVENTIONS = {
  // Fuentes de autoeficacia (Bandura)
  sources: {
    mastery: {
      name: 'Experiencias de éxito pasadas',
      description: 'Recordar logros y éxitos previos',
      prompts: [
        '¿Qué has logrado antes que te demuestra que puedes hacer esto?',
        'Piensa en un momento en que superaste un desafío. ¿Qué te ayudó?',
        '¿Qué experiencias pasadas te muestran que eres capaz?'
      ]
    },
    vicarious: {
      name: 'Ver a otros similares tener éxito',
      description: 'Aprender de las experiencias de otros',
      prompts: [
        '¿Conoces a alguien que haya pasado por algo similar? ¿Qué hizo?',
        '¿Qué puedes aprender de otros que han enfrentado desafíos similares?',
        'Ver a otros tener éxito puede inspirarnos. ¿Quién te inspira?'
      ]
    },
    verbal: {
      name: 'Persuasión y aliento de otros',
      description: 'Mensajes de apoyo y aliento',
      prompts: [
        'Creo que puedes hacerlo. ¿Qué te ayudaría a sentirte más capaz?',
        'Tienes las habilidades necesarias. ¿Qué te gustaría intentar?',
        'Estoy aquí para apoyarte. ¿Qué pequeño paso podrías dar?'
      ]
    },
    emotional: {
      name: 'Estado emocional positivo',
      description: 'Reducir ansiedad y aumentar confianza emocional',
      prompts: [
        'Cuando te sientes más tranquilo, ¿cómo ves las cosas?',
        '¿Qué te ayuda a sentirte más confiado?',
        'La confianza puede crecer cuando nos sentimos emocionalmente estables. ¿Qué te ayuda a sentirte así?'
      ]
    }
  },
  
  // Intervenciones
  interventions: {
    smallSteps: {
      name: 'Empezar con pasos pequeños y alcanzables',
      description: 'Dividir objetivos grandes en pasos pequeños',
      prompts: [
        '¿Qué pequeño paso podrías dar hoy?',
        'Empecemos con algo pequeño y alcanzable. ¿Qué sería?',
        'Los grandes cambios empiezan con pequeños pasos. ¿Cuál sería el primero?'
      ]
    },
    celebrate: {
      name: 'Celebrar cada logro, por pequeño que sea',
      description: 'Reconocer y celebrar progreso',
      prompts: [
        'Cada logro cuenta. ¿Qué has logrado recientemente?',
        'Celebra tus pequeños éxitos. ¿Qué te gustaría reconocer?',
        'Cada paso hacia adelante es importante. ¿Qué quieres celebrar?'
      ]
    },
    reframe: {
      name: 'Reencuadrar "fracasos" como oportunidades de aprendizaje',
      description: 'Cambiar la perspectiva sobre los errores',
      prompts: [
        '¿Qué aprendiste de esa experiencia?',
        'Los "fracasos" son oportunidades de aprendizaje. ¿Qué te enseñó esto?',
        'Cada intento nos acerca más al éxito. ¿Qué aprendiste?'
      ]
    },
    remind: {
      name: 'Recordar logros pasados cuando se siente difícil',
      description: 'Conectar con experiencias de éxito previas',
      prompts: [
        'Recuerda cuando lograste algo difícil. ¿Qué te ayudó entonces?',
        'Has superado desafíos antes. ¿Qué te funcionó?',
        'Piensa en un momento en que pensaste que no podías, pero lo lograste. ¿Qué pasó?'
      ]
    },
    support: {
      name: 'Ofrecer apoyo y aliento en el proceso',
      description: 'Proporcionar apoyo continuo',
      prompts: [
        'Estoy aquí para apoyarte en este proceso. ¿Cómo puedo ayudarte?',
        'No estás solo en esto. ¿Qué necesitas para sentirte más capaz?',
        'Creo en tu capacidad de hacer esto. ¿Qué te gustaría intentar?'
      ]
    }
  },
  
  // Preguntas de autoeficacia
  questions: [
    'En una escala del 1 al 10, ¿qué tan capaz te sientes de hacer X?',
    '¿Qué te ayudaría a sentirte más capaz?',
    '¿Qué has logrado antes que te demuestra que puedes hacer esto?',
    '¿Qué pequeño paso podrías dar hoy?',
    '¿Qué recursos o apoyos tienes que te pueden ayudar?',
    '¿Qué te ha funcionado en el pasado en situaciones similares?'
  ]
};

/**
 * Genera una intervención de autoeficacia apropiada
 * @param {string} context - Contexto de la situación
 * @param {string} source - Fuente de autoeficacia a usar (opcional)
 * @returns {Object} Intervención apropiada
 */
export const generateSelfEfficacyIntervention = (context = 'general', source = null) => {
  const sources = SELF_EFFICACY_INTERVENTIONS.sources;
  const interventions = SELF_EFFICACY_INTERVENTIONS.interventions;
  
  // Si se especifica una fuente, usarla
  if (source && sources[source]) {
    const sourceData = sources[source];
    const randomPrompt = sourceData.prompts[Math.floor(Math.random() * sourceData.prompts.length)];
    return {
      type: 'source',
      source: sourceData.name,
      prompt: randomPrompt
    };
  }
  
  // Si no, usar una intervención general
  const interventionKeys = Object.keys(interventions);
  const randomKey = interventionKeys[Math.floor(Math.random() * interventionKeys.length)];
  const intervention = interventions[randomKey];
  const randomPrompt = intervention.prompts[Math.floor(Math.random() * intervention.prompts.length)];
  
  return {
    type: 'intervention',
    intervention: intervention.name,
    prompt: randomPrompt
  };
};

/**
 * Evalúa el nivel de autoeficacia percibida en un mensaje
 * @param {string} messageContent - Contenido del mensaje
 * @returns {Object} Evaluación de autoeficacia
 */
export const evaluateSelfEfficacy = (messageContent) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return { level: 'unknown', confidence: 0 };
  }

  const content = messageContent.toLowerCase();
  
  // Patrones de baja autoeficacia
  const lowEfficacyPatterns = [
    /(?:no.*puedo|no.*soy.*capaz|no.*sirvo|no.*puedo.*hacerlo)/i,
    /(?:nunca.*podré|imposible|no.*tengo.*habilidades)/i
  ];
  
  // Patrones de alta autoeficacia
  const highEfficacyPatterns = [
    /(?:puedo|soy.*capaz|lo.*lograré|sé.*que.*puedo)/i,
    /(?:confío|tengo.*habilidades|puedo.*hacerlo)/i
  ];
  
  let lowCount = 0;
  let highCount = 0;
  
  for (const pattern of lowEfficacyPatterns) {
    if (pattern.test(content)) {
      lowCount++;
    }
  }
  
  for (const pattern of highEfficacyPatterns) {
    if (pattern.test(content)) {
      highCount++;
    }
  }
  
  if (lowCount > highCount) {
    return { level: 'low', confidence: 0.7, needsIntervention: true };
  } else if (highCount > lowCount) {
    return { level: 'high', confidence: 0.7, needsIntervention: false };
  }
  
  return { level: 'medium', confidence: 0.5, needsIntervention: true };
};

