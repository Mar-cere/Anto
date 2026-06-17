/**
 * Rutas de Chat - Gestiona conversaciones, mensajes y análisis emocional/contextual
 */
import express from 'express';
import mongoose from 'mongoose';
import {
    buildOpenaiCrisisContext,
    evaluateSuicideRisk,
    normalizeStoredCrisisRiskLevel,
    shouldAttachCrisisContextToPrompt,
    shouldIncludeCrisisInOpenaiContext,
} from '../constants/crisis.js';
import { isLlmCrisisTherapeuticExtrasBlocked } from '../utils/chatObservationalContext.js';
import {
    normalizeSessionIntention,
    sanitizeSessionIntentionForClient,
    wasSessionIntentionProvided
} from '../constants/sessionIntention.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import ClinicalScaleResult from '../models/ClinicalScaleResult.js';
import CognitiveDistortionReport from '../models/CognitiveDistortionReport.js';
import {
    Conversation,
    Message,
    TherapeuticRecord
} from '../models/index.js';
import User from '../models/User.js';
import actionSuggestionService from '../services/actionSuggestionService.js';
import {
    analyzeAssistantResponseTemplateSignals,
    encodeChatPreferencesKey
} from '../services/chat/chatTemplateSignals.js';
import { analyzeConversationPattern } from '../services/chat/conversationPatternAnalyzer.js';
import { detectFactualModeFromMessage } from '../services/chat/factualQueryDetector.js';
import { detectShortModeFromSession } from '../services/chat/responseLengthPreference.js';
import { inferChatSessionPhase } from '../services/chat/sessionPhaseHints.js';
import chatProductActionLlmService from '../services/chatProductActionLlmService.js';
import chatProductActionProposalService from '../services/chatProductActionProposalService.js';
import clinicalScalesService from '../services/clinicalScalesService.js';
import conversationProductProposalCapService from '../services/conversationProductProposalCapService.js';
import { scheduleRollingSummaryRefresh } from '../services/conversationRollingSummaryService.js';
import { buildCrisisRoutingMetricData } from '../utils/crisisRoutingMetricPayload.js';
import crisisBackgroundActionsService from '../services/crisisBackgroundActionsService.js';
import crisisTrendAnalyzer from '../services/crisisTrendAnalyzer.js';
import {
    contextAnalyzer,
    conversationDepthAnalyzer,
    emotionalAnalyzer,
    engagementTracker,
    intenseChatCheckInService,
    memoryService,
    openaiService,
    progressTracker,
    userProfileService,
    writingStyleDetector
} from '../services/index.js';
import { scheduleLastSessionSummary } from '../services/lastSessionSummaryService.js';
import { buildSessionInsight } from '../services/sessionInsightService.js';
import metricsService from '../services/metricsService.js';
import { buildHistoryForPromptFromMessages } from '../services/openai/openaiPromptBuilder.js';
import paymentAuditService from '../services/paymentAuditService.js';
import sessionEmotionalMemory from '../services/sessionEmotionalMemory.js';
import { buildSessionRetentionPayload, withThematicMicroClosureRetention } from '../services/sessionRetentionHints.js';
import {
  getInterventionCatalogEntry,
  getInterventionCatalogLabel,
  isValidInterventionId,
} from '../constants/interventionCatalog.js';
import chatInterventionGraphService from '../services/chatInterventionGraphService.js';
import { isTopicFreeEmbeddingsEnabled } from '../services/topicFreeEmbeddingService.js';
import { buildInterventionGraphPhase3Payload } from '../services/interventionGraphPhase3Service.js';
import { enrichInterventionGraphLabels } from '../services/graphSourceLabelService.js';
import { getVectorSearchMode } from '../services/topicFreeVectorSearchService.js';
import { buildChatTccContinuity } from '../services/chatTccContinuityService.js';
import {
  shouldHardStopCrisisLlm,
  buildHardStopCrisisAssistantContent,
  buildCrisisHardStopClientPayload,
} from '../services/crisisHardStopService.js';
import { crisisResourcesForTurn } from '../services/crisisResourcesService.js';
import { indexPersonalPatternFromUserMessage } from '../services/personalPatternRagService.js';
import {
  planChatTurnEnhancements,
  buildOpenaiEnhancementSnippets,
  buildAssistantMetadataWithEnhancements,
  finalizeChatTurnEnhancements,
  buildClientTurnPayload,
} from '../services/chatTurnEnhancementsService.js';
import { toTccLiteClientPayload } from '../services/chatTccLiteService.js';
import { normalizeTccLiteState } from '../services/tccLiteConversationStateService.js';
import { tccLiteStepIndex, tccLiteStepOrder } from '../utils/tccLiteCopy.js';
import { getAutomaticThoughtDistortionLabel } from '../constants/automaticThoughtDistortionPicker.js';
import { resetConversationSessionState } from '../services/conversationClearService.js';
import { cursorPaginate } from '../utils/pagination.js';
import {
    HISTORIAL_LIMITE,
    LIMITE_MENSAJES,
    analyzeMessageFrequency,
    deleteConversationLimiter,
    detectAbruptToneChange,
    detectEmotionalEscalation,
    detectHelpRejection,
    detectSilenceAfterNegative,
    isValidObjectId,
    messageFeedbackLimiter,
    patchMessageLimiter,
    scheduleSessionSummaryLimiter,
    sendMessageLimiter,
    shouldShowChatActionSuggestions,
    validarConversacion,
    validarConversationId
} from './chat/index.js';

import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { chatApiCopy } from '../utils/chatApiCopy.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import {
  clampInt,
  escapeRegexForMongo,
  safeErrorMessage,
} from '../utils/safeApiError.js';

const router = express.Router();
const MAX_USER_MESSAGE_LENGTH = 12_000;
const MAX_CONVERSATION_LIST_LIMIT = 50;
const MAX_MESSAGE_STATUS_BATCH = 100;
const MAX_SEARCH_QUERY_LENGTH = 200;

router.use((req, res, next) => {
  const language = resolveRequestLanguage(req);
  req.appLanguage = language;
  req.apiCopy = chatApiCopy(language);
  next();
});

// Obtener mensajes de una conversación (paginado)
router.get('/conversations/:conversationId', protect, validarConversationId, validarConversacion, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      status, 
      role 
    } = req.query;

    // Asegurar que los IDs sean ObjectIds válidos
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    const convId = mongoose.Types.ObjectId.isValid(conversationId) 
      ? new mongoose.Types.ObjectId(conversationId) 
      : conversationId;
    
    const query = {
      conversationId: convId,
      userId: userId,
      ...(status && { 'metadata.status': status }),
      ...(role && { role })
    };

    const [messages, total, convMeta] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Message.countDocuments(query),
      Conversation.findById(convId).select('sessionIntention tccLiteState').lean()
    ]);

    // Asegurar que el primer mensaje del historial sea del asistente (y quede persistido).
    // Idempotente: solo crea un welcome si no existe ya uno para la conversación.
    // Importante: solo hacerlo en la primera página y sin filtros, para evitar efectos laterales inesperados.
    const shouldEnsureWelcome =
      parseInt(page) === 1 &&
      !status &&
      !role;

    if (shouldEnsureWelcome) {
      const existingWelcome = await Message.findOne({
        conversationId: convId,
        userId,
        'metadata.type': 'welcome',
        role: 'assistant'
      })
        .select('_id createdAt')
        .lean();

      if (!existingWelcome) {
        // Consultar el mensaje más antiguo para saber si ya inicia con assistant.
        const earliestMessage = await Message.findOne({
          conversationId: convId,
          userId
        })
          .sort({ createdAt: 1 })
          .select('role createdAt')
          .lean();

        const earliestIsAssistant = earliestMessage?.role === 'assistant';

        if (!earliestMessage || !earliestIsAssistant) {
          const baseTime = earliestMessage?.createdAt
            ? new Date(earliestMessage.createdAt).getTime()
            : Date.now();
          const welcomeCreatedAt = new Date(baseTime - 1000);

          const welcomeContent = openaiService.generarSaludoPersonalizado({
            language: req.appLanguage,
          });
          const welcomeMessage = new Message({
            userId,
            content: welcomeContent,
            role: 'assistant',
            conversationId: convId,
            metadata: {
              context: { preferences: {} },
              status: 'sent',
              type: 'welcome'
            }
          });
          await welcomeMessage.save();

          // Backdate: forzar que aparezca primero.
          await Message.updateOne(
            { _id: welcomeMessage._id },
            { $set: { createdAt: welcomeCreatedAt } }
          ).catch(() => {});

          // Reconsultar solo la primera página para incluir el nuevo welcome.
          const refreshed = await Message.find(query)
            .sort({ createdAt: -1 })
            .skip(0)
            .limit(parseInt(limit))
            .lean();

          messages.length = 0;
          messages.push(...refreshed);
        }
      }
    }

    // Eliminar duplicados basándose en _id y contenido para evitar mensajes repetidos
    const uniqueMessages = messages.reduce((acc, message) => {
      const messageId = message._id?.toString();
      if (!messageId) {
        return acc;
      }
      
      // Verificar si ya existe un mensaje con este ID
      const exists = acc.some(
        msg => msg._id?.toString() === messageId
      );
      
      if (!exists) {
        acc.push(message);
      }
      
      return acc;
    }, []);

    metricsService.bumpChatExploration('load_messages', {
      page: parseInt(page, 10) || 1
    });

    const appLanguage = req.appLanguage || resolveRequestLanguage(req);
    const persistedTcc = normalizeTccLiteState(convMeta?.tccLiteState);
    let tccLite = null;
    if (persistedTcc && !persistedTcc.completed && persistedTcc.step) {
      const dtype = persistedTcc.distortionType;
      tccLite = toTccLiteClientPayload(
        {
          active: true,
          step: persistedTcc.step,
          stepIndex: tccLiteStepIndex(persistedTcc.step),
          stepTotal: tccLiteStepOrder().length,
          distortionType: dtype,
          distortionLabel: dtype
            ? getAutomaticThoughtDistortionLabel(dtype, appLanguage) || null
            : null,
          completed: false,
          atHandoff: null,
        },
        appLanguage,
      );
    }

    res.json({
      messages: uniqueMessages.reverse(),
      sessionIntention: sanitizeSessionIntentionForClient(convMeta?.sessionIntention),
      tccLite,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    metricsService.bumpChatFriction('load_messages_server_error', {
      httpStatus: 500,
      surface: 'registered'
    });
    res.status(500).json({
      message: req.apiCopy.historyError,
      error: safeErrorMessage(error)
    });
  }
});

