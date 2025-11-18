/**
 * Servicio de Recordatorios de Contactos de Emergencia
 * 
 * Envía recordatorios periódicos a los usuarios para verificar que sus
 * contactos de emergencia estén actualizados.
 * 
 * @author AntoApp Team
 */

import User from '../models/User.js';
import mailer from '../config/mailer.js';
import { APP_NAME } from '../constants/app.js';

class EmergencyReminderService {
  constructor() {
    this.REMINDER_INTERVAL_DAYS = 30; // Recordatorio cada 30 días
  }

  /**
   * Verifica si un usuario necesita un recordatorio
   * @param {Object} user - Usuario de MongoDB
   * @returns {boolean} true si necesita recordatorio
   */
  needsReminder(user) {
    // Si no tiene contactos, no necesita recordatorio (ya se muestra modal)
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      return false;
    }

    // Si todos los contactos tienen lastReminderSent reciente, no necesita recordatorio
    const allContactsHaveRecentReminder = user.emergencyContacts.every(contact => {
      if (!contact.lastReminderSent) return false;
      const daysSinceReminder = (Date.now() - new Date(contact.lastReminderSent).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceReminder < this.REMINDER_INTERVAL_DAYS;
    });

    return !allContactsHaveRecentReminder;
  }

  /**
   * Genera el contenido del email de recordatorio
   * @param {Object} userInfo - Información del usuario
   * @param {Array} contacts - Contactos de emergencia
   * @returns {Object} Objeto con subject y html
   */
  generateReminderEmail(userInfo, contacts) {
    const userName = userInfo.name || userInfo.username || 'Usuario';
    const contactsCount = contacts.length;
    const contactsList = contacts.map(c => `• ${c.name} (${c.email})${!c.enabled ? ' - Deshabilitado' : ''}`).join('<br>');

    const subject = `📋 Recordatorio: Verifica tus contactos de emergencia - ${APP_NAME}`;

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
          .reminder-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .contacts-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196F3;
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
          <h1>📋 Recordatorio - ${APP_NAME}</h1>
        </div>
        <div class="content">
          <p>Hola ${userName},</p>
          
          <div class="reminder-box">
            <h2 style="margin-top: 0;">⏰ Es hora de verificar tus contactos de emergencia</h2>
            <p>Han pasado más de ${this.REMINDER_INTERVAL_DAYS} días desde la última vez que revisaste tus contactos de emergencia.</p>
            <p>Es importante mantener esta información actualizada para tu seguridad.</p>
          </div>

          <div class="contacts-box">
            <h3 style="margin-top: 0;">Tus contactos actuales (${contactsCount}):</h3>
            <p>${contactsList}</p>
          </div>

          <h3>¿Qué debes verificar?</h3>
          <ul>
            <li>✅ ¿Los emails de tus contactos siguen siendo correctos?</li>
            <li>✅ ¿Los teléfonos están actualizados?</li>
            <li>✅ ¿Tus contactos siguen siendo las personas adecuadas?</li>
            <li>✅ ¿Algún contacto necesita ser reemplazado?</li>
          </ul>

          <p><strong>Importante:</strong> Si tus contactos no están actualizados, las alertas de emergencia podrían no llegar a las personas correctas.</p>

          <p>Puedes actualizar tus contactos de emergencia desde la aplicación en la sección de Configuración.</p>

          <div class="footer">
            <p>Este es un recordatorio automático de ${APP_NAME}.</p>
            <p>Recibirás este recordatorio cada ${this.REMINDER_INTERVAL_DAYS} días para mantener tus contactos actualizados.</p>
            <p>Si ya actualizaste tus contactos recientemente, puedes ignorar este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  /**
   * Envía recordatorio a un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendReminder(userId) {
    try {
      const user = await User.findById(userId).select('emergencyContacts name username email');
      
      if (!user) {
        return {
          sent: false,
          reason: 'Usuario no encontrado'
        };
      }

      // Verificar si necesita recordatorio
      if (!this.needsReminder(user)) {
        return {
          sent: false,
          reason: 'No necesita recordatorio (contactos actualizados recientemente)'
        };
      }

      // Obtener contactos activos
      const activeContacts = user.emergencyContacts.filter(c => c.enabled);
      
      if (activeContacts.length === 0) {
        return {
          sent: false,
          reason: 'No hay contactos activos'
        };
      }

      // Generar contenido del email
      const emailContent = this.generateReminderEmail(
        { name: user.name, username: user.username },
        user.emergencyContacts
      );

      // Enviar email al usuario
      const emailSent = await mailer.sendCustomEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      if (emailSent) {
        // Actualizar lastReminderSent para todos los contactos
        user.emergencyContacts.forEach(contact => {
          contact.lastReminderSent = new Date();
        });
        await user.save();

        console.log(`[EmergencyReminderService] ✅ Recordatorio enviado a ${user.email} (${user.name || user.username})`);
      }

      return {
        sent: emailSent,
        userId: user._id,
        userEmail: user.email,
        contactsCount: user.emergencyContacts.length
      };
    } catch (error) {
      console.error('[EmergencyReminderService] Error enviando recordatorio:', error);
      return {
        sent: false,
        reason: error.message
      };
    }
  }

  /**
   * Envía recordatorios a todos los usuarios que los necesiten
   * @returns {Promise<Object>} Resumen de envíos
   */
  async sendRemindersToAllUsers() {
    try {
      // Obtener todos los usuarios con contactos de emergencia
      const users = await User.find({
        'emergencyContacts.0': { $exists: true } // Al menos un contacto
      }).select('emergencyContacts name username email');

      const results = {
        total: users.length,
        sent: 0,
        skipped: 0,
        errors: 0,
        details: []
      };

      for (const user of users) {
        if (this.needsReminder(user)) {
          const result = await this.sendReminder(user._id);
          if (result.sent) {
            results.sent++;
            results.details.push({
              userId: user._id.toString(),
              email: user.email,
              status: 'sent'
            });
          } else {
            results.skipped++;
            results.details.push({
              userId: user._id.toString(),
              email: user.email,
              status: 'skipped',
              reason: result.reason
            });
          }
        } else {
          results.skipped++;
        }
      }

      console.log(`[EmergencyReminderService] 📧 Recordatorios enviados: ${results.sent}/${results.total}`);
      return results;
    } catch (error) {
      console.error('[EmergencyReminderService] Error en sendRemindersToAllUsers:', error);
      throw error;
    }
  }
}

// Singleton instance
const emergencyReminderService = new EmergencyReminderService();

export default emergencyReminderService;

