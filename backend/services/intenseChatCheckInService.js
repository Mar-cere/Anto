/**
 * Programa y procesa un check-in push poco después de mensajes muy intensos en el chat,
 * sin solapar el flujo de crisis formal (MEDIUM/HIGH con seguimiento largo).
 */
import IntenseChatCheckIn from '../models/IntenseChatCheckIn.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import pushNotificationService from './pushNotificationService.js';

export const DELAY_MIN_MS = 2 * 60 * 1000;
export const DELAY_MAX_MS = 5 * 60 * 1000;
export const PROCESS_INTERVAL_MS = 60 * 1000;
/** Evita saturar si hubo varios picos seguidos */
export const SENT_COOLDOWN_MS = 45 * 60 * 1000;
export const INTENSITY_THRESHOLD = 8;

export function shouldOfferWellbeingCheckIn({ isCrisis, emotionalIntensity, riskLevel }) {
  if (isCrisis) return false;
  const intensity = typeof emotionalIntensity === 'number' ? emotionalIntensity : 0;
  if (intensity >= INTENSITY_THRESHOLD) return true;
  if (riskLevel === 'WARNING') return true;
  return false;
}

function randomDelayMs() {
  return DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1));
}

function resolveReason(intensity, riskLevel) {
  const hi = typeof intensity === 'number' && intensity >= INTENSITY_THRESHOLD;
  const warn = riskLevel === 'WARNING';
  if (hi && warn) return 'high_intensity_and_warning';
  if (warn) return 'warning_level';
  return 'high_intensity';
}

class IntenseChatCheckInService {
  async maybeSchedule({ userId, conversationId, assistantMessageId, emotionalAnalysis, riskLevel, isCrisis }) {
    try {
      if (
        !shouldOfferWellbeingCheckIn({
          isCrisis,
          emotionalIntensity: emotionalAnalysis?.intensity,
          riskLevel
        })
      ) {
        return { scheduled: false, reason: 'criteria_not_met' };
      }

      const user = await User.findById(userId)
        .select('+pushToken notificationPreferences preferences.notifications')
        .lean();

      if (!user?.pushToken) {
        return { scheduled: false, reason: 'no_push_token' };
      }
      if (user.notificationPreferences?.enabled === false) {
        return { scheduled: false, reason: 'notifications_disabled' };
      }
      if (user.preferences?.notifications === false) {
        return { scheduled: false, reason: 'preference_notifications_off' };
      }

      const sinceCooldown = new Date(Date.now() - SENT_COOLDOWN_MS);
      const recentSent = await IntenseChatCheckIn.findOne({
        userId,
        status: 'sent',
        sentAt: { $gte: sinceCooldown }
      })
        .select('_id')
        .lean();
      if (recentSent) {
        return { scheduled: false, reason: 'cooldown_after_sent' };
      }

      await IntenseChatCheckIn.updateMany(
        { userId, conversationId, status: 'pending' },
        { $set: { status: 'cancelled', cancelReason: 'superseded' } }
      );

      const otherPending = await IntenseChatCheckIn.findOne({
        userId,
        status: 'pending'
      })
        .select('_id')
        .lean();
      if (otherPending) {
        return { scheduled: false, reason: 'user_has_other_pending_checkin' };
      }

      const intensity = emotionalAnalysis?.intensity;
      const doc = await IntenseChatCheckIn.create({
        userId,
        conversationId,
        anchorAssistantMessageId: assistantMessageId,
        scheduledFor: new Date(Date.now() + randomDelayMs()),
        status: 'pending',
        reason: resolveReason(intensity, riskLevel),
        marker: { intensity, riskLevel }
      });

      return { scheduled: true, id: doc._id.toString(), scheduledFor: doc.scheduledFor };
    } catch (error) {
      console.error('[IntenseChatCheckInService] Error programando check-in:', error);
      return { scheduled: false, reason: error.message };
    }
  }

  async processDue() {
    const now = new Date();
    const due = await IntenseChatCheckIn.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    })
      .limit(50)
      .lean();

    const results = { due: due.length, sent: 0, skipped: 0, errors: 0 };

    for (const row of due) {
      try {
        const anchor = await Message.findById(row.anchorAssistantMessageId)
          .select('createdAt')
          .lean();
        if (!anchor) {
          await IntenseChatCheckIn.updateOne(
            { _id: row._id },
            { $set: { status: 'cancelled', cancelReason: 'anchor_missing' } }
          );
          continue;
        }

        const continued = await Message.findOne({
          userId: row.userId,
          conversationId: row.conversationId,
          role: 'user',
          createdAt: { $gt: anchor.createdAt }
        })
          .select('_id')
          .lean();

        if (continued) {
          await IntenseChatCheckIn.updateOne(
            { _id: row._id },
            { $set: { status: 'skipped', skipReason: 'user_continued_chat' } }
          );
          results.skipped++;
          continue;
        }

        const user = await User.findById(row.userId).select('+pushToken notificationPreferences preferences.notifications').lean();
        if (!user?.pushToken || user.notificationPreferences?.enabled === false || user.preferences?.notifications === false) {
          await IntenseChatCheckIn.updateOne(
            { _id: row._id },
            { $set: { status: 'skipped', skipReason: 'no_token_or_prefs' } }
          );
          results.skipped++;
          continue;
        }

        const sendResult = await pushNotificationService.sendWellbeingChatCheckIn(user.pushToken, {
          conversationId: row.conversationId.toString()
        });

        if (sendResult.success) {
          await IntenseChatCheckIn.updateOne(
            { _id: row._id },
            { $set: { status: 'sent', sentAt: new Date() } }
          );
          results.sent++;
        } else {
          await IntenseChatCheckIn.updateOne(
            { _id: row._id },
            { $set: { status: 'skipped', skipReason: 'push_failed' } }
          );
          results.skipped++;
        }
      } catch (e) {
        console.error('[IntenseChatCheckInService] Error procesando fila:', e);
        results.errors++;
      }
    }

    return results;
  }

  start() {
    setInterval(() => {
      this.processDue().catch(err => {
        console.error('[IntenseChatCheckInService] Error en intervalo:', err);
      });
    }, PROCESS_INTERVAL_MS);
    this.processDue().catch(err => {
      console.error('[IntenseChatCheckInService] Error en proceso inicial:', err);
    });
    console.log('[IntenseChatCheckInService] ✅ Servicio iniciado');
  }
}

const intenseChatCheckInService = new IntenseChatCheckInService();
export default intenseChatCheckInService;
