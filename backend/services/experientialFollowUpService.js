/**
 * Follow-up evolutivo de patrones experienciales (#211).
 * Espejo de commitmentFollowUpService: snippet + asked-once + detección de respuesta.
 */
import mongoose from 'mongoose';
import ExperientialPattern from '../models/ExperientialPattern.js';
import {
  getDueExperientialPattern,
  isExperientialFollowUpEnabled,
  isExperientialPatternsEnabled,
  markExperientialFollowUpAsked,
  updateExperientialPattern,
} from './experientialPatternService.js';
import { isChatObservationalContextBlocked } from '../utils/chatObservationalContext.js';
import { isUserInPostCrisisCommitmentCooldown } from '../utils/commitmentPostCrisisGuard.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { sanitizeObservationalText } from '../utils/clinicalContentGuardrails.js';

/** Preguntar solo al inicio del hilo (primer turno del usuario). */
const MAX_USER_TURNS_FOR_ASK = 1;
/**
 * Chips en el mismo turno del plan (paridad producto #211).
 * Antes MIN=2 dejaba plan en turno 1 sin chips y markAsked colgaba el patrón.
 */
export const MIN_USER_TURNS_FOR_EXPERIENTIAL_CHIPS = 1;
const ANSWER_LOOKBACK_HOURS = 48;
const MAX_ANSWER_LEN_FOR_HEURISTIC = 80;

function countUserTurns(conversationHistory = []) {
  if (!Array.isArray(conversationHistory)) return 0;
  return conversationHistory.filter((m) => m?.role === 'user').length;
}

