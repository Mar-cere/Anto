/**
 * Copy fijo soft landing post-crisis (#225) — strip / home / prompt.
 */
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

export const SOFT_LANDING_VERSION = '1.1';

/**
 * @param {{ language?: string }} [opts]
 */
export function buildSoftLandingStripPayload({ language = 'es' } = {}) {
  const en = normalizeApiLanguage(language) === 'en';
  return {
    version: SOFT_LANDING_VERSION,
    active: true,
    kicker: en ? 'After a hard moment' : 'Después de un momento difícil',
    validation: en
      ? 'I am here when you want to talk. No rush.'
      : 'Estoy aquí cuando quieras hablar. Sin prisa.',
    subtitle: en
      ? 'If it helps, you can take a short regulation pause.'
      : 'Si te ayuda, puedes tomar una pausa breve de regulación.',
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
      ? 'You can dismiss this and keep chatting whenever you are ready.'
      : 'Puedes ocultar esto y seguir conversando cuando quieras.',
    dismissible: true,
  };
}

/**
 * @param {{ language?: string }} [opts]
 */
export function buildSoftLandingHomeMessage({ language = 'es' } = {}) {
  const en = normalizeApiLanguage(language) === 'en';
  return en
    ? 'I am here when you want. No pressure to do more right now.'
    : 'Estoy aquí cuando quieras. Sin presión de hacer más ahora.';
}

/**
 * @param {{ language?: string }} [opts]
 * @returns {string}
 */
export function buildSoftLandingPromptSnippet({ language = 'es' } = {}) {
  const en = normalizeApiLanguage(language) === 'en';
  if (en) {
    return [
      '## Soft landing after crisis (temporary)',
      'The user recently left a crisis protocol or hard-stop window.',
      'Respond with brief, warm presence. Prefer validation over advice.',
      'Do NOT propose tasks, habits, commitments, CBT frameworks, or psychoeducation cards.',
      'You MAY gently offer breathing or grounding only if the user asks or seems flooded.',
      'Do not reopen crisis protocol copy unless new risk signals appear.',
      'Tone cue: "I am here when you want."',
    ].join('\n');
  }
  return [
    '## Soft landing post-crisis (temporal)',
    'La persona salió recientemente de un protocolo de crisis o hard-stop.',
    'Responde con presencia breve y cálida. Prioriza validación sobre consejos.',
    'NO propongas tareas, hábitos, compromisos, marcos TCC ni tarjetas de psicoeducación.',
    'SÍ puedes ofrecer con suavidad respiración o grounding solo si la persona lo pide o se siente saturada.',
    'No reabras copy de protocolo de crisis salvo nuevas señales de riesgo.',
    'Tono: «Estoy aquí cuando quieras.»',
  ].join('\n');
}

export default {
  SOFT_LANDING_VERSION,
  buildSoftLandingStripPayload,
  buildSoftLandingHomeMessage,
  buildSoftLandingPromptSnippet,
};
