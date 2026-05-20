/**
 * Servicio de Programación de Notificaciones
 *
 * Gestiona la programación automática de notificaciones recurrentes
 * basadas en preferencias del usuario y comportamiento.
 *
 * Espaciado (variables de entorno, valores por defecto más conservadores):
 * - `NOTIFICATION_DAILY_MAX_PER_USER` — tope diario (default 3, máx. 20).
 * - `NOTIFICATION_MIN_HOURS_BETWEEN_ROUTINE` — horas mínimas entre avisos de rutina/bienestar (default 5; 0 = desactiva).
 * - `NOTIFICATION_INACTIVITY_POLL_HOURS` — cada cuántas horas se revisa inactividad (default 2).
 * - `NOTIFICATION_INACTIVITY_THRESHOLD_HOURS` — horas sin actividad para considerar inactivo (default 72).
 * - `NOTIFICATION_TASKS_DUE_TOMORROW_MAX` — máx. tareas avisadas por usuario al día (default 2).
 * - `NOTIFICATION_BETWEEN_SESSIONS_COOLDOWN_HOURS` — no repetir nudge entre sesiones (default 48).
 */

import mongoose from 'mongoose';
import Habit from '../models/Habit.js';
import NotificationEngagement from '../models/NotificationEngagement.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import pushNotificationService from './pushNotificationService.js';
import { resolveAppLanguage } from '../utils/resolveAppLanguage.js';
import { routinePushSlotLabel } from '../utils/focusDashboardCopy.js';

class NotificationScheduler {
  _userLanguage(user) {
    return resolveAppLanguage({
      preferenceLanguage: user?.preferences?.language,
    });
  }

  constructor() {
    // Intervalo para verificar notificaciones programadas (cada minuto)
    this.CHECK_INTERVAL_MS = 60 * 1000;

    const pollHoursRaw = parseInt(process.env.NOTIFICATION_INACTIVITY_POLL_HOURS || '2', 10);
    const pollHours = Number.isFinite(pollHoursRaw) && pollHoursRaw >= 1 ? Math.min(24, pollHoursRaw) : 2;
    this.INACTIVITY_CHECK_INTERVAL_MS = pollHours * 60 * 60 * 1000;

    const rawDailyMax = parseInt(process.env.NOTIFICATION_DAILY_MAX_PER_USER || '3', 10);
    this.DAILY_MAX_PER_USER = Number.isFinite(rawDailyMax)
      ? Math.min(20, Math.max(1, rawDailyMax))
      : 3;

    const minGapRaw = parseInt(process.env.NOTIFICATION_MIN_HOURS_BETWEEN_ROUTINE || '5', 10);
    this.MIN_HOURS_BETWEEN_ROUTINE =
      Number.isFinite(minGapRaw) && minGapRaw >= 0 ? Math.min(24, minGapRaw) : 5;

    const inactThRaw = parseInt(process.env.NOTIFICATION_INACTIVITY_THRESHOLD_HOURS || '72', 10);
    this.INACTIVITY_THRESHOLD_HOURS =
      Number.isFinite(inactThRaw) && inactThRaw >= 24 ? Math.min(336, inactThRaw) : 72;

    const taskCapRaw = parseInt(process.env.NOTIFICATION_TASKS_DUE_TOMORROW_MAX || '2', 10);
    this.TASKS_DUE_TOMORROW_MAX =
      Number.isFinite(taskCapRaw) && taskCapRaw >= 1 ? Math.min(10, taskCapRaw) : 2;

    const bsCoolRaw = parseInt(process.env.NOTIFICATION_BETWEEN_SESSIONS_COOLDOWN_HOURS || '48', 10);
    this.BETWEEN_SESSIONS_COOLDOWN_HOURS =
      Number.isFinite(bsCoolRaw) && bsCoolRaw >= 6 ? Math.min(168, bsCoolRaw) : 48;

    const T = pushNotificationService.NOTIFICATION_TYPES;
    /** Tipos de rutina/bienestar que comparten el espaciado mínimo entre sí (no incluye tareas). */
    this.ROUTINE_SPACING_TYPES = [
      T.MORNING_MOTIVATION,
      T.EVENING_REFLECTION,
      T.HYDRATION_REMINDER,
      T.MIDDAY_MOTIVATION,
      T.MOVEMENT_BREAK,
      T.SLEEP_ROUTINE_REMINDER,
      T.DAILY_CHECKIN,
      T.GRATITUDE_REMINDER,
      T.WEEKLY_REFLECTION
    ];

    this.isRunning = false;
  }

