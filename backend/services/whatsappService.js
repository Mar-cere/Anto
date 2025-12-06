/**
 * Servicio de WhatsApp - Envía mensajes a través de Twilio WhatsApp API
 * 
 * Requiere configuración de Twilio:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_NUMBER (formato: whatsapp:+14155238886)
 * 
 * @author AntoApp Team
 */

import twilio from 'twilio';
import { getFormattedEmergencyNumbers } from '../constants/emergencyNumbers.js';
import { getAlertMessages } from '../constants/crisis.js';
import { APP_NAME } from '../constants/app.js';

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // Formato: whatsapp:+14155238886

// Message Template para alertas de emergencia (opcional, se usa si está configurado)
// Formato: nombre_de_template_aprobado_en_twilio
// Ejemplo: "emergency_alert" o "alerta_emergencia"
const EMERGENCY_ALERT_TEMPLATE = process.env.TWILIO_WHATSAPP_EMERGENCY_TEMPLATE || null;
const TEST_MESSAGE_TEMPLATE = process.env.TWILIO_WHATSAPP_TEST_TEMPLATE || null;

// Verificar si Twilio está configurado
const USE_WHATSAPP = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER);

let twilioClient = null;

if (USE_WHATSAPP) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[WhatsAppService] ✅ Twilio configurado correctamente');
  } catch (error) {
    console.error('[WhatsAppService] ❌ Error configurando Twilio:', error.message);
  }
} else {
  console.log('[WhatsAppService] ⚠️ Twilio no configurado, WhatsApp deshabilitado');
}

/**
 * Formatea un número de teléfono para WhatsApp
 * Simplificado - solo limpia y agrega formato básico
 * @param {string} phone - Número de teléfono (puede tener varios formatos)
 * @returns {string} Número formateado para WhatsApp (whatsapp:+1234567890) o null si inválido
 */
