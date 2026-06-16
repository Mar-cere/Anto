/**
 * Hard-stop de crisis (#205): respuesta estructurada sin LLM en casos críticos explícitos.
 */
import { features } from '../config/features.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import {
  generateCrisisMessage,
  hasExplicitSuicidalOrSelfHarmLexicon,
} from '../constants/crisis.js';

export function isCrisisHardStopEnabled() {
  return features.crisisHardStop === true;
}

/**
 * Solo HIGH + léxico explícito de ideación/autolesión (conservador).
 */
export function shouldHardStopCrisisLlm({
  riskLevel,
  messageContent,
  enabled = isCrisisHardStopEnabled(),
} = {}) {
  if (!enabled) return false;
  if (String(riskLevel || '').toUpperCase() !== 'HIGH') return false;
  return hasExplicitSuicidalOrSelfHarmLexicon(messageContent);
}

export function buildHardStopCrisisAssistantContent({
  riskLevel = 'HIGH',
  country = 'GENERAL',
  language = 'es',
} = {}) {
  const lang = normalizeApiLanguage(language);
  const crisisBlock = generateCrisisMessage(riskLevel, country);
  const opening =
    lang === 'en'
      ? 'Thank you for telling me. Your safety comes first. You do not have to face this alone.'
      : 'Gracias por decírmelo. Tu seguridad es lo primero. No tienes que enfrentar esto solo/a.';
  return `${opening}\n\n${crisisBlock}`;
}

/** Payload cliente mínimo en hard-stop: sin sugerencias ni TCC lite. */
export function buildCrisisHardStopClientPayload(language = 'es') {
  normalizeApiLanguage(language);
  return {
    suggestions: [],
    suggestionsPersonalized: false,
    tccLite: { active: false, completed: false, atHandoff: null },
  };
}

export default {
  isCrisisHardStopEnabled,
  shouldHardStopCrisisLlm,
  buildHardStopCrisisAssistantContent,
  buildCrisisHardStopClientPayload,
};
