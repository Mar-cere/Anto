/**
 * Servicio de WhatsApp Cloud API (Meta)
 * 
 * API oficial de Meta para enviar mensajes de WhatsApp
 * Más simple que Twilio y con 1,000 conversaciones gratis/mes
 * 
 * Requiere configuración:
 * - WHATSAPP_CLOUD_ACCESS_TOKEN (Token de acceso de Meta)
 * - WHATSAPP_CLOUD_PHONE_NUMBER_ID (ID del número de teléfono)
 * - WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID (ID de la cuenta de negocio, opcional)
 * 
 * @author AntoApp Team
 */

import { getFormattedEmergencyNumbers } from '../constants/emergencyNumbers.js';
import { getAlertMessages } from '../constants/crisis.js';
import { APP_NAME } from '../constants/app.js';

// Configuración de WhatsApp Cloud API
const ACCESS_TOKEN = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID;
const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || 'v18.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Verificar si está configurado
const IS_CONFIGURED = !!(ACCESS_TOKEN && PHONE_NUMBER_ID);

if (IS_CONFIGURED) {
  console.log('[WhatsAppCloudService] ✅ WhatsApp Cloud API configurado correctamente');
} else {
  console.log('[WhatsAppCloudService] ⚠️ WhatsApp Cloud API no configurado');
  if (!ACCESS_TOKEN) console.log('   - Falta WHATSAPP_CLOUD_ACCESS_TOKEN');
  if (!PHONE_NUMBER_ID) console.log('   - Falta WHATSAPP_CLOUD_PHONE_NUMBER_ID');
}

/**
 * Formatea un número de teléfono para WhatsApp
 * WhatsApp Cloud API requiere formato internacional sin el prefijo "whatsapp:"
 * @param {string} phone - Número de teléfono
 * @returns {string} Número formateado (+1234567890) o null si inválido
 */
const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  // Limpiar: remover espacios, guiones, paréntesis, y prefijo whatsapp:
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^whatsapp:/i, '');
  
  // Si empieza con +, mantenerlo
  if (cleaned.startsWith('+')) {
    // Validar que tenga al menos 10 dígitos
    const digitsOnly = cleaned.replace(/\D/g, '');
    return digitsOnly.length >= 10 ? cleaned : null;
  }
  
  // Si empieza con 0, removerlo (números locales)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Agregar código de país si no lo tiene
  const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '+56'; // Chile por defecto
  cleaned = `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  
  // Validar longitud
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return null;
  }
  
  return cleaned;
};

/**
 * Envía un mensaje de texto a través de WhatsApp Cloud API
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendMessage = async (to, message) => {
  if (!IS_CONFIGURED) {
    return {
      success: false,
      error: 'WhatsApp Cloud API no está configurado. Configura WHATSAPP_CLOUD_ACCESS_TOKEN y WHATSAPP_CLOUD_PHONE_NUMBER_ID'
    };
  }

  const formattedTo = formatPhoneNumber(to);
  if (!formattedTo) {
    return {
      success: false,
      error: 'Número de teléfono inválido'
    };
  }

  try {
    const url = `${BASE_URL}/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'text',
      text: {
        body: message
      }
    };

    console.log(`[WhatsAppCloudService] 📤 Enviando mensaje a ${formattedTo} (URL: ${url})`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar errores comunes de WhatsApp Cloud API
      const errorMessage = data.error?.message || `Error ${response.status}`;
      const errorCode = data.error?.code;
      const errorType = data.error?.type;
      const errorSubcode = data.error?.error_subcode;
      
      console.error(`[WhatsAppCloudService] ❌ Error ${response.status}:`, {
        code: errorCode,
        type: errorType,
        subcode: errorSubcode,
        message: errorMessage,
        fbtrace_id: data.error?.fbtrace_id
      });
      
      const errorMessages = {
        100: 'Parámetros inválidos',
        131047: 'Número de teléfono inválido',
        131026: 'El número no está registrado en WhatsApp',
        131031: 'Mensaje duplicado',
        190: 'Token de acceso inválido o expirado',
        80007: 'Límite de mensajes alcanzado',
        131048: 'El número de teléfono no está en formato válido',
        131051: 'El número no tiene WhatsApp activo'
      };

      return {
        success: false,
        error: errorMessages[errorCode] || errorMessage,
        errorCode,
        errorType,
        errorSubcode,
        details: data.error
      };
    }

    console.log(`[WhatsAppCloudService] ✅ Mensaje enviado exitosamente. MessageId: ${data.messages?.[0]?.id || 'N/A'}`);

    return {
      success: true,
      messageId: data.messages?.[0]?.id || null,
      status: data.messages?.[0]?.message_status || 'sent'
    };
  } catch (error) {
    console.error('[WhatsAppCloudService] ❌ Error enviando mensaje:', {
      message: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar mensaje'
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

const whatsappCloudService = {
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
    return await sendMessage(phone, message);
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
    return await sendMessage(phone, message);
  },

  /**
   * Verifica si WhatsApp Cloud API está configurado
   * @returns {boolean}
   */
  isConfigured: () => IS_CONFIGURED,

  /**
   * Envía un mensaje personalizado
   * @param {string} phone - Número de teléfono
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendMessage: async (phone, message) => {
    return await sendMessage(phone, message);
  },

  /**
   * Obtiene información del número de teléfono configurado
   * @returns {Promise<Object>} Información del número
   */
  getPhoneNumberInfo: async () => {
    if (!IS_CONFIGURED) {
      return { success: false, error: 'WhatsApp Cloud API no está configurado' };
    }

    try {
      const url = `${BASE_URL}/${PHONE_NUMBER_ID}?access_token=${ACCESS_TOKEN}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Error obteniendo información'
        };
      }

      return {
        success: true,
        data: {
          phoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          qualityRating: data.quality_rating,
          codeVerificationStatus: data.code_verification_status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default whatsappCloudService;

