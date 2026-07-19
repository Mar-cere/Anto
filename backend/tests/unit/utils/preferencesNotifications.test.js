import { getUpdateProfileSchema } from '../../../utils/userSchemas.js';
import { userApiCopy } from '../../../utils/userApiCopy.js';
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

    it('conserva opt-out legacy boolean al merge parcial', () => {
      expect(
        normalizePreferencesNotifications({ pushEnabled: false }, false)
      ).toEqual({
        enabled: false,
        pushEnabled: false,
      });
    });

    it('ignora null y conserva previous', () => {
      expect(normalizePreferencesNotifications(null, { enabled: false })).toEqual({
        enabled: false,
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

  describe('getUpdateProfileSchema — notifications', () => {
    const schema = getUpdateProfileSchema(userApiCopy('es'));

    it('coerce boolean a objeto en validate', () => {
      const { error, value } = schema.validate({
        preferences: { notifications: false },
      });
      expect(error).toBeUndefined();
      expect(value.preferences.notifications).toEqual({ enabled: false });
    });

    it('acepta objeto parcial', () => {
      const { error, value } = schema.validate({
        preferences: { notifications: { pushEnabled: false } },
      });
      expect(error).toBeUndefined();
      expect(value.preferences.notifications).toEqual({ pushEnabled: false });
    });
  });
});
