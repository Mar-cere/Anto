/**
 * Servicio de Email Marketing - Gestiona correos de engagement y retención
 * 
 * Funcionalidades:
 * - Re-engagement: Envía correos a usuarios inactivos
 * - Tips semanales: Envía correos con consejos de bienestar
 */

import User from '../models/User.js';
import mailer from '../config/mailer.js';
import logger from '../utils/logger.js';

class EmailMarketingService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Enviar correos de re-engagement a usuarios inactivos
   * @param {number} daysInactive - Días de inactividad requeridos (default: 7)
   * @returns {Promise<Object>} Resumen de envíos
   */
  async sendReEngagementEmails(daysInactive = 7) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysInactive);

      // Buscar usuarios inactivos que tengan email verificado
      const inactiveUsers = await User.find({
        emailVerified: true,
        isActive: true,
        $or: [
          { lastLogin: { $lt: thresholdDate } },
          { 'stats.lastActive': { $lt: thresholdDate } }
        ]
      }).select('email username lastLogin stats');

      const results = {
        checked: inactiveUsers.length,
        sent: 0,
        failed: 0,
        skipped: 0
      };

      for (const user of inactiveUsers) {
        try {
          // Calcular días de inactividad
          const lastActive = user.stats?.lastActive || user.lastLogin || user.createdAt;
          const daysSinceActive = Math.floor(
            (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceActive < daysInactive) {
            results.skipped++;
            continue;
          }

          // Enviar correo de re-engagement
          const sent = await mailer.sendReEngagementEmail(
            user.email,
            user.username,
            daysSinceActive
          );

          if (sent) {
            results.sent++;
            logger.info(`[EmailMarketing] Re-engagement enviado a ${user.email} (${daysSinceActive} días inactivo)`);
          } else {
            results.failed++;
            logger.warn(`[EmailMarketing] Error enviando re-engagement a ${user.email}`);
          }
        } catch (error) {
          results.failed++;
          logger.error(`[EmailMarketing] Error procesando usuario ${user._id}:`, error.message);
        }
      }

      logger.info(`[EmailMarketing] Re-engagement completado: ${results.sent}/${results.checked} enviados`);
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendReEngagementEmails:', error);
      return { checked: 0, sent: 0, failed: 0, skipped: 0 };
    }
  }

  /**
   * Enviar correos de tips semanales a usuarios activos
   * @param {number} weekNumber - Número de semana (para rotar tips)
   * @returns {Promise<Object>} Resumen de envíos
   */
  async sendWeeklyTipsEmails(weekNumber = null) {
    try {
      // Calcular número de semana si no se proporciona (desde inicio del año)
      if (!weekNumber) {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
        weekNumber = Math.floor(daysSinceStart / 7) + 1;
      }

      // Buscar usuarios activos con email verificado
      // Opcional: Solo usuarios que han usado la app al menos una vez
      const activeUsers = await User.find({
        emailVerified: true,
        isActive: true,
        'stats.totalSessions': { $gte: 1 } // Al menos una sesión
      }).select('email username');

      const results = {
        checked: activeUsers.length,
        sent: 0,
        failed: 0
      };

      for (const user of activeUsers) {
        try {
          const sent = await mailer.sendWeeklyTipsEmail(
            user.email,
            user.username,
            weekNumber
          );

          if (sent) {
            results.sent++;
            logger.info(`[EmailMarketing] Tips semanales enviados a ${user.email} (semana ${weekNumber})`);
          } else {
            results.failed++;
            logger.warn(`[EmailMarketing] Error enviando tips semanales a ${user.email}`);
          }
        } catch (error) {
          results.failed++;
          logger.error(`[EmailMarketing] Error procesando usuario ${user._id}:`, error.message);
        }
      }

      logger.info(`[EmailMarketing] Tips semanales completados: ${results.sent}/${results.checked} enviados`);
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendWeeklyTipsEmails:', error);
      return { checked: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * Enviar correos de re-engagement a usuarios específicos
   * @param {Array<string>} userIds - IDs de usuarios
   * @returns {Promise<Object>} Resumen de envíos
   */
  async sendReEngagementToUsers(userIds) {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        emailVerified: true,
        isActive: true
      }).select('email username lastLogin stats');

      const results = {
        checked: users.length,
        sent: 0,
        failed: 0
      };

      for (const user of users) {
        try {
          const lastActive = user.stats?.lastActive || user.lastLogin || user.createdAt;
          const daysSinceActive = Math.floor(
            (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
          );

          const sent = await mailer.sendReEngagementEmail(
            user.email,
            user.username,
            daysSinceActive
          );

          if (sent) {
            results.sent++;
          } else {
            results.failed++;
          }
        } catch (error) {
          results.failed++;
          logger.error(`[EmailMarketing] Error procesando usuario ${user._id}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendReEngagementToUsers:', error);
      return { checked: 0, sent: 0, failed: 0 };
    }
  }
}

export default new EmailMarketingService();

