/**
 * Hard-stop de crisis (#205): respuesta estructurada sin LLM en casos críticos explícitos.
 */
import { features } from '../config/features.js';
import {
  formatCrisisEmergencyResources,
  resolveEmergencyInfoFromPreferences,
} from '../constants/emergencyNumbers.js';
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

const HARD_STOP_RISK_LEVELS = new Set(['WARNING', 'MEDIUM', 'HIGH']);

export function isCrisisHardStopEnabled() {
  return features.crisisHardStop === true;
}

/**
 * Léxico explícito de ideación/autolesión + riesgo WARNING o superior (no LOW).
 */
export function shouldHardStopCrisisLlm({
  riskLevel,
  messageContent,
  enabled = isCrisisHardStopEnabled(),
} = {}) {
  if (!enabled) return false;
  if (!hasExplicitSuicidalOrSelfHarmLexicon(messageContent)) return false;
  const level = String(riskLevel || 'LOW').toUpperCase();
  return HARD_STOP_RISK_LEVELS.has(level);
}

function buildHardStopCrisisBody({
  language = 'es',
  preferences = null,
  phone = null,
  /** Si el cliente muestra CrisisResourcesStrip, no repetir números ni límites en el texto. */
  resourcesDeliveredInPanel = false,
} = {}) {
  const lang = normalizeApiLanguage(language);
  const en = lang === 'en';
  const emergencyInfo = resolveEmergencyInfoFromPreferences(preferences, phone);
  const resourceBlock = formatCrisisEmergencyResources(emergencyInfo, lang);

  const safetyQuestions = en
    ? [
        'How are you right now?',
        '• Do you feel safe at this moment?',
        '• Is anyone with you, or can you reach someone you trust?',
      ]
    : [
        '¿Cómo estás en este momento?',
        '• ¿Te sientes a salvo ahora?',
        '• ¿Hay alguien cerca o a quien puedas escribir o llamar?',
      ];

  const resourceHeader = en
    ? 'If you need human help right now:'
    : 'Si necesitas ayuda humana ahora:';

  const panelPointer = en
    ? 'Below you will find local emergency and crisis lines for your country—you can call with one tap.'
    : 'Abajo tienes líneas de emergencia y prevención de tu país; puedes llamar con un toque.';

  const appLimits = en
    ? 'About this chat: I cannot place calls or send messages for you. Emergency contacts in the app are only notified if you configured them and the app activates alerts according to its rules.'
    : 'Sobre este chat: no puedo llamar ni enviar mensajes por ti. Los contactos de emergencia de la app solo reciben avisos si los configuraste y el sistema los activa según las reglas de la aplicación.';

  const closing = en
    ? 'When you can, you may reply here. You do not have to go through this alone.'
    : 'Cuando puedas, puedes responder aquí. No tienes que pasar esto solo/a.';

  if (resourcesDeliveredInPanel) {
    return [safetyQuestions.join('\n'), panelPointer, closing].join('\n\n');
  }

  return [
    safetyQuestions.join('\n'),
    resourceHeader,
    resourceBlock,
    appLimits,
    closing,
  ].join('\n\n');
}

export function buildHardStopCrisisAssistantContent({
  riskLevel = 'HIGH',
  language = 'es',
  preferences = null,
  phone = null,
  resourcesDeliveredInPanel = false,
  /** @deprecated usar preferences + phone */
  country = null,
} = {}) {
  const lang = normalizeApiLanguage(language);
  const mergedPreferences =
    preferences && typeof preferences === 'object'
      ? { ...preferences }
      : {};
  if (country && !mergedPreferences.country) {
    mergedPreferences.country = country;
  }

  const opening =
    lang === 'en'
      ? 'Thank you for telling me. What you feel matters, and your safety comes first.'
      : 'Gracias por contármelo. Lo que sientes importa, y tu seguridad es lo primero.';

  const body = buildHardStopCrisisBody({
    language: lang,
    preferences: mergedPreferences,
    phone,
    resourcesDeliveredInPanel,
  });
  return `${opening}\n\n${body}`;
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
