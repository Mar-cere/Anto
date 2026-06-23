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
import cacheService from './cacheService.js';
import {
  getDefaultTrialRetentionAfterHours,
  getDefaultTrialRetentionMaxTrialHours,
  getWeeklySummaryTrialGiftDays,
} from '../constants/subscription.js';
import {
  getEmailVerificationReminderAfterHours,
} from '../constants/email.js';

const MS_PER_DAY = 86400000;

function isWeeklySummaryTrialGiftEnabled() {
  return process.env.WEEKLY_SUMMARY_TRIAL_GIFT_ENABLED !== 'false';
}

/**
 * Suma días de prueba premium tras un envío exitoso del resumen semanal (cuentas no premium).
 * Desactivar: `WEEKLY_SUMMARY_TRIAL_GIFT_ENABLED=false`.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<{ applied: boolean, reason?: string, trialEndDate?: Date }>}
 */
export async function applyWeeklySummaryTrialGift(userId) {
  if (!isWeeklySummaryTrialGiftEnabled()) {
    return { applied: false, reason: 'disabled' };
  }

  const days = getWeeklySummaryTrialGiftDays();
  if (days <= 0) {
    return { applied: false, reason: 'zero_gift_days' };
  }
  const user = await User.findById(userId).select('subscription');
  if (!user?.subscription) {
    return { applied: false, reason: 'no_user' };
  }

  const sub = user.subscription;
  if (sub.status === 'premium') {
    return { applied: false, reason: 'premium' };
  }

  const now = new Date();
  const addMs = days * MS_PER_DAY;

  let trialStartDate;
  let trialEndDate;

  if (sub.status === 'trial' && sub.trialEndDate) {
    trialStartDate = sub.trialStartDate ? new Date(sub.trialStartDate) : now;
    const end = new Date(sub.trialEndDate);
    const baseMs = Math.max(now.getTime(), end.getTime());
    trialEndDate = new Date(baseMs + addMs);
    sub.trialEndDate = trialEndDate;
    sub.status = 'trial';
    if (!sub.trialStartDate) {
      sub.trialStartDate = now;
    }
  } else if (sub.status === 'expired') {
    trialStartDate = now;
    trialEndDate = new Date(now.getTime() + addMs);
    sub.status = 'trial';
    sub.trialStartDate = trialStartDate;
    sub.trialEndDate = trialEndDate;
    if (!sub.trialGrantedAt) {
      sub.trialGrantedAt = now;
    }
  } else if (sub.status === 'free') {
    if (!sub.trialEndDate) {
      return { applied: false, reason: 'free_no_trial_history' };
    }
    trialStartDate = now;
    trialEndDate = new Date(now.getTime() + addMs);
    sub.status = 'trial';
    sub.trialStartDate = trialStartDate;
    sub.trialEndDate = trialEndDate;
    if (!sub.trialGrantedAt) {
      sub.trialGrantedAt = now;
    }
  } else {
    return { applied: false, reason: 'status_not_eligible' };
  }

  await user.save();

  let subscription = await Subscription.findOne({ userId: user._id });
  if (!subscription) {
    subscription = new Subscription({
      userId: user._id,
      status: 'trialing',
      plan: 'monthly',
      currentPeriodStart: trialStartDate,
      currentPeriodEnd: trialEndDate,
      trialStart: trialStartDate,
      trialEnd: trialEndDate
    });
  } else {
    subscription.status = 'trialing';
    subscription.plan = subscription.plan || 'monthly';
    subscription.trialStart = subscription.trialStart || trialStartDate;
    subscription.trialEnd = trialEndDate;
    subscription.currentPeriodEnd = trialEndDate;
    if (!subscription.currentPeriodStart) {
      subscription.currentPeriodStart = trialStartDate;
    }
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    subscription.endedAt = null;
  }
  await subscription.save();

  await cacheService.invalidateUserCache(user._id.toString()).catch((err) => {
    logger.warn(`[EmailMarketing] No se pudo invalidar caché tras regalo trial (${user._id}):`, err?.message);
  });

  logger.info(`[EmailMarketing] Regalo trial correo semanal (+${days} días) aplicado a usuario ${user._id}`);
  return { applied: true, trialEndDate };
}

