/**
 * Recall temático de patrones experienciales entre conversaciones (promesa B).
 * Inyecta contexto cuando el mensaje solapa con un patrón activo o pregunta por un recuerdo.
 */
import {
  hasExperientialPatternsConsent,
  isExperientialPatternsEnabled,
  listExperientialPatterns,
  normalizeStatementKey,
} from './experientialPatternService.js';
import { isChatObservationalContextBlocked } from '../utils/chatObservationalContext.js';
import { isUserInPostCrisisCommitmentCooldown } from '../utils/commitmentPostCrisisGuard.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { sanitizeObservationalText } from '../utils/clinicalContentGuardrails.js';

const MAX_PATTERNS = 2;
const MIN_TOKEN_LEN = 4;
/** Overlap mínimo (tokens compartidos / tokens del patrón) para inyección temática. */
const OVERLAP_RATIO_THRESHOLD = 0.15;
const MIN_SHARED_TOKENS = 1;

const STOPWORDS = new Set([
  'algo', 'alguna', 'alguno', 'ante', 'antes', 'aqui', 'como', 'con', 'contra', 'cual',
  'cuando', 'de', 'del', 'desde', 'donde', 'el', 'ella', 'ellos', 'en', 'entre', 'era',
  'es', 'esa', 'ese', 'eso', 'esta', 'este', 'esto', 'ha', 'han', 'has', 'he', 'la',
  'las', 'le', 'les', 'lo', 'los', 'mas', 'me', 'mi', 'mis', 'muy', 'no', 'nos', 'o',
  'para', 'pero', 'por', 'que', 'se', 'si', 'sin', 'sobre', 'su', 'sus', 'te', 'ti',
  'tu', 'un', 'una', 'uno', 'y', 'ya', 'yo',
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'do', 'for', 'from',
  'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my',
  'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'to', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
  'who', 'will', 'with', 'you', 'your',
]);

const CATEGORY_BOOST_TOKENS = {
  time_of_day: [
    'manana', 'mananas', 'morning', 'mornings', 'noche', 'noches', 'evening', 'evenings',
    'despertar', 'despertarse', 'wake', 'waking', 'dormir', 'sleep', 'almorzar', 'tarde',
  ],
  emotion: [
    'animo', 'animos', 'mood', 'triste', 'tristeza', 'ansiedad', 'anxiety', 'enojo',
    'ira', 'miedo', 'fear', 'culpa', 'guilt', 'pesado', 'heavy',
  ],
  relationship: [
    'pareja', 'familia', 'amigo', 'amigos', 'limites', 'boundaries', 'relacion',
    'relationship', 'madre', 'padre', 'hijos',
  ],
  coping: [
    'respirar', 'respiracion', 'breathing', 'afrontar', 'coping', 'pasear', 'caminar',
    'escribir', 'journaling', 'meditar',
  ],
};

const RECALL_INTENT_RE =
  /\b(recuerdas?|recordas?|acordas?|acordarte|te\s+conte|te\s+habia\s+contado|te\s+habia\s+dicho|lo\s+que\s+te\s+(conte|dije)|do\s+you\s+remember|remember\s+(anything|something|what)|did\s+i\s+tell\s+you|have\s+i\s+told\s+you)\b/i;

function tokenizeNormalized(text) {
  const key = normalizeStatementKey(text);
  if (!key) return [];
  return key
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= MIN_TOKEN_LEN && !STOPWORDS.has(t));
}

/** Coincide token exacto o prefijo (mañana ↔ mañanas). */
function tokensOverlap(a, b) {
  if (a === b) return true;
  if (a.length >= MIN_TOKEN_LEN && b.length >= MIN_TOKEN_LEN) {
    if (a.startsWith(b) || b.startsWith(a)) return true;
  }
  return false;
}

function countSharedTokens(userTokens, patternTokens) {
  let shared = 0;
  for (const pt of patternTokens) {
    for (const ut of userTokens) {
      if (tokensOverlap(pt, ut)) {
        shared += 1;
        break;
      }
    }
  }
  return shared;
}