  async _countUserSentToday(userId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return NotificationEngagement.countDocuments({
      userId,
      status: 'sent',
      sentAt: { $gte: start, $lte: end }
    });
  }

  async _canSendMoreToday(userId) {
    const sentToday = await this._countUserSentToday(userId);
    return sentToday < this.DAILY_MAX_PER_USER;
  }

  /** Preferencias tipo: undefined = tratar como true (compatibilidad con usuarios antiguos). */
  _wellnessTypesEnabled(user) {
    return user?.notificationPreferences?.types?.motivationalMessages !== false;
  }

  _taskRemindersEnabled(user) {
    return user?.notificationPreferences?.types?.taskReminders !== false;
  }

  _habitRemindersEnabled(user) {
    return user?.notificationPreferences?.types?.habitReminders !== false;
  }

  _betweenSessionsEnabled(user) {
    return user?.notificationPreferences?.types?.betweenSessionsMessages !== false;
  }

  _dailyRemindersEnabled(user) {
    return user?.notificationPreferences?.types?.dailyReminders !== false;
  }

  _getUserTimezone(user) {
    const tz = user?.preferences?.timezone;
    if (typeof tz !== 'string' || !tz.includes('/')) return 'UTC';
    return tz;
  }

  _getLocalHourMinute(now, timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);
      const hh = parseInt(parts.find((p) => p.type === 'hour')?.value || '', 10);
      const mm = parseInt(parts.find((p) => p.type === 'minute')?.value || '', 10);
      if (Number.isFinite(hh) && Number.isFinite(mm)) return { hh, mm };
    } catch {}
    return { hh: now.getUTCHours(), mm: now.getUTCMinutes() };
  }

  _getStartOfDayInTzUtc(now, timeZone) {
    // Devuelve el instante UTC que corresponde a 00:00 del día local del usuario.
    // Implementación basada en reconstruir YYYY-MM-DD local en tz y calcular su offset.
    try {
      const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now); // "YYYY-MM-DD"
      const [y, m, d] = dateParts.split('-').map((x) => parseInt(x, 10));
      const utcMidnight = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
      // Calcular offset (min) del tz en esa fecha comparando hora local de utcMidnight.
      const localHm = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .formatToParts(utcMidnight);
      const lh = parseInt(localHm.find((p) => p.type === 'hour')?.value || '0', 10);
      const lm = parseInt(localHm.find((p) => p.type === 'minute')?.value || '0', 10);
      // Si utcMidnight en tz no es 00:00, ajustar.
      const deltaMinutes = lh * 60 + lm;
      return new Date(utcMidnight.getTime() - deltaMinutes * 60 * 1000);
    } catch {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }
  }

  async _hasRecentNotificationOfType(userId, notificationType, windowHours = 24) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const existing = await NotificationEngagement.findOne({
      userId,
      notificationType,
      status: 'sent',
      sentAt: { $gte: since }
    })
      .select('_id')
      .lean();
    return !!existing;
  }

  /**
   * Evita ráfagas: no enviar otro aviso de rutina/bienestar si hace poco hubo uno del mismo grupo.
   * Las tareas (`TASK_DUE_SOON`) no aplican esta regla.
   * @param {import('mongoose').Types.ObjectId|string} userId
   * @param {string} notificationType
   */
  async _routineSpacingAllows(userId, notificationType) {
    const T = pushNotificationService.NOTIFICATION_TYPES;
    if (notificationType === T.TASK_DUE_SOON) {
      return true;
    }
    if (!this.MIN_HOURS_BETWEEN_ROUTINE || this.MIN_HOURS_BETWEEN_ROUTINE <= 0) {
      return true;
    }
    if (!this.ROUTINE_SPACING_TYPES.includes(notificationType)) {
      return true;
    }
    const minMs = this.MIN_HOURS_BETWEEN_ROUTINE * 60 * 60 * 1000;
    const last = await NotificationEngagement.findOne({
      userId,
      status: 'sent',
      notificationType: { $in: this.ROUTINE_SPACING_TYPES }
    })
      .sort({ sentAt: -1 })
      .select('sentAt')
      .lean();
    if (!last?.sentAt) {
      return true;
    }
    const elapsed = Date.now() - new Date(last.sentAt).getTime();
    return elapsed >= minMs;
  }

  /**
   * Tareas con vencimiento mañana: un aviso por tarea (tope configurable por usuario), deduplicado por engagement reciente.
   */
  async notifyTasksDueTomorrow() {
    const types = pushNotificationService.NOTIFICATION_TYPES;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      dueDate: { $gte: tomorrow, $lte: tomorrowEnd },
      status: { $in: ['pending', 'in_progress'] },
      $or: [{ 'notifications.enabled': true }, { 'notifications.enabled': { $exists: false } }],
    })
      .select('title userId _id')
      .limit(800)
      .lean();

    const perUser = new Map();
    for (const t of tasks) {
      const uid = String(t.userId);
      if (!perUser.has(uid)) perUser.set(uid, []);
      const arr = perUser.get(uid);
      if (arr.length < this.TASKS_DUE_TOMORROW_MAX) arr.push(t);
    }

    const since = new Date(Date.now() - 28 * 60 * 60 * 1000);

    for (const [userIdStr, list] of perUser) {
      if (!mongoose.Types.ObjectId.isValid(userIdStr)) continue;
      try {
        const user = await User.findById(userIdStr)
          .select('pushToken notificationPreferences preferences.language')
          .lean();
        if (!user?.pushToken || user.notificationPreferences?.enabled === false) continue;
        if (!this._taskRemindersEnabled(user)) continue;

        for (const task of list) {
          try {
            const idStr = String(task._id);
            const dup = await NotificationEngagement.findOne({
              userId: task.userId,
              notificationType: types.TASK_DUE_SOON,
              sentAt: { $gte: since },
              'notificationData.data.taskId': idStr,
            })
              .select('_id')
              .lean();
            if (dup) continue;

            const lang = this._userLanguage(user);
            const rawTitle = String(task.title ?? '').trim();
            const taskTitle = rawTitle.slice(0, 200) || (lang === 'en' ? 'Task' : 'Tarea');

            await this.sendScheduledNotification(task.userId, user.pushToken, types.TASK_DUE_SOON, {
              taskTitle,
              taskId: idStr,
              dueIn: lang === 'en' ? 'tomorrow' : 'mañana',
              language: lang,
            });
          } catch (taskErr) {
            console.error('[NotificationScheduler] Error aviso tarea para mañana:', taskErr);
          }
        }
      } catch (userErr) {
        console.error('[NotificationScheduler] Error usuario en tareas para mañana:', userErr);
      }
    }
  }

  /**
   * Programa notificaciones recurrentes para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la programación
   */
  async scheduleUserNotifications(userId) {
    try {
      const user = await User.findById(userId).select('notificationPreferences pushToken');
      
      if (!user || !user.pushToken) {
        return { success: false, reason: 'Usuario no encontrado o sin token push' };
      }

      if (!user.notificationPreferences?.enabled) {
        return { success: false, reason: 'Notificaciones deshabilitadas' };
      }

      const scheduled = [];

      // Programar notificación matutina si está habilitada
      if (user.notificationPreferences.morning?.enabled) {
        const morningHour = user.notificationPreferences.morning.hour || 8;
        const morningMinute = user.notificationPreferences.morning.minute || 0;
        
        // Verificar si es hora de enviar
        const now = new Date();
        const morningTime = new Date();
        morningTime.setHours(morningHour, morningMinute, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (morningTime <= now) {
          morningTime.setDate(morningTime.getDate() + 1);
        }

        scheduled.push({
          type: 'morning',
          scheduledAt: morningTime,
          notificationType: pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION
        });
      }

      // Programar notificación vespertina si está habilitada
      if (user.notificationPreferences.evening?.enabled) {
        const eveningHour = user.notificationPreferences.evening.hour || 19;
        const eveningMinute = user.notificationPreferences.evening.minute || 0;
        
        const now = new Date();
        const eveningTime = new Date();
        eveningTime.setHours(eveningHour, eveningMinute, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (eveningTime <= now) {
          eveningTime.setDate(eveningTime.getDate() + 1);
        }

        scheduled.push({
          type: 'evening',
          scheduledAt: eveningTime,
          notificationType: pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION
        });
      }

      return {
        success: true,
        scheduled: scheduled.length,
        notifications: scheduled
      };
    } catch (error) {
      console.error('[NotificationScheduler] Error programando notificaciones:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Verifica y envía notificaciones programadas
   * @returns {Promise<Object>} Resumen de notificaciones enviadas
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const T = pushNotificationService.NOTIFICATION_TYPES;
      const users = await User.find({
        'notificationPreferences.enabled': true,
        pushToken: { $exists: true, $ne: null }
      }).select('notificationPreferences pushToken _id preferences.timezone preferences.language');

      const results = {
        checked: users.length,
        sent: 0,
        skipped: 0,
        errors: 0,
        habitsChecked: 0,
        habitsSent: 0,
      };

      for (const user of users) {
        try {
          const tz = this._getUserTimezone(user);
          const { hh: h, mm: m } = this._getLocalHourMinute(now, tz);

          // Verificar notificación matutina
          if (this._wellnessTypesEnabled(user) && user.notificationPreferences?.morning?.enabled) {
            const morningHour = user.notificationPreferences.morning.hour || 8;
            const morningMinute = user.notificationPreferences.morning.minute || 0;
            
            if (h === morningHour && m === morningMinute) {
              const sentOk = await this.sendScheduledNotification(
                user._id,
                user.pushToken,
                T.MORNING_MOTIVATION,
                { timeOfDay: 'morning', language: this._userLanguage(user) },
              );
              if (sentOk) results.sent++;
            }
          }

          // Verificar notificación vespertina
          if (this._wellnessTypesEnabled(user) && user.notificationPreferences?.evening?.enabled) {
            const eveningHour = user.notificationPreferences.evening.hour || 19;
            const eveningMinute = user.notificationPreferences.evening.minute || 0;
            
            if (h === eveningHour && m === eveningMinute) {
              const sentOk = await this.sendScheduledNotification(
                user._id,
                user.pushToken,
                T.EVENING_REFLECTION,
                { timeOfDay: 'evening', language: this._userLanguage(user) },
              );
              if (sentOk) results.sent++;
            }
          }

          // Hasta 2 franjas fijas diarias de bienestar (antes 4 en ventana corta), además de mañana/tarde configurables
          if (this._wellnessTypesEnabled(user) && h === 14 && m === 0) {
            const sentOk = await this.sendScheduledNotification(user._id, user.pushToken, T.MIDDAY_MOTIVATION, {
              timeOfDay: 'midday',
              language: this._userLanguage(user),
            });
            if (sentOk) results.sent++;
          }
          if (this._wellnessTypesEnabled(user) && h === 21 && m === 0) {
            const sentOk = await this.sendScheduledNotification(user._id, user.pushToken, T.SLEEP_ROUTINE_REMINDER, {
              timeOfDay: 'night',
              language: this._userLanguage(user),
            });
            if (sentOk) results.sent++;
          }

          results.skipped++;
        } catch (error) {
          console.error(`[NotificationScheduler] Error procesando usuario ${user._id}:`, error);
          results.errors++;
        }
      }

      // Recordatorios de hábitos (por minuto, según Habit.reminder.time)
      try {
        const habitResult = await this.notifyHabitsForCurrentMinute(now);
        results.habitsChecked = habitResult.checked;
        results.habitsSent = habitResult.sent;
      } catch (habitErr) {
        console.error('[NotificationScheduler] notifyHabitsForCurrentMinute:', habitErr);
        results.errors++;
      }

      // Para tareas, mantenemos un horario fijo en UTC para evitar depender del timezone (puede ajustarse luego).
      const hh = now.getUTCHours();
      const mm = now.getUTCMinutes();
      if (hh === 10 && mm === 5) {
        try {
          await this.notifyTasksDueTomorrow();
        } catch (e) {
          console.error('[NotificationScheduler] notifyTasksDueTomorrow:', e);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('[NotificationScheduler] Error procesando notificaciones programadas:', error);
      return { checked: 0, sent: 0, skipped: 0, errors: 1 };
    }
  }

  /**
   * Envía una notificación programada y registra el engagement
   * @param {string} userId - ID del usuario
   * @param {string} pushToken - Token push
   * @param {string} notificationType - Tipo de notificación
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<boolean>} True si se envió exitosamente
   */
  async sendScheduledNotification(userId, pushToken, notificationType, options = {}) {
    try {
      let language = options.language;
      if (!language) {
        const u = await User.findById(userId).select('preferences.language').lean();
        language = resolveAppLanguage({ preferenceLanguage: u?.preferences?.language });
      }
      const opts = { ...options, language };

      const canSend = await this._canSendMoreToday(userId);
      if (!canSend) {
        return false;
      }

      const spacingOk = await this._routineSpacingAllows(userId, notificationType);
      if (!spacingOk) {
        return false;
      }

      let result;
      
      // Enviar según el tipo
      switch (notificationType) {
        case pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION:
          result = await pushNotificationService.sendMotivationalMessage(pushToken, {
            timeOfDay: 'morning',
            ...opts,
          });
          break;
        case pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION:
          result = await pushNotificationService.sendMotivationalMessage(pushToken, {
            timeOfDay: 'evening',
            ...opts,
          });
          break;
        case pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN:
          result = await pushNotificationService.sendDailyCheckIn(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE:
          result = await pushNotificationService.sendBetweenSessionsNudge(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.HYDRATION_REMINDER:
          result = await pushNotificationService.sendHydrationReminder(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.MIDDAY_MOTIVATION:
          result = await pushNotificationService.sendMiddayMotivation(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.GROUNDING_REMINDER:
          result = await pushNotificationService.sendGroundingReminder(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.MOVEMENT_BREAK:
          result = await pushNotificationService.sendMovementBreak(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.WELLNESS_TIP:
          result = await pushNotificationService.sendWellnessTip(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.JOURNALING_PROMPT:
          result = await pushNotificationService.sendJournalingPrompt(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.SLEEP_ROUTINE_REMINDER:
          result = await pushNotificationService.sendSleepRoutineReminder(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.GRATITUDE_REMINDER:
          result = await pushNotificationService.sendGratitudeReminder(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.WEEKLY_REFLECTION:
          result = await pushNotificationService.sendWeeklyReflection(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.HABIT_REMINDER:
          result = await pushNotificationService.sendHabitReminder(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.TASK_REMINDER:
          result = await pushNotificationService.sendTaskReminder(pushToken, opts);
          break;
        case pushNotificationService.NOTIFICATION_TYPES.TASK_DUE_SOON:
          result = await pushNotificationService.sendTaskDueSoon(pushToken, opts);
          break;
        default:
          result = { success: false, error: 'Tipo de notificación no soportado' };
      }

      // Registrar engagement (no debe tumbar el envío si falla la DB)
      try {
        await NotificationEngagement.create({
          userId,
          notificationType,
          pushToken,
          status: result.success ? 'sent' : 'error',
          notificationData: {
            title: result.title || '',
            body: result.body || '',
            data: opts
          },
          error: result.error || null,
          metadata: {
            timeOfDay: opts.timeOfDay || 'unknown'
          }
        });
      } catch (engagementErr) {
        console.warn(
          '[NotificationScheduler] Engagement no registrado:',
          engagementErr?.message || engagementErr
        );
      }

      return result.success;
    } catch (error) {
      console.error('[NotificationScheduler] Error enviando notificación programada:', error);
      return false;
    }
  }

  /**
   * Envía notificaciones basadas en comportamiento del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} behaviorData - Datos de comportamiento
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendBehaviorBasedNotification(userId, behaviorData) {
    try {
      const user = await User.findById(userId).select(
        'pushToken notificationPreferences preferences.language',
      );
      
      if (!user || !user.pushToken) {
        return { success: false, reason: 'Usuario no encontrado o sin token push' };
      }

      if (!user.notificationPreferences?.enabled) {
        return { success: false, reason: 'Notificaciones deshabilitadas' };
      }

      const { inactivity, emotionalState, progress, lastInteraction } = behaviorData;
      const lang = this._userLanguage(user);
      let notificationType = null;
      let options = { language: lang };

      // Notificación por inactividad
      if (inactivity && inactivity.hours > 48) {
        notificationType = pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE;
        options = {
          language: lang,
          message:
            lang === 'en'
              ? 'It has been a few days. If it helps, come back with one short line and we can pick up from there.'
              : 'Hace días que no pasas por acá. Si te ayuda, vuelve con una frase breve y seguimos desde ahí.',
        };
      }
      // Notificación por progreso positivo
      else if (progress && progress.improvement) {
        notificationType = pushNotificationService.NOTIFICATION_TYPES.PROGRESS_POSITIVE;
        options = {
          language: lang,
          achievement: lang === 'en' ? 'Positive progress' : 'Progreso positivo',
          message:
            lang === 'en' ? 'You have been improving. Keep it up!' : 'Has estado mejorando. ¡Sigue así!',
        };
      }
      // Notificación por estado emocional negativo persistente
      else if (emotionalState && emotionalState.negativeStreak > 3) {
        notificationType = pushNotificationService.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN;
        options = {
          language: lang,
          message:
            lang === 'en'
              ? 'I notice you have been going through difficult moments. Would you like to talk?'
              : 'Noto que has estado pasando por momentos difíciles. ¿Quieres hablar?',
        };
      }

      if (!notificationType) {
        return { success: false, reason: 'No se requiere notificación basada en comportamiento' };
      }

      // Verificar preferencias de tipo
      const typeKey = this.getPreferenceKey(notificationType);
      if (user.notificationPreferences.types && 
          user.notificationPreferences.types[typeKey] === false) {
        return { success: false, reason: 'Tipo de notificación deshabilitado por el usuario' };
      }

      if (
        notificationType === pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE
        && !this._betweenSessionsEnabled(user)
      ) {
        return { success: false, reason: 'Mensajes entre sesiones deshabilitados por el usuario' };
      }

      if (notificationType === pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE) {
        const alreadySentRecently = await this._hasRecentNotificationOfType(
          userId,
          notificationType,
          this.BETWEEN_SESSIONS_COOLDOWN_HOURS
        );
        if (alreadySentRecently) {
          return {
            success: false,
            reason: `Ya se envió un mensaje entre sesiones en las últimas ${this.BETWEEN_SESSIONS_COOLDOWN_HOURS}h`
          };
        }
      }

      const result = await this.sendScheduledNotification(
        userId,
        user.pushToken,
        notificationType,
        options
      );

      return {
        success: result,
        notificationType,
        reason: this.getBehaviorReason(behaviorData)
      };
    } catch (error) {
      console.error('[NotificationScheduler] Error enviando notificación basada en comportamiento:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Obtiene la clave de preferencia para un tipo de notificación
   * @param {string} notificationType - Tipo de notificación
   * @returns {string} Clave de preferencia
   */
  getPreferenceKey(notificationType) {
    const mapping = {
      [pushNotificationService.NOTIFICATION_TYPES.DAILY_CHECKIN]: 'dailyReminders',
      [pushNotificationService.NOTIFICATION_TYPES.EMOTIONAL_CHECKIN]: 'dailyReminders',
      [pushNotificationService.NOTIFICATION_TYPES.MORNING_MOTIVATION]: 'motivationalMessages',
      [pushNotificationService.NOTIFICATION_TYPES.EVENING_REFLECTION]: 'motivationalMessages',
      [pushNotificationService.NOTIFICATION_TYPES.BETWEEN_SESSIONS_NUDGE]: 'betweenSessionsMessages',
      [pushNotificationService.NOTIFICATION_TYPES.PROGRESS_POSITIVE]: 'motivationalMessages',
      [pushNotificationService.NOTIFICATION_TYPES.HABIT_REMINDER]: 'habitReminders',
      [pushNotificationService.NOTIFICATION_TYPES.TASK_REMINDER]: 'taskReminders',
      [pushNotificationService.NOTIFICATION_TYPES.TASK_DUE_SOON]: 'taskReminders',
    };
    return mapping[notificationType] || 'dailyReminders';
  }

  /**
   * Obtiene la razón del comportamiento detectado
   * @param {Object} behaviorData - Datos de comportamiento
   * @returns {string} Razón
   */
  getBehaviorReason(behaviorData) {
    if (behaviorData.inactivity && behaviorData.inactivity.hours > 48) {
      return 'inactivity';
    }
    if (behaviorData.progress && behaviorData.progress.improvement) {
      return 'progress';
    }
    if (behaviorData.emotionalState && behaviorData.emotionalState.negativeStreak > 3) {
      return 'emotional_state';
    }
    return 'unknown';
  }

  /**
   * Verifica usuarios inactivos y envía notificaciones si es apropiado
   * @returns {Promise<Object>} Resumen de verificación
   */
  async checkInactiveUsers() {
    try {
      const hoursThreshold = this.INACTIVITY_THRESHOLD_HOURS;
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

      const inactiveUsers = await User.find({
        'notificationPreferences.enabled': true,
        pushToken: { $exists: true, $ne: null },
        'stats.lastActive': { $lt: thresholdDate }
      }).select('_id pushToken notificationPreferences stats');

      const results = {
        checked: inactiveUsers.length,
        notified: 0,
        skipped: 0,
        errors: 0
      };

      for (const user of inactiveUsers) {
        try {
          // Verificar si el usuario tiene habilitadas las notificaciones diarias
          if (!this._dailyRemindersEnabled(user)) {
            results.skipped++;
            continue;
          }

          const hoursInactive = Math.floor(
            (Date.now() - new Date(user.stats.lastActive).getTime()) / (1000 * 60 * 60)
          );

          const result = await this.sendBehaviorBasedNotification(user._id, {
            inactivity: { hours: hoursInactive }
          });

          if (result.success) {
            results.notified++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          console.error(`[NotificationScheduler] Error verificando usuario inactivo ${user._id}:`, error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('[NotificationScheduler] Error verificando usuarios inactivos:', error);
      return { checked: 0, notified: 0, skipped: 0, errors: 1 };
    }
  }

  /**
   * Inicia el servicio de programación
   */
  start() {
    if (this.isRunning) {
      console.warn('[NotificationScheduler] El servicio ya está corriendo');
      return;
    }

    this.isRunning = true;

    // Procesar notificaciones programadas cada minuto
    setInterval(() => {
      this.processScheduledNotifications().catch(err => {
        console.error('[NotificationScheduler] Error en intervalo de notificaciones programadas:', err);
      });
    }, this.CHECK_INTERVAL_MS);

    // Verificar usuarios inactivos cada hora
    setInterval(() => {
      this.checkInactiveUsers().catch(err => {
        console.error('[NotificationScheduler] Error en intervalo de usuarios inactivos:', err);
      });
    }, this.INACTIVITY_CHECK_INTERVAL_MS);

    // Ejecutar inmediatamente al iniciar
    this.processScheduledNotifications().catch(err => {
      console.error('[NotificationScheduler] Error en procesamiento inicial:', err);
    });

    this.checkInactiveUsers().catch(err => {
      console.error('[NotificationScheduler] Error en verificación inicial de inactivos:', err);
    });

    console.log('[NotificationScheduler] ✅ Servicio de programación de notificaciones iniciado');
  }

  /**
   * Detiene el servicio de programación
   */
  stop() {
    this.isRunning = false;
    console.log('[NotificationScheduler] ⏹️ Servicio de programación de notificaciones detenido');
  }

  /**
   * Envía recordatorios de hábitos cuya hora coincide con el minuto actual.
   * Asume que `reminder.time` se almacena en UTC (ISO) desde el cliente.
   * Deduplicación: no reenvía si `reminder.lastNotified` ya es hoy (UTC).
   */
  async notifyHabitsForCurrentMinute(now = new Date()) {
    // Optimización: agrupar por zona horaria y resolver con 1 aggregate por tz.
    const users = await User.find({
      'notificationPreferences.enabled': true,
      pushToken: { $exists: true, $ne: null },
      $or: [
        { 'notificationPreferences.types.habitReminders': { $ne: false } },
        { 'notificationPreferences.types.habitReminders': { $exists: false } },
      ],
    })
      .select('_id pushToken notificationPreferences preferences.timezone preferences.language')
      .lean();

    if (!users.length) {
      return { checked: 0, sent: 0 };
    }

    const groups = new Map();
    for (const u of users) {
      if (!this._habitRemindersEnabled(u)) continue;
      const tz = this._getUserTimezone(u);
      if (!groups.has(tz)) {
        groups.set(tz, { userIds: [], pushByUserId: new Map(), langByUserId: new Map() });
      }
      const g = groups.get(tz);
      g.userIds.push(u._id);
      g.pushByUserId.set(String(u._id), u.pushToken);
      g.langByUserId.set(String(u._id), this._userLanguage(u));
    }

    let checked = 0;
    let sent = 0;

    for (const [tz, g] of groups.entries()) {
      if (!g.userIds.length) continue;
      const { hh, mm } = this._getLocalHourMinute(now, tz);
      const startOfLocalDayUtc = this._getStartOfDayInTzUtc(now, tz);

      // Buscar hábitos cuyo reminder.time cae en hh:mm de la zona horaria tz, y que no hayan sido notificados hoy (día local).
      const matches = await Habit.aggregate([
        {
          $match: {
            userId: { $in: g.userIds },
            'reminder.enabled': true,
            'status.archived': { $ne: true },
            deletedAt: { $exists: false },
            $or: [
              { 'reminder.lastNotified': { $exists: false } },
              { 'reminder.lastNotified': null },
              { 'reminder.lastNotified': { $lt: startOfLocalDayUtc } },
            ],
          },
        },
        {
          $addFields: {
            _rtParts: {
              $dateToParts: { date: '$reminder.time', timezone: tz },
            },
          },
        },
        { $match: { '_rtParts.hour': hh, '_rtParts.minute': mm } },
        { $project: { title: 1, userId: 1 } },
        { $limit: 2000 },
      ]);

      checked += matches.length;
      if (!matches.length) continue;

      const toMarkNotified = [];

      for (const h of matches) {
        const userIdStr = String(h.userId);
        const pushToken = g.pushByUserId.get(userIdStr);
        if (!pushToken) continue;

        const lang = g.langByUserId.get(userIdStr) || 'es';
        const ok = await this.sendScheduledNotification(
          h.userId,
          pushToken,
          pushNotificationService.NOTIFICATION_TYPES.HABIT_REMINDER,
          {
            timeOfDay: 'habit',
            habitId: String(h._id),
            habitName: String(h.title || (lang === 'en' ? 'Habit' : 'Hábito')).slice(0, 120),
            language: lang,
          },
        );
        if (ok) {
          sent++;
          toMarkNotified.push(h._id);
        }
      }

      if (toMarkNotified.length) {
        try {
          await Habit.updateMany(
            { _id: { $in: toMarkNotified } },
            { $set: { 'reminder.lastNotified': now } }
          );
        } catch {}
      }
    }

    return { checked, sent };
  }
}

/**
 * Siguiente envío programado por preferencias rutinarias (mañana / tarde-noche).
 * No contempla notificaciones comportamentales ni tareas.
 * @param {object} notificationPreferences - prefs del usuario
 * @param {Date} [now]
 * @param {'es'|'en'} [language]
 * @returns {{ kind: 'morning'|'evening', at: Date, label: string }|null}
 */
export function computeNextRoutinePushSlot(
  notificationPreferences,
  now = new Date(),
  language = 'es'
) {
  if (!notificationPreferences?.enabled) return null;
  const slots = [];
  if (notificationPreferences.morning?.enabled) {
    const morningHour = notificationPreferences.morning.hour ?? 8;
    const morningMinute = notificationPreferences.morning.minute ?? 0;
    const morningTime = new Date(now);
    morningTime.setHours(morningHour, morningMinute, 0, 0);
    if (morningTime <= now) {
      morningTime.setDate(morningTime.getDate() + 1);
    }
    slots.push({
      kind: 'morning',
      at: morningTime,
      label: routinePushSlotLabel('morning', language)
    });
  }
  if (notificationPreferences.evening?.enabled) {
    const eveningHour = notificationPreferences.evening.hour ?? 19;
    const eveningMinute = notificationPreferences.evening.minute ?? 0;
    const eveningTime = new Date(now);
    eveningTime.setHours(eveningHour, eveningMinute, 0, 0);
    if (eveningTime <= now) {
      eveningTime.setDate(eveningTime.getDate() + 1);
    }
    slots.push({
      kind: 'evening',
      at: eveningTime,
      label: routinePushSlotLabel('evening', language)
    });
  }
  if (!slots.length) return null;
  slots.sort((a, b) => a.at.getTime() - b.at.getTime());
  return slots[0];
}

const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;

