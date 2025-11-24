/**
 * Constantes y Funciones de Crisis - Recursos de emergencia y protocolo de intervención en crisis
 * 
 * Este módulo proporciona:
 * - Líneas de emergencia por país
 * - Mensajes estructurados de crisis
 * - Protocolo de intervención en crisis
 * - Función de evaluación de riesgo suicida
 */

// ========== LÍNEAS DE EMERGENCIA POR PAÍS ==========
export const EMERGENCY_LINES = {
  ARGENTINA: {
    SUICIDE_PREVENTION: '135',
    MENTAL_HEALTH: '0800-222-5462',
    EMERGENCY: '911',
    CRISIS_TEXT: '741741'
  },
  MEXICO: {
    SUICIDE_PREVENTION: '800-273-8255',
    MENTAL_HEALTH: '800-911-2000',
    EMERGENCY: '911',
    CRISIS_TEXT: '741741'
  },
  ESPANA: {
    SUICIDE_PREVENTION: '024',
    MENTAL_HEALTH: '024',
    EMERGENCY: '112',
    CRISIS_TEXT: '741741'
  },
  COLOMBIA: {
    SUICIDE_PREVENTION: '106',
    MENTAL_HEALTH: '106',
    EMERGENCY: '123',
    CRISIS_TEXT: '741741'
  },
  CHILE: {
    SUICIDE_PREVENTION: '600-360-7777',
    MENTAL_HEALTH: '600-360-7777',
    EMERGENCY: '133',
    CRISIS_TEXT: '741741'
  },
  PERU: {
    SUICIDE_PREVENTION: '113',
    MENTAL_HEALTH: '113',
    EMERGENCY: '105',
    CRISIS_TEXT: '741741'
  },
  GENERAL: {
    SUICIDE_PREVENTION: '988', // Línea internacional
    CRISIS_TEXT: '741741', // Texto de crisis
    EMERGENCY: '911'
  }
};

// ========== MENSAJES DE CRISIS ESTRUCTURADOS ==========
export const CRISIS_MESSAGES = {
  IMMEDIATE_SAFETY: 'Tu seguridad es lo más importante. Si estás en peligro inmediato, llama al {EMERGENCY} ahora.',
  SUICIDE_PREVENTION: 'No estás solo. Llama a la línea de prevención del suicidio: {SUICIDE_LINE}. Están disponibles 24/7.',
  MENTAL_HEALTH_SUPPORT: 'Para apoyo profesional inmediato, contacta: {MENTAL_HEALTH_LINE}',
  SAFETY_PLAN: '¿Tienes un plan de seguridad? Si no, podemos crear uno juntos ahora mismo.',
  CRISIS_TEXT_LINE: 'También puedes enviar un mensaje de texto a {CRISIS_TEXT} para apoyo inmediato.',
  YOU_ARE_NOT_ALONE: 'Recuerda: no estás solo/a. Hay personas que pueden ayudarte en este momento.',
  PROFESSIONAL_HELP: 'Es importante que hables con un profesional de salud mental. Puedo ayudarte a encontrar recursos en tu área.'
};

// ========== PROTOCOLO DE INTERVENCIÓN EN CRISIS ==========
export const CRISIS_PROTOCOL = {
  STEPS: [
    '1. Validar la experiencia sin minimizar',
    '2. Evaluar nivel de riesgo (bajo, medio, alto)',
    '3. Proporcionar recursos de emergencia apropiados',
    '4. Crear sensación de seguridad y conexión',
    '5. Ofrecer seguimiento inmediato',
    '6. Documentar para seguimiento profesional'
  ],
  RISK_LEVELS: {
    LOW: {
      description: 'Monitoreo y apoyo continuo',
      actions: [
        'Validar emociones',
        'Ofrecer apoyo emocional',
        'Sugerir técnicas de regulación',
        'Programar seguimiento'
      ]
    },
    WARNING: {
      description: 'Detección temprana - Intervención preventiva',
      actions: [
        'Validar emociones y preocupaciones',
        'Ofrecer apoyo emocional proactivo',
        'Proporcionar recursos preventivos',
        'Sugerir técnicas de regulación emocional',
        'Ofrecer seguimiento en 24-48 horas',
        'Documentar para monitoreo continuo'
      ]
    },
    MEDIUM: {
      description: 'Recursos de emergencia + seguimiento en 24h',
      actions: [
        'Proporcionar líneas de ayuda',
        'Crear plan de seguridad básico',
        'Ofrecer seguimiento en 24 horas',
        'Documentar para monitoreo',
        'Considerar alerta a contactos de emergencia'
      ]
    },
    HIGH: {
      description: 'Recursos de emergencia inmediatos + alerta profesional',
      actions: [
        'Proporcionar recursos de emergencia inmediatamente',
        'Instar a contactar servicios de emergencia',
        'Crear plan de seguridad detallado',
        'Documentar para seguimiento profesional urgente',
        'Enviar alerta a contactos de emergencia'
      ]
    }
  }
};

