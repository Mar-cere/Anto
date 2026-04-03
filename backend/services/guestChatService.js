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
import { evaluateSuicideRisk } from '../constants/crisis.js';
import { buildHistoryForPromptFromMessages } from './openai/openaiPromptBuilder.js';
import { Conversation, Message } from '../models/index.js';
import GuestSession from '../models/GuestSession.js';
import contextAnalyzer from './contextAnalyzer.js';
import conversationDepthAnalyzer from './conversationDepthAnalyzer.js';
import emotionalAnalyzer from './emotionalAnalyzer.js';
import engagementTracker from './engagementTracker.js';
import openaiService from './openaiService.js';
import writingStyleDetector from './writingStyleDetector.js';
import {
  detectAbruptToneChange,
  detectEmotionalEscalation,
  detectHelpRejection,
  analyzeMessageFrequency,
  detectSilenceAfterNegative
} from '../routes/chat/chatContextAnalysis.js';
import { HISTORIAL_LIMITE } from '../routes/chat/chatConstants.js';

function signGuestToken(guestSessionId) {
  return jwt.sign(
    { typ: 'guest', gsid: guestSessionId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: `${GUEST_SESSION_HOURS}h` }
  );
}

export async function createGuestSession(ipHash) {
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

  const welcomeContent = openaiService.generarSaludoPersonalizado({});
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
    throw e;
  }
  if (content.length > GUEST_MAX_CONTENT_LENGTH) {
    const e = new Error(
      `El mensaje no puede superar ${GUEST_MAX_CONTENT_LENGTH} caracteres`
    );
    e.status = 400;
    e.code = 'GUEST_CONTENT_TOO_LONG';
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
    throw e;
  }

  const conversationId = guestSession.conversationId;

  const userMessage = new Message({
    userId: null,
    guestSessionId: guestSession._id,
    content,
    role: 'user',
    conversationId,
    metadata: { status: 'sent', guest: true }
  });
  await userMessage.save();

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

  const openaiContext = {
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
    _promptTelemetry: {
      userId: null,
      conversationId,
      source: 'guest',
      callSite: 'buildHistoryForPromptFromMessages'
    },
    isGuest: true,
    crisis: isCrisis
      ? {
          riskLevel,
          country: 'GENERAL',
          detectedAt: new Date()
        }
      : undefined
  };

  const syntheticUserId = guestSession._id;

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

  const emocionalNormalizado = openaiService.normalizarAnalisisEmocional(emotionalAnalysis);

  const assistantMessage = new Message({
    userId: null,
    guestSessionId: guestSession._id,
    content: response.content,
    role: 'assistant',
    conversationId,
    metadata: {
      status: 'sent',
      guest: true,
      context: {
        emotional: emocionalNormalizado,
        contextual: contextualAnalysis,
        response: JSON.stringify(response.context || {})
      }
    }
  });
  await assistantMessage.save();
  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantMessage._id });

  const newCount = userCount + 1;
  const remaining = Math.max(0, GUEST_MAX_USER_MESSAGES - newCount);

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
    }
  };
}

export default {
  createGuestSession,
  getGuestMessages,
  sendGuestMessage
};
