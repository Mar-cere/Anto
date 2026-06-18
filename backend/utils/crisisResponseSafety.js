/**
 * Post-procesado unificado de respuestas en crisis (camino B LLM).
 */
import { MESSAGE_INTENTS } from '../constants/openai.js';
import { isLlmCrisisTherapeuticExtrasBlocked } from './chatObservationalContext.js';
import { neutralizeSpanishVoseo } from './copyToneGuards.mjs';

const SANITIZE_RULES = [
  {
    id: 'conductual_future',
    pattern:
      /(?:mañana|esta semana|pr[oó]xim[oa]s?\s+d[ií]as?).{0,48}(?:podemos|podr[ií]amos|intenta|planifica|agenda|programa)/gi,
  },
  {
    id: 'behavioral_activation',
    pattern: /(?:activaci[oó]n conductual|behavioral activation)/gi,
  },
  {
    id: 'habit_invite',
    pattern:
      /(?:registra(?:r)?\s+(?:un\s+)?h[aá]bito|crea(?:r)?\s+(?:un\s+)?h[aá]bito|rutina de h[aá]bitos|planificar.{0,24}h[aá]bito)/gi,
  },
  {
    id: 'technique_invite',
    pattern: /(?:ejercicio de (?:respiraci[oó]n|grounding|mindfulness))/gi,
  },
  {
    id: 'tool_relax',
    pattern: /(?:t[eé]cnica de|herramienta de).{0,36}(?:relajaci[oó]n|respiraci[oó]n)/gi,
  },
  {
    id: 'safety_plan_co_create',
    pattern: /(?:plan de seguridad|safety plan).{0,48}(?:juntos|crear|armar|hagamos)/gi,
  },
  {
    id: 'task_micro',
    pattern: /(?:anota(?:r)?\s+una\s+tarea|crea(?:r)?\s+una\s+tarea|probar\s+mañana)/gi,
  },
  {
    id: 'grounding_invite',
    pattern: /(?:prueba\s+(?:un\s+)?grounding|hagamos\s+grounding|ejercicio\s+de\s+grounding)/gi,
  },
  {
    id: 'en_conductual',
    pattern: /(?:let'?s|we can) (?:try|plan|schedule).{0,40}(?:tomorrow|next week|habit)/gi,
  },
  {
    id: 'en_breathing_exercise',
    pattern: /(?:breathing exercise|breathing technique|mindfulness exercise)/gi,
  },
  {
    id: 'en_grounding_invite',
    pattern: /(?:try grounding|let'?s do grounding|grounding exercise)/gi,
  },
  {
    id: 'en_safety_plan',
    pattern: /(?:safety plan).{0,48}(?:together|create|let'?s|build)/gi,
  },
  {
    id: 'en_habit_invite',
    pattern: /(?:track a habit|create a habit|habit routine|schedule a habit)/gi,
  },
  {
    id: 'en_cbt_technique',
    pattern: /(?:CBT technique|cognitive behavioral technique)/gi,
  },
];

const CRISIS_SANITIZE_FALLBACK = {
  es: 'Te escucho. ¿Estás a salvo en este momento? Si estás en peligro inmediato, contacta a emergencias locales o a alguien de confianza ahora.',
  en: 'I hear you. Are you safe right now? If you are in immediate danger, contact local emergency services or someone you trust now.',
};

export function getCrisisSanitizeFallback(language = 'es') {
  const lang = String(language || 'es').trim().toLowerCase() === 'en' ? 'en' : 'es';
  return CRISIS_SANITIZE_FALLBACK[lang];
}

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
 * Detecta fragmentos inadecuados en respuestas de crisis (para tests y métricas).
 */
export function detectInappropriateCrisisContent(text) {
  if (!text || typeof text !== 'string') return [];
  const hits = [];
  for (const rule of SANITIZE_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) hits.push(rule.id);
  }
  return hits;
}

/**
 * Sanea respuesta LLM en crisis: quita invitaciones conductuales/terapéuticas.
 * @returns {{ text: string, wasSanitized: boolean, hits: string[] }}
 */
export function sanitizeCrisisLlmResponse(text) {
  if (!text || typeof text !== 'string') {
    return { text: text || '', wasSanitized: false, hits: [] };
  }
  const before = text.trim();
  let result = before;
  const hits = [];
  for (const rule of SANITIZE_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(result)) {
      hits.push(rule.id);
      rule.pattern.lastIndex = 0;
      result = result.replace(rule.pattern, '');
    }
  }
  result = result
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*[-•]\s*$/gm, '')
    .trim();
  const toneNeutralized = neutralizeSpanishVoseo(result);
  const wasSanitized =
    hits.length > 0 || result.length < before.length || toneNeutralized !== result;
  return { text: toneNeutralized, wasSanitized, hits };
}

/** @deprecated Usar sanitizeCrisisLlmResponse */
export function stripInappropriateCrisisConductualLanguage(text) {
  return sanitizeCrisisLlmResponse(text).text;
}

export default {
  shouldApplyCrisisResponseSafety,
  shouldStripCrisisConductualLanguage,
  detectInappropriateCrisisContent,
  sanitizeCrisisLlmResponse,
  getCrisisSanitizeFallback,
  stripInappropriateCrisisConductualLanguage,
};
