/**
 * Post-procesado unificado de respuestas en crisis (camino B LLM).
 */
import { MESSAGE_INTENTS } from '../constants/openai.js';
import { isLlmCrisisTherapeuticExtrasBlocked } from './chatObservationalContext.js';

const CONDUCTUAL_BLOCK_PATTERNS = [
  /(?:mañana|esta semana|pr[oó]xim[oa]s?\s+d[ií]as?).{0,48}(?:podemos|podr[ií]amos|intenta|planifica|agenda|programa)/gi,
  /(?:activaci[oó]n conductual|behavioral activation)/gi,
  /(?:registra(?:r)?\s+(?:un\s+)?h[aá]bito|crea(?:r)?\s+(?:un\s+)?h[aá]bito|rutina de h[aá]bitos|planificar.{0,24}h[aá]bito)/gi,
  /(?:ejercicio de (?:respiraci[oó]n|grounding|mindfulness))/gi,
  /(?:t[eé]cnica de|herramienta de).{0,36}(?:relajaci[oó]n|respiraci[oó]n)/gi,
  /(?:let'?s|we can) (?:try|plan|schedule).{0,40}(?:tomorrow|next week|habit)/gi,
];

export function shouldApplyCrisisResponseSafety({ crisis, contextual, emotional } = {}) {
  const riskLevel = String(crisis?.riskLevel || 'LOW').toUpperCase();
  if (['WARNING', 'MEDIUM', 'HIGH'].includes(riskLevel)) return true;

  const intent = contextual?.intencion?.tipo;
  const intensity = Number(emotional?.intensity || 0);
  if (intent === MESSAGE_INTENTS.CRISIS && intensity >= 7) return true;
  if ((intensity >= 8 || emotional?.requiresAttention) && intent === MESSAGE_INTENTS.CRISIS) {
    return true;
  }
  return false;
}

export function shouldStripCrisisConductualLanguage({ riskLevel, userMessage } = {}) {
  return isLlmCrisisTherapeuticExtrasBlocked({ riskLevel, userMessage });
}

/**
 * Quita invitaciones a hábitos, técnicas o planes cuando el turno es de crisis.
 */
export function stripInappropriateCrisisConductualLanguage(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const pattern of CONDUCTUAL_BLOCK_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

export default {
  shouldApplyCrisisResponseSafety,
  shouldStripCrisisConductualLanguage,
  stripInappropriateCrisisConductualLanguage,
};
