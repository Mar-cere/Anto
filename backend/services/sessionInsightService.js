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
  buildCrisisSessionInsightCopy,
  buildCrisisRecoverySessionInsightCopy,
  buildSuggestedStepFromCatalog,
  getEmotionInsightMeta,
  localizeDistortion,
  localizeSessionIntention,
  localizeTopic,
  normalizeInsightLanguage,
} from '../utils/sessionInsightCopy.js';
import {
  collectRiskLevelsFromMessages,
  maxRiskTierFromLevels,
} from './lastSessionSummaryService.js';
import {
  generateSessionInsightHeadline,
  isSessionInsightHeadlineLlmEnabled,
} from './sessionInsightHeadlineService.js';
import { inferChatSessionPhase } from './chat/sessionPhaseHints.js';
import topicDetector from './topicDetector.js';
import {
  isGenericInterventionCatalogLabel,
  SHORT_SOFT_RESUME_LABEL_EN,
  SHORT_SOFT_RESUME_LABEL_ES,
} from '../utils/commitmentLabelUtils.js';

const MIN_USER_TURNS = 2;
const MIN_USER_CHARS = 40;
const MESSAGE_LIMIT = 80;
const SESSION_LOOKBACK_MINUTES = 45;
const MAX_SESSION_DURATION_MINUTES = 180;
const MAX_SUGGESTED_COMMITMENTS = 2;

/** Textos concretos por intervención para cierre de sesión (v1.1 / #234). */
const COMMITMENT_HINT_BY_INTERVENTION = {
  breathing_exercise: {
    es: 'Probar una pausa breve de respiración cuando notes tensión',
    en: 'Try a short breathing pause when you notice tension',
  },
  grounding_technique: {
    es: 'Usar grounding una vez cuando todo se sienta demasiado',
    en: 'Use grounding once when things feel too much',
  },
  behavioral_activation: {
    es: 'Hacer un paso pequeño que dé un poco de energía',
    en: 'Do one small step that gives a little energy',
  },
  mindfulness_reminder: {
    es: 'Parar un minuto a notar el cuerpo sin juzgar',
    en: 'Pause one minute to notice your body without judging',
  },
  self_compassion: {
    es: 'Decirte una frase amable cuando aparezca la autocrítica',
    en: 'Tell yourself one kind line when self-criticism shows up',
  },
};

/**
 * Hasta 2 sugerencias de texto para guardar como compromiso (#234).
 * @param {{ suggestedStep?: object|null, themes?: string[], language?: string }} p
 * @returns {string[]}
 */
export function buildSuggestedCommitments({ suggestedStep = null, themes = [], language = 'es' } = {}) {
  const en = normalizeInsightLanguage(language) === 'en';
  const out = [];
  const stepId = suggestedStep?.id ? String(suggestedStep.id) : '';
  const hint = COMMITMENT_HINT_BY_INTERVENTION[stepId];
  if (hint) {
    out.push(en ? hint.en : hint.es);
  } else if (suggestedStep?.label && !isGenericInterventionCatalogLabel(suggestedStep.label)) {
    out.push(String(suggestedStep.label).trim().slice(0, 240));
  } else if (suggestedStep) {
    out.push(en ? SHORT_SOFT_RESUME_LABEL_EN : SHORT_SOFT_RESUME_LABEL_ES);
  }

  const theme = Array.isArray(themes) ? String(themes[0] || '').trim() : '';
  if (theme && out.length < MAX_SUGGESTED_COMMITMENTS) {
    const second = en
      ? `Come back to “${theme}” when you want`
      : `Volver a lo de «${theme}» cuando te venga bien`;
    if (second.length >= 2 && second.length <= 240 && !out.includes(second)) {
      out.push(second);
    }
  }

  return out.slice(0, MAX_SUGGESTED_COMMITMENTS);
}