// ========== EVALUACIÓN DE RIESGO SUICIDA ==========

/**
 * Evalúa el nivel de riesgo suicida basado en múltiples factores
 * @param {Object} emotionalAnalysis - Análisis emocional del mensaje
 * @param {Object} contextualAnalysis - Análisis contextual del mensaje
 * @param {string} messageContent - Contenido del mensaje del usuario
 * @param {Object} options - Opciones adicionales para evaluación
 * @param {Object} options.trendAnalysis - Análisis de tendencias históricas (opcional)
 * @param {Object} options.crisisHistory - Historial de crisis previas (opcional)
 * @param {Object} options.conversationContext - Contexto de la conversación (opcional)
 * @returns {string} Nivel de riesgo: 'LOW', 'WARNING', 'MEDIUM', 'HIGH'
 */
export const evaluateSuicideRisk = (
  emotionalAnalysis, 
  contextualAnalysis, 
  messageContent,
  options = {}
) => {
  if (!messageContent || typeof messageContent !== 'string') {
    return 'LOW';
  }

  let riskScore = 0;
  const content = messageContent.toLowerCase();
  const { trendAnalysis, crisisHistory, conversationContext } = options;

  // ========== FACTORES DE RIESGO CRÍTICOS (Alto peso) ==========
  
  // Intención de crisis
  if (contextualAnalysis?.intencion?.tipo === 'CRISIS') {
    riskScore += 3;
  }
  
  // Indicadores directos de ideación suicida
  if (/suicid(?:io|arme|arme|arse)/i.test(content)) {
    riskScore += 4;
  }
  if (/(?:me.*quiero.*morir|quiero.*morir|prefiero.*morir|me.*voy.*a.*matar)/i.test(content)) {
    riskScore += 4;
  }
  if (/(?:acabar.*con.*mi.*vida|terminar.*con.*mi.*vida|acabar.*con.*todo)/i.test(content)) {
    riskScore += 4;
  }
  
  // Plan específico (muy alto riesgo)
  if (/(?:tengo.*un.*plan|mi.*plan|método|medios.*para|ya.*tengo.*decidido|ya.*sé.*cómo)/i.test(content)) {
    riskScore += 3;
  }
  
  // Despedidas o mensajes finales
  if (/(?:despedida|última.*vez|adiós|ya.*no.*estaré|no.*estaré.*más|último.*mensaje|esto.*es.*todo)/i.test(content)) {
    riskScore += 2;
  }
  
  // Desesperanza extrema
  if (/(?:sin.*salida|no.*hay.*salida|no.*tengo.*salida|sin.*esperanza|sin.*esperanzas|nada.*tiene.*sentido|todo.*está.*perdido|no.*vale.*la.*pena|ya.*no.*quiero.*seguir)/i.test(content)) {
    riskScore += 2;
  }
  
  // Expresiones de desesperanza indirecta (MEJORADO)
  if (/(?:ya.*no.*quiero.*seguir.*así|no.*vale.*la.*pena|todo.*está.*perdido|nada.*tiene.*sentido|es.*inútil|no.*hay.*solución|no.*tiene.*solución|para.*qué.*sirve|no.*tiene.*sentido|no.*vale.*nada)/i.test(content)) {
    riskScore += 1.5;
  }
  
  // Expresiones de aislamiento (MEJORADO)
  if (/(?:nadie.*me.*entiende|estoy.*solo|no.*tengo.*a.*nadie|me.*siento.*solo|nadie.*me.*escucha|me.*siento.*aislad(?:o|a)|estoy.*aislad(?:o|a)|me.*siento.*desconectad(?:o|a)|estoy.*desconectad(?:o|a)|nadie.*me.*comprende)/i.test(content)) {
    riskScore += 1;
  }
  
  // Expresiones adicionales de desesperanza (NUEVO)
  if (/(?:nada.*tiene.*sentido|para.*qué.*vivir|no.*tiene.*propósito|sin.*propósito|sin.*razón.*de.*ser)/i.test(content)) {
    riskScore += 1.5;
  }
  
  // Intensidad emocional muy alta
  if (emotionalAnalysis?.intensity >= 9) {
    riskScore += 2;
  }
  
  // Tristeza extrema
  if (emotionalAnalysis?.mainEmotion === 'tristeza' && emotionalAnalysis?.intensity >= 8) {
    riskScore += 2;
  }
  
  // Expresiones de rendición
  if (/(?:me.*rindo|quiero.*rendirme|no.*puedo.*más|no.*aguanto.*más|no.*soporto.*más|me.*doy.*por.*vencid(?:o|a))/i.test(content)) {
    riskScore += 1;
  }

  // ========== FACTORES DE TENDENCIAS HISTÓRICAS (NUEVO) ==========
  
  if (trendAnalysis) {
    // Ajuste basado en tendencias
    if (trendAnalysis.riskAdjustment) {
      riskScore += trendAnalysis.riskAdjustment;
    }
    
    // Deterioro rápido
    if (trendAnalysis.trends?.rapidDecline) {
      riskScore += 1;
    }
    
    // Estado bajo sostenido
    if (trendAnalysis.trends?.sustainedLow) {
      riskScore += 0.5;
    }
    
    // Aislamiento (reducción en comunicación)
    if (trendAnalysis.trends?.isolation) {
      riskScore += 0.5;
    }
    
    // Escalada emocional reciente
    if (trendAnalysis.trends?.escalation) {
      riskScore += 1;
    }
  }

  // ========== HISTORIAL DE CRISIS PREVIAS (NUEVO) ==========
  
  if (crisisHistory) {
    // Crisis reciente (últimos 7 días)
    if (crisisHistory.recentCrises > 0) {
      riskScore += 2;
    }
    // Crisis en últimos 30 días
    else if (crisisHistory.totalCrises > 0) {
      riskScore += 1;
    }
    
    // Múltiples crisis recientes
    if (crisisHistory.recentCrises >= 2) {
      riskScore += 1;
    }
  }

  // ========== CONTEXTO CONVERSACIONAL (MEJORADO) ==========
  
  if (conversationContext) {
    // Escalada emocional en la conversación
    if (conversationContext.emotionalEscalation) {
      riskScore += 1;
    }
    
    // Rechazo de ayuda ofrecida
    if (conversationContext.helpRejected) {
      riskScore += 0.5;
    }
    
    // Cambio abrupto en el tono
    if (conversationContext.abruptToneChange) {
      riskScore += 0.5;
    }
    
    // Análisis de frecuencia (mensajes muy frecuentes pueden indicar ansiedad)
    if (conversationContext.frequencyAnalysis?.veryFrequent) {
      riskScore += 0.5;
    }
    
    // Cambio en ritmo de conversación
    if (conversationContext.frequencyAnalysis?.frequencyChange) {
      riskScore += 0.5;
    }
    
    // Silencio prolongado después de mensaje negativo
    if (conversationContext.silenceAfterNegative) {
      riskScore += 1;
    }
  }
  
  // ========== FACTORES PROTECTORES (Reducen riesgo) ==========
  
  // Búsqueda de ayuda
  if (/(?:ayuda|hablar|compartir|necesito.*hablar|quiero.*hablar|puedo.*hablar|me.*puedes.*ayudar)/i.test(content)) {
    riskScore -= 1;
  }
  
  // Emoción secundaria de esperanza
  if (emotionalAnalysis?.secondary?.includes('esperanza')) {
    riskScore -= 1;
  }
  
  // Expresiones de mejora
  if (/(?:mejor|mejorando|progreso|avance|me.*siento.*mejor|estoy.*mejor|voy.*mejorando)/i.test(content)) {
    riskScore -= 1;
  }
  
  // Menciones de apoyo social
  if (/(?:familia|amigos|amigo|amiga|pareja|personas.*que.*me.*quieren|tengo.*apoyo)/i.test(content)) {
    riskScore -= 0.5;
  }
  
  // Uso de técnicas de regulación
  if (/(?:respiración|meditación|ejercicio|técnica|estrategia.*que.*me.*ayuda)/i.test(content)) {
    riskScore -= 0.5;
  }
  
  // Asegurar que el score no sea negativo
  riskScore = Math.max(0, riskScore);
  
  // ========== DETERMINAR NIVEL DE RIESGO ==========
  
  // NUEVO: Nivel WARNING para detección temprana
  if (riskScore >= 7) {
    return 'HIGH';
  } else if (riskScore >= 4) {
    return 'MEDIUM';
  } else if (riskScore >= 2) {
    return 'WARNING'; // Nuevo nivel para detección temprana
  } else {
    return 'LOW';
  }
};