/**
 * Filtro Mongo para candidatos al correo de retención trial (misma semántica que `findOneAndUpdate` del job).
 *
 * @param {Date} now
 * @param {number} afterHours — horas desde inicio del trial (default: ~mitad de APP_TRIAL_DAYS)
 */
export function buildTrialRetentionBaseFilter(now, afterHours) {
  const hours =
    Number.isFinite(Number(afterHours)) && Number(afterHours) > 0
      ? Number(afterHours)
      : getDefaultTrialRetentionAfterHours();
  const trialStartDeadline = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return {
    emailVerified: true,
    isActive: true,
    'subscription.status': 'trial',
    'subscription.trialStartDate': { $exists: true, $ne: null, $lte: trialStartDeadline },
    'subscription.trialEndDate': { $exists: true, $ne: null, $gt: now },
    $or: [
      { 'subscription.trialRetentionEmailSentAt': null },
      { 'subscription.trialRetentionEmailSentAt': { $exists: false } }
    ]
  };
}

/**
 * @param {unknown} trialStartDate
 * @param {unknown} trialEndDate
 * @returns {number|null} ms de duración o null si fechas inválidas
 */
export function computeTrialSpanMs(trialStartDate, trialEndDate) {
  const start = trialStartDate ? new Date(trialStartDate).getTime() : NaN;
  const end = trialEndDate ? new Date(trialEndDate).getTime() : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return end - start;
}

/**
 * @param {number|null} spanMs
 * @param {number} maxTrialMs
 */
export function isTrialSpanEligibleForRetention(spanMs, maxTrialMs) {
  if (spanMs == null || !Number.isFinite(spanMs) || !Number.isFinite(maxTrialMs) || maxTrialMs <= 0) {
    return false;
  }
  return spanMs > 0 && spanMs <= maxTrialMs;
}

/**
 * Valida datos mínimos antes de llamar al mailer (post-reclamo atómico).
 *
 * @param {object} user
 * @param {Date} [now]
 * @returns {{ ok: true, email: string, username: string, trialEndDate: Date } | { ok: false, reason: string }}
 */
export function validateUserForTrialRetentionSend(user, now = new Date()) {
  const email = user?.email != null ? String(user.email).trim() : '';
  if (!email || !email.includes('@')) {
    return { ok: false, reason: 'invalid_email' };
  }
  const rawUser = user?.username != null ? String(user.username).trim() : '';
  const username = rawUser || 'Usuario';
  const trialEndRaw = user?.subscription?.trialEndDate;
  const end = trialEndRaw ? new Date(trialEndRaw) : new Date(NaN);
  if (Number.isNaN(end.getTime())) {
    return { ok: false, reason: 'invalid_trial_end' };
  }
  if (end.getTime() <= now.getTime()) {
    return { ok: false, reason: 'trial_already_ended' };
  }
  return { ok: true, email, username, trialEndDate: end };
}

/**
 * Filtro Mongo para recordatorio de registro sin verificar (~24 h tras registro, un envío).
 *
 * @param {Date} now
 * @param {number} [afterHours]
 */
export function buildEmailVerificationReminderBaseFilter(now, afterHours) {
  const hours =
    Number.isFinite(Number(afterHours)) && Number(afterHours) > 0
      ? Number(afterHours)
      : getEmailVerificationReminderAfterHours();
  const registeredBefore = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return {
    emailVerified: false,
    isActive: true,
    createdAt: { $exists: true, $ne: null, $lte: registeredBefore },
    $or: [
      { emailVerificationReminderSentAt: null },
      { emailVerificationReminderSentAt: { $exists: false } },
    ],
  };
}

/**
 * @param {object} user
 * @returns {{ ok: true, email: string, username: string } | { ok: false, reason: string }}
 */
export function validateUserForEmailVerificationReminderSend(user) {
  const email = user?.email != null ? String(user.email).trim() : '';
  if (!email || !email.includes('@')) {
    return { ok: false, reason: 'invalid_email' };
  }
  if (user?.emailVerified === true) {
    return { ok: false, reason: 'already_verified' };
  }
  const rawUser = user?.username != null ? String(user.username).trim() : '';
  const username = rawUser || 'Usuario';
  return { ok: true, email, username };
}

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

/**
 * Filtro para campaña puntual de novedades (dedupe por `campaignId`, no por semana ISO).
 * Permite reenviar a quien ya recibió el resumen semanal de esta semana con copy antiguo.
 *
 * @param {string} campaignId
 * @param {boolean} [requireMinSessions=false]
 */