function messageTimestampMs(msg) {
  const t = new Date(msg?.createdAt).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * Índice del primer mensaje de la sesión activa (gap ≥ SESSION_LOOKBACK_MINUTES).
 */
export function findActiveSessionStartIndex(msgs, gapMinutes = SESSION_LOOKBACK_MINUTES) {
  if (!Array.isArray(msgs) || msgs.length <= 1) return 0;
  const gapMs = Math.max(1, gapMinutes) * 60 * 1000;

  for (let i = msgs.length - 1; i > 0; i -= 1) {
    const current = messageTimestampMs(msgs[i]);
    const previous = messageTimestampMs(msgs[i - 1]);
    if (!Number.isFinite(current) || !Number.isFinite(previous)) continue;
    if (current - previous >= gapMs) return i;
  }
  return 0;
}

export function sliceActiveSessionMessages(msgs, gapMinutes = SESSION_LOOKBACK_MINUTES) {
  if (!Array.isArray(msgs) || msgs.length === 0) return [];
  const start = findActiveSessionStartIndex(msgs, gapMinutes);
  return msgs.slice(start);
}

function estimateDurationMinutes(msgs) {
  if (!Array.isArray(msgs) || msgs.length < 2) return 0;
  const first = messageTimestampMs(msgs[0]);
  const last = messageTimestampMs(msgs[msgs.length - 1]);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) return 0;
  const minutes = Math.round((last - first) / (1000 * 60));
  if (minutes <= 0) return 0;
  return Math.min(minutes, MAX_SESSION_DURATION_MINUTES);
}

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

/** Pánico verbalizado (sin riskLevel de protocolo) no debe quedar como «Calma mixta». */
const PANIC_LEXICON =
  /\b(?:crisis\s+de\s+p[aá]nico|ataque\s+de\s+p[aá]nico|ataque\s+de\s+ansiedad|\bp[aá]nico\b|panic\s+attack)\b/i;

/** Carga de malestar (estrés / sueño / agotamiento) aunque el metadata diga neutral. */
const DISTRESS_LOAD_LEXICON =
  /\b(?:estr[eé]s|agobia|angusti|ansios|preocup|agotad|cansancio|insomnio|no\s+(?:puedo|lograr|consigo)\s+dormir|me\s+cuesta\s+dormir|dormir\s+mal|falta\s+de\s+(?:sue[nñ]o|descanso|rutina)|cabeza\s+no\s+se\s+apaga|no\s+descanso)\b/i;

function isPanicUserContent(content) {
  return PANIC_LEXICON.test(String(content || ''));
}

function isDistressUserContent(content) {
  const text = String(content || '');
  return PANIC_LEXICON.test(text) || DISTRESS_LOAD_LEXICON.test(text);
}

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

function resolveCrisisRiskForUserTurn(msgs, index) {
  const m = msgs[index];
  if (!m || m.role !== 'user') return '';

  const fromUser = String(m?.metadata?.crisis?.riskLevel || '').toUpperCase();
  if (fromUser && fromUser !== 'LOW') return fromUser;

  const next = msgs[index + 1];
  if (next?.role === 'assistant') {
    const fromAssistant = String(next?.metadata?.crisis?.riskLevel || '').toUpperCase();
    if (fromAssistant && fromAssistant !== 'LOW') return fromAssistant;
    const fromContext = String(next?.metadata?.context?.crisis?.riskLevel || '').toUpperCase();
    if (fromContext && fromContext !== 'LOW') return fromContext;
  }
  return fromUser || '';
}

function resolveEmotionalForMessage(msgs, index) {
  const m = msgs[index];
  if (!m) return null;

  let emotional = m?.metadata?.context?.emotional;
  if (m.role === 'user') {
    if (!emotional?.mainEmotion) {
      const next = msgs[index + 1];
      if (next?.role === 'assistant') {
        emotional = next?.metadata?.context?.emotional;
      }
    }
    if (isPanicUserContent(m.content)) {
      const baseIntensity = Number(emotional?.intensity) || 5;
      return {
        ...(emotional || {}),
        mainEmotion:
          emotional?.mainEmotion && emotional.mainEmotion !== 'neutral'
            ? emotional.mainEmotion
            : 'ansiedad',
        intensity: Math.max(baseIntensity, 8),
        topic: emotional?.topic || topicDetector.detectTopic(m.content) || 'salud',
      };
    }
    if (isDistressUserContent(m.content)) {
      const baseIntensity = Number(emotional?.intensity) || 5;
      return {
        ...(emotional || {}),
        mainEmotion:
          emotional?.mainEmotion && emotional.mainEmotion !== 'neutral'
            ? emotional.mainEmotion
            : 'ansiedad',
        intensity: Math.max(baseIntensity, 6),
        topic: emotional?.topic || topicDetector.detectTopic(m.content) || 'salud',
      };
    }
    const risk = resolveCrisisRiskForUserTurn(msgs, index);
    if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'WARNING') {
      const baseIntensity = Number(emotional?.intensity) || 5;
      const floor = risk === 'HIGH' ? 8 : risk === 'MEDIUM' ? 7 : 6;
      return {
        ...(emotional || {}),
        mainEmotion: emotional?.mainEmotion && emotional.mainEmotion !== 'neutral'
          ? emotional.mainEmotion
          : risk === 'HIGH' ? 'miedo' : 'tristeza',
        intensity: Math.max(baseIntensity, floor),
        topic: emotional?.topic || 'salud',
      };
    }
  }
  return emotional;
}

