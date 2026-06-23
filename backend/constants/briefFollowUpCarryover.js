/**
 * Continuidad emocional en mensajes breves de seguimiento (insomnio, duelo, rumiación).
 */

export const BRIEF_FOLLOWUP_INTENSITY_MIN = 1;
export const BRIEF_FOLLOWUP_INTENSITY_MAX = 10;
export const BRIEF_FOLLOWUP_HIGH_INTENSITY_THRESHOLD = 8;
export const BRIEF_FOLLOWUP_MODERATE_INTENSITY_THRESHOLD = 6;
export const EXPLICIT_EMOTION_CARRYOVER_BLOCK_THRESHOLD = 6;

export const CARRYOVER_NEGATIVE_EMOTIONS = ['miedo', 'ansiedad', 'tristeza', 'enojo'];

export const SLEEP_THREAD_PATTERN =
  /(?:no\s+puedo\s+dormir|insomnio|duermo\s+mal|despierto|sueño|acostarme|conciliar)/i;

export const RELATIONSHIP_THREAD_PATTERN =
  /(?:\bex\b|relaci[oó]n|pareja|desamor|desamorar|ruptura|novi[oa]|separaci)/i;

export const RUMINATION_THREAD_PATTERN =
  /(?:mi\s+mente|la\s+cabeza|pensamientos?|rumiar|dar\s+vueltas|no\s+para)/i;

const FOLLOW_UP_CUE_PATTERN =
  /(?:pastillas?|medicaci[oó]n|medicinas?|dosis|lorazepam|citalopram|escitalopram|ansiol[ií]tico|benzodiazep|mi\s+mente|la\s+cabeza|pensamientos?|(?:^|\s)ex(?:\s|$)|relaci[oó]n|pareja|desamor|desamorar|dormir|sueño|noche)/i;

const DEICTIC_FOLLOW_UP_PATTERN = /^(?:eso|esto|esa|ese)\.?$/i;

const CLARIFICATION_FOLLOW_UP_PATTERN =
  /^(?:s[ií]\s*,?\s*qu[eé]|qu[eé]|y\s+eso|como\s+as[ií])\s*\??$/i;

/**
 * @param {object} pattern
 * @returns {{ mainEmotion: string, intensity: number, topic: string|null, content: string, timestamp: * }|null}
 */
export function normalizeHistoryPattern(pattern) {
  if (!pattern || typeof pattern !== 'object') return null;

  const mainEmotion = pattern.mainEmotion || pattern.emotion;
  if (!mainEmotion) return null;

  return {
    mainEmotion,
    intensity: Number(pattern.intensity ?? 5) || 5,
    topic: pattern.topic || null,
    content: typeof pattern.content === 'string' ? pattern.content : '',
    timestamp: pattern.timestamp,
  };
}

/**
 * @param {Array} patterns
 * @returns {number}
 */
export function getPeakNegativeIntensity(patterns) {
  return patterns.reduce((max, pattern) => {
    if (!CARRYOVER_NEGATIVE_EMOTIONS.includes(pattern.mainEmotion)) return max;
    return Math.max(max, pattern.intensity || 0);
  }, 0);
}

/**
 * @param {Array} patterns - cronológicos, más reciente al final
 * @returns {object|null}
 */
export function findCarryoverAnchor(patterns) {
  for (let i = patterns.length - 1; i >= 0; i -= 1) {
    const pattern = patterns[i];
    if (CARRYOVER_NEGATIVE_EMOTIONS.includes(pattern.mainEmotion)) {
      return pattern;
    }
  }
  return null;
}

/**
 * @param {Array} patterns
 * @param {string} currentContent
 * @returns {{ active: boolean, sleep: boolean, relationship: boolean, rumination: boolean }}
 */
export function detectSustainedThread(patterns, currentContent = '') {
  const topics = patterns.map((p) => p.topic).filter(Boolean);
  const textBlob = [currentContent, ...patterns.map((p) => p.content)].join(' ');

  const sleep = topics.includes('SALUD') || SLEEP_THREAD_PATTERN.test(textBlob);
  const relationship = topics.includes('RELACIONES') || RELATIONSHIP_THREAD_PATTERN.test(textBlob);
  const rumination = RUMINATION_THREAD_PATTERN.test(textBlob);

  return {
    sleep,
    relationship,
    rumination,
    active: sleep || relationship || rumination,
  };
}

