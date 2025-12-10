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

// ========== TRADUCCIONES DE MENSAJES DE ALERTA ==========
export const ALERT_MESSAGES = {
  es: {
    // Asuntos
    TEST_SUBJECT: '🧪 [PRUEBA] Alerta de {APP_NAME} - {USER_NAME}',
    ALERT_SUBJECT: '🚨 Alerta de {APP_NAME} - {USER_NAME} necesita apoyo',
    
    // Niveles de riesgo
    RISK_LEVEL: {
      LOW: 'Bajo',
      MEDIUM: 'Medio',
      HIGH: 'Alto',
      WARNING: 'Advertencia',
      UNKNOWN: 'Desconocido'
    },
    
    // Mensajes de prueba
    TEST_HEADER: '🧪 Esta es una PRUEBA',
    TEST_DESCRIPTION: 'Este es un email de prueba del sistema de alertas de emergencia.',
    TEST_EXPLANATION: 'No hay ninguna situación de emergencia real. {USER_NAME} está probando que el sistema funciona correctamente.',
    TEST_SUCCESS: 'Si recibiste este email, significa que:',
    TEST_SUCCESS_ITEM_1: '✅ Tu dirección de email está correctamente configurada',
    TEST_SUCCESS_ITEM_2: '✅ El sistema puede contactarte en caso de emergencia',
    TEST_SUCCESS_ITEM_3: '✅ Las alertas llegarán a tu bandeja de entrada',
    TEST_FOOTER: 'En caso de una emergencia real, recibirás un email similar pero con información sobre la situación y recursos de ayuda.',
    
    // Mensajes de alerta
    ALERT_HEADER: '🚨 Alerta de {APP_NAME}',
    ALERT_GREETING: 'Hola,',
    ALERT_INTRO: 'Has sido designado como contacto de emergencia de <strong>{USER_NAME}</strong> en {APP_NAME}.',
    SITUATION_DETECTED: '⚠️ Situación Detectada',
    RISK_LEVEL_LABEL: 'Nivel de Riesgo:',
    SITUATION_DESCRIPTION: 'Nuestro sistema ha detectado señales de que {USER_NAME} podría estar pasando por un momento difícil y necesita apoyo.',
    HIGH_RISK_WARNING: 'Esta es una situación de alto riesgo que requiere atención inmediata.',
    
    // Qué puedes hacer
    WHAT_CAN_YOU_DO: '¿Qué puedes hacer?',
    ACTION_CONTACT: '<strong>Contacta a {USER_NAME} directamente</strong> - Tu apoyo personal es muy valioso',
    ACTION_LISTEN: '<strong>Escucha sin juzgar</strong> - A veces solo necesitan alguien que los escuche',
    ACTION_SUPPORT: '<strong>Ofrece acompañamiento</strong> - Pregunta cómo puedes ayudar',
    ACTION_PROFESSIONAL: '<strong>Busca ayuda profesional</strong> - Si la situación es grave, contacta servicios de emergencia',
    
    // Recursos
    EMERGENCY_RESOURCES: 'Recursos de Emergencia',
    EMERGENCY_RESOURCES_DESC: 'Si la situación es urgente, contacta:',
    
    // Footer
    IMPORTANT_NOTE: 'Importante: Esta alerta se genera automáticamente cuando nuestro sistema detecta señales de riesgo. Por favor, verifica la situación directamente con {USER_NAME}.',
    ERROR_NOTE: 'Si crees que esta alerta fue enviada por error o si {USER_NAME} ya está recibiendo el apoyo necesario, puedes ignorar este mensaje.',
    FOOTER_AUTO: 'Este es un mensaje automático de {APP_NAME}.',
    FOOTER_NO_REPLY: 'Por favor, no respondas a este correo. Si necesitas contactar a {USER_NAME}, usa los medios de contacto que tengas con él/ella.',
    FOOTER_PRIVACY: 'Tu privacidad es importante. Este correo se envió solo porque fuiste designado como contacto de emergencia.',
    
    // WhatsApp
    WHATSAPP_TEST: '[PRUEBA] Alerta de {APP_NAME}',
    WHATSAPP_TEST_MESSAGE: 'Esta es una prueba del sistema de alertas. {USER_NAME} está verificando que el sistema funciona correctamente. No hay emergencia real.',
    WHATSAPP_ALERT: '🚨 Alerta de {APP_NAME}',
    WHATSAPP_INTRO: 'Has sido designado como contacto de emergencia de {USER_NAME}.',
    WHATSAPP_SITUATION: 'Nuestro sistema ha detectado señales de que {USER_NAME} podría necesitar apoyo.',
    WHATSAPP_RISK_LEVEL: 'Nivel de riesgo: {RISK_LEVEL}',
    WHATSAPP_ACTIONS: 'Por favor, contacta a {USER_NAME} directamente. Tu apoyo es muy valioso.',
    WHATSAPP_EMERGENCY: 'Si es urgente, contacta servicios de emergencia: {EMERGENCY}',
    WHATSAPP_FOOTER: 'Esta es una alerta automática. Verifica la situación directamente con {USER_NAME}.'
  },
  en: {
    // Subjects
    TEST_SUBJECT: '🧪 [TEST] Alert from {APP_NAME} - {USER_NAME}',
    ALERT_SUBJECT: '🚨 Alert from {APP_NAME} - {USER_NAME} needs support',
    
    // Risk levels
    RISK_LEVEL: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      WARNING: 'Warning',
      UNKNOWN: 'Unknown'
    },
    
    // Test messages
    TEST_HEADER: '🧪 This is a TEST',
    TEST_DESCRIPTION: 'This is a test email from the emergency alert system.',
    TEST_EXPLANATION: 'There is no real emergency situation. {USER_NAME} is testing that the system works correctly.',
    TEST_SUCCESS: 'If you received this email, it means:',
    TEST_SUCCESS_ITEM_1: '✅ Your email address is correctly configured',
    TEST_SUCCESS_ITEM_2: '✅ The system can contact you in case of emergency',
    TEST_SUCCESS_ITEM_3: '✅ Alerts will arrive in your inbox',
    TEST_FOOTER: 'In case of a real emergency, you will receive a similar email but with information about the situation and help resources.',
    
    // Alert messages
    ALERT_HEADER: '🚨 Alert from {APP_NAME}',
    ALERT_GREETING: 'Hello,',
    ALERT_INTRO: 'You have been designated as an emergency contact for <strong>{USER_NAME}</strong> in {APP_NAME}.',
    SITUATION_DETECTED: '⚠️ Situation Detected',
    RISK_LEVEL_LABEL: 'Risk Level:',
    SITUATION_DESCRIPTION: 'Our system has detected signs that {USER_NAME} might be going through a difficult time and needs support.',
    HIGH_RISK_WARNING: 'This is a high-risk situation that requires immediate attention.',
    
    // What can you do
    WHAT_CAN_YOU_DO: 'What can you do?',
    ACTION_CONTACT: '<strong>Contact {USER_NAME} directly</strong> - Your personal support is very valuable',
    ACTION_LISTEN: '<strong>Listen without judging</strong> - Sometimes they just need someone to listen',
    ACTION_SUPPORT: '<strong>Offer support</strong> - Ask how you can help',
    ACTION_PROFESSIONAL: '<strong>Seek professional help</strong> - If the situation is serious, contact emergency services',
    
    // Resources
    EMERGENCY_RESOURCES: 'Emergency Resources',
    EMERGENCY_RESOURCES_DESC: 'If the situation is urgent, contact:',
    
    // Footer
    IMPORTANT_NOTE: 'Important: This alert is automatically generated when our system detects risk signals. Please verify the situation directly with {USER_NAME}.',
    ERROR_NOTE: 'If you believe this alert was sent by mistake or if {USER_NAME} is already receiving the necessary support, you can ignore this message.',
    FOOTER_AUTO: 'This is an automatic message from {APP_NAME}.',
    FOOTER_NO_REPLY: 'Please do not reply to this email. If you need to contact {USER_NAME}, use the contact methods you have with them.',
    FOOTER_PRIVACY: 'Your privacy is important. This email was sent only because you were designated as an emergency contact.',
    
    // WhatsApp
    WHATSAPP_TEST: '[TEST] Alert from {APP_NAME}',
    WHATSAPP_TEST_MESSAGE: 'This is a test of the alert system. {USER_NAME} is verifying that the system works correctly. There is no real emergency.',
    WHATSAPP_ALERT: '🚨 Alert from {APP_NAME}',
    WHATSAPP_INTRO: 'You have been designated as an emergency contact for {USER_NAME}.',
    WHATSAPP_SITUATION: 'Our system has detected signs that {USER_NAME} might need support.',
    WHATSAPP_RISK_LEVEL: 'Risk level: {RISK_LEVEL}',
    WHATSAPP_ACTIONS: 'Please contact {USER_NAME} directly. Your support is very valuable.',
    WHATSAPP_EMERGENCY: 'If urgent, contact emergency services: {EMERGENCY}',
    WHATSAPP_FOOTER: 'This is an automatic alert. Verify the situation directly with {USER_NAME}.'
  }
};

