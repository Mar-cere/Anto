/**
 * Mensajes de API de señales multimodales (#215–#217).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: {
    serverError: 'No se pudieron procesar las señales.',
    consentRequired: 'Activa el consentimiento correspondiente en ajustes.',
    weeklyInsightsDisabled: 'Los informes semanales están desactivados.',
    invalidPayload: 'Payload de señales inválido.',
    invalidWeekKey: 'Semana inválida.',
    invalidMonthKey: 'Mes inválido.',
    monthlyInsightsDisabled: 'Los informes mensuales están desactivados.',
    rateLimit: 'Demasiadas solicitudes. Intenta más tarde.',
  },
  en: {
    serverError: 'Could not process signals.',
    consentRequired: 'Enable the corresponding consent in settings.',
    weeklyInsightsDisabled: 'Weekly insight reports are disabled.',
    invalidPayload: 'Invalid signal payload.',
    invalidWeekKey: 'Invalid week key.',
    invalidMonthKey: 'Invalid month key.',
    monthlyInsightsDisabled: 'Monthly insight reports are disabled.',
    rateLimit: 'Too many requests. Try again later.',
  },
};

export function signalsApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}

export default signalsApiCopy;