function aggregateDominantEmotion(msgs) {
  const userMsgs = msgs.filter((m) => m.role === 'user');
  const scores = { ...EMOTION_WEIGHTS };
  let weightedIntensity = 0;
  let weightSum = 0;
  let peakIntensity = 0;
  let peakEmotion = 'neutral';
  let sawPanicLexicon = false;
  let sawDistressLexicon = false;

  msgs.forEach((msg, index) => {
    if (msg.role !== 'user') return;
    if (isPanicUserContent(msg.content)) sawPanicLexicon = true;
    if (isDistressUserContent(msg.content)) sawDistressLexicon = true;
    const emotional = resolveEmotionalForMessage(msgs, index);
    const emotion = String(emotional?.mainEmotion || 'neutral').toLowerCase();
    const intensity = Number(emotional?.intensity) || 5;
    const userIndex = userMsgs.indexOf(msg);
    const recencyBoost = userIndex >= userMsgs.length - 3 ? 1.8 : 1;
    const weight = (1 + userIndex * 0.2) * recencyBoost;
    scores[emotion] = (scores[emotion] || 0) + weight;
    weightedIntensity += intensity * weight;
    weightSum += weight;
    if (intensity > peakIntensity || (intensity === peakIntensity && emotion !== 'neutral')) {
      peakIntensity = intensity;
      if (emotion !== 'neutral') peakEmotion = emotion;
    }
  });

  let dominantEmotion =
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Tras pánico / carga de malestar / pico alto, no dejar «Calma mixta»
  if (
    (sawPanicLexicon || sawDistressLexicon || peakIntensity >= 6) &&
    (dominantEmotion === 'neutral' || dominantEmotion === 'alegria')
  ) {
    dominantEmotion = peakEmotion !== 'neutral' ? peakEmotion : 'ansiedad';
  }

  const weightedAvg = weightSum > 0 ? weightedIntensity / weightSum : 5;
  // No diluir picos (p. ej. crisis de pánico) con turnos posteriores más calmados
  const avgIntensity =
    Math.round(Math.max(weightedAvg, peakIntensity * 0.7 + weightedAvg * 0.3) * 10) / 10;

  return { dominantEmotion, avgIntensity };
}

function resolveSessionThemeTopic(content, metadataTopic) {
  const detected = topicDetector.detectTopic(content);
  const meta = String(metadataTopic || '').toLowerCase();
  if (detected && detected !== 'general') return detected;
  // «soledad» en metadata suele venir del keyword «solo»; no lo uses sin señal clara
  if (meta === 'soledad' && !/\b(?:me\s+siento\s+sol[oa]|soledad|aislad)/i.test(String(content || ''))) {
    return 'general';
  }
  return meta || 'general';
}

function collectThemes(msgs, language) {
  const counts = new Map();
  for (let i = 0; i < msgs.length; i += 1) {
    const msg = msgs[i];
    if (msg.role !== 'user') continue;
    const emotional = resolveEmotionalForMessage(msgs, i);
    const topic = resolveSessionThemeTopic(msg.content, emotional?.topic);
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => localizeTopic(topic, language))
    .filter(Boolean);
}

function isElevatedCrisisTier(riskTier) {
  const t = String(riskTier || 'low').toLowerCase();
  return t === 'high' || t === 'medium' || t === 'warning';
}

function resolveInsightTerminalRiskLevel(msgs) {
  const lastUserIdx = msgs.map((m, i) => (m.role === 'user' ? i : -1)).filter((i) => i >= 0).pop();
  if (lastUserIdx == null) return 'LOW';
  const fromTurn = resolveCrisisRiskForUserTurn(msgs, lastUserIdx);
  if (fromTurn && fromTurn !== 'LOW') return fromTurn.toUpperCase();
  return 'LOW';
}