function truncateStatement(statement, max = 120) {
  return String(statement || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

/**
 * Detecta si el usuario pregunta explícitamente por un recuerdo.
 */
export function isExperientialRecallIntent(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return RECALL_INTENT_RE.test(normalized);
}

/**
 * Puntúa solapamiento temático entre mensaje y patrón (0–1+ con boosts).
 */
export function scorePatternOverlap(userContent, pattern) {
  const userTokens = tokenizeNormalized(userContent);
  if (userTokens.length === 0) return { score: 0, shared: 0, userTokenCount: 0 };

  const userSet = new Set(userTokens);
  const statementTokens = tokenizeNormalized(pattern?.statement || '');
  let shared = countSharedTokens(userSet, statementTokens);

  const denom = Math.max(statementTokens.length, 1);
  let score = shared / denom;

  const category = pattern?.category && CATEGORY_BOOST_TOKENS[pattern.category]
    ? pattern.category
    : null;
  if (category) {
    const boostTokens = CATEGORY_BOOST_TOKENS[category];
    const categoryHits = boostTokens.filter((t) =>
      [...userSet].some((ut) => tokensOverlap(t, ut)),
    ).length;
    if (categoryHits > 0) {
      score += 0.18 * Math.min(categoryHits, 2);
      shared += categoryHits;
    }
  }

  return { score, shared, userTokenCount: userSet.size };
}

/**
 * Selecciona hasta `limit` patrones activos para recall.
 */
export function selectPatternsForRecall({
  userContent,
  patterns = [],
  limit = MAX_PATTERNS,
} = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || MAX_PATTERNS, MAX_PATTERNS));
  const list = Array.isArray(patterns) ? patterns.filter((p) => p?.statement) : [];
  if (list.length === 0) return [];

  const recallIntent = isExperientialRecallIntent(userContent);
  const scored = list.map((p) => {
    const { score, shared } = scorePatternOverlap(userContent, p);
    return { pattern: p, score, shared };
  });

  if (recallIntent) {
    const withOverlap = scored
      .filter((s) => s.shared >= MIN_SHARED_TOKENS || s.score >= OVERLAP_RATIO_THRESHOLD)
      .sort((a, b) => b.score - a.score || new Date(b.pattern.observedAt || 0) - new Date(a.pattern.observedAt || 0));
    if (withOverlap.length > 0) {
      return withOverlap.slice(0, safeLimit).map((s) => s.pattern);
    }
    // Intent sin overlap claro: top recientes (el usuario pregunta por memoria).
    return [...list]
      .sort((a, b) => new Date(b.observedAt || 0) - new Date(a.observedAt || 0))
      .slice(0, safeLimit);
  }

  return scored
    .filter(
      (s) =>
        s.shared >= MIN_SHARED_TOKENS &&
        (s.score >= OVERLAP_RATIO_THRESHOLD || s.shared >= 2),
    )
    .sort((a, b) => b.score - a.score || new Date(b.pattern.observedAt || 0) - new Date(a.pattern.observedAt || 0))
    .slice(0, safeLimit)
    .map((s) => s.pattern);
}

/**
 * Snippet de prompt ES/EN para anclar memoria del proceso sin follow-up proactivo.
 */
export function buildExperientialRecallPromptSnippet(patterns, { language = 'es' } = {}) {
  const list = Array.isArray(patterns) ? patterns : [];
  const safeStatements = [];
  for (const p of list) {
    const safe = sanitizeObservationalText(truncateStatement(p?.statement), 120);
    if (safe) safeStatements.push(safe);
  }
  if (safeStatements.length === 0) return null;

  const lang = normalizeApiLanguage(language);
  const bullets = safeStatements.map((s) => `- "${s}"`).join('\n');

  if (lang === 'en') {
    return (
      '\n\n### Process memory (active patterns — cross-session)\n' +
      'The person previously shared (with consent to process memory):\n' +
      `${bullets}\n` +
      'If their current message asks whether you remember, or clearly touches one of these themes, ' +
      'you may gently anchor to that prior observation (e.g. soft continuity, one short check). ' +
      'Do not invent details beyond these lines. Do not diagnose. Do not force a follow-up if they bring urgency or a heavier topic.\n'
    );
  }

  return (
    '\n\n### Memoria del proceso (patrones activos — entre conversaciones)\n' +
    'La persona compartió antes (con consentimiento de memoria del proceso):\n' +
    `${bullets}\n` +
    'Si pregunta si recuerdas algo, o su mensaje toca claramente uno de estos temas, ' +
    'puedes anclar con suavidad esa observación previa (continuidad breve, una pregunta corta si encaja). ' +
    'No inventes detalles fuera de estas líneas. No diagnostiques. Si trae urgencia o un tema más pesado, no fuerces el recuerdo.\n'
  );
}

/**
 * Plan de recall temático. Sin chips; solo snippet de prompt.
 */
export async function buildExperientialRecallPlan({
  userId,
  userContent = '',
  riskLevel = 'LOW',
  language = 'es',
  skipBecauseCommitmentDue = false,
  skipBecauseFollowUpDue = false,
} = {}) {
  if (!userId) return null;
  if (!isExperientialPatternsEnabled()) return null;
  if (skipBecauseCommitmentDue || skipBecauseFollowUpDue) return null;
  if (isChatObservationalContextBlocked(riskLevel)) return null;
  if (await isUserInPostCrisisCommitmentCooldown(userId)) return null;
  if (!(await hasExperientialPatternsConsent(userId))) return null;

  const content = String(userContent || '').trim();
  if (!content) return null;

  const patterns = await listExperientialPatterns(userId, { activeOnly: true, limit: 20 });
  if (!patterns.length) return null;

  const selected = selectPatternsForRecall({
    userContent: content,
    patterns,
    limit: MAX_PATTERNS,
  });
  if (!selected.length) return null;

  const promptSnippet = buildExperientialRecallPromptSnippet(selected, { language });
  if (!promptSnippet) return null;

  return {
    patterns: selected.map((p) => ({
      id: p.id,
      statement: truncateStatement(p.statement),
      category: p.category || null,
      observedAt: p.observedAt || null,
    })),
    promptSnippet,
  };
}

export default {
  isExperientialRecallIntent,
  scorePatternOverlap,
  selectPatternsForRecall,
  buildExperientialRecallPromptSnippet,
  buildExperientialRecallPlan,
};
