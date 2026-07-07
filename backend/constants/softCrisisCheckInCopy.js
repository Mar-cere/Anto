/**
 * Copy del check-in de crisis suave (#19) para el cliente.
 */
import { getEmergencyLines } from './emergencyNumbers.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

export const SOFT_CHECK_IN_VERSION = '1.0';

export function buildSoftCrisisCheckInClientPayload({
  language = 'es',
  countryOrSource = 'GENERAL',
} = {}) {
  const lang = normalizeApiLanguage(language);
  const en = lang === 'en';
  const lines = getEmergencyLines(countryOrSource);

  return {
    version: SOFT_CHECK_IN_VERSION,
    active: true,
    validation: en
      ? 'I hear that things feel heavy right now. You are not alone in this moment.'
      : 'Escucho que ahora mismo se siente pesado. No estás solo/a en este momento.',
    subtitle: en
      ? 'A short pause can help before we keep talking.'
      : 'Una pausa breve puede ayudar antes de seguir conversando.',
    techniques: [
      {
        id: 'breathing',
        label: en ? 'Breathing exercise' : 'Ejercicio de respiración',
        screen: 'BreathingExercise',
      },
      {
        id: 'grounding',
        label: en ? 'Grounding 5-4-3-2-1' : 'Grounding 5-4-3-2-1',
        screen: 'GroundingTechnique',
      },
    ],
    footnote: en
      ? `If distress rises sharply, you can use the prevention line: ${lines.SUICIDE_PREVENTION}.`
      : `Si el malestar sube mucho, puedes usar la línea de prevención: ${lines.SUICIDE_PREVENTION}.`,
    dismissible: true,
  };
}

export default {
  SOFT_CHECK_IN_VERSION,
  buildSoftCrisisCheckInClientPayload,
};