// Fijar intención de sesión (#72) antes del primer mensaje del usuario
router.patch(
  '/conversations/:conversationId/session-intention',
  protect,
  requireActiveSubscription(true),
  validarConversationId,
  validarConversacion,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const intention = normalizeSessionIntention(req.body?.sessionIntention);
      if (!intention) {
        metricsService.bumpChatFriction('session_intention_invalid_on_patch', {
          httpStatus: 400,
          surface: 'registered'
        });
        return res.status(400).json({
          message: req.apiCopy.sessionIntentionInvalid
        });
      }
      const userMsgCount = await Message.countDocuments({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        userId: req.user._id,
        role: 'user'
      });
      if (userMsgCount > 0) {
        metricsService.bumpChatFriction('session_intention_patch_too_late', {
          httpStatus: 409,
          surface: 'registered'
        });
        return res.status(409).json({
          message: req.apiCopy.sessionIntentionTooLate,
        });
      }
      const updated = await Conversation.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(conversationId), userId: req.user._id },
        { $set: { sessionIntention: intention } },
        { new: true, runValidators: true }
      )
        .select('sessionIntention')
        .lean();
      if (!updated) {
        return res.status(404).json({ message: req.apiCopy.conversationNotFound });
      }
      res.json({ sessionIntention: sanitizeSessionIntentionForClient(updated.sessionIntention) });
    } catch (error) {
      console.error('Error al actualizar intención de sesión:', error);
      res.status(500).json({
        message: req.apiCopy.sessionIntentionSaveError,
        error: safeErrorMessage(error)
      });
    }
  }
);

// Feedback de propuestas productivas en la conversación (aceptada/rechazada)
router.post(
  '/conversations/:conversationId/product-proposal-feedback',
  protect,
  requireActiveSubscription(true),
  validarConversationId,
  validarConversacion,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const action = String(req.body?.action || '').trim();
      if (action !== 'accepted' && action !== 'rejected') {
        return res.status(400).json({ message: req.apiCopy.proposalActionInvalid });
      }
      await conversationProductProposalCapService.registerProductProposalFeedback(
        conversationId,
        action
      );
      metricsService
        .recordMetric(
          'product_action_feedback',
          { action },
          req.user._id.toString(),
          { conversationId: String(conversationId) }
        )
        .catch(() => {});
      return res.status(204).end();
    } catch (error) {
      console.error('Error guardando feedback de propuesta productiva:', error);
      return res.status(500).json({ message: req.apiCopy.proposalFeedbackError });
    }
  }
);

// Eventos del grafo tema–intervención (#127): clicked/dismissed/completed.
router.post(
  '/conversations/:conversationId/interventions/events',
  protect,
  requireActiveSubscription(true),
  validarConversationId,
  validarConversacion,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const interventionId = String(req.body?.interventionId || '').trim();
      const eventType = String(req.body?.eventType || '').trim();
      if (!interventionId || !isValidInterventionId(interventionId)) {
        return res.status(400).json({ message: req.apiCopy?.invalidRequest || 'Solicitud inválida' });
      }
      if (!['clicked', 'dismissed', 'completed'].includes(eventType)) {
        return res.status(400).json({ message: req.apiCopy?.invalidRequest || 'Solicitud inválida' });
      }
      // best-effort: no bloquear el flujo del usuario si hay fallo de DB
      chatInterventionGraphService
        .recordInterventionEvent({
          userId: req.user._id,
          conversationId: new mongoose.Types.ObjectId(conversationId),
          interventionId,
          eventType,
          assistantMessageId: null,
          emotionalAnalysis: null,
          contextualAnalysis: null,
          riskLevel: null,
          source: 'chat_suggestions_v1',
        })
        .catch(() => {});
      return res.status(204).end();
    } catch (error) {
      console.error('[ChatRoutes] interventions/events:', error);
      return res.status(500).json({ message: req.apiCopy?.serverError || 'Error del servidor' });
    }
  }
);

/**
 * GET /api/chat/interventions/graph
 * Agregado del grafo tema–intervención (#127) para el usuario autenticado.
 * Query:
 * - days: ventana (default 14, min 1, max 180)
 * - limit: máximo de edges (default 60, min 1, max 300)
 */
router.get('/interventions/graph', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const daysRaw = req.query?.days;
    const limitRaw = req.query?.limit;
    const days = Math.max(1, Math.min(180, Number(daysRaw ?? 14) || 14));
    const limit = Math.max(1, Math.min(300, Number(limitRaw ?? 60) || 60));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const edges = await chatInterventionGraphService.aggregateInterventionGraph({
      userId: req.user._id,
      since,
      limit,
    });
    const topicFreeLimit = Math.max(1, Math.min(80, Math.floor(limit * 0.75) || 30));
    const topicFreeRaw = await chatInterventionGraphService.aggregateTopicFreeGraph({
      userId: req.user._id,
      since,
      limit: topicFreeLimit,
    });
    const language = req.appLanguage || resolveRequestLanguage(req);

    const mapEdge = (e, includeTopicFree = false) => {
      const interventionId = String(e?._id?.interventionId || '').slice(0, 80);
      const entry = getInterventionCatalogEntry(interventionId);
      return {
        topicTag: String(
          includeTopicFree ? e?.topicTag || 'general' : e?._id?.topicTag || 'general',
        ).slice(0, 64),
        ...(includeTopicFree
          ? { topicFree: String(e?._id?.topicFree || '').slice(0, 128) }
          : {}),
        interventionId,
        interventionLabel: getInterventionCatalogLabel(entry, language) || interventionId,
        shown: e.shown || 0,
        clicked: e.clicked || 0,
        dismissed: e.dismissed || 0,
        completed: e.completed || 0,
        ctr: typeof e.ctr === 'number' ? e.ctr : 0,
        completionRate: typeof e.completionRate === 'number' ? e.completionRate : 0,
        lastAt: e.lastAt,
      };
    };

    const mappedEdges = edges.map((e) => mapEdge(e, false));
    const mappedTopicFreeEdges = topicFreeRaw.map((e) => mapEdge(e, true));

    const phase3 = await buildInterventionGraphPhase3Payload({
      userId: req.user._id,
      since,
      topicTagEdges: mappedEdges,
      topicFreeEdges: mappedTopicFreeEdges,
      language,
    });

    const labeled = await enrichInterventionGraphLabels({
      topicFreeEdges: mappedTopicFreeEdges,
      conceptNodes: phase3.conceptNodes,
      language,
    });

    res.json({
      success: true,
      aggregationMode: 'session',
      windowDays: days,
      since: since.toISOString(),
      count: edges.length,
      topicFreeCount: topicFreeRaw.length,
      embeddingsEnabled: isTopicFreeEmbeddingsEnabled(),
      vectorSearchMode: getVectorSearchMode(),
      language,
      edges: mappedEdges,
      topicFreeEdges: labeled.topicFreeEdges,
      conceptNodes: labeled.conceptNodes,
      conceptEdges: phase3.conceptEdges,
      correlations: phase3.correlations,
      correlationSummary: phase3.correlationSummary,
      features: {
        phase: 3,
        vectorSearch: phase3.vectorSearch,
      },
    });
  } catch (error) {
    console.error('[ChatRoutes] GET /interventions/graph:', error);
    res.status(500).json({ success: false, message: req.apiCopy?.serverError || 'Error del servidor' });
  }
});

/**
 * GET /api/chat/tcc-continuity
 * Ítems accionables para retomar protocolos TCC (BA, exposición) en el chat.
 */
router.get('/tcc-continuity', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const language = req.appLanguage || resolveRequestLanguage(req);
    const data = await buildChatTccContinuity({ userId: req.user._id, language });
    const conversationId = String(req.query?.conversationId || '').trim();
    if (
      conversationId &&
      mongoose.Types.ObjectId.isValid(conversationId) &&
      Array.isArray(data?.items) &&
      data.items.length > 0
    ) {
      chatInterventionGraphService
        .recordContinuityItemsShown({
          userId: req.user._id,
          conversationId: new mongoose.Types.ObjectId(conversationId),
          items: data.items,
        })
        .catch(() => {});
    }
    return res.json({ success: true, data, language });
  } catch (error) {
    console.error('[ChatRoutes] GET /tcc-continuity:', error);
    return res.status(500).json({ success: false, message: req.apiCopy?.serverError || 'Error del servidor' });
  }
});

// Crear nueva conversación con mensaje de bienvenida
// Optimizado: saludo sin cargar perfil en la ruta crítica para reducir latencia (<1s)
router.post('/conversations', protect, requireActiveSubscription(true), async (req, res) => {
  try {
    const userId = req.user._id;
    const intention = normalizeSessionIntention(req.body?.sessionIntention);
    if (wasSessionIntentionProvided(req.body?.sessionIntention) && !intention) {
      metricsService.bumpChatFriction('session_intention_invalid_on_create', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({
        message: req.apiCopy.sessionIntentionInvalidShort
      });
    }

    // Crear conversación
    const conversation = new Conversation({
      userId,
      ...(intention ? { sessionIntention: intention } : {})
    });
    await conversation.save();

    // Mensaje de bienvenida con saludo por momento del día (sin await de perfil para evitar +1 ronda DB)
    const welcomeContent = openaiService.generarSaludoPersonalizado({
      language: req.appLanguage,
    });
    const welcomeMessage = new Message({
      userId,
      content: welcomeContent,
      role: 'assistant',
      conversationId: conversation._id,
      metadata: {
        context: { preferences: {} },
        status: 'sent',
        type: 'welcome',
      },
    });
    await welcomeMessage.save();

    await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: welcomeMessage._id });

    metricsService
      .recordMetric(
        'chat_usage',
        { action: 'conversation_created', isGuest: false },
        req.user._id.toString(),
        { conversationId: String(conversation._id) }
      )
      .catch(() => {});

    res.status(201).json({
      conversationId: conversation._id.toString(),
      sessionIntention: sanitizeSessionIntentionForClient(conversation.sessionIntention),
      message: welcomeMessage
    });
  } catch (error) {
    console.error('Error al crear conversación:', error);
    metricsService.bumpChatFriction('create_conversation_server_error', {
      httpStatus: 500,
      surface: 'registered'
    });
    res.status(500).json({
      message: req.apiCopy.createConversationError,
      error: safeErrorMessage(error)
    });
  }
});

/**
 * POST /api/chat/conversations/:conversationId/session-summary/schedule
 * Programa generación de la continuidad del último chat tras inactividad (#4 + #47).
 * Body opcional: { delayMinutes: number } entre 5 y 12 (default 7).
 */