/**
 * @param {string} content
 * @returns {boolean}
 */
export function hasBriefFollowUpCue(content) {
  if (!content || typeof content !== 'string') return false;
  return FOLLOW_UP_CUE_PATTERN.test(content);
}

/**
 * @param {string} content
 * @returns {boolean}
 */
export function isDeicticFollowUp(content) {
  if (!content || typeof content !== 'string') return false;
  return DEICTIC_FOLLOW_UP_PATTERN.test(content.trim());
}

/**
 * @param {object} currentEmotion
 * @param {number} currentIntensity
 * @param {string} emotionNeutral
 * @returns {boolean}
 */
export function shouldBlockCarryoverForExplicitEmotion(
  currentEmotion,
  currentIntensity,
  emotionNeutral
) {
  const emotionName = currentEmotion?.name;
  if (!emotionName || emotionName === emotionNeutral) return false;
  if (currentEmotion?.category === 'positive') return true;
  if (
    CARRYOVER_NEGATIVE_EMOTIONS.includes(emotionName) &&
    currentIntensity >= EXPLICIT_EMOTION_CARRYOVER_BLOCK_THRESHOLD
  ) {
    return true;
  }
  return false;
}

function clampCarriedIntensity(value) {
  return Math.min(
    BRIEF_FOLLOWUP_INTENSITY_MAX,
    Math.max(BRIEF_FOLLOWUP_INTENSITY_MIN, value)
  );
}

/**
 * @param {string} content
 * @returns {boolean}
 */
export function isClarificationFollowUp(content) {
  if (!content || typeof content !== 'string') return false;
  return CLARIFICATION_FOLLOW_UP_PATTERN.test(content.trim());
}

/**
 * @param {number} anchorIntensity
 * @param {'high'|'moderate'} tier
 * @returns {number}
 */
export function resolveCarriedIntensity(anchorIntensity, tier) {
  const peak = Number(anchorIntensity) || 0;
  const raw = tier === 'high' ? Math.max(peak - 1, 7) : Math.max(peak - 1, 5);
  return clampCarriedIntensity(raw);
}

/**
 * @param {string} content
 * @param {object} currentEmotion
 * @param {number} currentIntensity
 * @param {Array} recentPatterns
 * @param {{ emotionPatterns: object, emotionNeutral: string }} deps
 * @returns {{ emotion: object, intensity: number }|null}
 */
export function resolveBriefFollowUpCarryover(
  content,
  currentEmotion,
  currentIntensity,
  recentPatterns,
  { emotionPatterns, emotionNeutral }
) {
  const normalized = recentPatterns
    .map(normalizeHistoryPattern)
    .filter(Boolean);

  if (!normalized.length) return null;

  if (shouldBlockCarryoverForExplicitEmotion(currentEmotion, currentIntensity, emotionNeutral)) {
    return null;
  }

  const anchor = findCarryoverAnchor(normalized);
  if (!anchor) return null;

  const peakIntensity = getPeakNegativeIntensity(normalized);
  const thread = detectSustainedThread(normalized, content);
  const hasCue = hasBriefFollowUpCue(content);
  const hasHighTierCue = hasCue || isDeicticFollowUp(content);
  const isClarification = isClarificationFollowUp(content);
  const collapsedNow =
    currentEmotion?.name === emotionNeutral || currentIntensity <= 5;

  const wasHighNegative = peakIntensity >= BRIEF_FOLLOWUP_HIGH_INTENSITY_THRESHOLD;
  const wasModerateNegative =
    peakIntensity >= BRIEF_FOLLOWUP_MODERATE_INTENSITY_THRESHOLD;

  const shouldCarryHigh =
    wasHighNegative &&
    (collapsedNow || isClarification) &&
    (hasHighTierCue || isClarification);

  const shouldCarryModerate =
    wasModerateNegative &&
    collapsedNow &&
    hasCue &&
    (thread.active || isClarification);

  if (!shouldCarryHigh && !shouldCarryModerate) return null;

  const carriedEmotionData = emotionPatterns[anchor.mainEmotion];
  if (!carriedEmotionData) return null;

  const tier = shouldCarryHigh ? 'high' : 'moderate';

  return {
    emotion: {
      name: anchor.mainEmotion,
      category: carriedEmotionData.category,
      baseIntensity: carriedEmotionData.intensity,
    },
    intensity: resolveCarriedIntensity(anchor.intensity, tier),
  };
}
