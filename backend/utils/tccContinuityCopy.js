/**
 * Copy para continuidad TCC (chat + dashboard).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    baToday: 'Activación conductual · Hoy',
    baTomorrow: 'Activación conductual · Mañana',
    baOverdue: 'Activación conductual · Pendiente',
    baUpcoming: 'Activación conductual',
    baMoreSuffix: 'actividades más esta semana',
    exposureTitle: 'Exposición · Paso en curso',
    exposureAttemptsSuffix: 'intentos registrados',
    chatStripKicker: 'Retoma tu proceso',
    chatStripOpen: 'Abrir',
    chatStripDismissA11y: 'Ocultar sugerencia',
  },
  en: {
    baToday: 'Behavioral activation · Today',
    baTomorrow: 'Behavioral activation · Tomorrow',
    baOverdue: 'Behavioral activation · Pending',
    baUpcoming: 'Behavioral activation',
    baMoreSuffix: 'more activities this week',
    exposureTitle: 'Exposure · Step in progress',
    exposureAttemptsSuffix: 'attempts logged',
    chatStripKicker: 'Pick up where you left off',
    chatStripOpen: 'Open',
    chatStripDismissA11y: 'Hide suggestion',
  },
};

export function tccContinuityCopy(language = 'es') {
  const lang = normalizeApiLanguage(language);
  return COPY[lang] || COPY.es;
}
