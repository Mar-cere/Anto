/**
 * Servicio de Alertas de Emergencia - Envía notificaciones a contactos de emergencia
 * cuando se detectan tendencias suicidas o situaciones de crisis
 */
import User from '../models/User.js';
import mailer from '../config/mailer.js';
import whatsappService from './whatsappService.js';
import { APP_NAME } from '../constants/app.js';

class EmergencyAlertService {
  constructor() {
    this.ALERT_COOLDOWN_MINUTES = 60; // Evitar múltiples alertas en 1 hora
    this.lastAlertTimestamps = new Map(); // userId -> timestamp
  }

  /**
   * Verifica si se debe enviar una alerta (evita spam)
   * @param {string} userId - ID del usuario
   * @returns {boolean} true si se puede enviar alerta
   */
  canSendAlert(userId) {
    const lastAlert = this.lastAlertTimestamps.get(userId);
    if (!lastAlert) return true;
    
    const minutesSinceLastAlert = (Date.now() - lastAlert) / (1000 * 60);
    return minutesSinceLastAlert >= this.ALERT_COOLDOWN_MINUTES;
  }

  /**
   * Registra que se envió una alerta
   * @param {string} userId - ID del usuario
   */
  recordAlertSent(userId) {
    this.lastAlertTimestamps.set(userId, Date.now());
  }

  /**
   * Obtiene los contactos de emergencia activos de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Array de contactos de emergencia activos
   */
  async getEmergencyContacts(userId) {
    try {
      const user = await User.findById(userId).select('emergencyContacts name email');
      if (!user || !user.emergencyContacts) {
        return [];
      }
      
      // Filtrar solo contactos activos
      return user.emergencyContacts.filter(contact => contact.enabled);
    } catch (error) {
      console.error('[EmergencyAlertService] Error obteniendo contactos de emergencia:', error);
      return [];
    }
  }

