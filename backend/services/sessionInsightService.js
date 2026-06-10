/**
 * Insight inmediato post-sesión de chat (sin LLM): emoción, patrón cognitivo y paso sugerido.
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import cognitiveDistortionDetector from './cognitiveDistortionDetector.js';
import {
  buildInsightCopy,
  buildSuggestedStepFromCatalog,
  getEmotionInsightMeta,
  localizeDistortion,
  localizeSessionIntention,
  localizeTopic,
  normalizeInsightLanguage,
} from '../utils/sessionInsightCopy.js';
import {
  generateSessionInsightHeadline,
  isSessionInsightHeadlineLlmEnabled,
} from './sessionInsightHeadlineService.js';

const MIN_USER_TURNS = 2;
const MIN_USER_CHARS = 40;
const MESSAGE_LIMIT = 80;
const SESSION_LOOKBACK_MINUTES = 45;

const EMOTION_WEIGHTS = {
  ansiedad: 0,
  tristeza: 0,
  enojo: 0,
  miedo: 0,
  culpa: 0,
  verguenza: 0,
  soledad: 0,
  alegria: 0,
  esperanza: 0,
  neutral: 0,
};

function countUserStats(msgs) {
  let turns = 0;
  let chars = 0;
  for (const m of msgs) {
    if (m.role !== 'user') continue;
    turns += 1;
    chars += String(m.content || '').trim().length;
  }
  return { userTurns: turns, userChars: chars };
}

function aggregateDominantEmotion(userMsgs) {
  const scores = { ...EMOTION_WEIGHTS };
  let totalIntensity = 0;
  let intensityCount = 0;

  userMsgs.forEach((msg, index) => {
    const emotion = String(msg?.metadata?.context?.emotional?.mainEmotion || 'neutral').toLowerCase();
    const intensity = Number(msg?.metadata?.context?.emotional?.intensity) || 5;
    const weight = 1 + index * 0.15;
    scores[emotion] = (scores[emotion] || 0) + weight;
    totalIntensity += intensity;
    intensityCount += 1;
  });

  const dominantEmotion =
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  const avgIntensity =
    intensityCount > 0 ? Math.round((totalIntensity / intensityCount) * 10) / 10 : 5;

  return { dominantEmotion, avgIntensity };
}

function collectThemes(userMsgs, language) {
  const counts = new Map();
  for (const msg of userMsgs) {
    const topic = String(msg?.metadata?.context?.emotional?.topic || 'general').toLowerCase();
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => localizeTopic(topic, language))
    .filter(Boolean);
}

function aggregateThoughtPattern(userMsgs, assistantMsgs, language) {
  const typeScores = new Map();

  const bump = (distortion) => {
    if (!distortion?.type) return;
    const prev = typeScores.get(distortion.type);
    if (!prev || (distortion.confidence || 0) >= (prev.confidence || 0)) {
      typeScores.set(distortion.type, distortion);
    }
  };

  for (const msg of assistantMsgs) {
    const contextual = msg?.metadata?.context?.contextual;
    if (contextual?.primaryDistortion) bump(contextual.primaryDistortion);
    if (Array.isArray(contextual?.cognitiveDistortions)) {
      contextual.cognitiveDistortions.forEach(bump);
    }
  }

  if (typeScores.size === 0) {
    const combinedUserText = userMsgs.map((m) => String(m.content || '')).join(' ').slice(0, 8000);
    const detected = cognitiveDistortionDetector.detectDistortions(combinedUserText);
    if (detected[0]) bump(detected[0]);
  }

  if (typeScores.size === 0) return null;

  const best = [...typeScores.values()].sort(
    (a, b) => (b.confidence || 0) - (a.confidence || 0),
  )[0];
  return localizeDistortion(best, language);
}

async function findSuggestedStep({ userId, conversationId, language, threadStartedAt = null }) {
  const lookback = new Date(Date.now() - SESSION_LOOKBACK_MINUTES * 60 * 1000);
  const threadStart =
    threadStartedAt instanceof Date && !Number.isNaN(threadStartedAt.getTime())
      ? threadStartedAt
      : null;
  const since =
    threadStart && threadStart > lookback ? threadStart : lookback;

  const lastShown = await ChatInterventionEvent.findOne({
    userId,
    conversationId,
    eventType: 'shown',
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .select('interventionId meta')
    .lean();

  const interventionId = lastShown?.interventionId;
  if (!interventionId) return null;

  const step = buildSuggestedStepFromCatalog(interventionId, language);
  if (!step) return null;

  const reason =
    normalizeInsightLanguage(language) === 'en'
      ? 'A concrete step that fits what you shared today.'
      : 'Un paso concreto que encaja con lo que compartiste hoy.';

  return { ...step, reason };
}

function estimateDurationMinutes(msgs) {
  if (!msgs.length) return 0;
  const first = new Date(msgs[0].createdAt).getTime();
  const last = new Date(msgs[msgs.length - 1].createdAt).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) return 0;
  return Math.max(1, Math.round((last - first) / (1000 * 60)));
}

/**
 * @param {object} params
 * @param {import('mongoose').Types.ObjectId|string} params.userId
 * @param {import('mongoose').Types.ObjectId|string} params.conversationId
 * @param {string} [params.language='es']
 */