router.post(
  '/conversations/:conversationId/session-summary/schedule',
  protect,
  requireActiveSubscription(true),
  scheduleSessionSummaryLimiter,
  validarConversationId,
  validarConversacion,
  async (req, res) => {
    try {
      const rawDelay = req.body?.delayMinutes;
      const delayMinutes =
        rawDelay === undefined || rawDelay === null || rawDelay === ''
          ? undefined
          : Number(rawDelay);
      if (
        rawDelay !== undefined &&
        rawDelay !== null &&
        rawDelay !== '' &&
        !Number.isFinite(delayMinutes)
      ) {
        return res.status(400).json({
          success: false,
          message: req.apiCopy.delayMinutesInvalid
        });
      }
      const data = await scheduleLastSessionSummary(req.user._id, req.params.conversationId, {
        delayMinutes
      });
      return res.status(202).json({ success: true, data });
    } catch (error) {
      if (error?.code === 'INVALID_IDS') {
        return res.status(400).json({ success: false, message: req.apiCopy.invalidIds });
      }
      if (error?.code === 'CONVERSATION_NOT_FOUND') {
        return res.status(404).json({ success: false, message: req.apiCopy.conversationNotFound });
      }
      console.error('[chatRoutes] session-summary/schedule:', error);
      return res.status(500).json({
        success: false,
        message: req.apiCopy.scheduleContinuityError
      });
    }
  }
);

/**
 * GET /api/chat/conversations/:conversationId/session-insight
 * Insight inmediato al cerrar el chat (emoción, patrón, paso sugerido).
 */
router.get(
  '/conversations/:conversationId/session-insight',
  protect,
  requireActiveSubscription(true),
  validarConversationId,
  validarConversacion,
  async (req, res) => {
    try {
      const language = req.appLanguage || resolveRequestLanguage(req);
      const insight = await buildSessionInsight({
        userId: req.user._id,
        conversationId: req.params.conversationId,
        language,
      });
      return res.json({ success: true, data: insight });
    } catch (error) {
      console.error('[chatRoutes] session-insight:', error);
      return res.status(500).json({
        success: false,
        message: req.apiCopy.sessionInsightError,
      });
    }
  },
);

