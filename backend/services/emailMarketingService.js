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
import { enqueueEmail } from './emailQueueService.js';

/** Horas tras el inicio del trial para enviar el correo de retención (default: fin ~2.º día en trial de 3 días). */
function getTrialRetentionAfterHours() {
  const n = parseInt(process.env.TRIAL_RETENTION_EMAIL_AFTER_HOURS || '48', 10);
  return Number.isFinite(n) && n > 0 ? n : 48;
}

/** Solo trials “cortos” (p. ej. 3 días en prod); evita mail a cuentas de prueba con trial largo. */
function getTrialRetentionMaxTrialHours() {
  const n = parseInt(process.env.TRIAL_RETENTION_MAX_TRIAL_HOURS || '96', 10);
  return Number.isFinite(n) && n > 0 ? n : 96;
}

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
          const enq = enqueueEmail(
            () => mailer.sendReEngagementEmail(user.email, user.username, daysSinceActive),
            { type: 're_engagement', to: user.email }
          );
          if (enq.accepted) {
            results.sent++;
            logger.info(`[EmailMarketing] Re-engagement encolado para ${user.email} (${daysSinceActive} días inactivo)`);
          } else {
            results.failed++;
            logger.warn(`[EmailMarketing] No se pudo encolar re-engagement para ${user.email}`);
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
          const enq = enqueueEmail(
            () => mailer.sendWeeklyTipsEmail(user.email, user.username, weekNumber),
            { type: 'weekly_tips', to: user.email }
          );
          if (enq.accepted) {
            results.sent++;
            logger.info(`[EmailMarketing] Tips semanales encolados para ${user.email} (semana ${weekNumber})`);
          } else {
            results.failed++;
            logger.warn(`[EmailMarketing] No se pudo encolar tips semanales para ${user.email}`);
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
   * Correo “no queremos que te vayas” para trials cortos (~48 h tras inicio, un solo envío por cuenta).
   * Usa findOneAndUpdate atómico para no duplicar si el job corre en paralelo.
   * @returns {Promise<{ processed: number, sent: number, failed: number, skippedLongTrial: number }>}
   */
  async sendTrialRetentionEmails() {
    const afterHours = getTrialRetentionAfterHours();
    const maxTrialMs = getTrialRetentionMaxTrialHours() * 60 * 60 * 1000;
    const now = new Date();
    const trialStartDeadline = new Date(now.getTime() - afterHours * 60 * 60 * 1000);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skippedLongTrial: 0,
    };

    const baseFilter = {
      emailVerified: true,
      isActive: true,
      'subscription.status': 'trial',
      'subscription.trialStartDate': { $lte: trialStartDeadline },
      'subscription.trialEndDate': { $gt: now },
      $or: [
        { 'subscription.trialRetentionEmailSentAt': null },
        { 'subscription.trialRetentionEmailSentAt': { $exists: false } },
      ],
    };

    try {
      const safetyCap = parseInt(process.env.TRIAL_RETENTION_EMAIL_MAX_PER_RUN || '500', 10);
      const maxIterations = Number.isFinite(safetyCap) && safetyCap > 0 ? safetyCap : 500;

      for (let i = 0; i < maxIterations; i += 1) {
        const user = await User.findOneAndUpdate(
          baseFilter,
          { $set: { 'subscription.trialRetentionEmailSentAt': new Date() } },
          { new: true, sort: { 'subscription.trialStartDate': 1 } }
        );

        if (!user) break;

        results.processed += 1;
        const sub = user.subscription;
        const start = sub?.trialStartDate ? new Date(sub.trialStartDate).getTime() : 0;
        const end = sub?.trialEndDate ? new Date(sub.trialEndDate).getTime() : 0;
        const span = end - start;

        const releaseClaim = async () => {
          await User.updateOne({ _id: user._id }, { $unset: { 'subscription.trialRetentionEmailSentAt': '' } });
        };

        if (span <= 0 || span > maxTrialMs) {
          await releaseClaim();
          results.skippedLongTrial += 1;
          continue;
        }

        try {
          const ok = await mailer.sendTrialRetentionEmail(
            user.email,
            user.username,
            sub.trialEndDate
          );
          if (!ok) {
            await releaseClaim();
            results.failed += 1;
          } else {
            results.sent += 1;
            logger.info(`[EmailMarketing] Retención trial enviada a ${user.email}`);
          }
        } catch (error) {
          await releaseClaim();
          results.failed += 1;
          logger.error(`[EmailMarketing] Error retención trial usuario ${user._id}:`, error.message);
        }
      }

      logger.info(
        `[EmailMarketing] Retención trial: enviados ${results.sent} (procesados ${results.processed}, fallos ${results.failed}, trial largo ${results.skippedLongTrial})`
      );
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendTrialRetentionEmails:', error);
      return { processed: 0, sent: 0, failed: 0, skippedLongTrial: 0 };
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

          const enq = enqueueEmail(
            () => mailer.sendReEngagementEmail(user.email, user.username, daysSinceActive),
            { type: 're_engagement', to: user.email }
          );
          if (enq.accepted) {
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

