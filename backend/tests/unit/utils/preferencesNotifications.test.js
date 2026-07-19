import {
  isPreferencesNotificationsEnabled,
  normalizePreferencesNotifications,
} from '../../../utils/preferencesNotifications.js';

describe('preferencesNotifications', () => {
  describe('normalizePreferencesNotifications', () => {
    it('convierte boolean legacy a objeto con enabled', () => {
      expect(normalizePreferencesNotifications(true)).toEqual({ enabled: true });
      expect(normalizePreferencesNotifications(false)).toEqual({ enabled: false });
    });

    it('preserva campos previos al convertir boolean', () => {
      expect(
        normalizePreferencesNotifications(false, {
          enabled: true,
          emailEnabled: true,
          pushEnabled: true,
        })
      ).toEqual({
        enabled: false,
        emailEnabled: true,
        pushEnabled: true,
      });
    });

    it('fusiona objetos', () => {
      expect(
        normalizePreferencesNotifications(
          { pushEnabled: false },
          { enabled: true, emailEnabled: true }
        )
      ).toEqual({
        enabled: true,
        emailEnabled: true,
        pushEnabled: false,
      });
    });
  });

  describe('isPreferencesNotificationsEnabled', () => {
    it('soporta boolean legacy y objeto', () => {
      expect(isPreferencesNotificationsEnabled(true)).toBe(true);
      expect(isPreferencesNotificationsEnabled(false)).toBe(false);
      expect(isPreferencesNotificationsEnabled({ enabled: true })).toBe(true);
      expect(isPreferencesNotificationsEnabled({ enabled: false })).toBe(false);
      expect(isPreferencesNotificationsEnabled(undefined)).toBe(true);
    });
  });
});
