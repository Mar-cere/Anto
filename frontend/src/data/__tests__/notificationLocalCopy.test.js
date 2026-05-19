/**
 * Tests unitarios para textos locales de notificaciones (hábitos, tareas, fallback).
 */

import {
  LOCAL_NOTIFICATION_COPY,
  getLocalNotificationCopy,
} from '../notificationLocalCopy';

describe('getLocalNotificationCopy', () => {
  it('returns English copy when language is en', () => {
    expect(getLocalNotificationCopy('en')).toBe(LOCAL_NOTIFICATION_COPY.en);
    expect(getLocalNotificationCopy('en').defaultTitle).toBe('Anto');
    expect(getLocalNotificationCopy('en').defaultBody).toBe('You have a reminder.');
    expect(getLocalNotificationCopy('en').habitTitle).toBe('Do not forget your habit!');
    expect(getLocalNotificationCopy('en').taskPendingBody).toBe(
      'You have a pending task in Anto'
    );
  });

  it('returns Spanish copy for es and non-en languages', () => {
    expect(getLocalNotificationCopy('es')).toBe(LOCAL_NOTIFICATION_COPY.es);
    expect(getLocalNotificationCopy('es').defaultBody).toBe('Tienes un recordatorio.');
    expect(getLocalNotificationCopy(undefined)).toBe(LOCAL_NOTIFICATION_COPY.es);
    expect(getLocalNotificationCopy('fr')).toBe(LOCAL_NOTIFICATION_COPY.es);
  });

  it('habitBody interpolates the habit name in the selected language', () => {
    expect(getLocalNotificationCopy('en').habitBody('Meditate')).toBe('Remember: Meditate');
    expect(getLocalNotificationCopy('es').habitBody('Meditar')).toBe('Recuerda: Meditar');
  });
});
