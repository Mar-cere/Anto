/**
 * Generador de mensajes de seguimiento post-crisis (#225 soft landing tone).
 * Nota: el envío real es push-only; este texto alimenta el cuerpo del push / legacy.
 */
import { APP_NAME } from '../../constants/app.js';
import {
  formatCrisisEmergencyResources,
  resolveEmergencyInfoFromPreferences,
} from '../../constants/emergencyNumbers.js';
import { normalizeApiLanguage } from '../../utils/apiLanguage.js';

/**
 * Genera el contenido del mensaje de seguimiento
 * @param {Object} crisisEvent - Evento de crisis
 * @param {Object} [options]
 * @param {Object|null} [options.preferences] - Preferencias del usuario
 * @param {string|null} [options.phone] - Teléfono del usuario
 * @param {'es'|'en'} [options.language='es']
 * @returns {string} Contenido del mensaje
 */
export function generateFollowUpMessage(crisisEvent, options = {}) {
  const { preferences = null, phone = null, language = 'es' } = options;
  const lang = normalizeApiLanguage(language);
  const en = lang === 'en';
  const emergencyInfo = resolveEmergencyInfoFromPreferences(preferences, phone);
  const riskLevel = crisisEvent.riskLevel;
  const hoursSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(crisisEvent.detectedAt).getTime()) / (1000 * 60 * 60)),
  );

  let message = en ? `Hi, this is ${APP_NAME}. ` : `Hola, soy ${APP_NAME}. `;

  if (en) {
    if (hoursSince < 36) {
      message += 'I am checking in gently after a hard moment. ';
    } else {
      message += 'Just a soft check-in — no pressure. ';
    }
    message += 'I am here when you want to talk. ';
  } else {
    if (hoursSince < 36) {
      message += 'Te escribo con suavidad después de un momento difícil. ';
    } else {
      message += 'Solo un acompañamiento suave — sin presión. ';
    }
    message += 'Estoy aquí cuando quieras hablar. ';
  }

  if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
    message += en
      ? '\n\nIf you need to talk with someone, these lines are available 24/7:\n'
      : '\n\nSi necesitas hablar con alguien, estas líneas están disponibles 24/7:\n';
    message += formatCrisisEmergencyResources(emergencyInfo, lang);
  }

  message += en
    ? '\nYou can open the app whenever you are ready.'
    : '\nPuedes abrir la app cuando estés listo/a.';

  return message;
}
