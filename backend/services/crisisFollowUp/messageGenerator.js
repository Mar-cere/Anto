/**
 * Generador de mensajes de seguimiento post-crisis.
 * Extraído de crisisFollowUpService para separar lógica de presentación.
 */
import { APP_NAME } from '../../constants/app.js';
import { getEmergencyLines } from '../../constants/crisis.js';

/**
 * Genera el contenido del mensaje de seguimiento
 * @param {Object} crisisEvent - Evento de crisis
 * @param {string} country - País del usuario
 * @returns {string} Contenido del mensaje
 */
export function generateFollowUpMessage(crisisEvent, country = 'GENERAL') {
  const lines = getEmergencyLines(country);
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
    message += `- Línea de Prevención del Suicidio: ${lines.SUICIDE_PREVENTION}\n`;
    message += `- Emergencias: ${lines.EMERGENCY}\n`;
    if (lines.MENTAL_HEALTH) {
      message += `- Salud Mental: ${lines.MENTAL_HEALTH}\n`;
    }
  }

  message += `\nEstoy aquí para escucharte cuando lo necesites.`;

  return message;
}
