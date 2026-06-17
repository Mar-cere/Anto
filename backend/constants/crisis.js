/**
 * Constantes y Funciones de Crisis - Recursos de emergencia y protocolo de intervención en crisis
 * 
 * Este módulo proporciona:
 * - Mensajes estructurados de crisis
 * - Protocolo de intervención en crisis
 * - Función de evaluación de riesgo suicida
 *
 * Líneas de emergencia por país: ver `emergencyNumbers.js` (`getEmergencyLines`).
 */
import {
  getEmergencyLines,
  resolveCrisisEmergencySource,
} from './emergencyNumbers.js';

export { getEmergencyLines, resolveCrisisEmergencySource };

// ========== MENSAJES DE CRISIS ESTRUCTURADOS ==========
export const CRISIS_MESSAGES = {
  IMMEDIATE_SAFETY: 'Tu seguridad es lo más importante. Si estás en peligro inmediato, llama al {EMERGENCY} ahora.',
  SUICIDE_PREVENTION: 'No estás solo. Llama a la línea de prevención del suicidio: {SUICIDE_LINE}. Están disponibles 24/7.',
  MENTAL_HEALTH_SUPPORT: 'Para apoyo profesional inmediato, contacta: {MENTAL_HEALTH_LINE}',
  SAFETY_PLAN: '¿Hay alguien de confianza con quien puedas hablar o escribir ahora?',
  CRISIS_SAFETY_CHECK: '¿Te sientes a salvo en este momento?',
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
        'Preguntar por seguridad inmediata y apoyo cercano',
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
        'Preguntar por seguridad inmediata y medios de daño cercanos',
        'Documentar para seguimiento profesional urgente',
        'Enviar alerta a contactos de emergencia'
      ]
    }
  }
};

// ========== EVALUACIÓN DE RIESGO SUICIDA ==========

/**
 * ¿Inyectar protocolo completo de crisis en el prompt del modelo (system + mensaje de contexto)?
 * WARNING puede usarse para monitoreo/alertas asíncronas, pero no debe mostrar 911/988 vía prompt
 * solo por un falso positivo del clasificador (p. ej. conflicto de pareja sin ideación).
 */
export const shouldAttachCrisisContextToPrompt = (riskLevel) =>
  riskLevel === 'MEDIUM' || riskLevel === 'HIGH';

/**
 * ¿Incluir objeto `crisis` en el contexto OpenAI (post-proceso + prompts por nivel)?
 * Distinto de shouldAttachCrisisContextToPrompt (bloque completo solo MEDIUM/HIGH).
 */
export function shouldIncludeCrisisInOpenaiContext(
  riskLevel,
  { isCrisis = false, userMessage } = {},
) {
  const level = String(riskLevel || 'LOW').trim().toUpperCase();
  if (['WARNING', 'MEDIUM', 'HIGH'].includes(level)) return true;
  if (hasExplicitSuicidalOrSelfHarmLexicon(userMessage)) return true;
  if (isCrisis && level !== 'LOW') return true;
  return false;
}

/**
 * Construye el objeto crisis para openaiService / prompt builder.
 */
export function buildOpenaiCrisisContext({
  riskLevel,
  isCrisis = false,
  userMessage,
  preferences = null,
  phone = null,
  country = null,
} = {}) {
  if (!shouldIncludeCrisisInOpenaiContext(riskLevel, { isCrisis, userMessage })) {
    return undefined;
  }
  const ctx = {
    riskLevel: normalizeStoredCrisisRiskLevel(riskLevel),
    preferences,
    phone,
    detectedAt: new Date(),
  };
  if (country) ctx.country = country;
  return ctx;
}

/**
 * Prompt ligero para WARNING con malestar alto (sin léxico explícito de ideación).
 */
export function shouldAttachCrisisWarningContextToPrompt(
  riskLevel,
  { emotional, contextual, userMessage } = {},
) {
  if (String(riskLevel || '').toUpperCase() !== 'WARNING') return false;
  if (hasExplicitSuicidalOrSelfHarmLexicon(userMessage)) return false;
  const intensity = Number(emotional?.intensity || 0);
  if (intensity >= 7) return true;
  if (contextual?.intencion?.tipo === 'CRISIS' && intensity >= 6) return true;
  return false;
}

/**
 * Contexto de sistema breve para WARNING (validación + seguridad presente, sin tono 911).
 */
