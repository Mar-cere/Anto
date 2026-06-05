/**
 * Prefill de jerarquía de exposición (#87) desde mensaje de chat.
 */
import { sanitizeAbcPrefillText } from './abcRecordPrefillService.js';
import { shouldBoostExposureSuggestion } from './actionSuggestionService.js';

export const EXPOSURE_PREFILL_MAX_GOAL = 200;
export const EXPOSURE_PREFILL_MAX_STEP = 500;

const AVOID_EXTRACT = [
  /(?:evit(?:o|ar|ando|ación)\s+(?:a\s+)?)(.+?)(?:\s*(?:porque|because|,\s*\d|\.\s|$))/i,
  /(?:avoid(?:ing)?\s+(?:to\s+)?)(.+?)(?:\s*(?:because|,\s*\d|\.\s|$))/i,
];

const FEAR_EXTRACT = [
  /(?:miedo\s+(?:a|de|que)\s+)(.+?)(?:\s*(?:porque|por|,\s*\d|\.\s|$))/i,
  /(?:temor\s+(?:a|de|que)\s+)(.+?)(?:\s*(?:porque|por|,\s*\d|\.\s|$))/i,
  /(?:me\s+(?:da|dan)\s+(?:mucho\s+)?miedo\s+(?:a\s+)?)(.+?)(?:\s*(?:porque|por|,\s*\d|\.\s|$))/i,
  /(?:afraid\s+(?:of|to)\s+)(.+?)(?:\s*(?:because|,\s*\d|\.\s|$))/i,
  /(?:scared\s+(?:of|to)\s+)(.+?)(?:\s*(?:because|,\s*\d|\.\s|$))/i,
];

function resolveLanguage(language = 'es') {
  return String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

function clampField(text, maxLength) {
  const value = sanitizeAbcPrefillText(String(text || '').replace(/^["'«]+|["'»]+$/g, ''));
  if (!value || value.length < 3) return null;
  if (value.length > maxLength) return `${value.slice(0, maxLength - 1).trim()}…`;
  return value;
}

function cleanGoalFragment(raw = '') {
  return String(raw || '')
    .replace(/\s*(?:porque|because|ya que|since)\s+.*/i, '')
    .replace(/\s*(?:me da|me dan|it makes me).*/i, '')
    .trim();
}

function buildStepTemplates(goal, language = 'es') {
  const lang = resolveLanguage(language);
  const shortGoal = goal.length > 56 ? `${goal.slice(0, 55).trim()}…` : goal;
  if (lang === 'en') {
    return [
      `Picture «${shortGoal}» for 1–2 min (without pushing the thought away)`,
      `Small step: get a little closer to «${shortGoal}»`,
    ];
  }
  return [
    `Imaginar «${shortGoal}» 1–2 min (sin huir del pensamiento)`,
    `Paso pequeño: acercarte un poco a «${shortGoal}»`,
  ];
}

/**
 * @param {string} userContent
 * @returns {string|null}
 */
export function extractExposureGoalFromMessage(userContent = '') {
  const text = sanitizeAbcPrefillText(
    String(userContent || '').replace(/\b\d{1,2}\s*\/\s*10\b/gi, ''),
  );
  if (!text) return null;

  for (const pattern of [...AVOID_EXTRACT, ...FEAR_EXTRACT]) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const goal = clampField(cleanGoalFragment(match[1]), EXPOSURE_PREFILL_MAX_GOAL);
      if (goal) return goal;
    }
  }

  const clauses = text
    .split(/(?<=[.!?])\s+|,\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const situational = clauses.find((c) =>
    /(?:evit|miedo|temor|avoid|afraid|scared|paraliza|bloquea|reunion|meeting|hablar|speak)/i.test(c),
  );
  if (situational) {
    const stripped = situational
      .replace(/^(?:tengo|me siento|estoy|i feel|i am|i'?m|i have)\s+[^,]+,?\s*/i, '')
      .replace(/^evit(?:o|ar|ando)\s+/i, '')
      .replace(/^avoid(?:ing)?\s+(?:to\s+)?/i, '');
    return clampField(cleanGoalFragment(stripped), EXPOSURE_PREFILL_MAX_GOAL);
  }

  return null;
}

/**
 * @param {string} userContent
 * @param {string} [language='es']
 * @returns {string[]|null}
 */
export function suggestExposureStepsFromMessage(userContent = '', language = 'es') {
  const goal = extractExposureGoalFromMessage(userContent);
  if (!goal) return null;
  return buildStepTemplates(goal, language)
    .map((step) => clampField(step, EXPOSURE_PREFILL_MAX_STEP))
    .filter(Boolean);
}

/**
 * @param {string} userContent
 * @param {string} [language='es']
 * @returns {{ prefillGoal?: string, prefillSteps?: string[] }|null}
 */
export function buildExposurePrefillParams(userContent = '', language = 'es') {
  if (!shouldBoostExposureSuggestion(userContent)) return null;

  const prefillGoal = extractExposureGoalFromMessage(userContent);
  const prefillSteps = suggestExposureStepsFromMessage(userContent, language);

  const params = {};
  if (prefillGoal) params.prefillGoal = prefillGoal;
  if (Array.isArray(prefillSteps) && prefillSteps.length >= 2) {
    params.prefillSteps = prefillSteps;
  }

  if (Object.keys(params).length === 0) return null;
  return params;
}

/**
 * @param {Array<object>} formatted
 * @param {string} userContent
 * @param {string} [language='es']
 */
export function enrichSuggestionsWithExposurePrefill(formatted = [], userContent = '', language = 'es') {
  if (!Array.isArray(formatted) || formatted.length === 0) return formatted;
  if (!formatted.some((s) => s?.id === 'exposure_hierarchy')) return formatted;

  const prefill = buildExposurePrefillParams(userContent, language);
  if (!prefill) return formatted;

  return formatted.map((suggestion) => {
    if (suggestion?.id !== 'exposure_hierarchy') return suggestion;
    return {
      ...suggestion,
      params: {
        ...(suggestion.params || {}),
        ...prefill,
        fromChat: true,
      },
    };
  });
}
