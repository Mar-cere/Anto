/**
 * Recordatorio semanal opt-in de compromisos pendientes (#202 v1.1).
 */
import User from '../models/User.js';
import SessionCommitment from '../models/SessionCommitment.js';
import pushNotificationService from './pushNotificationService.js';
import notificationScheduler from './notificationScheduler.js';

const COOLDOWN_HOURS = 7 * 24;

export function isCommitmentWeeklyRemindersEnabled(user) {
  return user?.notificationPreferences?.types?.commitmentWeeklyReminders === true;
}

export async function userHasPendingCommitmentFollowUp(userId) {
  const count = await SessionCommitment.countDocuments({
    userId,
    status: 'active',
    followUpAnswer: 'pending',
  });
  return count > 0;
}

export async function processWeeklyCommitmentNudges() {
  const users = await User.find({
    'notificationPreferences.enabled': true,
    'notificationPreferences.types.commitmentWeeklyReminders': true,
    pushToken: { $exists: true, $ne: null },
  })
    .select('_id pushToken notificationPreferences preferences.language')
    .lean();

  const results = { checked: users.length, sent: 0, skipped: 0, errors: 0 };
  const notificationType = pushNotificationService.NOTIFICATION_TYPES.COMMITMENT_WEEKLY_NUDGE;

  for (const user of users) {
    try {
      if (!isCommitmentWeeklyRemindersEnabled(user)) {
        results.skipped += 1;
        continue;
      }

      const hasPending = await userHasPendingCommitmentFollowUp(user._id);
      if (!hasPending) {
        results.skipped += 1;
        continue;
      }

      const recent = await notificationScheduler._hasRecentNotificationOfType(
        user._id,
        notificationType,
        COOLDOWN_HOURS,
      );
      if (recent) {
        results.skipped += 1;
        continue;
      }

      const lang = String(user?.preferences?.language || 'es').toLowerCase().startsWith('en')
        ? 'en'
        : 'es';
      const sent = await notificationScheduler.sendScheduledNotification(
        user._id,
        user.pushToken,
        notificationType,
        { language: lang },
      );
      if (sent) results.sent += 1;
      else results.skipped += 1;
    } catch (err) {
      console.error('[sessionCommitmentWeeklyNudge]', user._id, err?.message || err);
      results.errors += 1;
    }
  }

  return results;
}

export default {
  isCommitmentWeeklyRemindersEnabled,
  userHasPendingCommitmentFollowUp,
  processWeeklyCommitmentNudges,
};
