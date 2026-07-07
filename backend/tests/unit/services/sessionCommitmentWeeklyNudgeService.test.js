/**
 * Tests unitarios del recordatorio semanal de compromisos (#202 v1.1).
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: { find: jest.fn() },
}));

jest.unstable_mockModule('../../../models/SessionCommitment.js', () => ({
  default: { countDocuments: jest.fn() },
}));

jest.unstable_mockModule('../../../services/pushNotificationService.js', () => ({
  default: {
    NOTIFICATION_TYPES: { COMMITMENT_WEEKLY_NUDGE: 'commitment_weekly_nudge' },
  },
}));

const notificationScheduler = {
  _hasRecentNotificationOfType: jest.fn(),
  sendScheduledNotification: jest.fn(),
};

jest.unstable_mockModule('../../../services/notificationScheduler.js', () => ({
  default: notificationScheduler,
}));

const User = (await import('../../../models/User.js')).default;
const SessionCommitment = (await import('../../../models/SessionCommitment.js')).default;
const {
  isCommitmentWeeklyRemindersEnabled,
  processWeeklyCommitmentNudges,
} = await import('../../../services/sessionCommitmentWeeklyNudgeService.js');

describe('sessionCommitmentWeeklyNudgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isCommitmentWeeklyRemindersEnabled requiere opt-in explícito', () => {
    expect(isCommitmentWeeklyRemindersEnabled({})).toBe(false);
    expect(
      isCommitmentWeeklyRemindersEnabled({
        notificationPreferences: { types: { commitmentWeeklyReminders: true } },
      }),
    ).toBe(true);
  });

  it('processWeeklyCommitmentNudges envía cuando hay pendientes y sin cooldown', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'u1',
            pushToken: 'tok',
            notificationPreferences: { types: { commitmentWeeklyReminders: true } },
            preferences: { language: 'es' },
          },
        ]),
      }),
    });
    SessionCommitment.countDocuments.mockResolvedValue(1);
    notificationScheduler._hasRecentNotificationOfType.mockResolvedValue(false);
    notificationScheduler.sendScheduledNotification.mockResolvedValue(true);

    const result = await processWeeklyCommitmentNudges();
    expect(result.sent).toBe(1);
    expect(notificationScheduler.sendScheduledNotification).toHaveBeenCalled();
  });
});