const formatPhoneForWhatsApp = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  // Limpiar: remover espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si ya tiene formato whatsapp:, removerlo primero
  if (cleaned.startsWith('whatsapp:')) {
    cleaned = cleaned.replace('whatsapp:', '');
  }
  
  // Si empieza con +, mantenerlo
  if (cleaned.startsWith('+')) {
    return `whatsapp:${cleaned}`;
  }
  
  // Si empieza con 0, removerlo (números locales)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Agregar código de país si no lo tiene
  const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '+56'; // Chile por defecto
  if (!cleaned.startsWith('+')) {
    cleaned = `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  }
  
  // Validar que tenga al menos 10 dígitos (número mínimo razonable)
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return null; // Número muy corto, probablemente inválido
  }
  
  return `whatsapp:${cleaned}`;
};

/**
 * Envía un mensaje de WhatsApp
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
/**
 * Envía un mensaje de WhatsApp
 * Simplificado - manejo de errores más directo
 */
const sendWhatsAppMessage = async (to, message) => {
  // Verificar configuración
  if (!USE_WHATSAPP || !twilioClient) {
    return {
      success: false,
      error: 'WhatsApp no está configurado'
    };
  }

  // Formatear número
  const formattedTo = formatPhoneForWhatsApp(to);
  if (!formattedTo) {
    return {
      success: false,
      error: 'Número de teléfono inválido'
    };
  }

  try {
    console.log(`[WhatsAppService] 📤 Enviando mensaje a ${formattedTo} desde ${TWILIO_WHATSAPP_NUMBER}`);
    
    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedTo,
      body: message
    });

    console.log(`[WhatsAppService] ✅ Mensaje enviado exitosamente. SID: ${result.sid}, Status: ${result.status}`);
    
    // Advertencia si el status es "queued" (común en sandbox)
    if (result.status === 'queued') {
      console.warn(`[WhatsAppService] ⚠️ Mensaje en cola. Esto puede significar:`);
      console.warn(`   - El número no está verificado en Twilio Sandbox`);
      console.warn(`   - El mensaje está esperando ser procesado`);
      console.warn(`   - Verifica el número en Twilio Console > Messaging > Try it out`);
    }

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      warning: result.status === 'queued' ? 'Mensaje en cola. Si no llega, verifica que el número esté verificado en Twilio Sandbox.' : null
    };
  } catch (error) {
    // Manejo de errores comunes
    const errorMessages = {
      21211: 'Número de teléfono inválido',
      21608: 'El número no está registrado en WhatsApp',
      21408: 'Número no autorizado (sandbox: solo números verificados)',
      21614: 'Número no válido para WhatsApp',
      63016: 'Mensaje fuera de la ventana de 24 horas. Se requiere usar Message Template.'
    };

    // Si el error es 63016 (fuera de ventana de 24h), intentar con template si está configurado
    if (error.code === 63016) {
      console.warn(`[WhatsAppService] ⚠️ Error 63016: Mensaje fuera de ventana de 24h. Se requiere Message Template.`);
      return {
        success: false,
        error: errorMessages[63016],
        errorCode: 63016,
        requiresTemplate: true,
        suggestion: 'Configura TWILIO_WHATSAPP_EMERGENCY_TEMPLATE o TWILIO_WHATSAPP_TEST_TEMPLATE para enviar fuera de la ventana de 24 horas'
      };
    }

    return {
      success: false,
      error: errorMessages[error.code] || error.message || 'Error al enviar mensaje',
      errorCode: error.code
    };
  }
};

/**
 * Envía un mensaje usando Message Template de WhatsApp (Content Template)
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} contentSid - Content SID del template aprobado en Twilio (formato: HXxxxxx)
 * @param {Object} variables - Variables para el template (opcional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendWhatsAppTemplate = async (to, contentSid, variables = {}) => {
  if (!USE_WHATSAPP || !twilioClient) {
    return {
      success: false,
      error: 'WhatsApp no está configurado'
    };
  }

  const formattedTo = formatPhoneForWhatsApp(to);
  if (!formattedTo) {
    return {
      success: false,
      error: 'Número de teléfono inválido'
    };
  }

  if (!contentSid || !contentSid.startsWith('HX')) {
    return {
      success: false,
      error: 'Content SID inválido. Debe empezar con "HX"'
    };
  }

  try {
    console.log(`[WhatsAppService] 📤 Enviando template "${contentSid}" a ${formattedTo} desde ${TWILIO_WHATSAPP_NUMBER}`);
    
    // Construir el payload para Content Template
    const messagePayload = {
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedTo,
      contentSid: contentSid
    };

    // Si hay variables, agregarlas como contentVariables
    // Formato: {"1": "valor1", "2": "valor2", ...}
    if (variables && Object.keys(variables).length > 0) {
      const contentVariables = {};
      Object.keys(variables).forEach((key, index) => {
        contentVariables[`${index + 1}`] = variables[key];
      });
      messagePayload.contentVariables = JSON.stringify(contentVariables);
    }

    const result = await twilioClient.messages.create(messagePayload);

    console.log(`[WhatsAppService] ✅ Template enviado exitosamente. SID: ${result.sid}, Status: ${result.status}`);

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      usedTemplate: true
    };
  } catch (error) {
    console.error(`[WhatsAppService] ❌ Error enviando template:`, error);
    return {
      success: false,
      error: error.message || 'Error al enviar template',
      errorCode: error.code
    };
  }
};

/**
 * Genera el mensaje de texto para alerta de emergencia
 * @param {Object} userInfo - Información del usuario
 * @param {string} riskLevel - Nivel de riesgo (LOW, MEDIUM, HIGH)
 * @param {boolean} isTest - Si es una prueba
 * @param {string} phone - Número de teléfono del contacto (para detectar país)
 * @param {string} language - Idioma del usuario ('es' o 'en', default: 'es')
 * @returns {string} Mensaje formateado para WhatsApp
 */
const generateAlertMessage = (userInfo, riskLevel, isTest = false, phone = null, language = 'es') => {
  const messages = getAlertMessages(language);
  const userName = userInfo.name || userInfo.email || (language === 'en' ? 'a user' : 'un usuario');
  const riskLevelText = messages.RISK_LEVEL[riskLevel] || messages.RISK_LEVEL.UNKNOWN;

  if (isTest) {
    return `${messages.WHATSAPP_TEST.replace('{APP_NAME}', APP_NAME)}\n\n${messages.WHATSAPP_TEST_MESSAGE.replace('{USER_NAME}', userName).replace('{APP_NAME}', APP_NAME)}`;
  }

  let message = `${messages.WHATSAPP_ALERT.replace('{APP_NAME}', APP_NAME)}\n\n`;
  message += `${messages.WHATSAPP_INTRO.replace('{USER_NAME}', userName).replace('{APP_NAME}', APP_NAME)}\n\n`;
  message += `${messages.WHATSAPP_SITUATION.replace('{USER_NAME}', userName)}\n\n`;
  message += `${messages.WHATSAPP_RISK_LEVEL.replace('{RISK_LEVEL}', riskLevelText)}\n\n`;

  if (riskLevel === 'HIGH') {
    message += `⚠️ *${messages.HIGH_RISK_WARNING}*\n\n`;
  }

  message += `${messages.WHATSAPP_ACTIONS.replace('{USER_NAME}', userName)}\n\n`;

  // Obtener números de emergencia según el país del contacto
  const emergencyNumbers = getFormattedEmergencyNumbers(phone);
  message += `${emergencyNumbers}\n\n`;

  message += `${messages.WHATSAPP_FOOTER.replace('{USER_NAME}', userName)}`;

  return message;
};

const whatsappService = {
  /**
   * Envía alerta de emergencia por WhatsApp
   * Intenta primero con mensaje libre, si falla con error 63016, usa template si está configurado
   * @param {string} phone - Número de teléfono del contacto
   * @param {Object} userInfo - Información del usuario
   * @param {string} riskLevel - Nivel de riesgo (LOW, MEDIUM, HIGH)
   * @param {boolean} isTest - Si es una prueba
   * @param {string} language - Idioma del usuario ('es' o 'en', default: 'es')
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendEmergencyAlert: async (phone, userInfo, riskLevel, isTest = false, language = 'es') => {
    const message = generateAlertMessage(userInfo, riskLevel, isTest, phone, language);
    const result = await sendWhatsAppMessage(phone, message);
    
    // Si falla con error 63016 (fuera de ventana de 24h) y hay template configurado, intentar con template
    if (!result.success && result.errorCode === 63016) {
      const contentSid = isTest ? TEST_MESSAGE_TEMPLATE : EMERGENCY_ALERT_TEMPLATE;
      
      if (contentSid) {
        console.log(`[WhatsAppService] 🔄 Intentando enviar con template "${contentSid}" debido a error 63016`);
        const userName = userInfo.name || userInfo.email || 'un usuario';
        // Variables para el template: {{1}} = APP_NAME, {{2}} = userName, {{3}} = riskLevel
        const templateVars = {
          appName: APP_NAME,
          userName: userName,
          riskLevel: riskLevel
        };
        return await sendWhatsAppTemplate(phone, contentSid, templateVars);
      } else {
        console.warn(`[WhatsAppService] ⚠️ Error 63016 pero no hay template configurado. Configura ${isTest ? 'TWILIO_WHATSAPP_TEST_TEMPLATE' : 'TWILIO_WHATSAPP_EMERGENCY_TEMPLATE'}`);
      }
    }
    
    return result;
  },

  /**
   * Envía mensaje de prueba por WhatsApp
   * Intenta primero con mensaje libre, si falla con error 63016, usa template si está configurado
   * @param {string} phone - Número de teléfono del contacto
   * @param {Object} userInfo - Información del usuario
   * @param {string} language - Idioma del usuario ('es' o 'en', default: 'es')
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendTestMessage: async (phone, userInfo, language = 'es') => {
    const message = generateAlertMessage(userInfo, 'MEDIUM', true, phone, language);
    const result = await sendWhatsAppMessage(phone, message);
    
    // Si falla con error 63016 (fuera de ventana de 24h) y hay template configurado, intentar con template
    if (!result.success && result.errorCode === 63016) {
      if (TEST_MESSAGE_TEMPLATE) {
        console.log(`[WhatsAppService] 🔄 Intentando enviar con template "${TEST_MESSAGE_TEMPLATE}" debido a error 63016`);
        const userName = userInfo.name || userInfo.email || 'un usuario';
        // Variables para el template: {{1}} = APP_NAME, {{2}} = userName
        const templateVars = {
          appName: APP_NAME,
          userName: userName
        };
        return await sendWhatsAppTemplate(phone, TEST_MESSAGE_TEMPLATE, templateVars);
      } else {
        console.warn(`[WhatsAppService] ⚠️ Error 63016 pero no hay template configurado. Configura TWILIO_WHATSAPP_TEST_TEMPLATE`);
      }
    }
    
    return result;
  },

  /**
   * Verifica si WhatsApp está configurado
   * @returns {boolean}
   */
  isConfigured: () => USE_WHATSAPP && !!twilioClient,

  /**
   * Envía un mensaje personalizado
   * @param {string} phone - Número de teléfono
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendMessage: async (phone, message) => {
    return await sendWhatsAppMessage(phone, message);
  },

  /**
   * Verifica el estado de un mensaje usando su SID
   * @param {string} messageSid - SID del mensaje (ej: SMxxxxx)
   * @returns {Promise<{success: boolean, status?: string, error?: string, details?: object}>}
   */
  getMessageStatus: async (messageSid) => {
    if (!USE_WHATSAPP || !twilioClient) {
      return {
        success: false,
        error: 'WhatsApp no está configurado'
      };
    }

    try {
      const message = await twilioClient.messages(messageSid).fetch();
      
      return {
        success: true,
        status: message.status,
        sid: message.sid,
        to: message.to,
        from: message.from,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price,
        priceUnit: message.priceUnit,
        details: {
          direction: message.direction,
          numSegments: message.numSegments,
          uri: message.uri
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al obtener estado del mensaje',
        code: error.code
      };
    }
  }
};

export default whatsappService;

