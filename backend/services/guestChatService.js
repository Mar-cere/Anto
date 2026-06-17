/**
 * Chat invitado: sesión sin cuenta, límite de mensajes usuario, sin suscripción ni alertas a contactos.
 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  GUEST_MAX_CONTENT_LENGTH,
  GUEST_MAX_USER_MESSAGES,
  GUEST_SESSION_HOURS
} from '../constants/guestChat.js';
import {
  buildOpenaiCrisisContext,
  evaluateSuicideRisk,
  normalizeStoredCrisisRiskLevel,
  shouldIncludeCrisisInOpenaiContext,
} from '../constants/crisis.js';
import {
  buildHardStopCrisisAssistantContent,
  shouldHardStopCrisisLlm,
} from './crisisHardStopService.js';
import { crisisResourcesForTurn } from './crisisResourcesService.js';
import { sanitizeSessionIntentionForClient } from '../constants/sessionIntention.js';
import { buildHistoryForPromptFromMessages } from './openai/openaiPromptBuilder.js';
import { Conversation, Message } from '../models/index.js';
import GuestSession from '../models/GuestSession.js';
import contextAnalyzer from './contextAnalyzer.js';
import conversationDepthAnalyzer from './conversationDepthAnalyzer.js';
import emotionalAnalyzer from './emotionalAnalyzer.js';
import engagementTracker from './engagementTracker.js';
import openaiService from './openaiService.js';
import writingStyleDetector from './writingStyleDetector.js';
import metricsService from './metricsService.js';
import { buildCrisisRoutingMetricData } from '../utils/crisisRoutingMetricPayload.js';
import {
  detectAbruptToneChange,
  detectEmotionalEscalation,
  detectHelpRejection,
  analyzeMessageFrequency,
  detectSilenceAfterNegative
} from '../routes/chat/chatContextAnalysis.js';
import { HISTORIAL_LIMITE } from '../routes/chat/chatConstants.js';
import { analyzeConversationPattern } from './chat/conversationPatternAnalyzer.js';
import { detectFactualModeFromMessage } from './chat/factualQueryDetector.js';
import { detectShortModeFromSession } from './chat/responseLengthPreference.js';
import { buildSessionRetentionPayload, withThematicMicroClosureRetention } from './sessionRetentionHints.js';
import { inferChatSessionPhase } from './chat/sessionPhaseHints.js';
import { scheduleRollingSummaryRefresh } from './conversationRollingSummaryService.js';

function signGuestToken(guestSessionId) {
  return jwt.sign(
    { typ: 'guest', gsid: guestSessionId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: `${GUEST_SESSION_HOURS}h` }
  );
}

export async function createGuestSession(ipHash, language = 'es') {
  const expiresAt = new Date(Date.now() + GUEST_SESSION_HOURS * 60 * 60 * 1000);

  const guestSession = new GuestSession({
    maxUserMessages: GUEST_MAX_USER_MESSAGES,
    expiresAt,
    ipHash: ipHash || null
  });
  await guestSession.save();

  const conversation = new Conversation({
    userId: null,
    isGuest: true,
    guestSessionId: guestSession._id
  });
  await conversation.save();

  guestSession.conversationId = conversation._id;
  await guestSession.save();

  const welcomeContent = openaiService.generarSaludoPersonalizado({
    language: language === 'en' ? 'en' : 'es',
  });
  const welcomeMessage = new Message({
    userId: null,
    guestSessionId: guestSession._id,
    content: welcomeContent,
    role: 'assistant',
    conversationId: conversation._id,
    metadata: {
      context: { preferences: {} },
      status: 'sent',
      type: 'welcome',
      guest: true
    }
  });
  await welcomeMessage.save();
  await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: welcomeMessage._id });

  const token = signGuestToken(guestSession._id);

  metricsService
    .recordMetric(
      'chat_usage',
      { action: 'conversation_created', isGuest: true },
      null,
      { guestSessionId: String(guestSession._id), conversationId: String(conversation._id) }
    )
    .catch(() => {});

  return {
    guestToken: token,
    conversationId: conversation._id.toString(),
    maxUserMessages: GUEST_MAX_USER_MESSAGES,
    userMessagesUsed: 0,
    expiresAt: guestSession.expiresAt.toISOString()
  };
}

export async function getGuestMessages(guestSession) {
  const convId = guestSession.conversationId;
  const gsId = guestSession._id;

  const messages = await Message.find({
    conversationId: convId,
    guestSessionId: gsId
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return messages.reverse();
}

export async function sendGuestMessage(guestSession, contentRaw) {
  const content = (contentRaw || '').trim();
  if (!content) {
    const e = new Error('Contenido requerido');
    e.status = 400;
    metricsService
      .recordMetric(
        'chat_usage',
        { action: 'error', isGuest: true, code: e.code || e.status || 'GUEST_CONTENT_REQUIRED' },
        null,
        { guestSessionId: String(guestSession?._id || ''), conversationId: String(guestSession?.conversationId || '') }
      )
      .catch(() => {});
    throw e;
  }
  if (content.length > GUEST_MAX_CONTENT_LENGTH) {
    const e = new Error(
      `El mensaje no puede superar ${GUEST_MAX_CONTENT_LENGTH} caracteres`
    );
    e.status = 400;
    e.code = 'GUEST_CONTENT_TOO_LONG';
    metricsService
      .recordMetric(
        'chat_usage',
        { action: 'error', isGuest: true, code: e.code },
        null,
        { guestSessionId: String(guestSession?._id || ''), conversationId: String(guestSession?.conversationId || '') }
      )
      .catch(() => {});
    throw e;
  }

  const conversation = await Conversation.findOne({
    _id: guestSession.conversationId,
    isGuest: true,
    guestSessionId: guestSession._id
  }).lean();

  if (!conversation) {
    const e = new Error('Conversación no encontrada');
    e.status = 404;
    metricsService
      .recordMetric(
        'chat_usage',
        { action: 'error', isGuest: true, code: e.code || e.status || 'GUEST_CONVERSATION_NOT_FOUND' },
        null,
        { guestSessionId: String(guestSession?._id || ''), conversationId: String(guestSession?.conversationId || '') }
      )
      .catch(() => {});
    throw e;
  }

  const userCount = await Message.countDocuments({
    conversationId: guestSession.conversationId,
    guestSessionId: guestSession._id,
    role: 'user'
  });

  if (userCount >= GUEST_MAX_USER_MESSAGES) {
    const e = new Error('Límite de mensajes de invitado alcanzado');
    e.status = 403;
    e.code = 'GUEST_LIMIT_REACHED';
    e.maxUserMessages = GUEST_MAX_USER_MESSAGES;
    metricsService
      .recordMetric(
        'chat_usage',
        { action: 'error', isGuest: true, code: e.code },
        null,
        { guestSessionId: String(guestSession?._id || ''), conversationId: String(guestSession?.conversationId || '') }
      )
      .catch(() => {});
    throw e;
  }

  const conversationId = guestSession.conversationId;

  const recentDupUser = await Message.findOne({
    conversationId,
    guestSessionId: guestSession._id,
    role: 'user',
    content,
    createdAt: { $gte: new Date(Date.now() - 8000) }
  })
    .sort({ createdAt: -1 })
    .lean();

  if (recentDupUser) {
    const assistantAfter = await Message.findOne({
      conversationId,
      guestSessionId: guestSession._id,
      role: 'assistant',
      createdAt: { $gt: recentDupUser.createdAt }
    })
      .sort({ createdAt: 1 })
      .lean();

    if (assistantAfter) {
      const used = await Message.countDocuments({
        conversationId,
        guestSessionId: guestSession._id,
        role: 'user'
      });
      const remaining = Math.max(0, GUEST_MAX_USER_MESSAGES - used);
      return {
        userMessage: recentDupUser,
        assistantMessage: assistantAfter,
        context: {
          emotional: assistantAfter?.metadata?.context?.emotional || null,
          contextual: assistantAfter?.metadata?.context?.contextual || null
        },
        guest: {
          userMessagesUsed: used,
          maxUserMessages: GUEST_MAX_USER_MESSAGES,
          remainingAfterThis: remaining,
          limitReached: remaining === 0
        },
        idempotentReplay: true
      };
    }

    const busy = new Error('Este mensaje ya se está procesando. Espera un momento.');
    busy.status = 429;
    busy.code = 'MESSAGE_IN_FLIGHT';
    throw busy;
  }

  const userMessage = new Message({
    userId: null,
    guestSessionId: guestSession._id,
    content,
    role: 'user',
    conversationId,
    metadata: { status: 'sent', guest: true }
  });
  await userMessage.save();

  metricsService
    .recordMetric(
      'chat_usage',
      { action: 'user_message_saved', isGuest: true, chars: content.length },
      null,
      { guestSessionId: String(guestSession._id), conversationId: String(conversationId) }
    )
    .catch(() => {});

  await GuestSession.findByIdAndUpdate(guestSession._id, {
    $inc: { userMessagesUsed: 1 }
  });

  const conversationHistory = await Message.find({ conversationId })
    .select('content role metadata.context.emotional createdAt')
    .sort({ createdAt: -1 })
    .limit(HISTORIAL_LIMITE)
    .lean();

  const previousEmotionalPatterns = conversationHistory
    .filter((msg) => msg.metadata?.context?.emotional?.mainEmotion)
    .map((msg) => ({
      emotion: msg.metadata.context.emotional.mainEmotion,
      intensity: msg.metadata.context.emotional.intensity || 5,
      timestamp: msg.createdAt
    }))
    .slice(-3);

  const [emotionalAnalysis, contextualAnalysis] = await Promise.all([
    emotionalAnalyzer.analyzeEmotion(content, previousEmotionalPatterns),
    contextAnalyzer.analizarMensaje(userMessage, conversationHistory)
  ]);

  const trendAnalysis = null;
  const crisisHistory = null;
  const basicRiskLevel = evaluateSuicideRisk(
    emotionalAnalysis,
    contextualAnalysis,
    content,
    { trendAnalysis: null, crisisHistory: null, conversationContext: {} }
  );

  const conversationContext = {
    emotionalEscalation: detectEmotionalEscalation(conversationHistory, emotionalAnalysis),
    helpRejected: detectHelpRejection(conversationHistory, content),
    abruptToneChange: detectAbruptToneChange(conversationHistory, emotionalAnalysis),
    frequencyAnalysis: analyzeMessageFrequency(conversationHistory, content),
    silenceAfterNegative: detectSilenceAfterNegative(conversationHistory)
  };

  const riskLevel = evaluateSuicideRisk(emotionalAnalysis, contextualAnalysis, content, {
    trendAnalysis,
    crisisHistory,
    conversationContext
  });

  try {
    userMessage.metadata = {
      ...(userMessage.metadata?.toObject?.() || userMessage.metadata || {}),
      crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) }
    };
    userMessage.markModified('metadata');
    await userMessage.save();
  } catch (persistRiskMetaErr) {
    console.warn('[GuestChat] metadata.crisis en mensaje usuario:', persistRiskMetaErr?.message);
  }

  const isCrisis =
    riskLevel === 'MEDIUM' ||
    riskLevel === 'HIGH' ||
    (contextualAnalysis?.intencion?.tipo === 'CRISIS' &&
      contextualAnalysis?.intencion?.confianza >= 0.9 &&
      riskLevel !== 'LOW');

  const depthAnalysis = conversationDepthAnalyzer.analyzeDepth({
    content,
    conversationHistory: conversationHistory.map((m) => ({ role: m.role, content: m.content || '' })),
    emotionalAnalysis
  });

  const userMessagesForAnalysis = conversationHistory
    .filter((m) => m.role === 'user')
    .map((m) => ({ content: m.content || '' }))
    .slice(-8);
  const writingStyle = writingStyleDetector.detectWritingStyle({
    content,
    userMessages: userMessagesForAnalysis.slice(0, -1)
  });
  const engagement = engagementTracker.analyzeEngagement(userMessagesForAnalysis);

  const historialParaPrompt = buildHistoryForPromptFromMessages(conversationHistory, {
    emotional: emotionalAnalysis,
    contextual: contextualAnalysis,
    currentMessage: content,
    _promptTelemetry: {
      userId: null,
      conversationId,
      source: 'guest',
      callSite: 'buildHistoryForPromptFromMessages'
    }
  });

  const conversationPattern = analyzeConversationPattern(conversationHistory, content);
  const forceShortMode = detectShortModeFromSession({
    currentMessage: content,
    conversationHistoryNewestFirst: conversationHistory
  });
  const forceFactualMode = detectFactualModeFromMessage({ currentMessage: content });

  const conversationRoll = await Conversation.findById(conversationId)
    .select('rollingSummary sessionIntention')
    .lean();

  const sessionPhase = inferChatSessionPhase({
    riskLevel,
    contextualAnalysis,
    userContent: content.trim(),
    conversationHistoryNewestFirst: conversationHistory
  });

  const sessionRetention = withThematicMicroClosureRetention(
    buildSessionRetentionPayload({
      conversationHistoryNewestFirst: conversationHistory,
      userContent: content,
      priorConversationCount: null,
      threadMessageLimit: GUEST_MAX_USER_MESSAGES * 2,
      conversationPattern
    }),
    { sessionPhase, conversationHistoryNewestFirst: conversationHistory }
  );

  const openaiContext = {
    rollingSummary: conversationRoll?.rollingSummary || null,
    sessionIntention: sanitizeSessionIntentionForClient(conversationRoll?.sessionIntention),
    sessionPhase,
    safetyHistory: conversationHistory.map((m) => ({
      role: m.role,
      content: m.content || ''
    })),
    history: historialParaPrompt,
    emotional: emotionalAnalysis,
    contextual: contextualAnalysis,
    profile: { preferences: { responseStyle: 'empatico' } },
    therapeutic: null,
    currentConversationId: conversationId,
    conversationContext,
    depthPreference: depthAnalysis?.depthPreference,
    inferredWritingStyle: writingStyle?.style,
    preferredResponseLength: engagement?.preferredResponseLength,
    forceShortMode,
    forceFactualMode,
    _promptTelemetry: {
      userId: null,
      conversationId,
      source: 'guest',
      callSite: 'buildHistoryForPromptFromMessages'
    },
    isGuest: true,
    sessionRetention,
    conversationPattern,
    crisis: buildOpenaiCrisisContext({
      riskLevel,
      isCrisis,
      userMessage: content.trim(),
      country: 'GENERAL',
    }),
    crisisMetricTransport: 'guest',
  };

  const crisisHardStopContent = shouldHardStopCrisisLlm({
    riskLevel,
    messageContent: content.trim(),
  })
    ? buildHardStopCrisisAssistantContent({
        riskLevel,
        language: 'es',
        preferences: null,
        phone: null,
        country: 'GENERAL',
      })
    : null;

  const syntheticUserId = guestSession._id;

  let responseContent;
  let responseContext = {};
  if (crisisHardStopContent) {
    responseContent = crisisHardStopContent;
    responseContext = { crisisHardStop: true };
    metricsService
      .recordMetric(
        'crisis_hard_stop',
        buildCrisisRoutingMetricData({
          riskLevel,
          transport: 'guest',
          messageContent: content.trim(),
        }),
        null,
        { guestSessionId: String(guestSession._id), conversationId: String(conversationId) },
      )
      .catch(() => {});
  } else {
    const response = await openaiService.generarRespuesta(
      {
        _id: userMessage._id,
        content,
        userId: syntheticUserId,
        conversationId,
        role: 'user'
      },
      openaiContext
    );
    responseContent = response.content;
    responseContext = response.context || {};
    if (
      shouldIncludeCrisisInOpenaiContext(riskLevel, {
        isCrisis,
        userMessage: content.trim(),
      })
    ) {
      metricsService
        .recordMetric(
          'crisis_llm_path',
          buildCrisisRoutingMetricData({
            riskLevel,
            transport: 'guest',
            messageContent: content.trim(),
          }),
          null,
          { guestSessionId: String(guestSession._id), conversationId: String(conversationId) },
        )
        .catch(() => {});
    }
  }

  const emocionalNormalizado = openaiService.normalizarAnalisisEmocional(emotionalAnalysis);

  const assistantMessage = new Message({
    userId: null,
    guestSessionId: guestSession._id,
    content: responseContent,
    role: 'assistant',
    conversationId,
    metadata: {
      status: 'sent',
      guest: true,
      crisis: {
        riskLevel: normalizeStoredCrisisRiskLevel(riskLevel),
        ...(crisisHardStopContent ? { hardStop: true } : {}),
      },
      context: {
        emotional: emocionalNormalizado,
        contextual: contextualAnalysis,
        response: JSON.stringify(responseContext || {}),
      },
    },
  });
  await assistantMessage.save();
  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantMessage._id });

  scheduleRollingSummaryRefresh({
    conversationId,
    guestSessionId: guestSession._id,
    isGuest: true
  });

  metricsService
    .recordMetric(
      'chat_usage',
      { action: 'assistant_message_saved', isGuest: true, chars: (responseContent || '').length },
      null,
      { guestSessionId: String(guestSession._id), conversationId: String(conversationId) }
    )
    .catch(() => {});

  const newCount = userCount + 1;
  const remaining = Math.max(0, GUEST_MAX_USER_MESSAGES - newCount);

  const crisisResources = crisisResourcesForTurn({
    riskLevel,
    hardStop: Boolean(crisisHardStopContent),
    isCrisis,
    preferences: null,
    phone: null,
    language: 'es',
  });

  return {
    userMessage,
    assistantMessage,
    context: {
      emotional: emotionalAnalysis,
      contextual: contextualAnalysis
    },
    guest: {
      userMessagesUsed: newCount,
      maxUserMessages: GUEST_MAX_USER_MESSAGES,
      remainingAfterThis: remaining,
      limitReached: remaining === 0
    },
    ...(crisisResources ? { crisisResources } : {}),
  };
}

export default {
  createGuestSession,
  getGuestMessages,
  sendGuestMessage
};
