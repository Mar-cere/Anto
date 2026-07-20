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
  buildCommitmentFollowUpPlan,
  detectCommitmentFollowUpAnswer,
  markCommitmentFollowUpAsked,
  shouldShowCommitmentFollowUpChips,
} from './commitmentFollowUpService.js';
import {
  buildExperientialFollowUpPlan,
  detectExperientialFollowUpAnswer,
  markExperientialPatternFollowUpAsked,
  shouldShowExperientialFollowUpChips,
} from './experientialFollowUpService.js';
import { buildExperientialRecallPlan } from './experientialRecallService.js';
import {
  isChatObservationalContextBlocked,
  isLlmCrisisTherapeuticExtrasBlocked,
} from '../utils/chatObservationalContext.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import Message from '../models/Message.js';
import { sanitizeProposedCommitments } from '../utils/sanitizeProposedCommitments.js';
import { buildSessionCommitmentPromptSnippet } from './sessionCommitmentPromptSnippet.js';
import {
  buildGratitudeJournalPromptSnippet,
  buildTechniqueSuggestionPromptSnippet,
} from './chat/techniqueSuggestionPromptSnippet.js';
import { markCommitmentFollowUpShown } from './sessionCommitmentService.js';
import metricsService from './metricsService.js';
import { detectParaphrasisInResponse } from './chat/paraphrasDetectionService.js';
import { recordParaphrasMetrics } from './chat/paraphrasMetricsService.js';
import { shouldRequireParaphrasis, markTurnAsParaphrasis } from './chat/paraphrasisPolicySnippet.js';

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
  resumeCommitmentFollowUp = false,
  resumeExperientialFollowUp = false,
  isCrisis = false,
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

  // Respaldo de inferencia (#202 / #211): respuesta por texto a follow-up reciente.
  try {
    await detectCommitmentFollowUpAnswer({ userId, userContent: String(userContent || '') });
  } catch {
    // best-effort
  }
  try {
    await detectExperientialFollowUpAnswer({ userId, userContent: String(userContent || '') });
  } catch {
    // best-effort
  }

  // Plan de follow-up de compromiso (#202): v1 unificado — prioriza snippet §7.2;
  // solo usa el plan legacy si no hay compromiso pendiente en el camino v1.
  let commitmentFollowUpPlan = null;
  let sessionCommitmentPromptSnippet = null;
  let commitmentFollowUpCommitmentId = null;
  if (!blockCrisisExtras) {
    try {
      const commitmentCtx = await buildSessionCommitmentPromptSnippet({
        userId,
        conversationId,
        language: lang,
        riskLevel,
        isCrisis,
      });
      if (commitmentCtx?.commitmentId && commitmentCtx?.snippet) {
        sessionCommitmentPromptSnippet = commitmentCtx.snippet;
        commitmentFollowUpCommitmentId = commitmentCtx.commitmentId;
        if (
          shouldShowCommitmentFollowUpChips({
            conversationHistory,
            forceFollowUp: resumeCommitmentFollowUp === true,
          })
        ) {
          commitmentFollowUpPlan = {
            commitmentId: commitmentCtx.commitmentId,
            label: commitmentCtx.label || '',
            promptSnippet: null,
          };
        }
      } else {
        commitmentFollowUpPlan = await buildCommitmentFollowUpPlan({
          userId,
          conversationHistory,
          riskLevel,
          language: lang,
          forceFollowUp: resumeCommitmentFollowUp === true,
        });
      }
    } catch {
      commitmentFollowUpPlan = null;
      sessionCommitmentPromptSnippet = null;
      commitmentFollowUpCommitmentId = null;
    }
  }

  // Follow-up experiencial (#211): solo si no hay compromiso due (#202 gana).
  let experientialFollowUpPlan = null;
  const commitmentDue =
    Boolean(sessionCommitmentPromptSnippet) ||
    Boolean(commitmentFollowUpPlan?.promptSnippet) ||
    Boolean(commitmentFollowUpCommitmentId);
  if (!blockCrisisExtras && !commitmentDue) {
    try {
      experientialFollowUpPlan = await buildExperientialFollowUpPlan({
        userId,
        conversationHistory,
        riskLevel,
        language: lang,
        forceFollowUp: resumeExperientialFollowUp === true,
        skipBecauseCommitmentDue: false,
      });
    } catch {
      experientialFollowUpPlan = null;
    }
  }

  // Recall temático entre conversaciones (promesa B): si no hay follow-up due ni compromiso.
  let experientialRecallPlan = null;
  if (
    !blockObservationalSnippets &&
    !commitmentDue &&
    !experientialFollowUpPlan?.promptSnippet
  ) {
    try {
      experientialRecallPlan = await withTimeout(
        buildExperientialRecallPlan({
          userId,
          userContent: String(userContent || '').trim(),
          riskLevel,
          language: lang,
          skipBecauseCommitmentDue: false,
          skipBecauseFollowUpDue: false,
        }),
        CHAT_CONTEXT_SNIPPET_TIMEOUT_MS,
      );
    } catch {
      experientialRecallPlan = null;
    }
  }

  // Mutex RAG (#203): compromiso / follow-up #211 / recall ganan prioridad.
  if (
    commitmentDue ||
    experientialFollowUpPlan?.promptSnippet ||
    experientialRecallPlan?.promptSnippet
  ) {
    personalPatternRagPromptSnippet = null;
  }

  return {
    suggestionPlan,
    tccLitePlan,
    activeTccProtocolsPromptSnippet,
    persistedTccLiteState,
    digitalPhenotypePromptSnippet,
    recentAbcPromptSnippet,
    personalPatternRagPromptSnippet,
    commitmentFollowUpPlan,
    sessionCommitmentPromptSnippet,
    commitmentFollowUpCommitmentId,
    experientialFollowUpPlan,
    experientialRecallPlan,
  };
}

