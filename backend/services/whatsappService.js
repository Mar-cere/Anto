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
 * @param {string} phone - Número de teléfono (puede tener varios formatos)
 * @returns {string} Número formateado para WhatsApp (whatsapp:+1234567890)
 */
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  
  // Remover espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si empieza con +, mantenerlo
  if (cleaned.startsWith('+')) {
    return `whatsapp:${cleaned}`;
  }
  
  // Si empieza con 0, removerlo (para números locales)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si no tiene código de país, asumir que es el código por defecto
  // (puedes ajustar esto según tu país)
  const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '+1';
  
  if (!cleaned.startsWith('+')) {
    cleaned = `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  }
  
  return `whatsapp:${cleaned}`;
};

/**
 * Envía un mensaje de WhatsApp
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendWhatsAppMessage = async (to, message) => {
  if (!USE_WHATSAPP || !twilioClient) {
    return {
      success: false,
      error: 'WhatsApp no está configurado. Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_NUMBER'
    };
  }

  try {
    const formattedTo = formatPhoneForWhatsApp(to);
    
    if (!formattedTo) {
      return {
        success: false,
        error: 'Número de teléfono inválido'
      };
    }

    console.log(`[WhatsAppService] 📱 Enviando mensaje WhatsApp a: ${formattedTo}`);
    
    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedTo,
      body: message
    });

    console.log(`[WhatsAppService] ✅ Mensaje WhatsApp enviado exitosamente. SID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error(`[WhatsAppService] ❌ Error enviando mensaje WhatsApp:`, error.message);
    
    // Errores comunes de Twilio
    if (error.code === 21211) {
      return {
        success: false,
        error: 'Número de teléfono inválido'
      };
    } else if (error.code === 21608) {
      return {
        success: false,
        error: 'El número no está registrado en WhatsApp'
      };
    } else if (error.code === 21408) {
      return {
        success: false,
        error: 'No se puede enviar mensajes a este número (no está en la lista de permitidos durante prueba)'
      };
    }
    
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
 * @returns {string} Mensaje formateado para WhatsApp
 */
const generateAlertMessage = (userInfo, riskLevel, isTest = false, phone = null) => {
  const userName = userInfo.name || userInfo.email || 'un usuario';
  const riskLevelText = {
    'LOW': 'Bajo',
    'MEDIUM': 'Medio',
    'HIGH': 'Alto'
  }[riskLevel] || 'Desconocido';

  if (isTest) {
    return `🧪 *PRUEBA - Alerta de ${process.env.APP_NAME || 'Anto'}*

Hola,

Este es un mensaje de *PRUEBA* del sistema de alertas de emergencia.

${userName} está probando que el sistema funciona correctamente.

*No hay ninguna situación de emergencia real.*

Si recibiste este mensaje, significa que:
✅ Tu número está correctamente configurado
✅ El sistema puede contactarte en caso de emergencia
✅ Las alertas llegarán a tu WhatsApp

En caso de una emergencia real, recibirás un mensaje similar pero con información sobre la situación y recursos de ayuda.`;
  }

  let message = `🚨 *Alerta de Emergencia - ${process.env.APP_NAME || 'Anto'}*\n\n`;
  message += `Has sido designado como contacto de emergencia de *${userName}*.\n\n`;
  message += `*Situación Detectada:*\n`;
  message += `Nivel de Riesgo: *${riskLevelText}*\n\n`;
  message += `Nuestro sistema ha detectado señales de que ${userName} podría estar pasando por un momento difícil y necesita apoyo.\n\n`;

  if (riskLevel === 'HIGH') {
    message += `⚠️ *Esta es una situación de ALTO RIESGO que requiere atención inmediata.*\n\n`;
  }

  message += `*¿Qué puedes hacer?*\n`;
  message += `• Contacta a ${userName} directamente\n`;
  message += `• Escucha sin juzgar\n`;
  message += `• Ofrece acompañamiento\n`;
  message += `• Busca ayuda profesional si es necesario\n\n`;

  // Obtener números de emergencia según el país del contacto
  const emergencyNumbers = getFormattedEmergencyNumbers(phone);
  message += `${emergencyNumbers}\n\n`;

  message += `Este es un mensaje automático. Por favor, verifica la situación directamente con ${userName}.`;

  return message;
};

const whatsappService = {
  /**
   * Envía alerta de emergencia por WhatsApp
   * @param {string} phone - Número de teléfono del contacto
   * @param {Object} userInfo - Información del usuario
   * @param {string} riskLevel - Nivel de riesgo (LOW, MEDIUM, HIGH)
   * @param {boolean} isTest - Si es una prueba
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendEmergencyAlert: async (phone, userInfo, riskLevel, isTest = false) => {
    const message = generateAlertMessage(userInfo, riskLevel, isTest, phone);
    return await sendWhatsAppMessage(phone, message);
  },

  /**
   * Envía mensaje de prueba por WhatsApp
   * @param {string} phone - Número de teléfono del contacto
   * @param {Object} userInfo - Información del usuario
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  sendTestMessage: async (phone, userInfo) => {
    const message = generateAlertMessage(userInfo, 'MEDIUM', true, phone);
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