export function buildProductUpdateCampaignFilter(campaignId, requireMinSessions = false) {
  const id = String(campaignId || '').trim();
  if (!id) {
    throw new Error('campaignId requerido');
  }
  /** @type {Record<string, unknown>} */
  const filter = {
    emailVerified: true,
    isActive: true,
    $or: [
      { 'stats.lastProductUpdateCampaignKey': { $exists: false } },
      { 'stats.lastProductUpdateCampaignKey': null },
      { 'stats.lastProductUpdateCampaignKey': { $ne: id } }
    ]
  };
  if (requireMinSessions) {
    filter['stats.totalSessions'] = { $gte: 1 };
  }
  return filter;
}

/** Horas tras el inicio del trial para enviar el correo de retención (default: ~mitad de APP_TRIAL_DAYS). */
function getTrialRetentionAfterHours() {
  const fallback = getDefaultTrialRetentionAfterHours();
  const n = parseInt(process.env.TRIAL_RETENTION_EMAIL_AFTER_HOURS || String(fallback), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Solo trials “cortos”; evita mail a cuentas de prueba con trial largo. */
function getTrialRetentionMaxTrialHours() {
  const fallback = getDefaultTrialRetentionMaxTrialHours();
  const n = parseInt(process.env.TRIAL_RETENTION_MAX_TRIAL_HOURS || String(fallback), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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
      }).select('email username lastLogin stats preferences.language');

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
            () =>
              mailer.sendReEngagementEmail(user.email, user.username, daysSinceActive, {
                language: user.preferences?.language,
              }),
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
        requireMinSessions,
        trialGiftDays: getWeeklySummaryTrialGiftDays(),
        trialGiftApplied: 0,
        trialGiftSkipped: 0,
        trialGiftErrors: 0
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
              'email username name createdAt preferences.language stats.tasksCompleted stats.habitsStreak stats.totalSessions stats.lastActive subscription.status subscription.trialStartDate subscription.trialEndDate subscription.trialGrantedAt'
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
                results.trialGiftApplied += 1;
                logger.info(`[EmailMarketing] Regalo trial post-correo aplicado a ${user.email}`);
              } else {
                results.trialGiftSkipped += 1;
              }
            } catch (giftErr) {
              results.trialGiftErrors += 1;
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
      return {
        yearWeekKey: null,
        processed: 0,
        sent: 0,
        failed: 0,
        trialGiftDays: getWeeklySummaryTrialGiftDays(),
        trialGiftApplied: 0,
        trialGiftSkipped: 0,
        trialGiftErrors: 0
      };
    }
  }

  /**
   * Campaña puntual de novedades + regalo trial (misma plantilla que resumen semanal).
   * Dedupe por `campaignId` (`stats.lastProductUpdateCampaignKey`); también marca la semana ISO
   * para no duplicar si el job semanal corre después.
   *
   * @param {{ campaignId: string, requireMinSessions?: boolean }} options
   */
  async sendProductUpdateCampaignEmails(options = {}) {
    const campaignId = String(options.campaignId || process.env.PRODUCT_UPDATE_CAMPAIGN_ID || '1.5.0').trim();
    if (!campaignId) {
      throw new Error('campaignId vacío');
    }
    const requireMinSessions = options.requireMinSessions === true;
    const { yearWeekKey } = getUtcIsoWeekParts();

    const maxIterations = parseInt(process.env.PRODUCT_UPDATE_CAMPAIGN_MAX_PER_RUN || '10000', 10);
    const cap = Number.isFinite(maxIterations) && maxIterations > 0 ? maxIterations : 10000;

    const results = {
      campaignId,
      yearWeekKey,
      processed: 0,
      sent: 0,
      failed: 0,
      requireMinSessions,
      trialGiftDays: getWeeklySummaryTrialGiftDays(),
      trialGiftApplied: 0,
      trialGiftSkipped: 0,
      trialGiftErrors: 0
    };

    const candidateFilter = buildProductUpdateCampaignFilter(campaignId, requireMinSessions);

    try {
      for (let i = 0; i < cap; i += 1) {
        const user = await User.findOneAndUpdate(
          candidateFilter,
          {
            $set: {
              'stats.lastProductUpdateCampaignKey': campaignId,
              'stats.lastProductUpdateCampaignAt': new Date(),
              'stats.lastWeeklyTipsEmailYearWeek': yearWeekKey,
              'stats.lastWeeklyTipsEmailAt': new Date()
            }
          },
          {
            new: true,
            sort: { _id: 1 },
            select:
              'email username name createdAt preferences.language stats.tasksCompleted stats.habitsStreak stats.totalSessions stats.lastActive subscription.status subscription.trialStartDate subscription.trialEndDate subscription.trialGrantedAt'
          }
        );

        if (!user) {
          break;
        }

        results.processed += 1;

        const releaseClaim = async () => {
          await User.updateOne(
            { _id: user._id, 'stats.lastProductUpdateCampaignKey': campaignId },
            {
              $unset: {
                'stats.lastProductUpdateCampaignKey': '',
                'stats.lastProductUpdateCampaignAt': ''
              }
            }
          );
        };

        try {
          const ok = await mailer.sendWeeklySummaryEmail(user.email, user);
          if (!ok) {
            await releaseClaim();
            results.failed += 1;
            logger.warn(
              `[EmailMarketing] Campaña ${campaignId}: correo no enviado (mailer false) a ${user.email}`
            );
          } else {
            results.sent += 1;
            logger.info(`[EmailMarketing] Campaña ${campaignId}: enviado a ${user.email}`);
            try {
              const gift = await applyWeeklySummaryTrialGift(user._id);
              if (gift.applied) {
                results.trialGiftApplied += 1;
              } else {
                results.trialGiftSkipped += 1;
              }
            } catch (giftErr) {
              results.trialGiftErrors += 1;
              logger.error(
                `[EmailMarketing] Campaña ${campaignId}: regalo trial falló (${user.email}):`,
                giftErr.message
              );
            }
          }
        } catch (error) {
          await releaseClaim();
          results.failed += 1;
          logger.error(
            `[EmailMarketing] Campaña ${campaignId}: error usuario ${user._id}:`,
            error.message
          );
        }
      }

      logger.info(
        `[EmailMarketing] Campaña ${campaignId}: enviados ${results.sent} (procesados ${results.processed}, fallos ${results.failed})`
      );
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendProductUpdateCampaignEmails:', error);
      return {
        campaignId,
        yearWeekKey,
        processed: 0,
        sent: 0,
        failed: 0,
        requireMinSessions,
        trialGiftDays: getWeeklySummaryTrialGiftDays(),
        trialGiftApplied: 0,
        trialGiftSkipped: 0,
        trialGiftErrors: 0
      };
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
   * @returns {Promise<{ processed: number, sent: number, failed: number, skippedLongTrial: number, skippedInvalid: number }>}
   */
  async sendTrialRetentionEmails() {
    const afterHours = getTrialRetentionAfterHours();
    const maxTrialMs = getTrialRetentionMaxTrialHours() * 60 * 60 * 1000;
    const now = new Date();

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skippedLongTrial: 0,
      skippedInvalid: 0
    };

    const baseFilter = buildTrialRetentionBaseFilter(now, afterHours);

    try {
      const safetyCap = parseInt(process.env.TRIAL_RETENTION_EMAIL_MAX_PER_RUN || '500', 10);
      const maxIterations = Number.isFinite(safetyCap) && safetyCap > 0 ? safetyCap : 500;

      for (let i = 0; i < maxIterations; i += 1) {
        const user = await User.findOneAndUpdate(
          baseFilter,
          { $set: { 'subscription.trialRetentionEmailSentAt': new Date() } },
          {
            new: true,
            sort: { 'subscription.trialStartDate': 1 },
            select: 'email username subscription preferences.language'
          }
        );

        if (!user) break;

        results.processed += 1;
        const sub = user.subscription;

        const releaseClaim = async () => {
          await User.updateOne({ _id: user._id }, { $unset: { 'subscription.trialRetentionEmailSentAt': '' } });
        };

        const span = computeTrialSpanMs(sub?.trialStartDate, sub?.trialEndDate);

        if (span == null || span <= 0) {
          await releaseClaim();
          results.skippedInvalid += 1;
          logger.warn(`[EmailMarketing] Retención trial: datos de trial inválidos, reclamo liberado (${user._id})`);
          continue;
        }

        if (!isTrialSpanEligibleForRetention(span, maxTrialMs)) {
          await releaseClaim();
          results.skippedLongTrial += 1;
          continue;
        }

        const validated = validateUserForTrialRetentionSend(user, now);
        if (!validated.ok) {
          await releaseClaim();
          results.skippedInvalid += 1;
          logger.warn(`[EmailMarketing] Retención trial omitida (${user._id}): ${validated.reason}`);
          continue;
        }

        try {
          const ok = await mailer.sendTrialRetentionEmail(
            validated.email,
            validated.username,
            validated.trialEndDate,
            { user },
          );
          if (!ok) {
            await releaseClaim();
            results.failed += 1;
          } else {
            results.sent += 1;
            logger.info(`[EmailMarketing] Retención trial enviada a ${validated.email}`);
          }
        } catch (error) {
          await releaseClaim();
          results.failed += 1;
          logger.error(`[EmailMarketing] Error retención trial usuario ${user._id}:`, error.message);
        }
      }

      logger.info(
        `[EmailMarketing] Retención trial: enviados ${results.sent} (procesados ${results.processed}, fallos ${results.failed}, trial largo ${results.skippedLongTrial}, inválidos ${results.skippedInvalid})`
      );
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendTrialRetentionEmails:', error);
      return { processed: 0, sent: 0, failed: 0, skippedLongTrial: 0, skippedInvalid: 0 };
    }
  }

  /**
   * Recordatorio para usuarios registrados sin verificar email (~24 h tras registro, un envío).
   * Sin código: valor de producto e invitación a retomar registro o descargar la app.
   * @returns {Promise<{ processed: number, sent: number, failed: number, skippedInvalid: number }>}
   */
  async sendEmailVerificationReminderEmails() {
    const afterHours = getEmailVerificationReminderAfterHours();
    const now = new Date();

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skippedInvalid: 0,
    };

    const baseFilter = buildEmailVerificationReminderBaseFilter(now, afterHours);

    try {
      const safetyCap = parseInt(process.env.EMAIL_VERIFICATION_REMINDER_MAX_PER_RUN || '300', 10);
      const maxIterations = Number.isFinite(safetyCap) && safetyCap > 0 ? safetyCap : 300;

      for (let i = 0; i < maxIterations; i += 1) {
        const user = await User.findOneAndUpdate(
          baseFilter,
          {
            $set: {
              emailVerificationReminderSentAt: new Date(),
            },
          },
          {
            new: true,
            sort: { createdAt: 1 },
            select: 'email username emailVerified preferences.language',
          },
        );

        if (!user) break;

        results.processed += 1;

        const releaseClaim = async () => {
          await User.updateOne(
            { _id: user._id },
            { $unset: { emailVerificationReminderSentAt: '' } },
          );
        };

        const validated = validateUserForEmailVerificationReminderSend(user);
        if (!validated.ok) {
          await releaseClaim();
          results.skippedInvalid += 1;
          logger.warn(
            `[EmailMarketing] Recordatorio verificación omitido (${user._id}): ${validated.reason}`,
          );
          continue;
        }

        try {
          const ok = await mailer.sendEmailVerificationReminderEmail(
            validated.email,
            validated.username,
            { user },
          );
          if (!ok) {
            await releaseClaim();
            results.failed += 1;
          } else {
            results.sent += 1;
            logger.info(`[EmailMarketing] Recordatorio verificación enviado a ${validated.email}`);
          }
        } catch (error) {
          await releaseClaim();
          results.failed += 1;
          logger.error(
            `[EmailMarketing] Error recordatorio verificación usuario ${user._id}:`,
            error.message,
          );
        }
      }

      logger.info(
        `[EmailMarketing] Recordatorio verificación: enviados ${results.sent} (procesados ${results.processed}, fallos ${results.failed}, inválidos ${results.skippedInvalid})`,
      );
      return results;
    } catch (error) {
      logger.error('[EmailMarketing] Error en sendEmailVerificationReminderEmails:', error);
      return { processed: 0, sent: 0, failed: 0, skippedInvalid: 0 };
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
      }).select('email username lastLogin stats preferences.language');

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
            () =>
              mailer.sendReEngagementEmail(user.email, user.username, daysSinceActive, {
                language: user.preferences?.language,
              }),
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