export async function buildSessionInsight({ userId, conversationId, language = 'es' }) {
  const lang = normalizeInsightLanguage(language);
  const empty = { eligible: false, conversationId: String(conversationId) };

  if (!userId || !conversationId) return empty;

  const convOid = mongoose.Types.ObjectId.isValid(String(conversationId))
    ? new mongoose.Types.ObjectId(String(conversationId))
    : null;
  if (!convOid) return empty;

  const conversation = await Conversation.findOne({
    _id: convOid,
    userId: new mongoose.Types.ObjectId(String(userId)),
  })
    .select('sessionIntention')
    .lean();

  if (!conversation) return empty;

  const msgs = await Message.find({ conversationId: convOid })
    .sort({ createdAt: 1 })
    .limit(MESSAGE_LIMIT)
    .select('role content metadata createdAt')
    .lean();

  const userMsgs = msgs.filter((m) => m.role === 'user');
  const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
  const { userTurns, userChars } = countUserStats(msgs);

  if (userTurns < MIN_USER_TURNS && userChars < MIN_USER_CHARS) {
    return { ...empty, userTurns, userChars };
  }

  const { dominantEmotion, avgIntensity } = aggregateDominantEmotion(userMsgs);
  const emotionMeta = getEmotionInsightMeta(dominantEmotion, lang);
  const themes = collectThemes(userMsgs, lang);
  const thoughtPattern = aggregateThoughtPattern(userMsgs, assistantMsgs, lang);
  const threadStartedAt = msgs[0]?.createdAt ? new Date(msgs[0].createdAt) : null;
  const suggestedStep = await findSuggestedStep({
    userId,
    conversationId: convOid,
    language: lang,
    threadStartedAt,
  });
  const sessionIntentionLabel = localizeSessionIntention(
    conversation.sessionIntention,
    lang,
  );
  const copy = buildInsightCopy({
    language: lang,
    dominantEmotion,
    intensity: avgIntensity,
    themes,
    hasPattern: !!thoughtPattern,
    sessionIntention: sessionIntentionLabel,
  });

  let headline = copy.headline;
  let headlineSource = 'rules';
  if (isSessionInsightHeadlineLlmEnabled()) {
    const llmHeadline = await generateSessionInsightHeadline({
      userMsgs,
      allMsgs: msgs,
      language: lang,
      fallbackHeadline: copy.headline,
      dominantEmotion,
      thoughtPattern,
    }).catch(() => null);
    if (llmHeadline) {
      headline = llmHeadline;
      headlineSource = 'llm';
    }
  }

  return {
    eligible: true,
    conversationId: String(conversationId),
    userTurns,
    durationMinutes: estimateDurationMinutes(msgs),
    headline,
    headlineSource,
    reflection: copy.reflection,
    intentionLine: copy.intentionLine,
    dominantEmotion: {
      key: dominantEmotion,
      label: emotionMeta.label,
      emoji: emotionMeta.emoji,
      intensity: Math.round(avgIntensity),
    },
    thoughtPattern,
    themes,
    suggestedStep,
    sessionIntention: conversation.sessionIntention || null,
  };
}

export default { buildSessionInsight };