export function buildOpenaiEnhancementSnippets(enhancements, options = {}) {
  const blockTherapeutic = options.blockCrisisExtras === true;
  const commitmentFollowUpPromptSnippet = blockTherapeutic
    ? null
    : enhancements.commitmentFollowUpPlan?.promptSnippet || null;
  const sessionCommitmentPromptSnippet = blockTherapeutic
    ? null
    : enhancements.sessionCommitmentPromptSnippet || null;
  const experientialFollowUpPromptSnippet = blockTherapeutic
    ? null
    : enhancements.experientialFollowUpPlan?.promptSnippet || null;
  const experientialRecallPromptSnippet = blockTherapeutic
    ? null
    : enhancements.experientialRecallPlan?.promptSnippet || null;
  const memoryHigherPriority = Boolean(
    commitmentFollowUpPromptSnippet ||
      sessionCommitmentPromptSnippet ||
      experientialFollowUpPromptSnippet ||
      experientialRecallPromptSnippet,
  );
  const suggestionIds = (enhancements.suggestionPlan?.formatted || [])
    .map((s) => s?.id || s?.interventionId || s)
    .filter(Boolean)
    .map(String);
  const lang =
    options.language === 'en' || enhancements.language === 'en' ? 'en' : 'es';
  const techniqueSuggestionPromptSnippet = blockTherapeutic
    ? null
    : buildTechniqueSuggestionPromptSnippet(suggestionIds, lang) || null;
  const gratitudeJournalPromptSnippet = blockTherapeutic
    ? null
    : buildGratitudeJournalPromptSnippet(suggestionIds, lang) || null;

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
    personalPatternRagPromptSnippet: memoryHigherPriority
      ? null
      : enhancements.personalPatternRagPromptSnippet || null,
    commitmentFollowUpPromptSnippet,
    sessionCommitmentPromptSnippet,
    experientialFollowUpPromptSnippet,
    experientialRecallPromptSnippet,
    techniqueSuggestionPromptSnippet,
    gratitudeJournalPromptSnippet,
  };
}

export function buildAssistantMetadataWithEnhancements(baseMetadata, tccLitePlan, language = 'es') {
  return attachTccLiteToAssistantMetadata(baseMetadata, tccLitePlan, language);
}

