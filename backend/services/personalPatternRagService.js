/**
 * RAG de patrones personales entre sesiones (#203).
 * Indexa fragmentos topicFree del usuario y recupera similitud semántica vía Atlas/scan.
 */
import mongoose from 'mongoose';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import { features } from '../config/features.js';
import { buildTopicFreeFromUserContent } from '../utils/interventionTopicFree.js';
import { sanitizeObservationalText, failsClinicalGuardrails } from '../utils/clinicalContentGuardrails.js';
import { isChatObservationalContextBlocked } from '../utils/chatObservationalContext.js';
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import {
  embedTopicFreeText,
  isTopicFreeEmbeddingsEnabled,
  getTopicFreeEmbeddingMinSimilarity,
} from './topicFreeEmbeddingService.js';
import { findSimilarMemoryIndexEvents } from './topicFreeVectorSearchService.js';
import { hasExperientialPatternsConsent } from './experientialPatternService.js';

export const MEMORY_INTERVENTION_ID = 'personal-pattern';
export const MEMORY_EVENT_TYPE = 'memory_index';
export const MEMORY_SOURCE = 'personal_pattern_rag_v1';

const LOOKBACK_DAYS = 90;
const MAX_USER_MEMORY_CHUNKS = 320;
const MIN_CONTENT_CHARS = 16;
const SNIPPET_MAX_MEMORIES = 2;

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return null;
}

export function isPersonalPatternRagEnabled() {
  if (!features.personalPatternRag) return false;
  return isTopicFreeEmbeddingsEnabled();
}

function daysAgoLabel(days, lang) {
  const n = Math.max(0, Number(days) || 0);
  if (lang === 'en') {
    if (n === 0) return 'today';
    if (n === 1) return '1 day ago';
    return `${n} days ago`;
  }
  if (n === 0) return 'hoy';
  if (n === 1) return 'hace 1 día';
  return `hace ${n} días`;
}

function isSensitiveForPersonalMemory(content) {
  const raw = String(content || '').trim();
  if (!raw) return true;
  if (hasExplicitSuicidalOrSelfHarmLexicon(raw)) return true;
  if (failsClinicalGuardrails(raw)) return true;
  return false;
}

async function pruneOldMemoryChunks(userId) {
  const uid = toObjectId(userId);
  if (!uid) return;
  const count = await ChatInterventionEvent.countDocuments({
    userId: uid,
    interventionId: MEMORY_INTERVENTION_ID,
    eventType: MEMORY_EVENT_TYPE,
  });
  if (count <= MAX_USER_MEMORY_CHUNKS) return;

  const excess = count - MAX_USER_MEMORY_CHUNKS;
  const oldest = await ChatInterventionEvent.find({
    userId: uid,
    interventionId: MEMORY_INTERVENTION_ID,
    eventType: MEMORY_EVENT_TYPE,
  })
    .sort({ createdAt: 1 })
    .select('_id')
    .limit(excess)
    .lean();

  const ids = oldest.map((d) => d._id).filter(Boolean);
  if (ids.length > 0) {
    await ChatInterventionEvent.deleteMany({ _id: { $in: ids } });
  }
}

/**
 * Indexa un mensaje del usuario para recuperación futura (best-effort).
 */
export async function indexPersonalPatternFromUserMessage({
  userId,
  conversationId,
  content,
  riskLevel = 'LOW',
  topicTag = 'general',
} = {}) {
  if (!isPersonalPatternRagEnabled()) return { indexed: false, reason: 'disabled' };
  if (!userId || !conversationId) return { indexed: false, reason: 'missing_ids' };
  if (!(await hasExperientialPatternsConsent(userId))) {
    return { indexed: false, reason: 'no_consent' };
  }
  if (isChatObservationalContextBlocked(riskLevel)) {
    return { indexed: false, reason: 'risk_blocked' };
  }
  if (isSensitiveForPersonalMemory(content)) {
    return { indexed: false, reason: 'sensitive_content' };
  }

  const topicFree = buildTopicFreeFromUserContent(content, { minLength: MIN_CONTENT_CHARS });
  if (!topicFree || failsClinicalGuardrails(topicFree)) {
    return { indexed: false, reason: 'invalid_snippet' };
  }

  const embedding = await embedTopicFreeText(topicFree).catch(() => null);
  if (!embedding?.length) return { indexed: false, reason: 'no_embedding' };

  const uid = toObjectId(userId);
  const convOid = toObjectId(conversationId);
  if (!uid || !convOid) return { indexed: false, reason: 'invalid_ids' };

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const duplicate = await ChatInterventionEvent.findOne({
    userId: uid,
    interventionId: MEMORY_INTERVENTION_ID,
    eventType: MEMORY_EVENT_TYPE,
    topicFree,
    createdAt: { $gte: since },
  })
    .select('_id')
    .lean();
  if (duplicate) return { indexed: false, reason: 'duplicate_recent' };

  await ChatInterventionEvent.create({
    userId: uid,
    conversationId: convOid,
    sessionId: `memory:${convOid.toString()}`,
    interventionId: MEMORY_INTERVENTION_ID,
    interventionType: 'memory',
    topicTag: String(topicTag || 'general').slice(0, 64),
    topicFree,
    topicFreeEmbedding: embedding,
    eventType: MEMORY_EVENT_TYPE,
    source: MEMORY_SOURCE,
    riskLevel: null,
    meta: { version: 1 },
  });

  await pruneOldMemoryChunks(uid).catch(() => {});
  return { indexed: true };
}

