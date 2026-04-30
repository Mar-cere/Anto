/**
 * Tests unitarios para servicio de notificaciones push
 * 
 * @author AntoApp Team
 */

import pushNotificationService from '../../../services/pushNotificationService.js';

describe('PushNotificationService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(pushNotificationService).toBeDefined();
      expect(typeof pushNotificationService).toBe('object');
    });
  });

  describe('Mapeo de canales y prioridad', () => {
    it('debe enrutar notificaciones de trial/suscripción a anto-trial', () => {
      const types = pushNotificationService.NOTIFICATION_TYPES;

      expect(pushNotificationService.getChannelId(types.TRIAL_EXPIRING)).toBe('anto-trial');
      expect(pushNotificationService.getChannelId(types.TRIAL_EXPIRED)).toBe('anto-trial');
      expect(pushNotificationService.getChannelId(types.SUBSCRIPTION_REMINDER)).toBe('anto-trial');
      expect(pushNotificationService.getChannelId(types.TRIAL_WELCOME)).toBe('anto-trial');
      expect(pushNotificationService.getChannelId(types.SUBSCRIPTION_RENEWAL_HINT)).toBe('anto-trial');
    });

    it('debe mantener prioridad alta para trial/suscripción', () => {
      const types = pushNotificationService.NOTIFICATION_TYPES;

      expect(pushNotificationService.getPriority(types.TRIAL_EXPIRING)).toBe('high');
      expect(pushNotificationService.getPriority(types.TRIAL_EXPIRED)).toBe('high');
      expect(pushNotificationService.getPriority(types.SUBSCRIPTION_REMINDER)).toBe('high');
      expect(pushNotificationService.getPriority(types.TRIAL_WELCOME)).toBe('high');
      expect(pushNotificationService.getPriority(types.SUBSCRIPTION_RENEWAL_HINT)).toBe('high');
    });

    it('debe enrutar between_sessions_nudge como recordatorio estándar', () => {
      const types = pushNotificationService.NOTIFICATION_TYPES;
      expect(pushNotificationService.getChannelId(types.BETWEEN_SESSIONS_NUDGE)).toBe('anto-reminders');
      expect(pushNotificationService.getPriority(types.BETWEEN_SESSIONS_NUDGE)).toBe('default');
    });

    it('debe tener al menos 5 tipos por grupo funcional en NOTIFICATION_TYPES', () => {
      const t = pushNotificationService.NOTIFICATION_TYPES;
      const groups = [
        [
          t.CRISIS_WARNING,
          t.CRISIS_MEDIUM,
          t.CRISIS_HIGH,
          t.FOLLOW_UP,
          t.CRISIS_RESOURCES,
        ],
        [
          t.TECHNIQUE_REMINDER,
          t.BREATHING_REMINDER,
          t.MINDFULNESS_REMINDER,
          t.GROUNDING_REMINDER,
          t.PROGRESSIVE_RELAXATION,
        ],
        [
          t.PROGRESS_POSITIVE,
          t.ACHIEVEMENT_UNLOCKED,
          t.STREAK_MILESTONE,
          t.WEEKLY_PROGRESS,
          t.PERSONAL_BEST,
        ],
        [t.HABIT_REMINDER, t.HABIT_MISSED, t.TASK_REMINDER, t.TASK_OVERDUE, t.TASK_DUE_SOON],
        [
          t.DAILY_CHECKIN,
          t.EMOTIONAL_CHECKIN,
          t.GRATITUDE_REMINDER,
          t.JOURNALING_PROMPT,
          t.WEEKLY_REFLECTION,
        ],
        [
          t.MOTIVATIONAL_MESSAGE,
          t.MORNING_MOTIVATION,
          t.EVENING_REFLECTION,
          t.MIDDAY_MOTIVATION,
          t.WEEKEND_REFLECTION,
        ],
        [
          t.WELLNESS_TIP,
          t.SELF_CARE_REMINDER,
          t.HYDRATION_REMINDER,
          t.MOVEMENT_BREAK,
          t.SLEEP_ROUTINE_REMINDER,
        ],
        [
          t.TRIAL_EXPIRING,
          t.TRIAL_EXPIRED,
          t.SUBSCRIPTION_REMINDER,
          t.TRIAL_WELCOME,
          t.SUBSCRIPTION_RENEWAL_HINT,
        ],
        [
          t.EMERGENCY_ALERT_SENT,
          t.EMERGENCY_CONTACT_UPDATED,
          t.EMERGENCY_TEST_REMINDER,
          t.EMERGENCY_SAFETY_REVIEW,
          t.EMERGENCY_INFO_DIGEST,
        ],
      ];
      groups.forEach((keys) => {
        expect(keys.length).toBeGreaterThanOrEqual(5);
        keys.forEach((k) => expect(typeof k).toBe('string'));
      });
    });
  });
});