// Crear nuevo mensaje
router.post('/messages', protect, requireActiveSubscription(true), sendMessageLimiter, async (req, res) => {
  const startTime = Date.now();
  const logs = [];
  let userMessage = null;
  let assistantMessage = null;
  
  try {
    const { conversationId, content, resumeTccLite = null } = req.body;

    if (req.body?.role != null && req.body.role !== 'user') {
      metricsService.bumpChatFriction('message_invalid_role', {
        httpStatus: 400,
        surface: 'registered',
      });
      return res.status(400).json({ message: req.apiCopy.contentRequired });
    }
    const role = 'user';

    // SEGURIDAD: Validar formato de conversationId
    if (!conversationId) {
      metricsService.bumpChatFriction('message_missing_conversation_id', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({
        message: req.apiCopy.conversationIdRequired
      });
    }

    if (!isValidObjectId(conversationId)) {
      // Registrar intento de acceso con ID inválido
      await paymentAuditService.logEvent('SECURITY_INVALID_CONVERSATION_ID', {
        userId: req.user._id?.toString(),
        conversationId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
      }, req.user._id?.toString()).catch(() => {});

      metricsService.bumpChatFriction('message_invalid_conversation_id', {
        httpStatus: 400,
        surface: 'registered'
      });
      
      return res.status(400).json({
        message: req.apiCopy.conversationIdInvalid
      });
    }

    // SEGURIDAD: Validar que la conversación pertenece al usuario autenticado
    const conversation = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(req.user._id)
    })
      .select('_id userId rollingSummary rollingSummaryAtMessageCount sessionIntention')
      .lean();

    if (!conversation) {
      // Registrar intento de acceso a conversación no autorizada
      await paymentAuditService.logEvent('SECURITY_UNAUTHORIZED_CONVERSATION_ACCESS', {
        userId: req.user._id?.toString(),
        conversationId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
      }, req.user._id?.toString()).catch(() => {});

      metricsService.bumpChatFriction('message_unauthorized_conversation', {
        httpStatus: 403,
        surface: 'registered'
      });
      
      return res.status(403).json({
        message: req.apiCopy.conversationForbidden
      });
    }

    // SEGURIDAD: Validación adicional de suscripción (defense in depth)
    // Verificar que la suscripción sigue activa después del middleware
    if (
      !req.subscription ||
      (!req.subscription.isActive &&
        !req.subscription.isInTrial &&
        !req.subscription.firstSessionGrace)
    ) {
      await paymentAuditService.logEvent('SECURITY_SUBSCRIPTION_BYPASS_ATTEMPT', {
        userId: req.user._id?.toString(),
        conversationId,
        subscriptionInfo: req.subscription,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
      }, req.user._id?.toString()).catch(() => {});

      metricsService.bumpChatFriction('subscription_required_for_chat', {
        httpStatus: 403,
        surface: 'registered'
      });
      
      return res.status(403).json({
        success: false,
        error: req.apiCopy.subscriptionRequired,
        requiresSubscription: true
      });
    }

    if (!content?.trim()) {
      metricsService.bumpChatFriction('message_empty_content', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({
        message: req.apiCopy.contentRequired
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > MAX_USER_MESSAGE_LENGTH) {
      metricsService.bumpChatFriction('message_content_too_long', {
        httpStatus: 400,
        surface: 'registered',
      });
      return res.status(400).json({
        message: req.apiCopy.contentRequired,
        maxLength: MAX_USER_MESSAGE_LENGTH,
      });
    }

    // Validar límite de mensajes (permitir crear el mensaje si estamos justo en el límite)
    // El límite se aplica ANTES de crear el nuevo mensaje, así que si hay LIMITE_MENSAJES o más, no permitimos crear más
    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount >= LIMITE_MENSAJES) {
      metricsService.bumpChatFriction('message_thread_limit_reached', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({ 
        message: req.apiCopy.messageLimit(LIMITE_MENSAJES),
        limit: LIMITE_MENSAJES,
        currentCount: messageCount
      });
    }

    logs.push(`[${Date.now() - startTime}ms] Iniciando procesamiento de mensaje`);

    // Idempotencia: evita doble POST (doble tap / reintentos) duplicando user+assistant en BD
    if (role === 'user') {
      const recentDupUser = await Message.findOne({
        conversationId,
        userId: req.user._id,
        role: 'user',
        content: trimmedContent,
        createdAt: { $gte: new Date(Date.now() - 8000) }
      })
        .sort({ createdAt: -1 })
        .lean();

      if (recentDupUser) {
        const assistantAfter = await Message.findOne({
          conversationId,
          userId: req.user._id,
          role: 'assistant',
          createdAt: { $gt: recentDupUser.createdAt }
        })
          .sort({ createdAt: 1 })
          .lean();

        if (assistantAfter) {
          metricsService
            .recordMetric(
              'chat_usage',
              { action: 'message_idempotent_replay', isGuest: false },
              req.user._id.toString(),
              { conversationId: String(conversationId) }
            )
            .catch(() => {});

          return res.status(201).json({
            userMessage: recentDupUser,
            assistantMessage: assistantAfter,
            idempotentReplay: true,
            context: {
              emotional: assistantAfter?.metadata?.context?.emotional || null,
              contextual: assistantAfter?.metadata?.context?.contextual || null
            },
            suggestions: [],
            clinicalScale: null,
            cognitiveDistortions: null,
            processingTime: Date.now() - startTime
          });
        }

        metricsService.bumpChatFriction('message_duplicate_in_flight', {
          httpStatus: 429,
          surface: 'registered'
        });
        return res.status(429).json({
          message: req.apiCopy.messageProcessing,
          code: 'MESSAGE_IN_FLIGHT'
        });
      }
    }

    // 1. Crear y guardar mensaje del usuario INMEDIATAMENTE (optimización: no esperar análisis)
    userMessage = new Message({
      userId: req.user._id,
      content: trimmedContent,
      role,
      conversationId,
      metadata: {
        status: 'sent'
      }
    });
    // Guardar mensaje del usuario antes de análisis para respuesta más rápida
    await userMessage.save();
    logs.push(`[${Date.now() - startTime}ms] Mensaje del usuario guardado`);

    metricsService
      .recordMetric(
        'chat_usage',
        {
          action: 'user_message_saved',
          isGuest: false,
          chars: content.trim().length
        },
        req.user._id.toString(),
        { conversationId: String(conversationId) }
      )
      .catch(() => {});

    if (role === 'user') {
      /** Persistido en mensajes para continuidad post-chat / SLO (collectRiskLevelsFromMessages). */
      let riskLevel = 'LOW';
      try {
        // 2. Obtener contexto e historial (en paralelo)
        logs.push(`[${Date.now() - startTime}ms] Obteniendo contexto e historial`);
        // Optimización: Usar índices compuestos y proyección para reducir datos transferidos
        const [conversationHistory, userProfile, therapeuticRecord, user, priorConversationCount] = await Promise.all([
          Message.find({ conversationId })
          .select('content role metadata.context.emotional createdAt') // Solo campos necesarios
          .sort({ createdAt: -1 })
          .limit(HISTORIAL_LIMITE)
          .lean(),
          userProfileService.getOrCreateProfile(req.user._id),
          TherapeuticRecord.findOne({ userId: req.user._id }).lean(), // Usar lean() para mejor rendimiento
          User.findById(req.user._id).select('preferences phone').lean(), // preferences + teléfono para recursos de emergencia
          Conversation.countDocuments({
            userId: req.user._id,
            _id: { $ne: conversationId }
          }).catch(() => null)
        ]);

        const conversationPattern = analyzeConversationPattern(conversationHistory, content.trim());

        // NUEVO: Pasar conversationId al contexto para referencias a conversaciones anteriores
        const currentConversationId = conversationId;

        // 3. Análisis completo del mensaje (solo análisis críticos en paralelo)
        // Extraer patrones emocionales del historial para mejorar el análisis
        const previousEmotionalPatterns = conversationHistory
          .filter(msg => msg.metadata?.context?.emotional?.mainEmotion)
          .map(msg => ({
            emotion: msg.metadata.context.emotional.mainEmotion,
            intensity: msg.metadata.context.emotional.intensity || 5,
            timestamp: msg.createdAt
          }))
          .slice(-3); // Solo los últimos 3 para ajuste de tendencia

        logs.push(`[${Date.now() - startTime}ms] Realizando análisis crítico del mensaje`);
        
        // OPTIMIZACIÓN: Solo análisis críticos en paralelo (emocional y contextual)
        // Análisis de tendencias y crisis se harán después si es necesario
        const [emotionalAnalysis, contextualAnalysis] = await Promise.all([
          emotionalAnalyzer.analyzeEmotion(content, previousEmotionalPatterns),
          contextAnalyzer.analizarMensaje(userMessage, conversationHistory)
        ]);

        const memoryPrefetchPromise = memoryService
          .getRelevantContext(req.user._id, content.trim(), {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          })
          .catch((err) => {
            console.warn('[ChatRoutes] memoria (prefetch):', err?.message);
            return null;
          });
        
        // OPTIMIZACIÓN: Análisis de tendencias y crisis solo si hay indicadores de riesgo
        // Evaluar riesgo básico primero (más rápido)
        const basicRiskLevel = evaluateSuicideRisk(
          emotionalAnalysis, 
          contextualAnalysis, 
          content,
          {
            trendAnalysis: null, // No esperar análisis de tendencias
            crisisHistory: null,
            conversationContext: {}
          }
        );
        
        // Solo hacer análisis completo de tendencias/crisis si hay indicadores de riesgo
        let trendAnalysis = null;
        let crisisHistory = null;
        if (basicRiskLevel !== 'LOW' || emotionalAnalysis?.intensity >= 7) {
          logs.push(`[${Date.now() - startTime}ms] Indicadores de riesgo detectados, analizando tendencias`);
          [trendAnalysis, crisisHistory] = await Promise.all([
            crisisTrendAnalyzer.analyzeTrends(req.user._id).catch(err => {
              console.error('[ChatRoutes] Error analizando tendencias:', err);
              return null;
            }),
            crisisTrendAnalyzer.getCrisisHistory(req.user._id, 30).catch(err => {
              console.error('[ChatRoutes] Error obteniendo historial de crisis:', err);
              return null;
            })
          ]);
        }

        // NUEVO: Agregar análisis emocional a la memoria de sesión
        sessionEmotionalMemory.addAnalysis(req.user._id.toString(), emotionalAnalysis);
        
        // NUEVO: Registrar métricas de forma asíncrona (no bloquea la respuesta)
        Promise.all([
          metricsService.recordMetric('emotional_analysis', emotionalAnalysis, req.user._id.toString()).catch(() => {}),
          Promise.resolve().then(() => {
            const sessionBuffer = sessionEmotionalMemory.getBuffer(req.user._id.toString());
            return metricsService.recordMetric('session_memory', {
              action: 'add',
              bufferSize: sessionBuffer.length
            }, req.user._id.toString());
          }).catch(() => {})
        ]).catch(() => {}); // Ignorar errores en operaciones no críticas
        
        // NUEVO: Obtener tendencias de la sesión actual
        const sessionTrends = sessionEmotionalMemory.analyzeTrends(req.user._id.toString());

        // Analizar contexto conversacional para detectar escaladas y patrones
        const conversationContext = {
          emotionalEscalation: detectEmotionalEscalation(conversationHistory, emotionalAnalysis),
          helpRejected: detectHelpRejection(conversationHistory, content),
          abruptToneChange: detectAbruptToneChange(conversationHistory, emotionalAnalysis),
          frequencyAnalysis: analyzeMessageFrequency(conversationHistory, content),
          silenceAfterNegative: detectSilenceAfterNegative(conversationHistory)
        };

        // Analizar preferencia de profundidad (superficial/moderado/profundo) para ajustar respuestas
        const depthAnalysis = conversationDepthAnalyzer.analyzeDepth({
          content,
          conversationHistory: conversationHistory.map(m => ({ role: m.role, content: m.content || '' })),
          emotionalAnalysis
        });

        // Fase 3: Estilo de escritura y engagement para personalización
        const userMessagesForAnalysis = conversationHistory
          .filter(m => m.role === 'user')
          .map(m => ({ content: m.content || '' }))
          .slice(-8);
        const writingStyle = writingStyleDetector.detectWritingStyle({
          content,
          userMessages: userMessagesForAnalysis.slice(0, -1)
        });
        const engagement = engagementTracker.analyzeEngagement(userMessagesForAnalysis);

        // Evaluar riesgo de crisis/suicida con análisis mejorado
        riskLevel = evaluateSuicideRisk(
          emotionalAnalysis, 
          contextualAnalysis, 
          content,
          {
            trendAnalysis,
            crisisHistory,
            conversationContext
          }
        );
        try {
          userMessage.metadata = {
            ...(userMessage.metadata?.toObject?.() || userMessage.metadata || {}),
            crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) }
          };
          userMessage.markModified('metadata');
          await userMessage.save();
        } catch (persistRiskMetaErr) {
          console.warn('[ChatRoutes] metadata.crisis en mensaje usuario:', persistRiskMetaErr?.message);
        }
        indexPersonalPatternFromUserMessage({
          userId: req.user._id,
          conversationId,
          content: content.trim(),
          riskLevel,
        }).catch(() => {});
        const isCrisis =
          riskLevel === 'MEDIUM' ||
          riskLevel === 'HIGH' ||
          (contextualAnalysis?.intencion?.tipo === 'CRISIS' &&
            contextualAnalysis?.intencion?.confianza >= 0.9 &&
            riskLevel !== 'LOW');

        if (isCrisis) {
          logs.push(`[${Date.now() - startTime}ms] ⚠️ Crisis detectada - Nivel de riesgo: ${riskLevel}`);
          if (trendAnalysis?.warnings?.length > 0) {
            logs.push(
              `[${Date.now() - startTime}ms] 📊 Advertencias de tendencias: ${trendAnalysis.warnings.join('; ')}`,
            );
          }
        }

        const crisisTransport = req.query.stream === 'true' ? 'sse' : 'http';
        try {
          await crisisBackgroundActionsService.runCrisisBackgroundActions({
            userId: req.user._id,
            messageId: userMessage._id,
            messageContent: content,
            riskLevel,
            emotionalAnalysis,
            contextualAnalysis,
            trendAnalysis,
            crisisHistory,
            conversationContext,
            transport: crisisTransport,
            isCrisis,
            log: (msg) => logs.push(`[${Date.now() - startTime}ms] ${msg}`),
          });
        } catch (bgErr) {
          console.error('[ChatRoutes] Error en acciones de crisis en segundo plano:', bgErr);
          logs.push(`[${Date.now() - startTime}ms] ❌ Error acciones crisis: ${bgErr.message}`);
        }

        // 4. Generar respuesta usando el análisis ya realizado (mensaje ya guardado arriba)
        // Preparar historial de conversación en formato para el prompt
        const historialParaPrompt = buildHistoryForPromptFromMessages(conversationHistory, {
          emotional: emotionalAnalysis,
          contextual: contextualAnalysis,
          currentMessage: content,
          _promptTelemetry: {
            userId: req.user._id,
            conversationId,
            source: 'http',
            callSite: 'buildHistoryForPromptFromMessages'
          }
        });

        logs.push(`[${Date.now() - startTime}ms] Generando respuesta con análisis previo`);

        const memoriaParaOpenAI = await memoryPrefetchPromise;
        
        // Combinar UserProfile con User para tener acceso a todas las preferencias
        const combinedProfile = {
          ...userProfile,
          phone: user?.phone,
          preferences: {
            ...userProfile?.preferences,
            ...user?.preferences, // Incluir responseStyle de User
            language: req.appLanguage || resolveRequestLanguage(req),
          }
        };

        const appLanguageForChat = req.appLanguage || resolveRequestLanguage(req);

        const attachTurnCrisisResources = (payload, { hardStop = false } = {}) => {
          const crisisResources = crisisResourcesForTurn({
            riskLevel,
            hardStop,
            isCrisis,
            preferences: combinedProfile?.preferences,
            phone: combinedProfile?.phone,
            language: appLanguageForChat,
          });
          return crisisResources ? { ...payload, crisisResources } : payload;
        };

        const sessionPhase = inferChatSessionPhase({
          riskLevel,
          contextualAnalysis,
          userContent: content.trim(),
          conversationHistoryNewestFirst: conversationHistory
        });
        const sessionRetention = withThematicMicroClosureRetention(
          buildSessionRetentionPayload({
            conversationHistoryNewestFirst: conversationHistory,
            userContent: content.trim(),
            priorConversationCount,
            threadMessageLimit: LIMITE_MENSAJES,
            conversationPattern
          }),
          { sessionPhase, conversationHistoryNewestFirst: conversationHistory }
        );
        const sessionIntentionSafe = sanitizeSessionIntentionForClient(conversation?.sessionIntention);
        const responseStrategyHint =
          sessionIntentionSafe === 'vent'
            ? 'validate_first_then_action'
            : sessionIntentionSafe === 'plan'
              ? 'action_first_then_validation'
              : 'balanced';
        const forceShortMode = detectShortModeFromSession({
          currentMessage: content,
          conversationHistoryNewestFirst: conversationHistory
        });
        const forceFactualMode = detectFactualModeFromMessage({ currentMessage: content });

        const turnEnhancements = await planChatTurnEnhancements({
          userId: req.user._id,
          conversationId,
          userContent: content,
          conversationHistory,
          emotionalAnalysis,
          contextualAnalysis,
          riskLevel,
          sessionIntention: sessionIntentionSafe,
          language: appLanguageForChat,
          resumeTccLite:
            resumeTccLite && typeof resumeTccLite === 'object' ? resumeTccLite : null,
        });
        const { suggestionPlan, tccLitePlan } = turnEnhancements;
        const blockCrisisExtras = isLlmCrisisTherapeuticExtrasBlocked({
          riskLevel,
          userMessage: content.trim(),
        });
        const promptSnippets = buildOpenaiEnhancementSnippets(turnEnhancements, { blockCrisisExtras });

        const openaiContext = {
          rollingSummary: conversation?.rollingSummary || null,
          sessionPhase,
          safetyHistory: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content || ''
          })),
          history: historialParaPrompt,
          emotional: emotionalAnalysis,
          contextual: contextualAnalysis,
          profile: combinedProfile,
          therapeutic: therapeuticRecord,
          currentConversationId: conversationId,
          conversationContext,
          depthPreference: depthAnalysis?.depthPreference,
          inferredWritingStyle: writingStyle?.style,
          preferredResponseLength: engagement?.preferredResponseLength,
          forceShortMode,
          forceFactualMode,
          _promptTelemetry: {
            userId: req.user._id,
            conversationId,
            source: 'http',
            callSite: 'buildHistoryForPromptFromMessages'
          },
          crisis: buildOpenaiCrisisContext({
            riskLevel,
            isCrisis,
            userMessage: content.trim(),
            preferences: combinedProfile?.preferences || user?.preferences || null,
            phone: user?.phone || null,
          }),
          ...(memoriaParaOpenAI ? { memory: memoriaParaOpenAI } : {}),
          sessionRetention,
          sessionIntention: sessionIntentionSafe,
          responseStrategyHint,
          conversationPattern,
          psychoeducationPromptSnippet: promptSnippets.psychoeducationPromptSnippet,
          activeTccProtocolsPromptSnippet: promptSnippets.activeTccProtocolsPromptSnippet,
          tccLitePromptSnippet: promptSnippets.tccLitePromptSnippet,
          digitalPhenotypePromptSnippet: promptSnippets.digitalPhenotypePromptSnippet,
          recentAbcPromptSnippet: promptSnippets.recentAbcPromptSnippet,
          personalPatternRagPromptSnippet: promptSnippets.personalPatternRagPromptSnippet,
          crisisMetricTransport: req.query.stream === 'true' ? 'sse' : 'http',
        };

        const crisisHardStopContent = shouldHardStopCrisisLlm({
          riskLevel,
          messageContent: content.trim(),
        })
          ? buildHardStopCrisisAssistantContent({
              riskLevel,
              language: appLanguageForChat,
              preferences: combinedProfile?.preferences,
              phone: user?.phone || null,
            })
          : null;

        if (crisisHardStopContent) {
          logs.push(`[${Date.now() - startTime}ms] Crisis hard-stop (#205): respuesta estructurada sin LLM`);
          metricsService
            .recordMetric(
              'crisis_hard_stop',
              buildCrisisRoutingMetricData({
                riskLevel,
                transport: req.query.stream === 'true' ? 'sse' : 'http',
                messageContent: content.trim(),
              }),
              req.user._id.toString(),
              { conversationId: String(conversationId) }
            )
            .catch(() => {});

          const emocionalHardStop = openaiService.normalizarAnalisisEmocional(emotionalAnalysis);
          assistantMessage = new Message({
            userId: req.user._id,
            content: crisisHardStopContent,
            role: 'assistant',
            conversationId,
            metadata: buildAssistantMetadataWithEnhancements(
              {
                status: 'sent',
                crisis: {
                  riskLevel: normalizeStoredCrisisRiskLevel(riskLevel),
                  hardStop: true,
                },
                context: {
                  emotional: emocionalHardStop,
                  contextual: contextualAnalysis,
                  response: JSON.stringify({ crisisHardStop: true }),
                },
              },
              { active: false },
              appLanguageForChat,
            ),
          });
          await assistantMessage.save();
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: assistantMessage._id,
          }).catch(() => {});

          intenseChatCheckInService
            .maybeSchedule({
              userId: req.user._id,
              conversationId,
              assistantMessageId: assistantMessage._id,
              emotionalAnalysis,
              riskLevel,
              isCrisis: true,
            })
            .catch(() => {});

          scheduleRollingSummaryRefresh({
            conversationId,
            userId: req.user._id,
            isGuest: false,
          });

          const clientTurnHardStop = buildCrisisHardStopClientPayload(appLanguageForChat);
          const responseTimeHardStop = Date.now() - startTime;

          if (req.query.stream === 'true') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            res.write('data: ' + JSON.stringify({ content: crisisHardStopContent }) + '\n\n');
            res.write(
              'data: ' +
                JSON.stringify(
                  attachTurnCrisisResources(
                    {
                      done: true,
                      messageId: assistantMessage._id?.toString(),
                      content: crisisHardStopContent,
                      crisisHardStop: true,
                      context: { emotional: emotionalAnalysis, contextual: contextualAnalysis },
                      suggestions: clientTurnHardStop.suggestions,
                      suggestionsPersonalized: clientTurnHardStop.suggestionsPersonalized,
                      proposedProductActions: [],
                      productActionStatus: { paused: false, reason: null, askFirst: false },
                      clinicalScale: null,
                      cognitiveDistortions: null,
                      tccLite: clientTurnHardStop.tccLite,
                      processingTime: responseTimeHardStop,
                    },
                    { hardStop: true },
                  ),
                ) +
                '\n\n',
            );
            res.end();
            return;
          }

          return res.status(201).json(
            attachTurnCrisisResources(
              {
                userMessage,
                assistantMessage,
                crisisHardStop: true,
                context: {
                  emotional: emotionalAnalysis,
                  contextual: contextualAnalysis,
                },
                suggestions: clientTurnHardStop.suggestions,
                suggestionsPersonalized: clientTurnHardStop.suggestionsPersonalized,
                proposedProductActions: [],
                productActionStatus: { paused: false, reason: null, askFirst: false },
                clinicalScale: null,
                cognitiveDistortions: null,
                tccLite: clientTurnHardStop.tccLite,
                processingTime: responseTimeHardStop,
              },
              { hardStop: true },
            ),
          );
        }

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
                transport: req.query.stream === 'true' ? 'sse' : 'http',
                messageContent: content.trim(),
              }),
              req.user._id.toString(),
              { conversationId: String(conversationId) },
            )
            .catch(() => {});
        }

        metricsService
          .recordMetric(
            'chat_turn_policy',
            {
              questionStreakCount: conversationPattern.questionStreakCount,
              shortReplyStreak: conversationPattern.shortReplyStreak,
              cognitiveLoadSignal: conversationPattern.cognitiveLoadSignal || 'none',
              closureRisk: conversationPattern.closureRisk === true
            },
            req.user._id.toString(),
            { conversationId: String(conversationId) }
          )
          .catch(() => {});

        // Streaming: si se pide stream=true, responder por SSE
        if (req.query.stream === 'true') {
          metricsService
            .recordMetric(
              'chat_usage',
              { action: 'streaming_request', isGuest: false },
              req.user._id.toString(),
              {
                conversationId: String(conversationId),
                transport: 'http',
                endpoint: 'chat',
                surface: 'registered',
                streaming: true
              }
            )
            .catch(() => {});

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');
          res.flushHeaders();

          try {
            let firstChunkAt = null;
            for await (const event of openaiService.generarRespuestaStream(userMessage, openaiContext)) {
              if (event.type === 'chunk') {
                if (!firstChunkAt) {
                  firstChunkAt = Date.now();
                  metricsService
                    .recordMetric(
                      'chat_usage',
                      {
                        action: 'streaming_first_chunk',
                        isGuest: false,
                        ttftMs: firstChunkAt - startTime
                      },
                      req.user._id.toString(),
                      {
                        conversationId: String(conversationId),
                        transport: 'http',
                        endpoint: 'chat',
                        surface: 'registered',
                        streaming: true
                      }
                    )
                    .catch(() => {});
                }
                res.write('data: ' + JSON.stringify({ content: event.content }) + '\n\n');
              } else if (event.type === 'done') {
                const response = { content: event.content, context: event.context };
                const emocionalNormalizado = openaiService.normalizarAnalisisEmocional(emotionalAnalysis);
                const therapeutic = response.context?.therapeutic;
                const modelRouting = response.context?.modelRouting || null;

                try {
                  assistantMessage = new Message({
                    userId: req.user._id,
                    content: response.content,
                    role: 'assistant',
                    conversationId,
                    metadata: buildAssistantMetadataWithEnhancements({
                      status: 'sent',
                      crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) },
                      context: {
                        emotional: emocionalNormalizado,
                        contextual: contextualAnalysis,
                        response: JSON.stringify(response.context),
                        ...(therapeutic && { therapeutic: { technique: therapeutic.technique, type: therapeutic.type } })
                      }
                    }, tccLitePlan, appLanguageForChat),
                  });
                  await assistantMessage.save();
                } catch (saveError) {
                  if (saveError.name === 'ValidationError' && saveError.errors?.['metadata.context.emotional.mainEmotion']) {
                    assistantMessage = new Message({
                      userId: req.user._id,
                      content: response.content,
                      role: 'assistant',
                      conversationId,
                      metadata: buildAssistantMetadataWithEnhancements({
                        status: 'sent',
                        crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) },
                        context: {
                          emotional: { mainEmotion: 'neutral', intensity: emocionalNormalizado.intensity || 5 },
                          contextual: contextualAnalysis,
                          response: JSON.stringify(response.context),
                          ...(therapeutic && { therapeutic: { technique: therapeutic.technique, type: therapeutic.type } })
                        }
                      }, tccLitePlan, appLanguageForChat),
                    });
                    await assistantMessage.save();
                  } else throw saveError;
                }

                metricsService
                  .recordMetric(
                    'chat_usage',
                    {
                      action: 'assistant_message_saved',
                      isGuest: false,
                      chars: (response.content || '').length
                    },
                    req.user._id.toString(),
                    { conversationId: String(conversationId), streaming: true }
                  )
                  .catch(() => {});

                metricsService
                  .recordMetric(
                    'chat_template_signals',
                    {
                      ...analyzeAssistantResponseTemplateSignals(response.content, content),
                      responseStyle: combinedProfile?.preferences?.responseStyle || 'balanced',
                      chatPrefsKey: encodeChatPreferencesKey(combinedProfile?.preferences?.chatPreferences)
                    },
                    req.user._id.toString(),
                    {
                      conversationId: String(conversationId),
                      responseStyle: combinedProfile?.preferences?.responseStyle || 'balanced',
                      chatPrefsKey: encodeChatPreferencesKey(combinedProfile?.preferences?.chatPreferences),
                      riskLevel
                    }
                  )
                  .catch(() => {});

                intenseChatCheckInService
                  .maybeSchedule({
                    userId: req.user._id,
                    conversationId,
                    assistantMessageId: assistantMessage._id,
                    emotionalAnalysis,
                    riskLevel,
                    isCrisis
                  })
                  .catch(() => {});

                Promise.all([
                  Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantMessage._id }).catch(() => {}),
                  progressTracker.trackProgress(req.user._id, { userMessage, assistantMessage, analysis: { emotional: emotionalAnalysis, contextual: contextualAnalysis } }).catch(() => {}),
                  userProfileService.actualizarPerfil(req.user._id, userMessage, { emotional: emotionalAnalysis, contextual: contextualAnalysis }).catch(() => {}),
                  userProfileService.updateLongTermProfileFromConversation(req.user._id, { emotionalAnalysis, contextualAnalysis }).catch(() => {}),
                  ...(userMessagesForAnalysis.length >= 5 ? [userProfileService.inferPreferencesFromBehavior(req.user._id, {
                    communicationStyle: writingStyle?.confidence >= 0.5 ? { formal: 'formal', casual: 'casual', laconic: 'directo', emotive: 'empatico' }[writingStyle.style] : undefined,
                    responseLength: engagement?.engagementLevel !== 'unknown' ? engagement.preferredResponseLength : undefined,
                    responseStyle: engagement?.preferredResponseLength === 'SHORT' ? 'brief' : engagement?.preferredResponseLength === 'LONG' ? 'deep' : undefined
                  }).catch(() => {})] : [])
                ]).catch(() => {});

                await finalizeChatTurnEnhancements({
                  conversationId,
                  userId: req.user._id,
                  assistantMessageId: assistantMessage._id,
                  tccLitePlan,
                  suggestionPlan,
                  emotionalAnalysis,
                  contextualAnalysis,
                  userContent: content,
                  riskLevel,
                }).catch(() => {});

                scheduleRollingSummaryRefresh({
                  conversationId,
                  userId: req.user._id,
                  isGuest: false
                });

                const responseTime = Date.now() - startTime;
                const blockClinicalExtras = isLlmCrisisTherapeuticExtrasBlocked({
                  riskLevel,
                  userMessage: content.trim(),
                });
                let scaleSuggestion = null;
                try {
                  if (!blockClinicalExtras) {
                    scaleSuggestion = await clinicalScalesService.shouldAdministerScale(emotionalAnalysis, contextualAnalysis, req.user._id);
                  }
                } catch (_) {}
                const cognitiveDistortions = blockClinicalExtras
                  ? null
                  : contextualAnalysis?.cognitiveDistortions || null;
                const primaryDistortion = contextualAnalysis?.primaryDistortion || null;
                const distortionIntervention = contextualAnalysis?.distortionIntervention || null;
                const clientTurn = buildClientTurnPayload({
                  tccLitePlan,
                  suggestionPlan,
                  language: appLanguageForChat,
                  riskLevel,
                  userMessage: content.trim(),
                });
                if (suggestionPlan.actionIds?.length > 0) {
                  suggestionPlan.actionIds.forEach((suggestionType) => {
                    metricsService
                      .recordMetric(
                        'action_suggestion',
                        { action: 'generate', suggestionType },
                        req.user._id.toString(),
                      )
                      .catch(() => {});
                  });
                }

                let proposedProductActions = [];
                let productActionStatus = { paused: false, reason: null, askFirst: false };
                try {
                  proposedProductActions = chatProductActionProposalService.buildProposedProductActions({
                    riskLevel,
                    isCrisis,
                    userContent: content,
                    sessionIntention: conversation?.sessionIntention,
                    conversationId,
                    assistantMessageId: assistantMessage._id
                  });
                } catch (propErr) {
                  console.error('[ChatRoutes] proposedProductActions (stream):', propErr);
                }

                if (proposedProductActions.length > 0) {
                  try {
                    const proposalEval =
                      await conversationProductProposalCapService.evaluateProposedProductActionsState(
                        content,
                        conversationId,
                        proposedProductActions
                      );
                    proposedProductActions = proposalEval.actions;
                    productActionStatus = proposalEval.status || productActionStatus;
                  } catch (capErr) {
                    console.warn('[ChatRoutes] product proposal cap (stream):', capErr?.message || capErr);
                  }
                }

                if (proposedProductActions.length > 0) {
                  try {
                    proposedProductActions =
                      await chatProductActionLlmService.enrichProposedProductActionsWithLlm(
                        proposedProductActions,
                        {
                          userContent: content,
                          assistantContent: response.content,
                          primaryPsychoeducationId: suggestionPlan.primaryPsychoeducationId,
                          language: appLanguageForChat,
                        }
                      );
                  } catch (llmPropErr) {
                    console.warn('[ChatRoutes] proposedProductActions LLM (stream):', llmPropErr?.message || llmPropErr);
                  }
                  metricsService
                    .recordMetric(
                      'product_action_proposed',
                      {
                        count: proposedProductActions.length,
                        types: proposedProductActions.map((a) => a.type),
                        transport: 'sse'
                      },
                      req.user._id.toString(),
                      { conversationId: String(conversationId) }
                    )
                    .catch(() => {});
                  conversationProductProposalCapService
                    .incrementNonExplicitProductProposalCountIfApplied(
                      content,
                      conversationId,
                      proposedProductActions.length
                    )
                    .catch((incErr) =>
                      console.warn('[ChatRoutes] product proposal cap inc (stream):', incErr?.message || incErr)
                    );
                }

                res.write('data: ' + JSON.stringify(attachTurnCrisisResources({
                  done: true,
                  messageId: assistantMessage._id?.toString(),
                  content: response.content,
                  context: { emotional: emotionalAnalysis, contextual: contextualAnalysis },
                  suggestions: clientTurn.suggestions,
                  suggestionsPersonalized: clientTurn.suggestionsPersonalized,
                  proposedProductActions,
                  productActionStatus,
                  clinicalScale: scaleSuggestion ? { ...scaleSuggestion, suggestion: clinicalScalesService.generateScaleSuggestion(scaleSuggestion.scale, scaleSuggestion.reason), automaticResult: null } : null,
                  cognitiveDistortions: cognitiveDistortions?.length > 0 ? { detected: cognitiveDistortions, primary: primaryDistortion, intervention: distortionIntervention } : null,
                  tccLite: clientTurn.tccLite,
                  processingTime: responseTime
                })) + '\n\n');

                metricsService
                  .recordMetric(
                    'chat_usage',
                    {
                      action: 'streaming_done',
                      isGuest: false,
                      timeToDoneMs: Date.now() - startTime
                    },
                    req.user._id.toString(),
                    {
                      conversationId: String(conversationId),
                      model: modelRouting?.model,
                      route: modelRouting?.route,
                      routeReason: modelRouting?.reason
                    }
                  )
                  .catch(() => {});

                res.end();
                return;
              }
            }
          } catch (streamErr) {
            console.error('[ChatRoutes] Error en streaming:', streamErr);
            metricsService
              .recordMetric(
                'chat_usage',
                {
                  action: 'error',
                  isGuest: false,
                  code: streamErr?.code || streamErr?.status || 'streaming_error'
                },
                req.user._id.toString(),
                { conversationId: String(conversationId), streaming: true }
              )
              .catch(() => {});
            res.write(
              'data: ' +
                JSON.stringify({
                  error: streamErr.message || req.apiCopy.streamError,
                }) +
                '\n\n',
            );
            res.end();
            return;
          }
        }

        const response = await openaiService.generarRespuesta(
          userMessage,
          openaiContext
        );
        const modelRouting = response.context?.modelRouting || null;

        metricsService
          .recordMetric(
            'chat_usage',
            {
              action: 'non_stream_response_ready',
              isGuest: false,
              latencyMs: Date.now() - startTime
            },
            req.user._id.toString(),
            {
              conversationId: String(conversationId),
              streaming: false,
              transport: 'http',
              endpoint: 'chat',
              surface: 'registered',
              model: modelRouting?.model,
              route: modelRouting?.route,
              routeReason: modelRouting?.reason
            }
          )
          .catch(() => {});

        // Nota: La validación de coherencia emocional ya se realiza dentro de generarRespuesta()
        // en el método validarYMejorarRespuesta(), por lo que no es necesario hacerla aquí

        // 6. Crear y guardar mensaje del asistente
        // Normalizar objeto emocional para asegurar compatibilidad con el esquema
        const emocionalNormalizado = openaiService.normalizarAnalisisEmocional(emotionalAnalysis);
        
        try {
          const therapeutic = response.context?.therapeutic;
          assistantMessage = new Message({
            userId: req.user._id,
            content: response.content,
            role: 'assistant',
            conversationId,
            metadata: buildAssistantMetadataWithEnhancements({
              status: 'sent',
              crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) },
              context: {
                emotional: emocionalNormalizado,
                contextual: contextualAnalysis,
                response: JSON.stringify(response.context),
                ...(therapeutic && { therapeutic: { technique: therapeutic.technique, type: therapeutic.type } })
              }
            }, tccLitePlan, appLanguageForChat),
          });
          await assistantMessage.save();
        } catch (saveError) {
          // Si hay error de validación del enum, intentar guardar con 'neutral' como fallback
          if (saveError.name === 'ValidationError' && saveError.errors?.['metadata.context.emotional.mainEmotion']) {
            console.warn('⚠️ Error de validación de enum emocional. Guardando con neutral como fallback:', saveError.message);
            const therapeutic = response.context?.therapeutic;
            assistantMessage = new Message({
              userId: req.user._id,
              content: response.content,
              role: 'assistant',
              conversationId,
              metadata: buildAssistantMetadataWithEnhancements({
                status: 'sent',
                crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) },
                context: {
                  emotional: {
                    mainEmotion: 'neutral',
                    intensity: emocionalNormalizado.intensity || 5
                  },
                  contextual: contextualAnalysis,
                  response: JSON.stringify(response.context),
                  ...(therapeutic && { therapeutic: { technique: therapeutic.technique, type: therapeutic.type } })
                }
              }, tccLitePlan, appLanguageForChat),
            });
            await assistantMessage.save();
          } else {
            throw saveError;
          }
        }

        metricsService
          .recordMetric(
            'chat_usage',
            {
              action: 'assistant_message_saved',
              isGuest: false,
              chars: (response.content || '').length
            },
            req.user._id.toString(),
            { conversationId: String(conversationId), streaming: false }
          )
          .catch(() => {});

        metricsService
          .recordMetric(
            'chat_template_signals',
            {
              ...analyzeAssistantResponseTemplateSignals(response.content, content),
              responseStyle: combinedProfile?.preferences?.responseStyle || 'balanced',
              chatPrefsKey: encodeChatPreferencesKey(combinedProfile?.preferences?.chatPreferences)
            },
            req.user._id.toString(),
            {
              conversationId: String(conversationId),
              responseStyle: combinedProfile?.preferences?.responseStyle || 'balanced',
              chatPrefsKey: encodeChatPreferencesKey(combinedProfile?.preferences?.chatPreferences),
              riskLevel
            }
          )
          .catch(() => {});

        intenseChatCheckInService
          .maybeSchedule({
            userId: req.user._id,
            conversationId,
            assistantMessageId: assistantMessage._id,
            emotionalAnalysis,
            riskLevel,
            isCrisis
          })
          .catch(() => {});

        // 7. Actualizar registros de forma asíncrona (no bloquea la respuesta)
        // Solo actualizar lastMessage de forma síncrona, el resto puede ser asíncrono
        Promise.all([
          Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantMessage._id }).catch(() => {}),
          progressTracker.trackProgress(req.user._id, {
            userMessage,
            assistantMessage,
            analysis: {
              emotional: emotionalAnalysis,
              contextual: contextualAnalysis
            }
          }).catch(() => {}),
          userProfileService.actualizarPerfil(req.user._id, userMessage, {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          }).catch(() => {}),
          // Personalización a largo plazo: temas recurrentes, emociones predominantes, topicsOfInterest
          userProfileService.updateLongTermProfileFromConversation(req.user._id, {
            emotionalAnalysis,
            contextualAnalysis
          }).catch(() => {}),
          // Fase 3: Inferir preferencias desde comportamiento (solo si hay suficientes mensajes)
          ...(userMessagesForAnalysis.length >= 5 ? [userProfileService.inferPreferencesFromBehavior(req.user._id, {
            communicationStyle: writingStyle?.confidence >= 0.5 ? { formal: 'formal', casual: 'casual', laconic: 'directo', emotive: 'empatico' }[writingStyle.style] : undefined,
            responseLength: engagement?.engagementLevel !== 'unknown' ? engagement.preferredResponseLength : undefined,
            responseStyle: engagement?.preferredResponseLength === 'SHORT' ? 'brief' : engagement?.preferredResponseLength === 'LONG' ? 'deep' : undefined
          }).catch(() => {})] : [])
        ]).catch(() => {}); // Ignorar errores en operaciones no críticas

        await finalizeChatTurnEnhancements({
          conversationId,
          userId: req.user._id,
          assistantMessageId: assistantMessage._id,
          tccLitePlan,
          suggestionPlan,
          emotionalAnalysis,
          contextualAnalysis,
          userContent: content,
          riskLevel,
        }).catch(() => {});

        scheduleRollingSummaryRefresh({
          conversationId,
          userId: req.user._id,
          isGuest: false
        });

        // OPTIMIZACIÓN: Generar sugerencias solo cuando sea apropiado (no en cada mensaje)
        const responseTime = Date.now() - startTime;
        const blockClinicalExtras = isLlmCrisisTherapeuticExtrasBlocked({
          riskLevel,
          userMessage: content.trim(),
        });
        
        // NUEVO: Verificar si se debe administrar una escala clínica
        let scaleSuggestion = null;
        try {
          if (!blockClinicalExtras) {
            scaleSuggestion = await clinicalScalesService.shouldAdministerScale(
              emotionalAnalysis,
              contextualAnalysis,
              req.user._id
            );
          }
        } catch (error) {
          console.error('[ChatRoutes] Error verificando escalas clínicas:', error);
        }
        
        // NUEVO: Detectar distorsiones cognitivas (ya integrado en contextualAnalysis)
        const cognitiveDistortions = blockClinicalExtras
          ? null
          : contextualAnalysis?.cognitiveDistortions || null;
        const primaryDistortion = contextualAnalysis?.primaryDistortion || null;
        const distortionIntervention = contextualAnalysis?.distortionIntervention || null;
        
        // NUEVO: Guardar distorsiones cognitivas detectadas para reportes (asíncrono)
        if (cognitiveDistortions && cognitiveDistortions.length > 0) {
          Promise.resolve().then(async () => {
            try {
              // SEGURIDAD: Validar y sanitizar datos antes de guardar
              const safeDistortions = cognitiveDistortions
                .filter(d => d && d.type && d.name && typeof d.confidence === 'number')
                .map(d => ({
                  type: String(d.type).substring(0, 50),
                  name: String(d.name).substring(0, 200),
                  confidence: Math.max(0, Math.min(1, d.confidence || 0)),
                  matchedPattern: d.matchedPattern ? String(d.matchedPattern).substring(0, 200) : undefined
                }));
              
              const report = new CognitiveDistortionReport({
                userId: req.user._id,
                messageId: userMessage._id,
                messageContent: content ? String(content).substring(0, 2000).trim() : undefined,
                distortions: safeDistortions,
                primaryDistortion: primaryDistortion && safeDistortions.length > 0 ? {
                  type: String(primaryDistortion.type || '').substring(0, 50),
                  name: String(primaryDistortion.name || '').substring(0, 200),
                  confidence: Math.max(0, Math.min(1, primaryDistortion.confidence || 0)),
                  intervention: distortionIntervention?.intervention 
                    ? String(distortionIntervention.intervention).substring(0, 500) 
                    : undefined
                } : null,
                emotionalContext: {
                  emotion: emotionalAnalysis?.mainEmotion ? String(emotionalAnalysis.mainEmotion).substring(0, 50) : undefined,
                  intensity: typeof emotionalAnalysis?.intensity === 'number' 
                    ? Math.max(0, Math.min(10, emotionalAnalysis.intensity)) 
                    : undefined
                }
              });
              await report.save();
            } catch (error) {
              console.error('[ChatRoutes] Error guardando reporte de distorsiones:', error);
            }
          }).catch(() => {});
        }
        
        // NUEVO: Completar automáticamente la escala si se detecta
        let automaticScaleResult = null;
        if (scaleSuggestion) {
          try {
            // Obtener historial reciente para mejor análisis
            const recentMessages = conversationHistory
              .filter(msg => msg.role === 'user')
              .slice(0, 3)
              .map(msg => ({ content: msg.content || '' }));
            
            // Completar escala automáticamente (síncrono para incluir en respuesta)
            const completedScale = clinicalScalesService.completeScaleAutomatically(
              content,
              scaleSuggestion.scale,
              emotionalAnalysis,
              contextualAnalysis,
              recentMessages
            );
            
            if (completedScale && completedScale.totalScore >= 0) {
              // Guardar resultado de forma asíncrona (no bloquea la respuesta)
              Promise.resolve().then(async () => {
                try {
                  const result = new ClinicalScaleResult({
                    userId: req.user._id,
                    scaleType: scaleSuggestion.scale,
                    totalScore: completedScale.totalScore,
                    itemScores: completedScale.itemScores,
                    interpretation: completedScale.interpretation,
                    administrationMethod: 'automatic',
                    notes: `Completada automáticamente basada en análisis del mensaje. Confianza: ${(completedScale.confidence * 100).toFixed(0)}%`
                  });
                  await result.save();
                  logs.push(`[${Date.now() - startTime}ms] ✅ Escala ${scaleSuggestion.scale} completada automáticamente: ${completedScale.totalScore} puntos`);
                } catch (error) {
                  console.error('[ChatRoutes] Error guardando escala automática:', error);
                }
              }).catch(() => {});
              
              // Incluir resultado en la respuesta
              automaticScaleResult = {
                completed: true,
                totalScore: completedScale.totalScore,
                interpretation: completedScale.interpretation,
                confidence: completedScale.confidence,
                itemScores: completedScale.itemScores.map(item => ({
                  itemId: item.itemId,
                  question: item.question,
                  score: item.score
                }))
              };
              
              logs.push(`[${Date.now() - startTime}ms] 📊 Escala ${scaleSuggestion.scale} completada automáticamente: ${completedScale.totalScore} puntos (${completedScale.interpretation.severity})`);
            }
          } catch (error) {
            console.error('[ChatRoutes] Error completando escala automáticamente:', error);
          }
        }
        
        const clientTurn = buildClientTurnPayload({
          tccLitePlan,
          suggestionPlan,
          language: appLanguageForChat,
          riskLevel,
          userMessage: content.trim(),
        });
        if (suggestionPlan.actionIds?.length > 0) {
          suggestionPlan.actionIds.forEach((suggestionType) => {
            metricsService
              .recordMetric(
                'action_suggestion',
                { action: 'generate', suggestionType },
                req.user._id.toString(),
              )
              .catch(() => {});
          });
        }

        let proposedProductActions = [];
        let productActionStatus = { paused: false, reason: null, askFirst: false };
        try {
          proposedProductActions = chatProductActionProposalService.buildProposedProductActions({
            riskLevel,
            isCrisis,
            userContent: content,
            sessionIntention: conversation?.sessionIntention,
            conversationId,
            assistantMessageId: assistantMessage._id
          });
        } catch (propErr) {
          console.error('[ChatRoutes] proposedProductActions (non-stream):', propErr);
        }

        if (proposedProductActions.length > 0) {
          try {
            const proposalEval =
              await conversationProductProposalCapService.evaluateProposedProductActionsState(
                content,
                conversationId,
                proposedProductActions
              );
            proposedProductActions = proposalEval.actions;
            productActionStatus = proposalEval.status || productActionStatus;
          } catch (capErr) {
            console.warn('[ChatRoutes] product proposal cap (non-stream):', capErr?.message || capErr);
          }
        }

        if (proposedProductActions.length > 0) {
          try {
            proposedProductActions =
              await chatProductActionLlmService.enrichProposedProductActionsWithLlm(
                proposedProductActions,
                {
                  userContent: content,
                  assistantContent: response.content,
                  primaryPsychoeducationId: suggestionPlan.primaryPsychoeducationId,
                  language: appLanguageForChat,
                }
              );
          } catch (llmPropErr) {
            console.warn('[ChatRoutes] proposedProductActions LLM (non-stream):', llmPropErr?.message || llmPropErr);
          }
          metricsService
            .recordMetric(
              'product_action_proposed',
              {
                count: proposedProductActions.length,
                types: proposedProductActions.map((a) => a.type),
                transport: 'http_json'
              },
              req.user._id.toString(),
              { conversationId: String(conversationId) }
            )
            .catch(() => {});
          conversationProductProposalCapService
            .incrementNonExplicitProductProposalCountIfApplied(
              content,
              conversationId,
              proposedProductActions.length
            )
            .catch((incErr) =>
              console.warn('[ChatRoutes] product proposal cap inc (non-stream):', incErr?.message || incErr)
            );
        }
        
        // Registrar métrica de tiempo de respuesta de forma asíncrona
        metricsService.recordMetric('response_generation', {
          time: responseTime,
          success: true
        }, req.user._id.toString()).catch(() => {});
        
        logs.push(`[${Date.now() - startTime}ms] Proceso completado exitosamente`);
        
        return res.status(201).json(attachTurnCrisisResources({
          userMessage,
          assistantMessage,
          context: {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          },
          suggestions: clientTurn.suggestions,
          suggestionsPersonalized: clientTurn.suggestionsPersonalized,
          proposedProductActions,
          productActionStatus,
          // NUEVO: Información de escalas clínicas y distorsiones cognitivas
          clinicalScale: scaleSuggestion ? {
            ...scaleSuggestion,
            suggestion: clinicalScalesService.generateScaleSuggestion(scaleSuggestion.scale, scaleSuggestion.reason),
            automaticResult: automaticScaleResult || null
          } : null,
          cognitiveDistortions: cognitiveDistortions && cognitiveDistortions.length > 0 ? {
            detected: cognitiveDistortions,
            primary: primaryDistortion,
            intervention: distortionIntervention
          } : null,
          tccLite: clientTurn.tccLite,
          processingTime: responseTime
        }));

      } catch (error) {
        logs.push(`[${Date.now() - startTime}ms] Error: ${error.message}`);
        console.error('Error procesando mensaje:', {
          error,
          logs,
          userId: req.user._id,
        });

        metricsService
          .recordMetric(
            'chat_usage',
            {
              action: 'error',
              isGuest: false,
              code: error?.code || error?.status || 'chat_message_error'
            },
            req.user._id.toString(),
            { conversationId: String(conversationId) }
          )
          .catch(() => {});

        metricsService.bumpChatFriction('message_processing_failed', {
          httpStatus: 500,
          surface: 'registered'
        });

        // Si el mensaje del usuario ya se guardó, crear mensaje de error
        if (userMessage._id) {
          assistantMessage = new Message({
            userId: req.user._id,
            content: req.apiCopy.assistantProcessingFallback,
            role: 'assistant',
            conversationId,
            metadata: {
              status: 'sent',
              crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) },
            }
          });

          await assistantMessage.save();
        }

        return res.status(500).json({
          message: req.apiCopy.processMessageError,
          userMessage: userMessage._id ? userMessage : null,
          errorMessage: assistantMessage,
        });
      }
    }

  } catch (error) {
    logs.push(`[${Date.now() - startTime}ms] Error crítico: ${error.message}`);
    console.error('Error crítico en POST /messages:', {
      error,
      logs,
      userId: req?.user?._id
    });

    metricsService
      .recordMetric(
        'chat_usage',
        {
          action: 'error',
          isGuest: false,
          code: error?.code || error?.status || 'chat_messages_critical'
        },
        req?.user?._id?.toString?.() || null,
        { endpoint: '/api/chat/messages' }
      )
      .catch(() => {});

    metricsService.bumpChatFriction('message_post_critical_error', {
      httpStatus: 500,
      surface: 'registered'
    });

    return res.status(500).json({
      message: req.apiCopy.criticalProcessError,
      error: safeErrorMessage(error),
    });
  }
});

