/**
 * Generador de mensajes de seguimiento post-crisis.
 * Extraído de crisisFollowUpService para separar lógica de presentación.
 */
import { APP_NAME } from '../../constants/app.js';
import {
  formatCrisisEmergencyResources,
  resolveEmergencyInfoFromPreferences,
} from '../../constants/emergencyNumbers.js';

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
  const emergencyInfo = resolveEmergencyInfoFromPreferences(preferences, phone);
  const riskLevel = crisisEvent.riskLevel;
  const daysSinceCrisis = Math.floor(
    (Date.now() - new Date(crisisEvent.detectedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  let message = `Hola, soy ${APP_NAME}. `;

  if (daysSinceCrisis === 1) {
    message += `Hace un día detectamos que estabas pasando por un momento difícil. `;
  } else {
    message += `Hace ${daysSinceCrisis} días detectamos que estabas pasando por un momento difícil. `;
  }

  message += `Quería saber cómo te sientes ahora. `;
  message += `¿Hay algo en lo que pueda ayudarte? `;

  if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
    message += `\n\nRecuerda que si necesitas hablar con alguien, estas líneas están disponibles 24/7:\n`;
    message += formatCrisisEmergencyResources(emergencyInfo, language);
  }

  message += `\nEstoy aquí para escucharte cuando lo necesites.`;

  return message;
}
