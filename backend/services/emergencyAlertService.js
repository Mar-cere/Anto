/**
 * Servicio de Alertas de Emergencia - Envía notificaciones a contactos de emergencia
 * cuando se detectan tendencias suicidas o situaciones de crisis
 */
import mailer from '../config/mailer.js';
import { APP_NAME } from '../constants/app.js';
import { getEmergencyNumbersFromPhone } from '../constants/emergencyNumbers.js';
import { getAlertMessages } from '../constants/crisis.js';
import EmergencyAlert from '../models/EmergencyAlert.js';
import User from '../models/User.js';
import whatsappCloudService from './whatsappCloudService.js';
import whatsappService from './whatsappService.js'; // Fallback a Twilio si Cloud API no está disponible
import pushNotificationService from './pushNotificationService.js';

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
   * Formatea los números de emergencia para HTML de email
   * @param {string} phone - Número de teléfono del contacto (para detectar país)
   * @returns {string} HTML con los números de emergencia
   */
  formatEmergencyNumbersForEmail(phone) {
    const emergencyInfo = getEmergencyNumbersFromPhone(phone);
    
    if (!emergencyInfo) {
      // Números por defecto si no se puede detectar el país
      return `
        <ul>
          <li><strong>Emergencias:</strong> 911</li>
          <li><strong>Línea de Prevención del Suicidio:</strong> 988 (Internacional)</li>
          <li><strong>Texto de Crisis:</strong> 741741</li>
        </ul>
      `;
    }
    
    let html = `<p><strong>Recursos de Emergencia (${emergencyInfo.country}):</strong></p><ul>`;
    
    if (emergencyInfo.emergency) {
      html += `<li><strong>Emergencias:</strong> ${emergencyInfo.emergency}</li>`;
    }
    
    if (emergencyInfo.medical && emergencyInfo.medical !== emergencyInfo.emergency) {
      html += `<li><strong>Emergencias Médicas:</strong> ${emergencyInfo.medical}</li>`;
    }
    
    if (emergencyInfo.fire && emergencyInfo.fire !== emergencyInfo.emergency) {
      html += `<li><strong>Bomberos:</strong> ${emergencyInfo.fire}</li>`;
    }
    
    if (emergencyInfo.suicidePrevention) {
      html += `<li><strong>Línea de Prevención del Suicidio:</strong> ${emergencyInfo.suicidePrevention}</li>`;
    }
    
    if (emergencyInfo.crisisText) {
      html += `<li><strong>Texto de Crisis:</strong> ${emergencyInfo.crisisText}</li>`;
    }
    
    // Si no hay línea de prevención del suicidio específica, agregar recursos internacionales
    if (!emergencyInfo.suicidePrevention) {
      html += `<li><strong>Línea Internacional de Prevención del Suicidio:</strong> 988 (Estados Unidos)</li>`;
    }
    
    html += `</ul>`;
    
    return html;
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
   * @param {string} contactPhone - Teléfono del contacto (para detectar país)
   * @param {string} language - Idioma del usuario ('es' o 'en', default: 'es')
   * @returns {Object} Objeto con subject y html
   */
  generateAlertEmail(userInfo, riskLevel, messageContent = null, isTest = false, contactPhone = null, language = 'es') {
    const messages = getAlertMessages(language);
    const userName = userInfo.name || userInfo.email || (language === 'en' ? 'a user' : 'un usuario');
    const riskLevelText = messages.RISK_LEVEL[riskLevel] || messages.RISK_LEVEL.UNKNOWN;

    const subject = isTest 
      ? messages.TEST_SUBJECT.replace('{APP_NAME}', APP_NAME).replace('{USER_NAME}', userName)
      : messages.ALERT_SUBJECT.replace('{APP_NAME}', APP_NAME).replace('{USER_NAME}', userName);

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
          <h1>${messages.ALERT_HEADER.replace('{APP_NAME}', APP_NAME)}</h1>
        </div>
        <div class="content">
          <p>${messages.ALERT_GREETING}</p>
          
          <p>${messages.ALERT_INTRO.replace('{USER_NAME}', userName).replace('{APP_NAME}', APP_NAME)}</p>
          
          ${isTest ? `
          <div class="test-box" style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin-top: 0;">${messages.TEST_HEADER}</h2>
            <p><strong>${messages.TEST_DESCRIPTION}</strong></p>
            <p>${messages.TEST_EXPLANATION.replace('{USER_NAME}', userName)}</p>
          </div>
          ` : `
          <div class="alert-box ${riskLevel.toLowerCase()}-risk">
            <h2 style="margin-top: 0;">${messages.SITUATION_DETECTED}</h2>
            <p><strong>${messages.RISK_LEVEL_LABEL}</strong> ${riskLevelText}</p>
            <p>${messages.SITUATION_DESCRIPTION.replace('{USER_NAME}', userName)}</p>
            ${riskLevel === 'HIGH' ? `<p><strong>${messages.HIGH_RISK_WARNING}</strong></p>` : ''}
          </div>
          `}

          ${!isTest ? `
          <h3>${messages.WHAT_CAN_YOU_DO}</h3>
          <ul>
            <li>${messages.ACTION_CONTACT.replace('{USER_NAME}', userName)}</li>
            <li>${messages.ACTION_LISTEN}</li>
            <li>${messages.ACTION_SUPPORT}</li>
            <li>${messages.ACTION_PROFESSIONAL}</li>
          </ul>
          ` : `
          <h3>${messages.TEST_SUCCESS}</h3>
          <ul>
            <li>${messages.TEST_SUCCESS_ITEM_1}</li>
            <li>${messages.TEST_SUCCESS_ITEM_2}</li>
            <li>${messages.TEST_SUCCESS_ITEM_3}</li>
          </ul>
          `}

          <div class="resources">
            <h3>${messages.EMERGENCY_RESOURCES}</h3>
            <p>${messages.EMERGENCY_RESOURCES_DESC}</p>
            ${this.formatEmergencyNumbersForEmail(contactPhone, language)}
          </div>

          ${!isTest ? `
          <p><strong>${messages.IMPORTANT_NOTE.replace('{USER_NAME}', userName)}</strong></p>

          <p>${messages.ERROR_NOTE.replace('{USER_NAME}', userName)}</p>
          ` : `
          <p>${messages.TEST_FOOTER}</p>
          `}

          <div class="footer">
            <p>${messages.FOOTER_AUTO.replace('{APP_NAME}', APP_NAME)}</p>
            <p>${messages.FOOTER_NO_REPLY.replace('{USER_NAME}', userName)}</p>
            <p>${messages.FOOTER_PRIVACY}</p>
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
   * @param {Object} options - Opciones adicionales (crisisEventId, trendAnalysis, metadata)
   * @returns {Promise<Object>} Resultado del envío de alertas
   */
  async sendEmergencyAlerts(userId, riskLevel, messageContent = null, options = {}) {
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

      // Obtener información del usuario (incluyendo preferencias de idioma)
      const user = await User.findById(userId).select('name email emergencyContacts preferences.language');
      if (!user) {
        console.error(`[EmergencyAlertService] Usuario ${userId} no encontrado`);
        return {
          sent: false,
          reason: 'Usuario no encontrado',
          contacts: []
        };
      }

      // Obtener idioma del usuario (default: 'es')
      const userLanguage = user.preferences?.language || 'es';

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

      // Detectar si es una prueba (mensaje contiene '[PRUEBA]' o 'PRUEBA' o viene en opciones)
      const isTest = options.isTest || (messageContent && /\[?PRUEBA\]?/i.test(messageContent));
      
      // Extraer opciones
      const { crisisEventId, trendAnalysis, metadata: alertMetadata } = options;
      
      // Enviar alertas a cada contacto
      const results = [];
      const alertRecords = []; // Para guardar en la base de datos
      
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

        // Generar contenido del email personalizado para este contacto (según su país e idioma)
        const emailContent = this.generateAlertEmail(
          { name: user.name, email: user.email },
          riskLevel,
          messageContent,
          isTest,
          contact.phone || null, // Pasar el teléfono del contacto para detectar país
          userLanguage // Pasar el idioma del usuario
        );

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
        // Prioridad: WhatsApp Cloud API > Twilio WhatsApp
        // WhatsApp es OPCIONAL - si falla, el email ya fue enviado
        if (contact.phone) {
          try {
            let whatsappResult = null;
            
            // Intentar primero con WhatsApp Cloud API (más simple y gratis)
            if (whatsappCloudService.isConfigured()) {
              whatsappResult = isTest
                ? await whatsappCloudService.sendTestMessage(contact.phone, { name: user.name, email: user.email }, userLanguage)
                : await whatsappCloudService.sendEmergencyAlert(contact.phone, { name: user.name, email: user.email }, riskLevel, isTest, userLanguage);
            }
            // Fallback a Twilio si Cloud API no está configurado
            else if (whatsappService.isConfigured()) {
              whatsappResult = isTest
                ? await whatsappService.sendTestMessage(contact.phone, { name: user.name, email: user.email }, userLanguage)
                : await whatsappService.sendEmergencyAlert(contact.phone, { name: user.name, email: user.email }, riskLevel, isTest, userLanguage);
            }

            if (whatsappResult) {
              contactResult.whatsapp.sent = whatsappResult.success || false;
              contactResult.whatsapp.error = whatsappResult.success ? null : (whatsappResult.error || 'Error al enviar WhatsApp');

              if (whatsappResult.success) {
                console.log(`[EmergencyAlertService] ✅ WhatsApp enviado a ${contact.name} (${contact.phone})`);
              } else {
                // No es crítico - el email ya fue enviado
                console.warn(`[EmergencyAlertService] ⚠️ WhatsApp no enviado a ${contact.name}: ${contactResult.whatsapp.error}`);
              }
            } else {
              // Ningún servicio de WhatsApp configurado
              console.log(`[EmergencyAlertService] ℹ️ WhatsApp no configurado, solo email enviado a ${contact.name}`);
            }
          } catch (error) {
            // WhatsApp falló, pero email ya fue enviado - no es crítico
            contactResult.whatsapp.error = error.message;
            console.warn(`[EmergencyAlertService] ⚠️ Error enviando WhatsApp a ${contact.phone}: ${error.message}`);
          }
        }

        results.push(contactResult);

        // Determinar estado de la alerta
        let alertStatus = 'failed';
        if (contactResult.email.sent && contactResult.whatsapp.sent) {
          alertStatus = 'sent';
        } else if (contactResult.email.sent || contactResult.whatsapp.sent) {
          alertStatus = 'partial';
        }

        // Crear registro de alerta para guardar en BD
        const alertRecord = {
          userId,
          crisisEventId: crisisEventId || null,
          riskLevel,
          contact: {
            contactId: contact._id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            relationship: contact.relationship || null
          },
          channels: {
            email: {
              sent: contactResult.email.sent,
              sentAt: contactResult.email.sent ? new Date() : null,
              error: contactResult.email.error || null,
              messageId: null // Se puede agregar si el servicio de email lo proporciona
            },
            whatsapp: {
              sent: contactResult.whatsapp.sent,
              sentAt: contactResult.whatsapp.sent ? new Date() : null,
              error: contactResult.whatsapp.error || null,
              messageId: null // Se puede agregar si WhatsApp lo proporciona
            }
          },
          isTest,
          sentAt: new Date(),
          status: alertStatus,
          triggerMessagePreview: messageContent ? messageContent.substring(0, 200) : null,
          trendAnalysis: trendAnalysis ? {
            rapidDecline: trendAnalysis.trends?.rapidDecline || false,
            sustainedLow: trendAnalysis.trends?.sustainedLow || false,
            isolation: trendAnalysis.trends?.isolation || false,
            escalation: trendAnalysis.trends?.escalation || false,
            warnings: trendAnalysis.warnings || []
          } : undefined,
          metadata: {
            riskScore: alertMetadata?.riskScore || null,
            factors: alertMetadata?.factors || [],
            cooldownActive: !this.canSendAlert(userId),
            totalContactsNotified: contacts.length
          }
        };

        alertRecords.push(alertRecord);
      }

      // Guardar alertas en la base de datos (en paralelo, no bloquear el flujo)
      if (alertRecords.length > 0) {
        EmergencyAlert.insertMany(alertRecords).catch(error => {
          console.error('[EmergencyAlertService] Error guardando alertas en BD:', error);
          // No lanzar error, solo loguear - el envío ya se completó
        });
      }

      // Registrar que se envió una alerta si al menos un canal (email o WhatsApp) fue exitoso
      const anySent = results.some(r => r.email.sent || r.whatsapp.sent);
      if (anySent) {
        this.recordAlertSent(userId);
      }

      // Contar envíos exitosos
      const successfulEmails = results.filter(r => r.email.sent).length;
      const successfulWhatsApp = results.filter(r => r.whatsapp.sent).length;
      const successfulSends = results.filter(r => r.email.sent || r.whatsapp.sent).length;

      // Enviar notificación push al usuario si se enviaron alertas
      if (anySent) {
        try {
          const userWithToken = await User.findById(userId).select('pushToken').lean();
          if (userWithToken && userWithToken.pushToken) {
            await pushNotificationService.sendEmergencyAlertSent(
              userWithToken.pushToken,
              {
                successfulSends,
                totalContacts: contacts.length,
                riskLevel,
                isTest
              }
            );
            console.log(`[EmergencyAlertService] ✅ Notificación push enviada al usuario ${userId}`);
          } else {
            console.log(`[EmergencyAlertService] Usuario ${userId} no tiene pushToken configurado`);
          }
        } catch (pushError) {
          console.error('[EmergencyAlertService] Error enviando notificación push al usuario:', pushError);
          // No fallar el proceso si la notificación push falla
        }

        // Emitir evento de socket en tiempo real
        try {
          // Obtener instancia de io desde el app (si está disponible)
          // Esto se hace de forma dinámica para evitar dependencias circulares
          let io = null;
          try {
            const serverModule = await import('../server.js');
            // En server.js, app.set('io', io) guarda la instancia
            const app = serverModule.app;
            io = app?.get?.('io') || null;
          } catch (importError) {
            // En algunos casos (tests, inicialización), el servidor puede no estar disponible
            console.log('[EmergencyAlertService] No se pudo obtener instancia de io:', importError.message);
          }
          
          if (io) {
            const { emitEmergencyAlert } = await import('../config/socket.js');
            emitEmergencyAlert(io, userId, {
              successfulSends,
              totalContacts: contacts.length,
              riskLevel,
              isTest,
              contacts: results.map(r => ({
                name: r.contact.name,
                email: r.contact.email,
                emailSent: r.email.sent,
                whatsappSent: r.whatsapp.sent
              }))
            });
            console.log(`[EmergencyAlertService] ✅ Evento socket emitido al usuario ${userId}`);
          } else {
            // Esto es normal si el servidor no ha iniciado aún o en tests
            console.log(`[EmergencyAlertService] Socket.IO no está disponible (esto es normal si el servidor no ha iniciado aún)`);
          }
        } catch (socketError) {
          console.error('[EmergencyAlertService] Error emitiendo evento socket:', socketError);
          // No fallar el proceso si el socket falla
        }
      }

      return {
        sent: anySent,
        contacts: results,
        totalContacts: contacts.length,
        successfulSends,
        successfulEmails,
        successfulWhatsApp,
        alertRecordsCount: alertRecords.length
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