// ========== FUNCIONES HELPER ==========

/**
 * Obtiene las líneas de emergencia para un país específico
 * @param {string} country - Código del país (ARGENTINA, MEXICO, etc.) o 'GENERAL'
 * @returns {Object} Objeto con líneas de emergencia
 */
export const getEmergencyLines = (country = 'GENERAL') => {
  return EMERGENCY_LINES[country] || EMERGENCY_LINES.GENERAL;
};

/**
 * Genera un mensaje de crisis personalizado con recursos de emergencia
 * @param {string} riskLevel - Nivel de riesgo: 'LOW', 'MEDIUM', 'HIGH'
 * @param {string} country - País del usuario (opcional)
 * @returns {string} Mensaje de crisis con recursos
 */
export const generateCrisisMessage = (riskLevel, country = 'GENERAL') => {
  const lines = getEmergencyLines(country);
  const messages = [];
  
  // Mensaje base de seguridad
  messages.push(CRISIS_MESSAGES.YOU_ARE_NOT_ALONE);
  
  // Según el nivel de riesgo, agregar recursos apropiados
  if (riskLevel === 'HIGH') {
    messages.push(CRISIS_MESSAGES.IMMEDIATE_SAFETY.replace('{EMERGENCY}', lines.EMERGENCY));
    messages.push(CRISIS_MESSAGES.SUICIDE_PREVENTION.replace('{SUICIDE_LINE}', lines.SUICIDE_PREVENTION));
    if (lines.MENTAL_HEALTH) {
      messages.push(CRISIS_MESSAGES.MENTAL_HEALTH_SUPPORT.replace('{MENTAL_HEALTH_LINE}', lines.MENTAL_HEALTH));
    }
    messages.push(CRISIS_MESSAGES.CRISIS_TEXT_LINE.replace('{CRISIS_TEXT}', lines.CRISIS_TEXT || '741741'));
  } else if (riskLevel === 'MEDIUM') {
    messages.push(CRISIS_MESSAGES.SUICIDE_PREVENTION.replace('{SUICIDE_LINE}', lines.SUICIDE_PREVENTION));
    if (lines.MENTAL_HEALTH) {
      messages.push(CRISIS_MESSAGES.MENTAL_HEALTH_SUPPORT.replace('{MENTAL_HEALTH_LINE}', lines.MENTAL_HEALTH));
    }
    messages.push(CRISIS_MESSAGES.SAFETY_PLAN);
  } else if (riskLevel === 'WARNING') {
    // WARNING - Intervención preventiva
    messages.push('He notado algunas señales que me preocupan. Es importante que sepas que estoy aquí para apoyarte.');
    messages.push(CRISIS_MESSAGES.PROFESSIONAL_HELP);
    messages.push('Si en algún momento sientes que necesitas hablar con alguien, estas líneas están disponibles 24/7:');
    messages.push(CRISIS_MESSAGES.SUICIDE_PREVENTION.replace('{SUICIDE_LINE}', lines.SUICIDE_PREVENTION));
    messages.push(CRISIS_MESSAGES.SAFETY_PLAN);
  } else {
    // LOW risk - mensaje de apoyo general
    messages.push(CRISIS_MESSAGES.PROFESSIONAL_HELP);
    messages.push(CRISIS_MESSAGES.SAFETY_PLAN);
  }
  
  return messages.join(' ');
};