// Feedback rápido (útil / poco útil) en mensajes del asistente — usuarios registrados
router.patch('/messages/:messageId/feedback', protect, messageFeedbackLimiter, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { helpful } = req.body;

    if (!mongoose.isValidObjectId(messageId)) {
      metricsService.bumpChatFriction('feedback_invalid_message_id', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({ message: req.apiCopy.messageIdInvalid });
    }

    if (!Object.prototype.hasOwnProperty.call(req.body, 'helpful')) {
      metricsService.bumpChatFriction('feedback_missing_helpful_field', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({ message: req.apiCopy.helpfulRequired });
    }

    if (helpful !== null && helpful !== 'up' && helpful !== 'down') {
      metricsService.bumpChatFriction('feedback_invalid_helpful_value', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({ message: req.apiCopy.helpfulInvalid });
    }

    const oid = new mongoose.Types.ObjectId(messageId);
    const feedbackPayload =
      helpful === null
        ? null
        : { helpful, at: new Date().toISOString() };

    const update =
      helpful === null
        ? { $unset: { 'metadata.userFeedback': '' } }
        : { $set: { 'metadata.userFeedback': feedbackPayload } };

    const updated = await Message.findOneAndUpdate(
      { _id: oid, userId: req.user._id, role: 'assistant' },
      update,
      { new: true, runValidators: false }
    )
      .select('conversationId metadata.userFeedback')
      .lean();

    if (!updated) {
      metricsService.bumpChatFriction('feedback_message_not_found', {
        httpStatus: 404,
        surface: 'registered'
      });
      return res.status(404).json({ message: req.apiCopy.assistantMessageNotFound });
    }

    metricsService
      .recordMetric(
        'message_feedback',
        { helpful: helpful === null ? 'cleared' : helpful, messageId: String(oid) },
        req.user._id.toString(),
        { conversationId: String(updated.conversationId) }
      )
      .catch(() => {});

    metricsService
      .recordMetric(
        'chat_usage',
        { action: 'message_feedback', isGuest: false },
        req.user._id.toString(),
        { conversationId: String(updated.conversationId) }
      )
      .catch(() => {});

    res.json({
      success: true,
      messageId: String(oid),
      userFeedback: updated.metadata?.userFeedback ?? null
    });
  } catch (error) {
    console.error('[ChatRoutes] Error en PATCH /messages/:messageId/feedback:', error);
    metricsService.bumpChatFriction('feedback_server_error', {
      httpStatus: 500,
      surface: 'registered'
    });
    res.status(500).json({
      message: req.apiCopy.ratingSaveError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener todas las conversaciones del usuario con estadísticas
router.get('/conversations', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, cursor, paginationType = 'offset' } = req.query;
    const listLimit = clampInt(limit, { min: 1, max: MAX_CONVERSATION_LIST_LIMIT, fallback: 10 });
    
    // Usar cursor-based pagination si se especifica o si hay muchos resultados
    if (paginationType === 'cursor' || cursor) {
      const result = await cursorPaginate({
        query: { userId: new mongoose.Types.ObjectId(req.user._id) },
        model: Message,
        cursor: cursor || null,
        limit: listLimit,
        sort: { createdAt: -1 },
        select: 'conversationId content role metadata.context.emotional createdAt'
      });
      
      // Agrupar por conversación
      const conversationMap = new Map();
      result.data.forEach(msg => {
        const convId = msg.conversationId.toString();
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            _id: msg.conversationId,
            lastMessage: msg.content,
            lastMessageRole: msg.role,
            updatedAt: msg.createdAt,
            messageCount: 1,
            emotionalContext: msg.metadata?.context?.emotional
          });
        } else {
          const conv = conversationMap.get(convId);
          conv.messageCount++;
          if (msg.createdAt > conv.updatedAt) {
            conv.updatedAt = msg.createdAt;
            conv.lastMessage = msg.content;
            conv.lastMessageRole = msg.role;
            conv.emotionalContext = msg.metadata?.context?.emotional;
          }
        }
      });
      
      const conversations = Array.from(conversationMap.values());

      metricsService.bumpChatExploration('list_conversations', {
        paginationType: 'cursor'
      });
      
      return res.json({
        conversations,
        pagination: {
          type: 'cursor',
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          count: conversations.length
        }
      });
    }
    
    // Paginación tradicional (offset-based)
    const skip = (clampInt(page, { min: 1, max: 10_000, fallback: 1 }) - 1) * listLimit;
    
    // Optimización: Usar índices existentes (userId, createdAt) y proyección
    const conversations = await Message.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(req.user._id) 
        } 
      },
      {
        // Optimización: Proyectar solo campos necesarios antes de agrupar
        $project: {
          conversationId: 1,
          content: 1,
          role: 1,
          createdAt: 1,
          'metadata.status': 1,
          'metadata.context.emotional': 1
        }
      },
      { 
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$content' },
          lastMessageRole: { $last: '$role' },
          updatedAt: { $max: '$createdAt' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$metadata.status', 'sent'] }, 1, 0] }
          },
          emotionalContext: {
            $last: '$metadata.context.emotional'
          }
        }
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: listLimit }
    ]);

    // Calcular estadísticas básicas
    const stats = {
      total: conversations.length,
      active: conversations.filter(c => !c.archived).length,
      archived: conversations.filter(c => c.archived).length
    };

    metricsService.bumpChatExploration('list_conversations', {
      paginationType: 'offset'
    });

    res.json({ 
      conversations,
      stats
    });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    metricsService.bumpChatFriction('list_conversations_server_error', {
      httpStatus: 500,
      surface: 'registered'
    });
    res.status(500).json({
      message: req.apiCopy.listConversationsError,
      error: safeErrorMessage(error)
    });
  }
});

