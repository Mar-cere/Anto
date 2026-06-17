/**
 * Servicio de Alertas de Emergencia - Envía notificaciones a contactos de emergencia
 * cuando se detectan tendencias suicidas o situaciones de crisis
 */
import EmergencyAlert from '../models/EmergencyAlert.js';
import User from '../models/User.js';
import pushNotificationService from './pushNotificationService.js';
import whatsappService from './whatsappService.js';

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
          whatsapp: { sent: false, error: null }
        };

        // Enviar solo por WhatsApp.
        if (contact.phone && whatsappService.isConfigured()) {
          try {
            const whatsappResult = isTest
              ? await whatsappService.sendTestMessage(contact.phone, { name: user.name, email: user.email }, userLanguage)
              : await whatsappService.sendEmergencyAlert(contact.phone, { name: user.name, email: user.email }, riskLevel, isTest, userLanguage);

            contactResult.whatsapp.sent = whatsappResult.success || false;
            contactResult.whatsapp.error = whatsappResult.success ? null : (whatsappResult.error || 'Error al enviar WhatsApp');

            if (whatsappResult.success) {
              console.log(`[EmergencyAlertService] ✅ WhatsApp enviado a ${contact.name} (${contact.phone})`);
            } else {
              console.warn(`[EmergencyAlertService] ⚠️ WhatsApp no enviado a ${contact.name}: ${contactResult.whatsapp.error}`);
            }
          } catch (error) {
            contactResult.whatsapp.error = error.message;
            console.warn(`[EmergencyAlertService] ⚠️ Error enviando WhatsApp a ${contact.phone}: ${error.message}`);
          }
        } else if (contact.phone && !whatsappService.isConfigured()) {
          contactResult.whatsapp.error = 'WhatsApp no configurado';
          console.warn(`[EmergencyAlertService] ⚠️ WhatsApp no configurado para enviar alerta a ${contact.name}`);
        } else {
          contactResult.whatsapp.error = 'Contacto sin número de teléfono';
          console.warn(`[EmergencyAlertService] ⚠️ Contacto ${contact.name} no tiene teléfono; alerta no enviada`);
        }

        results.push(contactResult);

        // Determinar estado de la alerta
        const alertStatus = contactResult.whatsapp.sent ? 'sent' : 'failed';

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
              sent: false,
              sentAt: null,
              error: 'Canal email deshabilitado para alertas de emergencia',
              messageId: null
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

      // Registrar que se envió una alerta si WhatsApp fue exitoso en al menos un contacto.
      const anySent = results.some(r => r.whatsapp.sent);
      if (anySent) {
        this.recordAlertSent(userId);
      }

      // Contar envíos exitosos
      const successfulWhatsApp = results.filter(r => r.whatsapp.sent).length;
      const successfulSends = successfulWhatsApp;

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
                emailSent: false,
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
        successfulEmails: 0,
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

// Limpiar cache cada hora (no bloquear salida de scripts/smokes/tests)
if (process.env.NODE_ENV !== 'test') {
  const cleanupTimer = setInterval(() => {
    emergencyAlertService.cleanupOldAlerts();
  }, 60 * 60 * 1000);
  cleanupTimer.unref?.();
}

export default emergencyAlertService;

