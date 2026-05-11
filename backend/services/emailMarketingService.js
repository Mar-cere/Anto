/**
 * Servicio de Email Marketing - Gestiona correos de engagement y retención
 * 
 * Funcionalidades:
 * - Re-engagement: Envía correos a usuarios inactivos
 * - Tips semanales: Envía correos con consejos de bienestar
 */

import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import mailer from '../config/mailer.js';
import logger from '../utils/logger.js';
import { enqueueEmail } from './emailQueueService.js';
import { getUtcIsoWeekParts } from '../utils/isoWeek.js';

/**
 * Filtro Mongo para candidatos al correo de resumen semanal (misma semántica que `findOneAndUpdate` del lote).
 * `requireMinSessions: false` omite `stats.totalSessions >= 1` (catch-up para usuarios que usan la app pero no suman sesión en ese campo).
 *
 * @param {string} yearWeekKey
 * @param {boolean} [requireMinSessions=true]
 * @returns {Record<string, unknown>}
 */
export function buildWeeklySummaryCandidateFilter(yearWeekKey, requireMinSessions = true) {
  /** @type {Record<string, unknown>} */
  const filter = {
    emailVerified: true,
    isActive: true,
    $or: [
      { 'stats.lastWeeklyTipsEmailYearWeek': { $exists: false } },
      { 'stats.lastWeeklyTipsEmailYearWeek': null },
      { 'stats.lastWeeklyTipsEmailYearWeek': { $ne: yearWeekKey } }
    ]
  };
  if (requireMinSessions) {
    filter['stats.totalSessions'] = { $gte: 1 };
  }
  return filter;
}

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
   * Correo de aviso de resumen semanal (solo CTA a la app, sin datos de uso en el cuerpo; como mucho una vez por semana ISO UTC por usuario).
   * Usa reclamo atómico en Mongo (similar a retención trial) para evitar duplicados con varios procesos o reintentos.
   *
   * @param {{ requireMinSessions?: boolean }} [options] — `requireMinSessions` default `true` (comportamiento histórico del job).
   * @returns {Promise<Object>} Resumen de envíos
   */
  async sendWeeklySummaryEmails(options = {}) {
    try {
      const { yearWeekKey } = getUtcIsoWeekParts();
      const requireMinSessions = options.requireMinSessions !== false;

      const maxIterations = parseInt(process.env.WEEKLY_TIPS_EMAIL_MAX_PER_RUN || '5000', 10);
      const cap = Number.isFinite(maxIterations) && maxIterations > 0 ? maxIterations : 5000;

      const results = {
        yearWeekKey,
        processed: 0,
        sent: 0,
        failed: 0,
        requireMinSessions
      };

      const candidateFilter = buildWeeklySummaryCandidateFilter(yearWeekKey, requireMinSessions);

      for (let i = 0; i < cap; i += 1) {
        const user = await User.findOneAndUpdate(
          candidateFilter,
          {
            $set: {
              'stats.lastWeeklyTipsEmailYearWeek': yearWeekKey,
              'stats.lastWeeklyTipsEmailAt': new Date()
            }
          },
          {
            new: true,
            sort: { _id: 1 },
            select:
              'email username name createdAt stats.tasksCompleted stats.habitsStreak stats.totalSessions stats.lastActive subscription.status subscription.trialStartDate subscription.trialEndDate subscription.trialGrantedAt'
          }
        );

        if (!user) {
          break;
        }

        results.processed += 1;

        const releaseClaim = async () => {
          await User.updateOne(
            { _id: user._id },
            { $unset: { 'stats.lastWeeklyTipsEmailYearWeek': '', 'stats.lastWeeklyTipsEmailAt': '' } }
          );
        };

        try {
          const ok = await mailer.sendWeeklySummaryEmail(user.email, user);
          if (!ok) {
            await releaseClaim();
            results.failed += 1;
            logger.warn(`[EmailMarketing] Resumen semanal no enviado (mailer false) a ${user.email}`);
          } else {
            results.sent += 1;
            logger.info(`[EmailMarketing] Resumen semanal enviado a ${user.email} (${yearWeekKey})`);
            try {
              const gift = await applyWeeklySummaryTrialGift(user._id);
              if (gift.applied) {
                logger.info(`[EmailMarketing] Regalo trial post-correo aplicado a ${user.email}`);
              }
            } catch (giftErr) {
              logger.error(`[EmailMarketing] Regalo trial post-correo falló (${user.email}):`, giftErr.message);
            }
          }
        } catch (error) {
          await releaseClaim();
          results.failed += 1;
          logger.error(`[EmailMarketing] Error resumen semanal usuario ${user._id}:`, error.message);
        }
      }

      logger.info(
        `[EmailMarketing] Resumen semanal ${yearWeekKey}: enviados ${results.sent} (procesados ${results.processed}, fallos ${results.failed})`
      );
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendWeeklySummaryEmails:', error);
      return { yearWeekKey: null, processed: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * @deprecated Usar `sendWeeklySummaryEmails`. Se mantiene por compatibilidad con scripts antiguos.
   */
  async sendWeeklyTipsEmails() {
    return this.sendWeeklySummaryEmails();
  }

  /**
   * Correo de retención (prueba por terminar) para trials cortos (~48 h tras inicio, un solo envío por cuenta).
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