function truncateStatement(statement, max = 120) {
  return String(statement || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function daysAgoLabel(observedAt, language = 'es') {
  const when = observedAt ? new Date(observedAt) : null;
  if (!when || Number.isNaN(when.getTime())) {
    return language === 'en' ? 'a while ago' : 'hace un tiempo';
  }
  const days = Math.max(
    0,
    Math.floor((Date.now() - when.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (language === 'en') {
    if (days <= 3) return 'a few days ago';
    if (days <= 10) return 'about a week ago';
    if (days <= 24) return 'a couple of weeks ago';
    if (days <= 45) return 'about a month ago';
    return 'a while ago';
  }
  if (days <= 3) return 'hace unos días';
  if (days <= 10) return 'hace alrededor de una semana';
  if (days <= 24) return 'hace unas semanas';
  if (days <= 45) return 'hace alrededor de un mes';
  return 'hace un tiempo';
}

/**
 * Snippet de prompt ES/EN: contraste evolutivo, una pregunta, sin insistir.
 */
export function buildExperientialFollowUpPromptSnippet(
  statement,
  { language = 'es', observedAt = null } = {},
) {
  const safe = sanitizeObservationalText(truncateStatement(statement), 120);
  if (!safe) return null;
  const lang = normalizeApiLanguage(language);
  const when = daysAgoLabel(observedAt, lang);
  if (lang === 'en') {
    return (
      '\n\n### Experiential continuity (process memory)\n' +
      `${when.charAt(0).toUpperCase() + when.slice(1)} the person mentioned that: "${safe}". ` +
      'If their current message is not urgent or high distress, after attending to what they bring, ' +
      'gently check whether that still feels true (e.g. "A couple of weeks ago you said mornings were the hardest — do you feel that has changed a bit?"). ' +
      'One soft question only. Do not quote long verbatim text. Do not diagnose. ' +
      'If they bring urgency, crisis, or a heavier topic, skip this entirely this turn.\n'
    );
  }
  return (
    '\n\n### Continuidad experiencial (memoria del proceso)\n' +
    `${when.charAt(0).toUpperCase() + when.slice(1)} la persona mencionó que: "${safe}". ` +
    'Si su mensaje actual no trae urgencia ni malestar alto, después de atender lo que trae, ' +
    'retoma con curiosidad si eso ha cambiado un poco (por ejemplo: "Hace unas semanas me dijiste que las mañanas eran las más difíciles. ¿Sientes que eso ha cambiado un poco?"). ' +
    'Solo una pregunta suave. No cites textualmente en largo. No diagnostiques. ' +
    'Si trae urgencia, crisis o un tema más pesado, omítelo por completo este turno.\n'
  );
}

export function shouldShowExperientialFollowUpChips({
  conversationHistory = [],
  forceFollowUp = false,
} = {}) {
  if (forceFollowUp) return true;
  return countUserTurns(conversationHistory) >= MIN_USER_TURNS_FOR_EXPERIENTIAL_CHIPS;
}

/**
 * Clasifica respuesta corta → changed | unchanged | skipped | null
 */
export function classifyExperientialFollowUpAnswerFromText(text) {
  const raw = String(text || '').trim().toLowerCase();
  if (!raw || raw.length > MAX_ANSWER_LEN_FOR_HEURISTIC) return null;
  const t = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hasAny = (patterns) => patterns.some((p) => new RegExp(p).test(t));

  const skipped = [
    'omitir', 'omite', 'no quiero hablar', 'deja eso', 'otra cosa',
    'skip', 'not now', "don't want", 'change topic',
  ];
  // Sin `\bsi\b` / `\byes\b` sueltos: evitan falsos positivos en cualquier “sí”.
  const changed = [
    'ha cambiado', 'ha mejorado', 'mejoro', 'un poco mejor', 'ya no tanto',
    'si un poco', 'algo mejor', 'un poco si',
    'has changed', 'a bit better', 'yes a bit', 'somewhat better', 'improved a bit',
  ];
  const unchanged = [
    'sigue igual', 'lo mismo', 'no ha cambiado', 'mas o menos igual', 'igual que antes',
    'still the same', 'about the same', 'no change', 'hasn.?t changed', 'still hard',
  ];

  if (hasAny(skipped)) return 'skipped';
  if (hasAny(unchanged)) return 'unchanged';
  if (hasAny(changed)) return 'changed';
  return null;
}

/**
 * Plan de follow-up. No corre si hay crisis o si el caller indica commitment due
 * (prioridad #202 se aplica en chatTurnEnhancements).
 */
export async function buildExperientialFollowUpPlan({
  userId,
  conversationHistory = [],
  riskLevel = 'LOW',
  language = 'es',
  forceFollowUp = false,
  skipBecauseCommitmentDue = false,
} = {}) {
  if (!userId) return null;
  if (!isExperientialPatternsEnabled() || !isExperientialFollowUpEnabled()) return null;
  if (skipBecauseCommitmentDue) return null;
  if (isChatObservationalContextBlocked(riskLevel)) return null;
  if (await isUserInPostCrisisCommitmentCooldown(userId)) return null;
  if (!forceFollowUp && countUserTurns(conversationHistory) > MAX_USER_TURNS_FOR_ASK) {
    return null;
  }

  const due = await getDueExperientialPattern(userId);
  if (!due) return null;

  const promptSnippet = buildExperientialFollowUpPromptSnippet(due.statement, {
    language,
    observedAt: due.observedAt,
  });
  if (!promptSnippet) return null;

  return {
    patternId: due.id,
    statement: truncateStatement(due.statement),
    statementPreview: truncateStatement(due.statement, 80),
    observedAt: due.observedAt,
    promptSnippet,
  };
}

export async function markExperientialPatternFollowUpAsked(patternId) {
  return markExperientialFollowUpAsked(patternId);
}

export async function detectExperientialFollowUpAnswer({ userId, userContent } = {}) {
  if (!userId) return null;
  const answer = classifyExperientialFollowUpAnswerFromText(userContent);
  if (!answer) return null;

  const uid = new mongoose.Types.ObjectId(String(userId));
  const since = new Date(Date.now() - ANSWER_LOOKBACK_HOURS * 60 * 60 * 1000);
  const pending = await ExperientialPattern.findOne({
    userId: uid,
    isActive: true,
    followUpStatus: 'pending',
    followUpAskedAt: { $ne: null, $gte: since },
  })
    .sort({ followUpAskedAt: -1 })
    .lean();

  if (!pending) return null;

  const result = await updateExperientialPattern(userId, String(pending._id), {
    followUpStatus: answer,
  });
  if (result?.error) return null;
  return { patternId: String(pending._id), followUpStatus: answer };
}

export default {
  buildExperientialFollowUpPromptSnippet,
  buildExperientialFollowUpPlan,
  markExperientialPatternFollowUpAsked,
  detectExperientialFollowUpAnswer,
  classifyExperientialFollowUpAnswerFromText,
  shouldShowExperientialFollowUpChips,
  MIN_USER_TURNS_FOR_EXPERIENTIAL_CHIPS,
};
