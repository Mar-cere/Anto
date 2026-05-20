/**
 * Mensajes de API de notificaciones de prueba (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    noPushToken:
      'Usuario no tiene token push registrado. Activa las notificaciones push en Settings.',
    warningSent: 'Notificación de prueba WARNING enviada exitosamente',
    mediumSent: 'Notificación de prueba MEDIUM enviada exitosamente',
    followupSent: 'Notificación de prueba de seguimiento enviada exitosamente',
    sendError: 'Error enviando notificación',
    testSendError: 'Error enviando notificación de prueba',
    followupTestMessage:
      'Han pasado 24 horas desde tu último momento difícil. ¿Quieres compartir cómo te sientes?',
  },
  en: {
    noPushToken:
      'User has no push token registered. Enable push notifications in Settings.',
    warningSent: 'WARNING test notification sent successfully',
    mediumSent: 'MEDIUM test notification sent successfully',
    followupSent: 'Follow-up test notification sent successfully',
    sendError: 'Could not send notification',
    testSendError: 'Could not send test notification',
    followupTestMessage:
      '24 hours have passed since your last difficult moment. Would you like to share how you feel?',
  },
};

export function testNotificationApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