/**
 * Genera un prompt del sistema para situaciones de crisis
 * @param {string} riskLevel - Nivel de riesgo: 'LOW', 'MEDIUM', 'HIGH'
 * @param {string} country - País del usuario (opcional)
 * @returns {string} Prompt del sistema para crisis
 */
export const generateCrisisSystemPrompt = (riskLevel, country = 'GENERAL') => {
  const lines = getEmergencyLines(country);
  const protocol = CRISIS_PROTOCOL.RISK_LEVELS[riskLevel];
  
  let prompt = `🚨 SITUACIÓN DE CRISIS DETECTADA - NIVEL DE RIESGO: ${riskLevel}\n\n`;
  prompt += `PROTOCOLO A SEGUIR:\n`;
  protocol.actions.forEach(action => {
    prompt += `- ${action}\n`;
  });
  prompt += `\nRECURSOS DE EMERGENCIA DISPONIBLES:\n`;
  prompt += `- Emergencia: ${lines.EMERGENCY}\n`;
  prompt += `- Prevención del suicidio: ${lines.SUICIDE_PREVENTION}\n`;
  if (lines.MENTAL_HEALTH) {
    prompt += `- Salud mental: ${lines.MENTAL_HEALTH}\n`;
  }
  prompt += `- Texto de crisis: ${lines.CRISIS_TEXT || '741741'}\n\n`;
  prompt += `INSTRUCCIONES CRÍTICAS:\n`;
  prompt += `1. Prioriza la seguridad del usuario sobre todo\n`;
  prompt += `2. Valida sus emociones sin minimizar\n`;
  prompt += `3. Proporciona recursos de emergencia de forma clara y directa\n`;
  prompt += `4. Crea sensación de conexión y apoyo\n`;
  prompt += `5. Ofrece seguimiento inmediato\n`;
  if (riskLevel === 'HIGH') {
    prompt += `6. URGENTE: Insta al usuario a contactar servicios de emergencia si está en peligro inmediato\n`;
  }
  
  return prompt;
};

