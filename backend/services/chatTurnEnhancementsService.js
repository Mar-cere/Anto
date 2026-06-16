/**
 * Extras de turno de chat compartidos entre HTTP/SSE y Socket.IO (#201, #127, #6).
 */
import chatInterventionGraphService from './chatInterventionGraphService.js';
import { buildActiveTccProtocolsPromptSnippet } from './activeTccProtocolsContextService.js';
import { planChatActionSuggestions } from './psychoeducationPromptSnippetService.js';
import {
  attachTccLiteToAssistantMetadata,
  planChatTccLite,
  toTccLiteClientPayload,
} from './chatTccLiteService.js';
import {
  loadTccLiteStateFromConversation,
  saveTccLiteStateToConversation,
} from './tccLiteConversationStateService.js';
import { buildDigitalPhenotypeChatSnippet } from './digitalPhenotypeChatContextService.js';
import { buildRecentAbcChatSnippet } from './recentAbcChatContextService.js';
import { buildPersonalPatternRagSnippet } from './personalPatternRagService.js';
import { isChatObservationalContextBlocked } from '../utils/chatObservationalContext.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

const CHAT_CONTEXT_SNIPPET_TIMEOUT_MS = 2500;

async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('phenotype_snippet_timeout')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Planifica sugerencias, TCC lite y snippets de prompt para un turno.
 */
export async function planChatTurnEnhancements({
  userId,
  conversationId,
  userContent,
  conversationHistory,
  emotionalAnalysis,
  contextualAnalysis,
  riskLevel,
  sessionIntention,
  language = 'es',
  resumeTccLite = null,
}) {
  const lang = normalizeApiLanguage(language);
  const blockObservationalSnippets = isChatObservationalContextBlocked(riskLevel);
  let persistedTccLiteState = null;
  try {
    persistedTccLiteState = await loadTccLiteStateFromConversation(conversationId);
  } catch {
    persistedTccLiteState = null;
  }

  let suggestionPlan = {
    shouldShow: false,
    formatted: [],
    rankingPersonalized: false,
    psychoeducationPromptSnippet: null,
  };
  try {
    suggestionPlan = await planChatActionSuggestions({
      emotionalAnalysis,
      contextualAnalysis,
      userContent,
      userId,
      conversationId,
      conversationHistory,
      language: lang,
    });
  } catch {
    // best-effort
  }

  let activeTccProtocolsPromptSnippet = null;
  try {
    activeTccProtocolsPromptSnippet = await buildActiveTccProtocolsPromptSnippet({
      userId,
      language: lang,
    });
  } catch {
    activeTccProtocolsPromptSnippet = null;
  }

  let tccLitePlan = { active: false };
  try {
    tccLitePlan = planChatTccLite({
      userContent: String(userContent || '').trim(),
      contextualAnalysis,
      emotionalAnalysis,
      conversationHistory,
      riskLevel,
      sessionIntention,
      language: lang,
      persistedState: persistedTccLiteState,
      resumeFromInsight:
        resumeTccLite && typeof resumeTccLite === 'object'
          ? {
              distortionType: resumeTccLite.distortionType,
              distortionLabel: resumeTccLite.distortionLabel,
            }
          : null,
    });
  } catch {
    tccLitePlan = { active: false };
  }

  let digitalPhenotypePromptSnippet = null;
  if (!blockObservationalSnippets) {
    try {
      digitalPhenotypePromptSnippet = await withTimeout(
        buildDigitalPhenotypeChatSnippet({
          userId,
          language: lang,
        }),
        CHAT_CONTEXT_SNIPPET_TIMEOUT_MS,
      );
    } catch {
      digitalPhenotypePromptSnippet = null;
    }
  }

  let recentAbcPromptSnippet = null;
  if (!blockObservationalSnippets) {
    try {
      recentAbcPromptSnippet = await withTimeout(
        buildRecentAbcChatSnippet({
          userId,
          userContent: String(userContent || '').trim(),
          language: lang,
          riskLevel,
        }),
        CHAT_CONTEXT_SNIPPET_TIMEOUT_MS,
      );
    } catch {
      recentAbcPromptSnippet = null;
    }
  }

  let personalPatternRagPromptSnippet = null;
  if (!blockObservationalSnippets) {
    try {
      personalPatternRagPromptSnippet = await withTimeout(
        buildPersonalPatternRagSnippet({
          userId,
          userContent: String(userContent || '').trim(),
          conversationId,
          language: lang,
          riskLevel,
        }),
        CHAT_CONTEXT_SNIPPET_TIMEOUT_MS,
      );
    } catch {
      personalPatternRagPromptSnippet = null;
    }
  }

  return {
    suggestionPlan,
    tccLitePlan,
    activeTccProtocolsPromptSnippet,
    persistedTccLiteState,
    digitalPhenotypePromptSnippet,
    recentAbcPromptSnippet,
    personalPatternRagPromptSnippet,
  };
}

export function buildOpenaiEnhancementSnippets(enhancements) {
  return {
    psychoeducationPromptSnippet: enhancements.suggestionPlan?.psychoeducationPromptSnippet || null,
    activeTccProtocolsPromptSnippet: enhancements.activeTccProtocolsPromptSnippet || null,
    tccLitePromptSnippet: enhancements.tccLitePlan?.promptSnippet || null,
    digitalPhenotypePromptSnippet: enhancements.digitalPhenotypePromptSnippet || null,
    recentAbcPromptSnippet: enhancements.recentAbcPromptSnippet || null,
    personalPatternRagPromptSnippet: enhancements.personalPatternRagPromptSnippet || null,
  };
}

export function buildAssistantMetadataWithEnhancements(baseMetadata, tccLitePlan, language = 'es') {
  return attachTccLiteToAssistantMetadata(baseMetadata, tccLitePlan, language);
}

/**
 * Persistencia post-respuesta (best-effort).
 */
export async function finalizeChatTurnEnhancements({
  conversationId,
  userId,
  assistantMessageId,
  tccLitePlan,
  suggestionPlan,
  emotionalAnalysis,
  contextualAnalysis,
  userContent,
  riskLevel,
}) {
  await saveTccLiteStateToConversation(conversationId, tccLitePlan).catch(() => {});

  const formatted = suggestionPlan?.formatted;
  if (Array.isArray(formatted) && formatted.length > 0 && userId && conversationId) {
    await chatInterventionGraphService
      .recordSuggestionEventsShown({
        userId,
        conversationId,
        assistantMessageId,
        suggestions: formatted,
        emotionalAnalysis,
        contextualAnalysis,
        userContent,
        riskLevel,
        source: 'chat_suggestions_v1',
      })
      .catch(() => {});
  }
}

export function buildClientTurnPayload({
  tccLitePlan,
  suggestionPlan,
  language = 'es',
}) {
  const lang = normalizeApiLanguage(language);
  const formatted = suggestionPlan?.shouldShow ? suggestionPlan.formatted || [] : [];
  return {
    suggestions: formatted,
    suggestionsPersonalized: suggestionPlan?.rankingPersonalized === true,
    tccLite: toTccLiteClientPayload(tccLitePlan || { active: false }, lang),
  };
}

export default {
  planChatTurnEnhancements,
  buildOpenaiEnhancementSnippets,
  buildAssistantMetadataWithEnhancements,
  finalizeChatTurnEnhancements,
  buildClientTurnPayload,
};