export function generateCrisisWarningContextMessage(countryOrSource = 'GENERAL') {
  const lines = getEmergencyLines(countryOrSource);
  return [
    'Señales de malestar elevado (nivel WARNING, sin ideación explícita en el mensaje).',
    'Prioriza validación breve y comprobar cómo está ahora.',
    CRISIS_MESSAGES.CRISIS_SAFETY_CHECK,
    'Escucha sin presionar técnicas, hábitos ni planes a futuro.',
    `Si el malestar sube, puede usar la línea de prevención: ${lines.SUICIDE_PREVENTION}.`,
  ].join(' ');
}

/**
 * Léxico explícito de ideación suicida / autolesión en el mensaje (no depende del clasificador).
 */
export function hasExplicitSuicidalOrSelfHarmLexicon(content) {
  if (!content || typeof content !== 'string') return false;
  const c = content.toLowerCase();
  if (/suicid/i.test(c)) return true;
  if (/(?:me.*quiero.*morir|quiero.*morir|prefiero.*morir|me.*voy.*a.*matar)/i.test(c)) return true;
  if (/(?:acabar.*con.*mi.*vida|terminar.*con.*mi.*vida)/i.test(c)) return true;
  if (/autoles|auto\s*les|me\s+corto|cortarme|lastimar|hacerme\s+daño|hacerse\s+daño/i.test(c)) return true;
  return false;
}

/**
 * Historial Mongo típico: sort { createdAt: -1 } → el índice 0 es el más reciente.
 * Devuelve textos de mensajes user en orden cronológico (últimos hasta `max`).
 */
function extractRecentUserContentsChronological(historyNewestFirst, max = 8) {
  if (!Array.isArray(historyNewestFirst)) return [];
  return [...historyNewestFirst]
    .reverse()
    .filter((m) => m.role === 'user')
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .slice(-max);
}

/**
 * Tras una desescalada explícita del usuario, si el siguiente mensaje es reflexivo
 * (patrón histórico) sin señales de inmediatez, evita repetir el bloque largo 911/988.
 */
export function shouldUseCompactCrisisSafetyAppend(userMessageContent, historyNewestFirst) {
  const cur = (userMessageContent || '').trim();
  if (!cur) return false;
  const curLower = cur.toLowerCase();
  const recentUser = extractRecentUserContentsChronological(historyNewestFirst, 10);
  const joined = recentUser.join(' ').toLowerCase();
  const calmRecently =
    /\b(estoy bien|ahora estoy bien|mejor ahora|solo (un )?poco de ansiedad|no (es|está) tan mal)\b/i.test(
      joined
    );
  const historicalTone =
    /\b(a veces|desde hace|hace mucho tiempo|hace tiempo|patr[oó]n|cuando (me )?siento|historia de)\b/i.test(
      curLower
    );
  const imminent =
    /\b(ahora mismo|en este momento voy|esta noche voy|ya no aguanto|voy a hacerlo|tal vez ahora|en un rato)\b/i.test(
      curLower
    );
  const selfHarmReflection =
    hasExplicitSuicidalOrSelfHarmLexicon(cur) || /\b(autoles|me\s+corto|cortes|lastim)\b/i.test(curLower);
  if (!calmRecently || !historicalTone || imminent || !selfHarmReflection) return false;
  return true;
}

/**
 * Malestar interpersonal (pareja, ex, peleas) sin léxico de autolesión: suele clasificarse como CRISIS
 * con alta confianza pero no debe puntuar como crisis suicida completa.
 */
function isLikelyInterpersonalDistressWithoutSelfHarmLexicon(content) {
  if (hasExplicitSuicidalOrSelfHarmLexicon(content)) return false;
  return /(?:\bex\b|ex-|pareja|novi[oa]|relaci[oó]n|pelea|peleas|volv|volviendo|volvamos|mentira|celos|engañ|engañ)/i.test(
    content
  );
}

/**
 * Para post-procesado de respuesta (addSafetyChecks): no añadir 911/988 genéricos si el mensaje del usuario
 * describe conflicto de pareja / ex sin ideación explícita (evita el patrón visto en conversaciones reales).
 */
export const shouldSkipEmergencyPhoneNumbersInSafetyAppend = (userMessageContent) =>
  isLikelyInterpersonalDistressWithoutSelfHarmLexicon(userMessageContent || '');

