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
    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedTo,
      body: message
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    // Manejo simplificado de errores comunes
    const errorMessages = {
      21211: 'Número de teléfono inválido',
      21608: 'El número no está registrado en WhatsApp',
      21408: 'Número no autorizado (sandbox: solo números verificados)',
      21614: 'Número no válido para WhatsApp'
    };

    return {
      success: false,
      error: errorMessages[error.code] || error.message || 'Error al enviar mensaje'
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
   * @param {string} phone - Número de teléfono del contacto
   * @param {Object} userInfo - Información del usuario
   * @param {string} riskLevel - Nivel de riesgo (LOW, MEDIUM, HIGH)
   * @param {boolean} isTest - Si es una prueba
   * @param {string} language - Idioma del usuario ('es' o 'en', default: 'es')
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendEmergencyAlert: async (phone, userInfo, riskLevel, isTest = false, language = 'es') => {
    const message = generateAlertMessage(userInfo, riskLevel, isTest, phone, language);
    return await sendWhatsAppMessage(phone, message);
  },

  /**
   * Envía mensaje de prueba por WhatsApp
   * @param {string} phone - Número de teléfono del contacto
   * @param {Object} userInfo - Información del usuario
   * @param {string} language - Idioma del usuario ('es' o 'en', default: 'es')
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendTestMessage: async (phone, userInfo, language = 'es') => {
    const message = generateAlertMessage(userInfo, 'MEDIUM', true, phone, language);
    return await sendWhatsAppMessage(phone, message);
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
  }
};

export default whatsappService;

