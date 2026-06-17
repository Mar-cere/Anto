/**
 * Contexto de tendencias e historial para acciones de crisis (§3).
 * Unifica la lógica que antes solo existía en chatRoutes HTTP.
 */
import { evaluateSuicideRisk } from '../constants/crisis.js';
import {
  analyzeMessageFrequency,
  detectAbruptToneChange,
  detectEmotionalEscalation,
  detectHelpRejection,
  detectSilenceAfterNegative,
} from '../routes/chat/chatContextAnalysis.js';
import crisisTrendAnalyzer from './crisisTrendAnalyzer.js';

export function buildConversationContextForCrisis(
  conversationHistory,
  messageContent,
  emotionalAnalysis,
) {
  return {
    emotionalEscalation: detectEmotionalEscalation(conversationHistory, emotionalAnalysis),
    helpRejected: detectHelpRejection(conversationHistory, messageContent),
    abruptToneChange: detectAbruptToneChange(conversationHistory, emotionalAnalysis),
    frequencyAnalysis: analyzeMessageFrequency(conversationHistory, messageContent),
    silenceAfterNegative: detectSilenceAfterNegative(conversationHistory),
  };
}

/**
 * @param {string | import('mongoose').Types.ObjectId} userId
 * @param {{ basicRiskLevel?: string, emotionalIntensity?: number }} [opts]
 */
export async function fetchCrisisTrendContext(userId, opts = {}) {
  const basicRiskLevel = String(opts.basicRiskLevel || 'LOW').toUpperCase();
  const intensity = Number(opts.emotionalIntensity || 0);
  if (basicRiskLevel === 'LOW' && intensity < 7) {
    return { trendAnalysis: null, crisisHistory: null };
  }

  const [trendAnalysis, crisisHistory] = await Promise.all([
    crisisTrendAnalyzer.analyzeTrends(userId).catch((err) => {
      console.error('[CrisisBackgroundContext] Error analizando tendencias:', err);
      return null;
    }),
    crisisTrendAnalyzer.getCrisisHistory(userId, 30).catch((err) => {
      console.error('[CrisisBackgroundContext] Error obteniendo historial de crisis:', err);
      return null;
    }),
  ]);

  return { trendAnalysis, crisisHistory };
}

/**
 * Evalúa riesgo con contexto completo (tendencias + conversación).
 */
export async function resolveCrisisRiskAndContext({
  userId,
  emotionalAnalysis = {},
  contextualAnalysis = {},
  messageContent,
  conversationHistory = [],
}) {
  const conversationContext = buildConversationContextForCrisis(
    conversationHistory,
    messageContent,
    emotionalAnalysis,
  );

  const basicRiskLevel = evaluateSuicideRisk(
    emotionalAnalysis,
    contextualAnalysis,
    messageContent,
    {
      trendAnalysis: null,
      crisisHistory: null,
      conversationContext,
    },
  );

  const { trendAnalysis, crisisHistory } = await fetchCrisisTrendContext(userId, {
    basicRiskLevel,
    emotionalIntensity: emotionalAnalysis?.intensity,
  });

  const riskLevel = evaluateSuicideRisk(
    emotionalAnalysis,
    contextualAnalysis,
    messageContent,
    {
      trendAnalysis,
      crisisHistory,
      conversationContext,
    },
  );

  return {
    riskLevel,
    trendAnalysis,
    crisisHistory,
    conversationContext,
  };
}

export default {
  buildConversationContextForCrisis,
  fetchCrisisTrendContext,
  resolveCrisisRiskAndContext,
};