  /**
   * Genera el contenido del email de alerta
   * @param {Object} userInfo - Información del usuario
   * @param {string} riskLevel - Nivel de riesgo (LOW, MEDIUM, HIGH)
   * @param {string} messageContent - Contenido del mensaje que activó la alerta (opcional, puede estar censurado)
   * @param {boolean} isTest - Si es true, marca el email como prueba
   * @returns {Object} Objeto con subject y html
   */
  generateAlertEmail(userInfo, riskLevel, messageContent = null, isTest = false) {
    const userName = userInfo.name || userInfo.email || 'un usuario';
    const riskLevelText = {
      'LOW': 'Bajo',
      'MEDIUM': 'Medio',
      'HIGH': 'Alto'
    }[riskLevel] || 'Desconocido';

    const subject = isTest 
      ? `🧪 [PRUEBA] Alerta de ${APP_NAME} - ${userName}`
      : `🚨 Alerta de ${APP_NAME} - ${userName} necesita apoyo`;

    // No incluir el contenido exacto del mensaje por privacidad, solo indicar que se detectó riesgo
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #0A1533;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .alert-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .high-risk {
            background-color: #f8d7da;
            border-left-color: #dc3545;
          }
          .medium-risk {
            background-color: #fff3cd;
            border-left-color: #ffc107;
          }
          .resources {
            background-color: #d1ecf1;
            border-left: 4px solid #0c5460;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1ADDDB;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Alerta de ${APP_NAME}</h1>
        </div>
        <div class="content">
          <p>Hola,</p>
          
          <p>Has sido designado como contacto de emergencia de <strong>${userName}</strong> en ${APP_NAME}.</p>
          
          ${isTest ? `
          <div class="test-box" style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin-top: 0;">🧪 Esta es una PRUEBA</h2>
            <p><strong>Este es un email de prueba del sistema de alertas de emergencia.</strong></p>
            <p>No hay ninguna situación de emergencia real. ${userName} está probando que el sistema funciona correctamente.</p>
          </div>
          ` : `
          <div class="alert-box ${riskLevel.toLowerCase()}-risk">
            <h2 style="margin-top: 0;">⚠️ Situación Detectada</h2>
            <p><strong>Nivel de Riesgo:</strong> ${riskLevelText}</p>
            <p>Nuestro sistema ha detectado señales de que ${userName} podría estar pasando por un momento difícil y necesita apoyo.</p>
            ${riskLevel === 'HIGH' ? '<p><strong>Esta es una situación de alto riesgo que requiere atención inmediata.</strong></p>' : ''}
          </div>
          `}

          ${!isTest ? `
          <h3>¿Qué puedes hacer?</h3>
          <ul>
            <li><strong>Contacta a ${userName} directamente</strong> - Tu apoyo personal es muy valioso</li>
            <li><strong>Escucha sin juzgar</strong> - A veces solo necesitan alguien que los escuche</li>
            <li><strong>Ofrece acompañamiento</strong> - Pregunta cómo puedes ayudar</li>
            <li><strong>Busca ayuda profesional</strong> - Si la situación es grave, contacta servicios de emergencia</li>
          </ul>
          ` : `
          <h3>Si recibiste este email, significa que:</h3>
          <ul>
            <li>✅ Tu dirección de email está correctamente configurada</li>
            <li>✅ El sistema puede contactarte en caso de emergencia</li>
            <li>✅ Las alertas llegarán a tu bandeja de entrada</li>
          </ul>
          `}

          <div class="resources">
            <h3>Recursos de Emergencia</h3>
            <p>Si la situación es urgente, contacta:</p>
            <ul>
              <li><strong>Emergencias:</strong> 911</li>
              <li><strong>Línea de Prevención del Suicidio:</strong> 988 (Internacional) o 135 (Argentina)</li>
              <li><strong>Texto de Crisis:</strong> 741741</li>
            </ul>
          </div>

          ${!isTest ? `
          <p><strong>Importante:</strong> Esta alerta se genera automáticamente cuando nuestro sistema detecta señales de riesgo. Por favor, verifica la situación directamente con ${userName}.</p>

          <p>Si crees que esta alerta fue enviada por error o si ${userName} ya está recibiendo el apoyo necesario, puedes ignorar este mensaje.</p>
          ` : `
          <p>En caso de una emergencia real, recibirás un email similar pero con información sobre la situación y recursos de ayuda.</p>
          `}

          <div class="footer">
            <p>Este es un mensaje automático de ${APP_NAME}.</p>
            <p>Por favor, no respondas a este correo. Si necesitas contactar a ${userName}, usa los medios de contacto que tengas con él/ella.</p>
            <p>Tu privacidad es importante. Este correo se envió solo porque fuiste designado como contacto de emergencia.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  /**
   * Envía alertas a los contactos de emergencia
   * @param {string} userId - ID del usuario
   * @param {string} riskLevel - Nivel de riesgo (LOW, MEDIUM, HIGH)
   * @param {string} messageContent - Contenido del mensaje (opcional, para contexto)
   * @returns {Promise<Object>} Resultado del envío de alertas
   */
  async sendEmergencyAlerts(userId, riskLevel, messageContent = null) {
    try {
      // Solo enviar alertas para riesgo MEDIUM o HIGH
      if (riskLevel === 'LOW') {
        return {
          sent: false,
          reason: 'Riesgo bajo, no se envían alertas',
          contacts: []
        };
      }

      // Verificar cooldown para evitar spam
      if (!this.canSendAlert(userId)) {
        console.log(`[EmergencyAlertService] Alerta no enviada para usuario ${userId}: cooldown activo`);
        return {
          sent: false,
          reason: 'Cooldown activo (última alerta enviada hace menos de 1 hora)',
          contacts: []
        };
      }

      // Obtener información del usuario
      const user = await User.findById(userId).select('name email emergencyContacts');
      if (!user) {
        console.error(`[EmergencyAlertService] Usuario ${userId} no encontrado`);
        return {
          sent: false,
          reason: 'Usuario no encontrado',
          contacts: []
        };
      }

      // Obtener contactos de emergencia activos
      const contacts = await this.getEmergencyContacts(userId);
      if (contacts.length === 0) {
        console.log(`[EmergencyAlertService] Usuario ${userId} no tiene contactos de emergencia configurados`);
        return {
          sent: false,
          reason: 'No hay contactos de emergencia configurados',
          contacts: []
        };
      }

      // Detectar si es una prueba (mensaje contiene '[PRUEBA]' o 'PRUEBA')
      const isTest = messageContent && /\[?PRUEBA\]?/i.test(messageContent);
      
      // Generar contenido del email
      const emailContent = this.generateAlertEmail(
        { name: user.name, email: user.email },
        riskLevel,
        messageContent,
        isTest
      );

      // Enviar alertas a cada contacto
      const results = [];
      for (const contact of contacts) {
        const contactResult = {
          contact: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            relationship: contact.relationship
          },
          email: { sent: false, error: null },
          whatsapp: { sent: false, error: null }
        };

        // Enviar email
        try {
          const emailSent = await mailer.sendCustomEmail({
            to: contact.email,
            subject: emailContent.subject,
            html: emailContent.html
          });

          contactResult.email.sent = emailSent;
          if (!emailSent) {
            contactResult.email.error = 'Error al enviar email';
          }

          if (emailSent) {
            console.log(`[EmergencyAlertService] ✅ Email enviado a ${contact.name} (${contact.email}) para usuario ${userId}`);
          } else {
            console.error(`[EmergencyAlertService] ❌ Error enviando email a ${contact.name} (${contact.email})`);
          }
        } catch (error) {
          console.error(`[EmergencyAlertService] ❌ Error enviando email a ${contact.email}:`, error);
          contactResult.email.error = error.message;
        }

        // Enviar WhatsApp si el contacto tiene teléfono
        if (contact.phone) {
          try {
            // Usar el método correcto del servicio de WhatsApp
            const whatsappResult = isTest
              ? await whatsappService.sendTestMessage(
                  contact.phone,
                  { name: user.name, email: user.email }
                )
              : await whatsappService.sendEmergencyAlert(
                  contact.phone,
                  { name: user.name, email: user.email },
                  riskLevel,
                  isTest
                );

            contactResult.whatsapp.sent = whatsappResult.success || false;
            if (!whatsappResult.success) {
              contactResult.whatsapp.error = whatsappResult.error || 'Error al enviar WhatsApp';
            }

            if (whatsappResult.success) {
              console.log(`[EmergencyAlertService] ✅ WhatsApp enviado a ${contact.name} (${contact.phone}) para usuario ${userId}. MessageId: ${whatsappResult.messageId || 'N/A'}`);
            } else {
              console.error(`[EmergencyAlertService] ❌ Error enviando WhatsApp a ${contact.name} (${contact.phone}): ${whatsappResult.error || 'Error desconocido'}`);
            }
          } catch (error) {
            console.error(`[EmergencyAlertService] ❌ Error enviando WhatsApp a ${contact.phone}:`, error);
            contactResult.whatsapp.error = error.message;
          }
        }

        results.push(contactResult);
      }

      // Registrar que se envió una alerta si al menos un canal (email o WhatsApp) fue exitoso
      const anySent = results.some(r => r.email.sent || r.whatsapp.sent);
      if (anySent) {
        this.recordAlertSent(userId);
      }

      // Contar envíos exitosos
      const successfulEmails = results.filter(r => r.email.sent).length;
      const successfulWhatsApp = results.filter(r => r.whatsapp.sent).length;

      return {
        sent: anySent,
        contacts: results,
        totalContacts: contacts.length,
        successfulSends: results.filter(r => r.email.sent || r.whatsapp.sent).length,
        successfulEmails,
        successfulWhatsApp
      };
    } catch (error) {
      console.error('[EmergencyAlertService] Error en sendEmergencyAlerts:', error);
      return {
        sent: false,
        reason: error.message,
        contacts: []
      };
    }
  }

  /**
   * Limpia alertas antiguas del cache (para evitar acumulación de memoria)
   */
  cleanupOldAlerts() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [userId, timestamp] of this.lastAlertTimestamps.entries()) {
      if (timestamp < oneHourAgo) {
        this.lastAlertTimestamps.delete(userId);
      }
    }
  }
}

// Singleton instance
const emergencyAlertService = new EmergencyAlertService();

// Limpiar cache cada hora
setInterval(() => {
  emergencyAlertService.cleanupOldAlerts();
}, 60 * 60 * 1000);

export default emergencyAlertService;