/**
 * Obtiene los mensajes traducidos según el idioma
 * @param {string} language - Código de idioma ('es' o 'en')
 * @returns {Object} Objeto con mensajes traducidos
 */
export const getAlertMessages = (language = 'es') => {
  return ALERT_MESSAGES[language] || ALERT_MESSAGES.es;
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
  
  // Intención de crisis (solo si la confianza es muy alta)
  if (contextualAnalysis?.intencion?.tipo === 'CRISIS' && contextualAnalysis?.intencion?.confianza >= 0.9) {
    riskScore += 3;
  } else if (contextualAnalysis?.intencion?.tipo === 'CRISIS' && contextualAnalysis?.intencion?.confianza >= 0.8) {
    riskScore += 2; // Reducir si la confianza es menor
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
  
  // Intensidad emocional muy alta (solo si es extrema y hay otros indicadores)
  // No sumar solo por intensidad alta sin otros indicadores de crisis
  if (emotionalAnalysis?.intensity >= 9 && (
    /(?:suicid|morir|matar|acabar|terminar|desesperad)/i.test(content) ||
    contextualAnalysis?.intencion?.tipo === 'CRISIS'
  )) {
    riskScore += 2;
  }
  
  // Tristeza extrema (solo si hay otros indicadores de crisis)
  // No sumar solo por tristeza sin indicadores específicos de crisis
  if (emotionalAnalysis?.mainEmotion === 'tristeza' && emotionalAnalysis?.intensity >= 8 && (
    /(?:suicid|morir|matar|acabar|terminar|desesperad|sin.*salida|no.*quiero.*vivir)/i.test(content) ||
    contextualAnalysis?.intencion?.tipo === 'CRISIS'
  )) {
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
  
  // ========== VALIDACIONES ADICIONALES PARA EVITAR FALSOS POSITIVOS ==========
  
  // Mensajes muy cortos o neutrales no deben activar crisis
  const contentLength = content.trim().length;
  const isVeryShort = contentLength < 10;
  const trimmedContent = content.trim();
  
  // Detectar saludos y preguntas simples (deben tener score 0)
  // IMPORTANTE: Estas validaciones deben ir ANTES de calcular el score para evitar falsos positivos
  const isNeutralGreeting = /^(hola|hi|hello|buenos.*d[ií]as|buenas.*tardes|buenas.*noches|qué.*tal|qué.*pasa|qué.*pasó|qué.*hubo|todo.*bien|estoy.*bien|está.*bien|están.*bien)$/i.test(trimmedContent);
  const isSimpleQuestion = /^(quien.*eres|qué.*haces|qué.*es|qué.*sos|qué.*hace|qué.*hacen|qué.*es.*esto|quien.*sos|quien.*es|como.*funciona|para.*qué.*sirve|qué.*puedes.*hacer|qué.*ofreces|quien.*eres.*y.*qué.*haces|quien.*eres.*y.*que.*haces)$/i.test(trimmedContent);
  const isPositiveMessage = /^(todo.*bien|estoy.*bien|está.*bien|están.*bien|muy.*bien|excelente|genial|perfecto|bien.*gracias|bien.*y.*tú|bien.*y.*vos)$/i.test(trimmedContent);
  const isJustQuestionMarks = /^\?+$/i.test(trimmedContent);
  
  // Si es un saludo, pregunta simple sobre el sistema, o solo signos de interrogación, score = 0
  if (isNeutralGreeting || isSimpleQuestion || isJustQuestionMarks || isPositiveMessage) {
    return 'LOW'; // Retornar directamente LOW sin calcular score
  }
  
  // Si es muy corto y no tiene indicadores de crisis, reducir score
  if (isVeryShort && riskScore < 3) {
    riskScore = Math.max(0, riskScore - 2);
  }
  
  // Si el mensaje menciona eventos positivos o emociones positivas, reducir score drásticamente o retornar LOW directamente
  const hasPositiveEvents = /(?:graduaci[oó]n|fiesta|celebraci[oó]n|cumpleaños|boda|nacimiento|logro|éxito|felicidad|alegría|contento|satisfecho|feliz|alegre|orgullos[oa]|emocionad[oa])/i.test(content);
  const hasPositiveEmotions = /(?:estoy.*feliz|me.*siento.*feliz|estoy.*alegre|me.*siento.*alegre|estoy.*content[oa]|me.*siento.*content[oa]|estoy.*emocionad[oa]|me.*siento.*emocionad[oa])/i.test(content);
  
  // Si hay eventos positivos o emociones positivas, reducir score drásticamente o retornar LOW directamente
  if (hasPositiveEvents || hasPositiveEmotions) {
    // Si el mensaje es claramente positivo, retornar LOW directamente
    if (hasPositiveEvents && (hasPositiveEmotions || /(?:estoy|me.*siento|tengo|siento).*(?:feliz|alegre|content[oa]|emocionad[oa]|orgullos[oa])/i.test(content))) {
      return 'LOW'; // Retornar LOW directamente para mensajes claramente positivos
    }
    // Si solo menciona eventos positivos pero no emociones, reducir score significativamente
    riskScore = Math.max(0, riskScore - 5); // Reducción drástica
  }
  
  // Validación adicional: si el mensaje es una pregunta simple sobre el sistema, score = 0
  const isSystemQuestion = /(?:quien.*eres|qué.*haces|qué.*es|qué.*sos|como.*funciona|para.*qué.*sirve|qué.*puedes.*hacer|qué.*ofreces)/i.test(content);
  if (isSystemQuestion) {
    riskScore = 0;
    return 'LOW';
  }
  
  // ========== DETERMINAR NIVEL DE RIESGO ==========
  
  // Umbrales MUY altos para reducir falsos positivos drásticamente
  // Solo activar crisis con indicadores MUY claros y específicos
  if (riskScore >= 10) {
    return 'HIGH'; // Solo para situaciones extremadamente críticas
  } else if (riskScore >= 7) {
    return 'MEDIUM'; // Solo para situaciones claramente de crisis
  } else if (riskScore >= 5) {
    return 'WARNING'; // Solo para situaciones que requieren atención preventiva
  } else {
    return 'LOW'; // Todo lo demás es LOW
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

