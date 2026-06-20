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
import {
  isChatObservationalContextBlocked,
  isLlmCrisisTherapeuticExtrasBlocked,
} from '../utils/chatObservationalContext.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import Message from '../models/Message.js';

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
  const blockCrisisExtras = isLlmCrisisTherapeuticExtrasBlocked({
    riskLevel,
    userMessage: userContent,
  });
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
  if (!blockCrisisExtras) {
    try {
      suggestionPlan = await planChatActionSuggestions({
        emotionalAnalysis,
        contextualAnalysis,
        userContent,
        userId,
        conversationId,
        conversationHistory,
        language: lang,
        riskLevel,
      });
    } catch {
      // best-effort
    }
  }

  let activeTccProtocolsPromptSnippet = null;
  if (!blockCrisisExtras) {
    try {
      activeTccProtocolsPromptSnippet = await buildActiveTccProtocolsPromptSnippet({
        userId,
        language: lang,
      });
    } catch {
      activeTccProtocolsPromptSnippet = null;
    }
  }

  let tccLitePlan = { active: false };
  if (!blockCrisisExtras) {
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

export function buildOpenaiEnhancementSnippets(enhancements, options = {}) {
  const blockTherapeutic = options.blockCrisisExtras === true;
  return {
    psychoeducationPromptSnippet: blockTherapeutic
      ? null
      : enhancements.suggestionPlan?.psychoeducationPromptSnippet || null,
    activeTccProtocolsPromptSnippet: blockTherapeutic
      ? null
      : enhancements.activeTccProtocolsPromptSnippet || null,
    tccLitePromptSnippet: blockTherapeutic
      ? null
      : enhancements.tccLitePlan?.promptSnippet || null,
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
  const crisisBlocked = isLlmCrisisTherapeuticExtrasBlocked({ riskLevel, userMessage: userContent });
  if (
    !crisisBlocked &&
    Array.isArray(formatted) &&
    formatted.length > 0 &&
    userId &&
    conversationId
  ) {
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

  // Persistir las sugerencias mostradas en el mensaje del asistente para que
  // las tarjetas se reconstruyan al reabrir la conversación (continuidad de UX).
  // Solo cuando realmente se mostraron (shouldShow), igual que buildClientTurnPayload.
  const shownSuggestions = suggestionPlan?.shouldShow && !crisisBlocked
    ? suggestionPlan.formatted || []
    : [];
  if (assistantMessageId && shownSuggestions.length > 0) {
    await Message.updateOne(
      { _id: assistantMessageId },
      {
        $set: {
          'metadata.suggestions': shownSuggestions,
          'metadata.suggestionsPersonalized': suggestionPlan?.rankingPersonalized === true,
        },
      },
    ).catch(() => {});
  }
}

export function buildClientTurnPayload({
  tccLitePlan,
  suggestionPlan,
  language = 'es',
  riskLevel = 'LOW',
  userMessage = '',
}) {
  const lang = normalizeApiLanguage(language);
  if (isLlmCrisisTherapeuticExtrasBlocked({ riskLevel, userMessage })) {
    return {
      suggestions: [],
      suggestionsPersonalized: false,
      tccLite: toTccLiteClientPayload({ active: false }, lang),
    };
  }
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
