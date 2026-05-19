/**
 * Textos para notificaciones locales (hábitos, tareas, fallback).
 */
export const LOCAL_NOTIFICATION_COPY = {
  es: {
    defaultTitle: 'Anto',
    defaultBody: 'Tienes un recordatorio.',
    habitTitle: '¡No olvides tu hábito!',
    habitBody: (name) => `Recuerda: ${name}`,
    taskPendingBody: 'Tienes una tarea pendiente en Anto',
  },
  en: {
    defaultTitle: 'Anto',
    defaultBody: 'You have a reminder.',
    habitTitle: 'Do not forget your habit!',
    habitBody: (name) => `Remember: ${name}`,
    taskPendingBody: 'You have a pending task in Anto',
  },
};

export function getLocalNotificationCopy(language) {
  return language === 'en' ? LOCAL_NOTIFICATION_COPY.en : LOCAL_NOTIFICATION_COPY.es;
}