/**
 * Recupera memorias semánticamente similares (excluye conversación actual).
 */
export async function retrievePersonalPatternMemories({
  userId,
  userContent,
  conversationId,
  limit = SNIPPET_MAX_MEMORIES,
} = {}) {
  if (!isPersonalPatternRagEnabled() || !userId) return [];
  if (!(await hasExperientialPatternsConsent(userId))) return [];

  const snippet = buildTopicFreeFromUserContent(userContent, { minLength: MIN_CONTENT_CHARS });
  if (!snippet || isSensitiveForPersonalMemory(userContent)) return [];

  const queryVector = await embedTopicFreeText(snippet).catch(() => null);
  if (!queryVector?.length) return [];

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const hits = await findSimilarMemoryIndexEvents({
    userId,
    queryVector,
    since,
    limit: Math.max(limit, 6),
  });

  const minScore = getTopicFreeEmbeddingMinSimilarity();
  const excludeConv = conversationId ? String(conversationId) : null;

  return hits
    .filter((hit) => {
      if (!hit?.topicFree) return false;
      if (excludeConv && String(hit.conversationId) === excludeConv) return false;
      if (Number(hit.score) < minScore) return false;
      if (failsClinicalGuardrails(hit.topicFree)) return false;
      return true;
    })
    .slice(0, Math.max(1, Math.min(limit, SNIPPET_MAX_MEMORIES)));
}

export async function buildPersonalPatternRagSnippet({
  userId,
  userContent = '',
  conversationId = null,
  language = 'es',
  riskLevel = 'LOW',
} = {}) {
  if (!isPersonalPatternRagEnabled() || !userId) return null;
  if (!(await hasExperientialPatternsConsent(userId))) return null;
  if (isChatObservationalContextBlocked(riskLevel)) return null;

  const content = String(userContent || '').trim();
  if (content.length < MIN_CONTENT_CHARS || isSensitiveForPersonalMemory(content)) return null;

  const memories = await retrievePersonalPatternMemories({
    userId,
    userContent: content,
    conversationId,
    limit: SNIPPET_MAX_MEMORIES,
  });
  if (!memories.length) return null;

  const lang = normalizeApiLanguage(language);
  const header =
    lang === 'en'
      ? '\n\n### Observational continuity (personal patterns)\n'
      : '\n\n### Continuidad observacional (patrones personales)\n';

  const lines = memories.map((mem) => {
    const safeTopic = sanitizeObservationalText(mem.topicFree, 96);
    if (!safeTopic) return null;
    const days = Math.floor(
      (Date.now() - new Date(mem.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24),
    );
    const when = daysAgoLabel(days, lang);
    const whenLabel = lang === 'en' ? when : when.charAt(0).toUpperCase() + when.slice(1);
    return lang === 'en'
      ? `- Around ${whenLabel} a related theme appeared: «${safeTopic}». Offer natural continuity if it fits; never quote verbatim.`
      : `- ${whenLabel} apareció un tema relacionado: «${safeTopic}». Ofrece continuidad natural si encaja; nunca cites textualmente.`;
  }).filter(Boolean);

  if (!lines.length) return null;

  const footer =
    lang === 'en'
      ? 'Correlational memory only. No diagnosis. Prioritize the present message if the topic changed.'
      : 'Solo memoria correlacional. Sin diagnóstico. Prioriza el mensaje actual si el tema cambió.';

  return `${header}${lines.join('\n')}\n${footer}\n`;
}

export default {
  isPersonalPatternRagEnabled,
  indexPersonalPatternFromUserMessage,
  retrievePersonalPatternMemories,
  buildPersonalPatternRagSnippet,
  MEMORY_INTERVENTION_ID,
  MEMORY_EVENT_TYPE,
};