// Actualizar estado de mensajes (sent, delivered, read, failed)
router.patch('/messages/status', protect, patchMessageLimiter, async (req, res) => {
  try {
    const { messageIds, status } = req.body;

    if (!Array.isArray(messageIds) || !messageIds.length) {
      metricsService.bumpChatFriction('message_status_missing_ids', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({
        message: req.apiCopy.messageIdsRequired
      });
    }

    if (messageIds.length > MAX_MESSAGE_STATUS_BATCH) {
      metricsService.bumpChatFriction('message_status_batch_too_large', {
        httpStatus: 400,
        surface: 'registered',
      });
      return res.status(400).json({
        message: req.apiCopy.messageIdsInvalid,
        maxBatch: MAX_MESSAGE_STATUS_BATCH,
      });
    }

    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) {
      metricsService.bumpChatFriction('message_status_invalid_status', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({
        message: req.apiCopy.messageStatusInvalid
      });
    }

    // Validar que todos los IDs son válidos
    const validIds = messageIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== messageIds.length) {
      metricsService.bumpChatFriction('message_status_invalid_message_ids', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({ 
        message: req.apiCopy.messageIdsInvalid 
      });
    }

    // Optimización: Solo verificar existencia, no cargar datos completos
    const messageCount = await Message.countDocuments({ 
      _id: { $in: validIds }, 
      userId: req.user._id 
    });
    
    if (messageCount !== validIds.length) {
      metricsService.bumpChatFriction('message_status_not_owned_or_missing', {
        httpStatus: 400,
        surface: 'registered'
      });
      return res.status(400).json({ 
        message: req.apiCopy.messagesNotOwned 
      });
    }

    // Actualizar estado
    const result = await Message.updateMany(
      {
        _id: { $in: validIds },
        userId: req.user._id
      },
      {
        $set: { 
          'metadata.status': status,
          'metadata.lastStatusUpdate': new Date()
        }
      }
    );

    res.json({
      message: req.apiCopy.messagesUpdated(result.modifiedCount),
      status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error al actualizar estado de mensajes:', error);
    res.status(500).json({
      message: req.apiCopy.updateStatusError,
      error: safeErrorMessage(error)
    });
  }
});

// Eliminar mensajes de una conversación (opcional: filtrar por rol)
router.delete('/conversations/:conversationId', protect, validarConversationId, validarConversacion, deleteConversationLimiter, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role } = req.query;

    const query = {
      conversationId,
      userId: req.user._id,
      ...(role && { role })
    };

    const result = await Message.deleteMany(query);

    if (!role) {
      await resetConversationSessionState(conversationId, { full: true });
    }

    res.json({
      message: req.apiCopy.messagesDeletedSuccess,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar mensajes:', error);
    res.status(500).json({
      message: req.apiCopy.deleteMessagesError,
      error: safeErrorMessage(error)
    });
  }
});

// Búsqueda avanzada de mensajes (por contenido, rol, estado, emociones, fechas)
router.get('/messages/search', protect, async (req, res) => {
  try {
    const { 
      query: searchText,
      role,
      status,
      startDate,
      endDate,
      emotion,
      intensity
    } = req.query;

    const searchQuery = {
      userId: req.user._id,
      ...(searchText && {
        content: {
          $regex: escapeRegexForMongo(String(searchText).trim().slice(0, MAX_SEARCH_QUERY_LENGTH)),
          $options: 'i',
        },
      }),
      ...(role && { role }),
      ...(status && { 'metadata.status': status }),
      ...(emotion && { 'metadata.context.emotional.mainEmotion': emotion }),
      ...(intensity && { 'metadata.context.emotional.intensity': parseInt(intensity) })
    };

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      searchQuery.createdAt = {
        ...(startDate && { $gte: new Date(startDate) }),
        ...(endDate && { $lte: new Date(endDate) })
      };
    }

    // Optimización: Usar proyección para reducir datos transferidos
    const messages = await Message.find(searchQuery)
      .select('content role metadata createdAt') // Solo campos necesarios
      .sort({ createdAt: -1 })
      .limit(LIMITE_MENSAJES)
      .lean();

    res.json({ 
      messages,
      count: messages.length,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error en búsqueda de mensajes:', error);
    res.status(500).json({
      message: req.apiCopy.searchMessagesError,
      error: safeErrorMessage(error)
    });
  }
});

export default router;