/**
 * Persistencia post-respuesta (best-effort).
 * 
 * @param {Object} params - Parámetros de finalización
 * @param {string} params.conversationId - ID de la conversación
 * @param {string} params.userId - ID del usuario
 * @param {string} params.assistantMessageId - ID del mensaje del asistente
 * @param {Object} params.tccLitePlan - Plan TCC lite
 * @param {Object} params.suggestionPlan - Plan de sugerencias
 * @param {Object} params.emotionalAnalysis - Análisis emocional
 * @param {Object} params.contextualAnalysis - Análisis contextual
 * @param {string} params.userContent - Contenido del mensaje del usuario
 * @param {string} params.riskLevel - Nivel de riesgo
 * @param {Object} [params.commitmentFollowUpPlan] - Plan de follow-up de compromiso
 * @param {string} [params.commitmentFollowUpCommitmentId] - ID del compromiso
 * @param {boolean} [params.showCommitmentFollowUpChips] - Si mostrar chips de follow-up
 * @param {string} [params.assistantMessageContent] - Contenido del mensaje del asistente (para paráfrasis #55)
 * @param {Object} [params.paraphrasisContext] - Contexto de paráfrasis (para registro de métricas #55)
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
  commitmentFollowUpPlan = null,
  commitmentFollowUpCommitmentId = null,
  showCommitmentFollowUpChips = false,
  experientialFollowUpPlan = null,
  showExperientialFollowUpChips = false,
  assistantMessageContent = null,
  paraphrasisContext = null,
}) {
  await saveTccLiteStateToConversation(conversationId, tccLitePlan).catch(() => {});

  // Follow-up de compromiso (#202): marcar como preguntado (una sola vez) y
  // persistir en el mensaje asistente para rehidratar los chips al recargar.
  if (showCommitmentFollowUpChips && commitmentFollowUpPlan?.commitmentId) {
    await markCommitmentFollowUpAsked(commitmentFollowUpPlan.commitmentId).catch(() => {});
    if (assistantMessageId) {
      await Message.updateOne(
        { _id: assistantMessageId },
        {
          $set: {
            'metadata.commitmentFollowUp': {
              id: commitmentFollowUpPlan.commitmentId,
              label: commitmentFollowUpPlan.label,
            },
          },
        },
      ).catch(() => {});
    }
  }

  // Follow-up experiencial (#211): markAsked solo con chips (paridad #202).
  if (showExperientialFollowUpChips && experientialFollowUpPlan?.patternId) {
    await markExperientialPatternFollowUpAsked(experientialFollowUpPlan.patternId).catch(() => {});
    metricsService
      .recordMetric(
        'experiential_follow_up_shown',
        { surface: 'chat' },
        String(userId || ''),
        conversationId ? { conversationId: String(conversationId) } : undefined,
      )
      .catch(() => {});
    if (assistantMessageId) {
      await Message.updateOne(
        { _id: assistantMessageId },
        {
          $set: {
            'metadata.experientialFollowUp': {
              id: experientialFollowUpPlan.patternId,
              statementPreview: experientialFollowUpPlan.statementPreview,
            },
          },
        },
      ).catch(() => {});
    }
  }

  const formatted = suggestionPlan?.formatted;
  const crisisBlocked = isLlmCrisisTherapeuticExtrasBlocked({ riskLevel, userMessage: userContent });
  if (
    !crisisBlocked &&
    commitmentFollowUpCommitmentId &&
    userId &&
    conversationId
  ) {
    await markCommitmentFollowUpShown(userId, commitmentFollowUpCommitmentId, conversationId).catch(
      () => {},
    );
    metricsService
      .recordMetric(
        'commitment_follow_up_shown',
        { surface: 'chat' },
        String(userId),
        { conversationId: String(conversationId) },
      )
      .catch(() => {});
  }
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

  // Paráfrasis detección y métricas (#55): Analizar si la respuesta del asistente
  // contiene paráfrasis y registrar métricas para análisis de impacto.
  if (assistantMessageId && assistantMessageContent && userContent && paraphrasisContext) {
    try {
      // Validar tipos de parámetros críticos
      if (typeof assistantMessageContent !== 'string' || assistantMessageContent.length === 0) {
        console.warn('[finalizeChatTurnEnhancements] Invalid assistantMessageContent type');
        return;
      }

      if (typeof userContent !== 'string' || userContent.length === 0) {
        console.warn('[finalizeChatTurnEnhancements] Invalid userContent type');
        return;
      }

      if (!paraphrasisContext || typeof paraphrasisContext !== 'object' || Array.isArray(paraphrasisContext)) {
        console.warn('[finalizeChatTurnEnhancements] Invalid paraphrasisContext type');
        return;
      }

      if (!conversationId || typeof conversationId !== 'string') {
        console.warn('[finalizeChatTurnEnhancements] Invalid conversationId');
        return;
      }

      // Determinar si se requería paráfrasis según las reglas de la policy
      const wasRequired = shouldRequireParaphrasis(paraphrasisContext);

      // Detectar si la respuesta del asistente contiene paráfrasis
      const paraphrasisDetection = detectParaphrasisInResponse(
        assistantMessageContent,
        userContent,
        paraphrasisContext.language || 'es'
      );

      // Validar resultado de detección
      if (
        !paraphrasisDetection ||
        typeof paraphrasisDetection !== 'object' ||
        typeof paraphrasisDetection.hasParaphrasis !== 'boolean' ||
        typeof paraphrasisDetection.confidence !== 'number'
      ) {
        console.warn('[finalizeChatTurnEnhancements] Invalid paraphrasisDetection result');
        return;
      }

      // Registrar métricas de paráfrasis
      await recordParaphrasMetrics(conversationId, assistantMessageId, {
        wasRequired,
        wasDetected: paraphrasisDetection.hasParaphrasis,
        confidence: paraphrasisDetection.confidence,
        emotionalContext: emotionalAnalysis,
      });

      // Si se detectó paráfrasis, marcar en metadata para cooldown
      if (paraphrasisDetection.hasParaphrasis && wasRequired) {
        const markedMetadata = markTurnAsParaphrasis({});
        
        // Validar que markTurnAsParaphrasis retornó metadata válido
        if (
          markedMetadata &&
          markedMetadata.paraphrasis &&
          typeof markedMetadata.paraphrasis.wasParaphrasis === 'boolean'
        ) {
          await Message.updateOne(
            { _id: assistantMessageId },
            {
              $set: {
                'metadata.paraphrasis.wasParaphrasis': markedMetadata.paraphrasis.wasParaphrasis,
                'metadata.paraphrasis.timestamp': markedMetadata.paraphrasis.timestamp,
              },
            },
          ).catch(() => {});
        }
      }
    } catch (error) {
      // Best-effort: no fallar el flujo si las métricas de paráfrasis fallan
      console.warn('[finalizeChatTurnEnhancements] Error recording paraphrasis metrics:', error);
    }
  }
}

/**
 * Persiste propuestas de compromiso mostradas para reconstruir tarjetas al reabrir el hilo.
 * @param {unknown} assistantMessageId
 * @param {unknown[]} proposedCommitments
 */
