/**
 * Módulos extraídos de crisisFollowUpService.
 * - constants: intervalos de seguimiento y configuración
 * - messageGenerator: generación de mensajes de seguimiento
 */

export {
  FOLLOW_UP_INTERVALS,
  CHECK_INTERVAL_MS,
  FIRST_FOLLOW_UP_HOURS_BY_RISK
} from './constants.js';

export { generateFollowUpMessage } from './messageGenerator.js';