/** Valores que puede devolver `evaluateSuicideRisk` y que persistimos en `Message.metadata.crisis.riskLevel`. */
const STORED_CRISIS_RISK_LEVELS = new Set(['LOW', 'WARNING', 'MEDIUM', 'HIGH']);

/**
 * Garantiza que solo se guarden niveles conocidos (evita basura en BD / manipulación).
 * @param {unknown} raw
 * @returns {'LOW' | 'WARNING' | 'MEDIUM' | 'HIGH'}
 */
export function normalizeStoredCrisisRiskLevel(raw) {
  const L = String(raw == null ? 'LOW' : raw)
    .trim()
    .toUpperCase();
  return STORED_CRISIS_RISK_LEVELS.has(L) ? L : 'LOW';
}

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
  
  // Intención de crisis (clasificador). Reducir peso si el texto es típico de conflicto de pareja
  // sin léxico de autolesión/ideación (evita MEDIUM + prompt de emergencia por "peleas con el ex").
  if (contextualAnalysis?.intencion?.tipo === 'CRISIS' && contextualAnalysis?.intencion?.confianza >= 0.9) {
    const boost = isLikelyInterpersonalDistressWithoutSelfHarmLexicon(content) ? 1 : 3;
    riskScore += boost;
  } else if (contextualAnalysis?.intencion?.tipo === 'CRISIS' && contextualAnalysis?.intencion?.confianza >= 0.8) {
    const boost = isLikelyInterpersonalDistressWithoutSelfHarmLexicon(content) ? 1 : 2;
    riskScore += boost;
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
  if (
    emotionalAnalysis?.intensity >= 9 &&
    (/suicid|morir|matar|acabar|terminar|desesperad/i.test(content) ||
      (contextualAnalysis?.intencion?.tipo === 'CRISIS' &&
        !isLikelyInterpersonalDistressWithoutSelfHarmLexicon(content)))
  ) {
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

const ACTION_LEVELS = {
  MONITOR: 'MONITOR',
  SUPPORT_USER: 'SUPPORT_USER',
  VERIFY: 'VERIFY',
  ALERT_CONTACTS: 'ALERT_CONTACTS'
};

const clampConfidence = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const detectAdvancedPlanning = (content) =>
  /(?:tengo.*plan|ya.*sé.*c[oó]mo|m[eé]todo|medios.*para|he.*preparado|carta.*despedida|fecha.*para)/i.test(
    content || ''
  );

const detectFarewellSignals = (content) =>
  /(?:ad[ií]os|esta.*ser[aá].*la.*[uú]ltima|[uú]ltimo.*mensaje|ya.*no.*estar[eé]|despedirme|gracias.*por.*todo)/i.test(
    content || ''
  );

const detectObsessiveDistress = (content) =>
  /(?:no.*puedo.*dejar.*de.*pensar|todo.*el.*tiempo.*pienso|obsesi[oó]n|rumio|rumiaci[oó]n|me.*persigue.*la.*idea)/i.test(
    content || ''
  );

const detectIsolationSignals = (content, trendAnalysis) => {
  const lexicalIsolation =
    /(?:estoy.*solo|no.*tengo.*a.*nadie|nadie.*me.*entiende|aislad[oa]|desconectad[oa]|sin.*apoyo)/i.test(
      content || ''
    );
  const trendIsolation = Boolean(trendAnalysis?.trends?.isolation || trendAnalysis?.trends?.sustainedLow);
  return lexicalIsolation || trendIsolation;
};

const detectCommunicationDisengagement = (conversationContext = {}) =>
  Boolean(
    conversationContext.helpRejected ||
      conversationContext.abruptToneChange ||
      conversationContext.silenceAfterNegative
  );

/**
 * Decide nivel operativo con puertas conservadoras para alertar a contactos.
 * Objetivo: reducir falsos positivos sociales, manteniendo sensibilidad en casos críticos.
 */
export const buildCrisisActionDecision = ({
  riskLevel,
  messageContent,
  contextualAnalysis,
  trendAnalysis,
  crisisHistory,
  conversationContext
}) => {
  const content = messageContent || '';
  const classifierConfidence = Number(contextualAnalysis?.intencion?.confianza || 0);

  const signals = {
    advancedPlanning: detectAdvancedPlanning(content),
    farewellSignals: detectFarewellSignals(content),
    obsessiveDistress: detectObsessiveDistress(content),
    isolation: detectIsolationSignals(content, trendAnalysis),
    communicationDisengagement: detectCommunicationDisengagement(conversationContext),
    trendDeterioration: Boolean(
      trendAnalysis?.trends?.rapidDecline || trendAnalysis?.trends?.escalation || trendAnalysis?.trends?.sustainedLow
    ),
    recentCrisisHistory: Number(crisisHistory?.recentCrises || 0) > 0
  };

  const criticalSignals = Number(signals.advancedPlanning) + Number(signals.farewellSignals);
  const moderateSignals =
    Number(signals.obsessiveDistress) +
    Number(signals.isolation) +
    Number(signals.communicationDisengagement) +
    Number(signals.trendDeterioration);

  const baseConfidenceByRisk = {
    LOW: 0.55,
    WARNING: 0.68,
    MEDIUM: 0.78,
    HIGH: 0.88
  };
  let confidence = baseConfidenceByRisk[riskLevel] ?? 0.5;
  confidence += classifierConfidence >= 0.9 ? 0.08 : classifierConfidence >= 0.8 ? 0.04 : 0;
  confidence += criticalSignals > 0 ? 0.06 : 0;
  confidence += moderateSignals >= 3 ? 0.05 : moderateSignals >= 2 ? 0.03 : 0;
  confidence += signals.recentCrisisHistory ? 0.03 : 0;
  confidence = clampConfidence(confidence);

  let actionLevel = ACTION_LEVELS.MONITOR;
  if (riskLevel === 'WARNING') actionLevel = ACTION_LEVELS.SUPPORT_USER;
  if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') actionLevel = ACTION_LEVELS.VERIFY;

  const hasStrongEvidence =
    criticalSignals >= 1 &&
    (signals.trendDeterioration || signals.recentCrisisHistory || moderateSignals >= 2);
  const hasAccumulatedEvidence =
    criticalSignals >= 1 &&
    moderateSignals >= 3 &&
    (signals.trendDeterioration || signals.recentCrisisHistory);

  const shouldAlertContacts =
    (riskLevel === 'HIGH' && confidence >= 0.9 && (hasStrongEvidence || hasAccumulatedEvidence)) ||
    (riskLevel === 'MEDIUM' && confidence >= 0.95 && hasAccumulatedEvidence);

  if (shouldAlertContacts) {
    actionLevel = ACTION_LEVELS.ALERT_CONTACTS;
  }

  const reasons = [];
  if (signals.advancedPlanning) reasons.push('advanced_planning');
  if (signals.farewellSignals) reasons.push('farewell_signals');
  if (signals.obsessiveDistress) reasons.push('obsessive_distress');
  if (signals.isolation) reasons.push('isolation');
  if (signals.communicationDisengagement) reasons.push('communication_disengagement');
  if (signals.trendDeterioration) reasons.push('trend_deterioration');
  if (signals.recentCrisisHistory) reasons.push('recent_crisis_history');

  return {
    riskLevel,
    actionLevel,
    shouldAlertContacts,
    confidence,
    evidence: {
      criticalSignals,
      moderateSignals,
      hasStrongEvidence,
      hasAccumulatedEvidence
    },
    reasons
  };
};

// ========== FUNCIONES HELPER ==========

/**
 * Genera un mensaje de crisis personalizado con recursos de emergencia
 * @param {string} riskLevel - Nivel de riesgo: 'LOW', 'MEDIUM', 'HIGH'
 * @param {string|Object} [countryOrSource='GENERAL'] - Legacy, ISO, o `{ preferences, phone }`
 * @returns {string} Mensaje de crisis con recursos
 */
export const generateCrisisMessage = (riskLevel, countryOrSource = 'GENERAL') => {
  const lines = getEmergencyLines(countryOrSource);
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
    if (lines.CRISIS_TEXT) {
      messages.push(CRISIS_MESSAGES.CRISIS_TEXT_LINE.replace('{CRISIS_TEXT}', lines.CRISIS_TEXT));
    }
  } else if (riskLevel === 'MEDIUM') {
    messages.push(CRISIS_MESSAGES.SUICIDE_PREVENTION.replace('{SUICIDE_LINE}', lines.SUICIDE_PREVENTION));
    if (lines.MENTAL_HEALTH) {
      messages.push(CRISIS_MESSAGES.MENTAL_HEALTH_SUPPORT.replace('{MENTAL_HEALTH_LINE}', lines.MENTAL_HEALTH));
    }
    messages.push(CRISIS_MESSAGES.CRISIS_SAFETY_CHECK);
    messages.push(CRISIS_MESSAGES.SAFETY_PLAN);
  } else if (riskLevel === 'WARNING') {
    // WARNING - Intervención preventiva
    messages.push('He notado algunas señales que me preocupan. Es importante que sepas que estoy aquí para apoyarte.');
    messages.push(CRISIS_MESSAGES.PROFESSIONAL_HELP);
    messages.push('Si en algún momento sientes que necesitas hablar con alguien, estas líneas están disponibles 24/7:');
    messages.push(CRISIS_MESSAGES.SUICIDE_PREVENTION.replace('{SUICIDE_LINE}', lines.SUICIDE_PREVENTION));
    messages.push(CRISIS_MESSAGES.CRISIS_SAFETY_CHECK);
  } else {
    // LOW risk - mensaje de apoyo general
    messages.push(CRISIS_MESSAGES.PROFESSIONAL_HELP);
  }
  
  return messages.join(' ');
};

/**
 * Genera un prompt del sistema para situaciones de crisis
 * @param {string} riskLevel - Nivel de riesgo: 'LOW', 'MEDIUM', 'HIGH'
 * @param {string|Object} [countryOrSource='GENERAL'] - Legacy, ISO, o `{ preferences, phone }`
 * @returns {string} Prompt del sistema para crisis
 */
export const generateCrisisSystemPrompt = (riskLevel, countryOrSource = 'GENERAL', language = 'es') => {
  const lines = getEmergencyLines(countryOrSource);
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
  if (lines.CRISIS_TEXT) {
    prompt += `- Texto de crisis: ${lines.CRISIS_TEXT}\n`;
  }
  prompt += '\n';
  prompt += `INSTRUCCIONES CRÍTICAS:\n`;
  prompt += `1. Prioriza la seguridad del usuario sobre todo\n`;
  prompt += `2. Valida sus emociones sin minimizar\n`;
  prompt += `3. Proporciona recursos de emergencia de forma clara y directa\n`;
  prompt += `4. Mantén tono humano y presente; evita planes terapéuticos, hábitos o técnicas\n`;
  prompt += `5. Pregunta por seguridad inmediata y apoyo cercano si falta en la conversación\n`;
  if (riskLevel === 'HIGH') {
    prompt += `6. URGENTE: Insta al usuario a contactar servicios de emergencia si está en peligro inmediato\n`;
  }
  if (riskLevel === 'MEDIUM') {
    prompt += `\n${generateCrisisMediumResponseConstraints(language)}\n`;
  }

  return prompt;
};

/**
 * Plantilla casi fija para respuestas LLM en crisis MEDIUM (camino B fase 3).
 */
export function generateCrisisMediumResponseConstraints(language = 'es') {
  const lang = String(language || 'es').trim().toLowerCase() === 'en' ? 'en' : 'es';
  if (lang === 'en') {
    return [
      'MANDATORY RESPONSE FORMAT (MEDIUM):',
      '1. At most 2 empathetic validation sentences tied to the user message.',
      '2. One direct safety question: Are you safe right now?',
      '3. Brief local crisis lines (max 3 bullets).',
      '4. One sentence inviting contact with someone trusted now.',
      'FORBIDDEN: techniques, habits, tasks, future plans, A/B choices, co-created safety plans.',
      'Target length: about 120–280 words.',
    ].join('\n');
  }
  return [
    'FORMATO DE RESPUESTA OBLIGATORIO (MEDIUM):',
    '1. Máximo 2 frases de validación empática ligadas al mensaje del usuario.',
    '2. Una pregunta directa de seguridad: ¿Te sientes a salvo en este momento?',
    '3. Líneas de ayuda locales en lista breve (máx. 3 viñetas).',
    '4. Una frase invitando a contactar a alguien de confianza ahora.',
    'PROHIBIDO: técnicas, hábitos, tareas, planes a futuro, opciones A/B, plan de seguridad co-creado.',
    'Longitud orientativa: 120–280 palabras.',
  ].join('\n');
}