function inferInsightSessionPhase(msgs) {
  const userMsgs = msgs.filter((m) => m.role === 'user');
  const lastUser = userMsgs[userMsgs.length - 1];
  const historyNewestFirst = [...msgs]
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  return inferChatSessionPhase({
    riskLevel: resolveInsightTerminalRiskLevel(msgs),
    userContent: lastUser?.content || '',
    conversationHistoryNewestFirst: historyNewestFirst,
  });
}

function aggregateThoughtPatternRecent(userMsgs, assistantMsgs, language, maxUserMsgs = 4) {
  return aggregateThoughtPattern(
    userMsgs.slice(-maxUserMsgs),
    assistantMsgs.slice(-maxUserMsgs),
    language,
  );
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
  // Evita mostrar distorsiones de baja confianza (falsos positivos tipo «qué si»)
  if ((best.confidence || 0) < 0.45) return null;
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

  const allMsgs = await Message.find({ conversationId: convOid })
    .sort({ createdAt: 1 })
    .limit(MESSAGE_LIMIT)
    .select('role content metadata createdAt')
    .lean();

  const msgs = sliceActiveSessionMessages(allMsgs);
  const userMsgs = msgs.filter((m) => m.role === 'user');
  const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
  const { userTurns, userChars } = countUserStats(msgs);

  if (userTurns < MIN_USER_TURNS && userChars < MIN_USER_CHARS) {
    return { ...empty, userTurns, userChars };
  }

  const { dominantEmotion, avgIntensity } = aggregateDominantEmotion(msgs);
  const peakRiskTier = maxRiskTierFromLevels(collectRiskLevelsFromMessages(msgs));
  const hadCrisisInSession = isElevatedCrisisTier(peakRiskTier);
  const sessionPhase = inferInsightSessionPhase(msgs);
  const crisisRecovered = hadCrisisInSession && sessionPhase === 'settled';
  const crisisSession = hadCrisisInSession && !crisisRecovered;
  const emotionMeta = getEmotionInsightMeta(dominantEmotion, lang);
  let themes = collectThemes(msgs, lang);
  if (crisisSession && !themes.some((t) => /seguridad|safety/i.test(t))) {
    themes = [localizeTopic('salud', lang), ...themes].slice(0, 3);
  }
  const thoughtPattern = crisisSession
    ? null
    : crisisRecovered
      ? aggregateThoughtPatternRecent(userMsgs, assistantMsgs, lang)
      : aggregateThoughtPattern(userMsgs, assistantMsgs, lang);
  const threadStartedAt = msgs[0]?.createdAt ? new Date(msgs[0].createdAt) : null;
  const suggestedStep = crisisSession
    ? null
    : await findSuggestedStep({
        userId,
        conversationId: convOid,
        language: lang,
        threadStartedAt,
      });
  const suggestedCommitments = crisisSession
    ? []
    : buildSuggestedCommitments({
        suggestedStep,
        themes,
        language: lang,
      });
  const sessionIntentionLabel = localizeSessionIntention(
    conversation.sessionIntention,
    lang,
  );
  const copy = crisisRecovered
    ? buildCrisisRecoverySessionInsightCopy({
        language: lang,
        peakRiskTier,
        intensity: avgIntensity,
        sessionIntention: sessionIntentionLabel,
      })
    : crisisSession
      ? buildCrisisSessionInsightCopy({
          language: lang,
          riskTier: peakRiskTier,
          intensity: avgIntensity,
          sessionIntention: sessionIntentionLabel,
        })
      : buildInsightCopy({
          language: lang,
          dominantEmotion,
          intensity: avgIntensity,
          themes,
          hasPattern: !!thoughtPattern,
          sessionIntention: sessionIntentionLabel,
        });

  let headline = copy.headline;
  let headlineSource = crisisRecovered
    ? 'crisis_recovered_rules'
    : crisisSession
      ? 'crisis_rules'
      : 'rules';
  if (!crisisSession && !crisisRecovered && isSessionInsightHeadlineLlmEnabled()) {
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
    userChars,
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
    suggestedCommitments,
    sessionIntention: conversation.sessionIntention || null,
    crisisTier: crisisSession ? peakRiskTier : null,
    sessionPhase: crisisRecovered ? 'crisis_recovered' : sessionPhase,
    tccLiteResume: thoughtPattern?.type && !crisisSession
      ? {
          eligible: true,
          distortionType: thoughtPattern.type,
          distortionLabel: thoughtPattern.name,
          step: 'capture_thought',
        }
      : null,
  };
}

export default { buildSessionInsight, buildSuggestedCommitments };