export async function persistProposedCommitmentsOnMessage(assistantMessageId, proposedCommitments) {
  const sanitized = sanitizeProposedCommitments(proposedCommitments);
  if (!assistantMessageId || sanitized.length === 0) {
    return;
  }
  await Message.updateOne(
    { _id: assistantMessageId },
    { $set: { 'metadata.proposedCommitments': sanitized } },
  ).catch(() => {});
}

export function buildClientTurnPayload({
  tccLitePlan,
  suggestionPlan,
  language = 'es',
  riskLevel = 'LOW',
  userMessage = '',
  commitmentFollowUpPlan = null,
  showCommitmentFollowUpChips = false,
  experientialFollowUpPlan = null,
  showExperientialFollowUpChips = false,
}) {
  const lang = normalizeApiLanguage(language);
  if (isLlmCrisisTherapeuticExtrasBlocked({ riskLevel, userMessage })) {
    return {
      suggestions: [],
      suggestionsPersonalized: false,
      tccLite: toTccLiteClientPayload({ active: false }, lang),
      commitmentFollowUp: null,
      experientialFollowUp: null,
    };
  }
  const formatted = suggestionPlan?.shouldShow ? suggestionPlan.formatted || [] : [];
  return {
    suggestions: formatted,
    suggestionsPersonalized: suggestionPlan?.rankingPersonalized === true,
    tccLite: toTccLiteClientPayload(tccLitePlan || { active: false }, lang),
    commitmentFollowUp:
      showCommitmentFollowUpChips && commitmentFollowUpPlan
        ? { id: commitmentFollowUpPlan.commitmentId, label: commitmentFollowUpPlan.label }
        : null,
    experientialFollowUp:
      showExperientialFollowUpChips && experientialFollowUpPlan?.patternId
        ? {
            id: experientialFollowUpPlan.patternId,
            statementPreview: experientialFollowUpPlan.statementPreview,
          }
        : null,
  };
}

export default {
  planChatTurnEnhancements,
  buildOpenaiEnhancementSnippets,
  buildAssistantMetadataWithEnhancements,
  finalizeChatTurnEnhancements,
  persistProposedCommitmentsOnMessage,
  buildClientTurnPayload,
};
