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
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

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

  return {
    suggestionPlan,
    tccLitePlan,
    activeTccProtocolsPromptSnippet,
    persistedTccLiteState,
  };
}

export function buildOpenaiEnhancementSnippets(enhancements) {
  return {
    psychoeducationPromptSnippet: enhancements.suggestionPlan?.psychoeducationPromptSnippet || null,
    activeTccProtocolsPromptSnippet: enhancements.activeTccProtocolsPromptSnippet || null,
    tccLitePromptSnippet: enhancements.tccLitePlan?.promptSnippet || null,
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
