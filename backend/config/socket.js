/**
 * Configuración de Socket.IO - Gestiona conexiones WebSocket en tiempo real
 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { buildHistoryForPromptFromMessages } from '../services/openai/openaiPromptBuilder.js';
import { analyzeConversationPattern } from '../services/chat/conversationPatternAnalyzer.js';
import { buildSessionRetentionPayload, withThematicMicroClosureRetention } from '../services/sessionRetentionHints.js';
import { inferChatSessionPhase } from '../services/chat/sessionPhaseHints.js';
import { HISTORIAL_LIMITE, LIMITE_MENSAJES } from '../routes/chat/chatConstants.js';
import {
  openaiService,
  emotionalAnalyzer,
  contextAnalyzer,
  userProfileService
} from '../services/index.js';
import { sanitizeSessionIntentionForClient } from '../constants/sessionIntention.js';
import { normalizeStoredCrisisRiskLevel, buildOpenaiCrisisContext, shouldIncludeCrisisInOpenaiContext } from '../constants/crisis.js';
import { isLlmCrisisTherapeuticExtrasBlocked } from '../utils/chatObservationalContext.js';
import chatProductActionProposalService from '../services/chatProductActionProposalService.js';
import { recordEngagementSignal } from '../services/engagementStreakService.js';
import { ENGAGEMENT_SIGNAL } from '../utils/engagementStreakWeights.js';
import chatProductActionLlmService from '../services/chatProductActionLlmService.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import conversationProductProposalCapService from '../services/conversationProductProposalCapService.js';
import chatCommitmentProposalService from '../services/chatCommitmentProposalService.js';
import metricsService from '../services/metricsService.js';
import { buildCrisisRoutingMetricData } from '../utils/crisisRoutingMetricPayload.js';
import crisisBackgroundActionsService from '../services/crisisBackgroundActionsService.js';
import { resolveCrisisRiskAndContext } from '../services/crisisBackgroundContextService.js';
import intenseChatCheckInService from '../services/intenseChatCheckInService.js';
import { scheduleRollingSummaryRefresh } from '../services/conversationRollingSummaryService.js';
import {
  planChatTurnEnhancements,
  buildOpenaiEnhancementSnippets,
  buildAssistantMetadataWithEnhancements,
  finalizeChatTurnEnhancements,
  persistProposedCommitmentsOnMessage,
  buildClientTurnPayload,
} from '../services/chatTurnEnhancementsService.js';
import { shouldShowCommitmentFollowUpChips } from '../services/commitmentFollowUpService.js';
import {
  shouldHardStopCrisisLlm,
  buildHardStopCrisisAssistantContent,
  buildCrisisHardStopClientPayload,
} from '../services/crisisHardStopService.js';
import { crisisResourcesForTurn } from '../services/crisisResourcesService.js';
import { applyCrisisProtocolForTurn } from '../services/crisisTurnClientExtrasService.js';
import { hasCrisisBatterySignal } from '../services/crisisProtocolService.js';
import { indexPersonalPatternFromUserMessage } from '../services/personalPatternRagService.js';
import { resolveChatConversationForSocket } from '../utils/resolveChatConversationForSocket.js';
import { buildSocketChatErrorPayload } from '../utils/socketChatErrorPayload.js';
import {
  buildStreamingTtftMetrics,
  streamingTtftMetricPayload,
} from '../utils/chatStreamingMetrics.js';

// Constantes de configuración
const DEFAULT_FRONTEND_URLS = ['http://localhost:3000', 'http://localhost:19006'];
const PING_TIMEOUT = 60000; // 60 segundos
const PING_INTERVAL = 25000; // 25 segundos

// Constantes de mensajes de error
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Autenticación requerida',
  INVALID_TOKEN: 'Token inválido',
  USER_NOT_AUTHENTICATED: 'Usuario no autenticado'
};

// Constantes de eventos de socket
const SOCKET_EVENTS = {
  AUTHENTICATE: 'authenticate',
  MESSAGE: 'message',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_CHUNK: 'message:chunk',
  MESSAGE_RECEIVED: 'message:received',
  AI_TYPING: 'ai:typing',
  CANCEL_RESPONSE: 'cancel:response',
  ERROR: 'error',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  // Eventos de alertas de emergencia
  EMERGENCY_ALERT_SENT: 'emergency:alert:sent',
  EMERGENCY_ALERT_UPDATED: 'emergency:alert:updated',
};

// Helper: obtener URLs permitidas para CORS
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    return Array.isArray(frontendUrl) ? frontendUrl : [frontendUrl];
  }
  return DEFAULT_FRONTEND_URLS;
};

// Helper: verificar y decodificar token JWT
const verifySocketToken = (token) => {
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Configura y inicializa Socket.IO
 * @param {Object} server - Servidor HTTP de Express
 * @returns {Object} Instancia de Socket.IO configurada
 */
export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: PING_TIMEOUT,
    pingInterval: PING_INTERVAL
  });

  // Middleware de autenticación para sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const payload = verifySocketToken(token);
      socket.user = payload;
      next();
    } catch (error) {
      return next(new Error(error.message));
    }
  });

  // Manejo de eventos de conexión
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log('[SocketIO] Usuario conectado:', socket.id);
    
    let currentUserId = null;
    let responseTimeout = null;
    socket._chatTurnControl = null;
    
    /**
     * Autenticación del socket
     * El cliente debe enviar su userId para unirse a su sala personal
     */
    socket.on(SOCKET_EVENTS.AUTHENTICATE, ({ userId }) => {
      if (!userId) {
        socket.emit(SOCKET_EVENTS.ERROR, { 
          message: 'userId es requerido para autenticación' 
        });
        return;
      }
      
      currentUserId = userId;
      socket.join(userId); // Unir al socket a una sala específica del usuario
      console.log(`[SocketIO] Socket ${socket.id} autenticado como usuario ${currentUserId}`);
    });
    
    /**
     * Manejo de mensajes del usuario
     * Procesa mensajes y genera respuestas usando OpenAI
     */
    socket.on(SOCKET_EVENTS.MESSAGE, async (data) => {
      try {
        // Validar que el usuario esté autenticado
        if (!currentUserId) {
          throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
        }

        if (socket._chatTurnControl) {
          socket._chatTurnControl.aborted = true;
        }
        const turnControl = { aborted: false };
        socket._chatTurnControl = turnControl;
        const turnStartTime = Date.now();
        
        // Validar que el mensaje tenga contenido
        if (!data || !data.text || typeof data.text !== 'string' || !data.text.trim()) {
          throw new Error('El mensaje debe contener un texto válido');
        }
        
        const messageText = data.text.trim();
        const userId = new mongoose.Types.ObjectId(currentUserId);
        
        // Emitir estado de escritura de la IA
        socket.emit(SOCKET_EVENTS.AI_TYPING, true);
        
        // 1. Conversación del cliente (misma regla que HTTP/SSE)
        const conversation = await resolveChatConversationForSocket({
          userId,
          conversationId: data?.conversationId,
        });
        
        // 2. Guardar mensaje del usuario
        const userMessage = new Message({
          userId: userId,
          content: messageText,
          role: 'user',
          conversationId: conversation._id,
          metadata: {
            status: 'sent'
          }
        });
        await userMessage.save();
        recordEngagementSignal(userId, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE).catch(() => {});
        
        // Emitir confirmación de mensaje enviado
        socket.emit(SOCKET_EVENTS.MESSAGE_SENT, {
          id: userMessage._id.toString(),
          text: messageText,
          userId: currentUserId,
          conversationId: conversation._id.toString(),
          timestamp: new Date()
        });
        
        // 3. Historial acotado por cantidad (misma conversación), sin ventana temporal
        const [conversationHistory, priorConversationCount] = await Promise.all([
          Message.find({
            conversationId: conversation._id
          })
            .select('content role metadata.context.emotional createdAt')
            .sort({ createdAt: -1 })
            .limit(HISTORIAL_LIMITE)
            .lean(),
          Conversation.countDocuments({
            userId: userId,
            _id: { $ne: conversation._id }
          }).catch(() => null)
        ]);

        const conversationPattern = analyzeConversationPattern(conversationHistory, messageText);

        // 4. Análisis emocional y contextual (en paralelo)
        const [emotionalAnalysis, contextualAnalysis, userProfile, socketUser] = await Promise.all([
          emotionalAnalyzer.analyzeEmotion(messageText).catch(err => {
            console.error('[SocketIO] Error en análisis emocional:', err);
            return null;
          }),
          contextAnalyzer.analizarMensaje(userMessage, conversationHistory).catch(err => {
            console.error('[SocketIO] Error en análisis contextual:', err);
            return null;
          }),
          userProfileService.getOrCreateProfile(userId).catch(err => {
            console.error('[SocketIO] Error obteniendo perfil:', err);
            return null;
          }),
          User.findById(userId).select('preferences phone').lean().catch(() => null),
        ]);

        const {
          riskLevel,
          trendAnalysis,
          crisisHistory,
          conversationContext,
        } = await resolveCrisisRiskAndContext({
          userId,
          emotionalAnalysis: emotionalAnalysis || {},
          contextualAnalysis: contextualAnalysis || {},
          messageContent: messageText,
          conversationHistory,
        });
        try {
          userMessage.metadata = {
            ...(userMessage.metadata?.toObject?.() || userMessage.metadata || {}),
            crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) }
          };
          userMessage.markModified('metadata');
          await userMessage.save();
        } catch (persistRiskMetaErr) {
          console.warn('[SocketIO] metadata.crisis en mensaje usuario:', persistRiskMetaErr?.message);
        }
        indexPersonalPatternFromUserMessage({
          userId,
          conversationId: conversation._id,
          content: messageText,
          riskLevel,
        }).catch(() => {});
        const isCrisis =
          riskLevel === 'MEDIUM' ||
          riskLevel === 'HIGH' ||
          (contextualAnalysis?.intencion?.tipo === 'CRISIS' &&
            contextualAnalysis?.intencion?.confianza >= 0.9 &&
            riskLevel !== 'LOW');

        let crisisBgResult = null;
        try {
          crisisBgResult = await crisisBackgroundActionsService.runCrisisBackgroundActions({
            userId,
            messageId: userMessage._id,
            messageContent: messageText,
            riskLevel,
            emotionalAnalysis,
            contextualAnalysis,
            trendAnalysis,
            crisisHistory,
            conversationContext,
            conversationId: conversation._id,
            transport: 'socket',
            isCrisis,
          });
        } catch (bgErr) {
          console.error('[SocketIO] Error en acciones de crisis en segundo plano:', bgErr);
        }

        const sessionPhase = inferChatSessionPhase({
          riskLevel,
          contextualAnalysis: contextualAnalysis || {},
          userContent: messageText,
          conversationHistoryNewestFirst: conversationHistory
        });
        const sessionRetention = withThematicMicroClosureRetention(
          buildSessionRetentionPayload({
            conversationHistoryNewestFirst: conversationHistory,
            userContent: messageText,
            priorConversationCount,
            threadMessageLimit: LIMITE_MENSAJES,
            conversationPattern
          }),
          { sessionPhase, conversationHistoryNewestFirst: conversationHistory }
        );

        // 5. Preparar historial para el prompt
        const historialParaPrompt = buildHistoryForPromptFromMessages(conversationHistory, {
          emotional: emotionalAnalysis,
          contextual: contextualAnalysis,
          currentMessage: messageText,
          _promptTelemetry: {
            userId,
            conversationId: conversation._id,
            source: 'socket',
            callSite: 'buildHistoryForPromptFromMessages'
          }
        });
        
        // 6. Extras de turno (sugerencias, TCC lite, protocolos activos)
        const sessionIntentionSafe = sanitizeSessionIntentionForClient(conversation.sessionIntention);
        const socketLanguage = normalizeApiLanguage(
          data?.language ||
            userProfile?.preferences?.language ||
            userProfile?.language ||
            'es',
        );
        const socketPreferences = {
          ...(userProfile?.preferences || {}),
          ...(socketUser?.preferences || {}),
        };
        const willHardStop = shouldHardStopCrisisLlm({
          riskLevel,
          messageContent: messageText,
        });
        let crisisTurnClientExtras = await applyCrisisProtocolForTurn({
          conversation,
          userId,
          user: socketUser,
          riskLevel,
          messageContent: messageText,
          contextualAnalysis,
          trendAnalysis,
          crisisHistory,
          conversationContext,
          hardStop: willHardStop,
          isCrisis,
          hadContactAlert: crisisBgResult?.alertSent === true,
          language: socketLanguage,
          preferences: socketPreferences,
          phone: socketUser?.phone || null,
        });
        const buildSocketCrisisPayload = ({ hardStop = false } = {}) => {
          const protocolActive = crisisTurnClientExtras?.crisisProtocolState?.active === true;
          const batterySignal = hasCrisisBatterySignal(
            messageText,
            crisisTurnClientExtras?.crisisDecision,
          );
          if (hardStop) {
            crisisTurnClientExtras = {
              ...crisisTurnClientExtras,
              crisisResources: crisisResourcesForTurn({
                riskLevel,
                hardStop: true,
                isCrisis: true,
                hasBatterySignal: batterySignal,
                crisisProtocolActive: protocolActive,
                preferences: socketPreferences,
                phone: socketUser?.phone || null,
                language: socketLanguage,
                showContactAlertNotice:
                  crisisTurnClientExtras?.crisisProtocolState?.hadContactAlert === true ||
                  crisisBgResult?.alertSent === true,
              }),
            };
          }
          const crisisResources =
            crisisTurnClientExtras?.crisisResources ??
            crisisResourcesForTurn({
              riskLevel,
              hardStop,
              isCrisis,
              hasBatterySignal: batterySignal,
              crisisProtocolActive: protocolActive,
              preferences: socketPreferences,
              phone: socketUser?.phone || null,
              language: socketLanguage,
              showContactAlertNotice:
                crisisTurnClientExtras?.crisisProtocolState?.hadContactAlert === true ||
                crisisBgResult?.alertSent === true,
            });
          return {
            ...(crisisResources ? { crisisResources } : {}),
            ...(crisisTurnClientExtras?.proposedEmergencyContactAlert
              ? {
                  proposedEmergencyContactAlert:
                    crisisTurnClientExtras.proposedEmergencyContactAlert,
                }
              : {}),
            ...(crisisTurnClientExtras?.softCrisisCheckIn
              ? { softCrisisCheckIn: crisisTurnClientExtras.softCrisisCheckIn }
              : {}),
          };
        };

        const turnEnhancements = await planChatTurnEnhancements({
          userId,
          conversationId: conversation._id,
          userContent: messageText,
          conversationHistory,
          emotionalAnalysis,
          contextualAnalysis,
          riskLevel,
          sessionIntention: sessionIntentionSafe,
          language: socketLanguage,
          resumeTccLite:
            data?.resumeTccLite && typeof data.resumeTccLite === 'object'
              ? data.resumeTccLite
              : null,
          resumeCommitmentFollowUp: data?.resumeCommitmentFollowUp === true,
          isCrisis,
        });
        const promptSnippets = buildOpenaiEnhancementSnippets(turnEnhancements, {
          blockCrisisExtras: isLlmCrisisTherapeuticExtrasBlocked({
            riskLevel,
            userMessage: messageText,
          }),
        });
        const showCommitmentFollowUpChips = shouldShowCommitmentFollowUpChips({
          conversationHistory,
          forceFollowUp: data?.resumeCommitmentFollowUp === true,
        });

        const crisisHardStopContent = willHardStop
          ? buildHardStopCrisisAssistantContent({
              riskLevel,
              language: socketLanguage,
              preferences: {
                ...(userProfile?.preferences || {}),
                ...(socketUser?.preferences || {}),
              },
              phone: socketUser?.phone || null,
              resourcesDeliveredInPanel: true,
            })
          : null;

        if (crisisHardStopContent) {
          metricsService
            .recordMetric(
              'crisis_hard_stop',
              buildCrisisRoutingMetricData({
                riskLevel,
                transport: 'socket',
                messageContent: messageText,
              }),
              userId.toString(),
              { conversationId: String(conversation._id) }
            )
            .catch(() => {});

          const assistantMessage = new Message({
            userId,
            content: crisisHardStopContent,
            role: 'assistant',
            conversationId: conversation._id,
            metadata: buildAssistantMetadataWithEnhancements(
              {
                status: 'sent',
                crisis: {
                  riskLevel: normalizeStoredCrisisRiskLevel(riskLevel),
                  hardStop: true,
                },
                context: {
                  emotional: emotionalAnalysis,
                  contextual: contextualAnalysis,
                  response: JSON.stringify({ crisisHardStop: true }),
                },
              },
              { active: false },
              socketLanguage,
            ),
          });
          await assistantMessage.save();
          await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: assistantMessage._id,
          });

          intenseChatCheckInService
            .maybeSchedule({
              userId,
              conversationId: conversation._id,
              assistantMessageId: assistantMessage._id,
              emotionalAnalysis,
              riskLevel,
              isCrisis: true,
            })
            .catch(() => {});

          scheduleRollingSummaryRefresh({
            conversationId: conversation._id,
            userId,
            isGuest: false,
          }).catch(() => {});

          const clientTurn = buildCrisisHardStopClientPayload(socketLanguage);
          socket.emit(SOCKET_EVENTS.MESSAGE_CHUNK, {
            content: crisisHardStopContent,
            conversationId: conversation._id.toString(),
          });
          socket.emit(SOCKET_EVENTS.AI_TYPING, false);
          socket.emit(SOCKET_EVENTS.MESSAGE_RECEIVED, {
            id: assistantMessage._id.toString(),
            text: crisisHardStopContent,
            userId: currentUserId,
            conversationId: conversation._id.toString(),
            timestamp: new Date(),
            crisisHardStop: true,
            proposedProductActions: [],
            proposedCommitments: [],
            productActionStatus: { paused: false, reason: null, askFirst: false },
            suggestions: clientTurn.suggestions,
            suggestionsPersonalized: clientTurn.suggestionsPersonalized,
            tccLite: clientTurn.tccLite,
            ...buildSocketCrisisPayload({ hardStop: true }),
          });
          return;
        }

        if (
          shouldIncludeCrisisInOpenaiContext(riskLevel, {
            isCrisis,
            userMessage: messageText,
          })
        ) {
          metricsService
            .recordMetric(
              'crisis_llm_path',
              buildCrisisRoutingMetricData({
                riskLevel,
                transport: 'socket',
                messageContent: messageText,
              }),
              userId.toString(),
              { conversationId: String(conversation._id) },
            )
            .catch(() => {});
        }

        const responseStrategyHint =
          sessionIntentionSafe === 'vent'
            ? 'validate_first_then_action'
            : sessionIntentionSafe === 'plan'
              ? 'action_first_then_validation'
              : 'balanced';
        const openaiContext = {
          rollingSummary: conversation?.rollingSummary || null,
          sessionPhase,
          safetyHistory: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content || '',
          })),
          history: historialParaPrompt,
          emotional: emotionalAnalysis,
          contextual: contextualAnalysis,
          profile: userProfile,
          currentConversationId: conversation._id,
          sessionPhase,
          sessionRetention,
          conversationPattern,
          sessionIntention: sessionIntentionSafe,
          responseStrategyHint,
          psychoeducationPromptSnippet: promptSnippets.psychoeducationPromptSnippet,
          activeTccProtocolsPromptSnippet: promptSnippets.activeTccProtocolsPromptSnippet,
          tccLitePromptSnippet: promptSnippets.tccLitePromptSnippet,
          digitalPhenotypePromptSnippet: promptSnippets.digitalPhenotypePromptSnippet,
          recentAbcPromptSnippet: promptSnippets.recentAbcPromptSnippet,
          personalPatternRagPromptSnippet: promptSnippets.personalPatternRagPromptSnippet,
          commitmentFollowUpPromptSnippet: promptSnippets.commitmentFollowUpPromptSnippet,
          sessionCommitmentPromptSnippet: promptSnippets.sessionCommitmentPromptSnippet,
          crisis: buildOpenaiCrisisContext({
            riskLevel,
            isCrisis,
            userMessage: messageText,
            preferences: {
              ...(userProfile?.preferences || {}),
              ...(socketUser?.preferences || {}),
            },
            phone: socketUser?.phone || null,
          }),
          crisisMetricTransport: 'socket',
          _promptTelemetry: {
            userId,
            conversationId: conversation._id,
            source: 'socket',
            callSite: 'buildHistoryForPromptFromMessages',
          },
        };

        metricsService
          .recordMetric(
            'chat_usage',
            { action: 'streaming_request', isGuest: false },
            userId.toString(),
            {
              conversationId: String(conversation._id),
              transport: 'socket',
              endpoint: 'chat',
              surface: 'registered',
              streaming: true,
            },
          )
          .catch(() => {});

        const preLlmEndAt = Date.now();
        let firstChunkAt = null;
        let streamResponse = null;

        for await (const event of openaiService.generarRespuestaStream(userMessage, openaiContext)) {
          if (turnControl.aborted) {
            socket.emit(SOCKET_EVENTS.AI_TYPING, false);
            return;
          }
          if (event.type === 'chunk') {
            const chunkText = typeof event.content === 'string' ? event.content : '';
            if (!chunkText) continue;
            if (!firstChunkAt) {
              firstChunkAt = Date.now();
              const ttftMetrics = buildStreamingTtftMetrics({
                startTime: turnStartTime,
                preLlmEndAt,
                firstChunkAt,
              });
              metricsService
                .recordMetric(
                  'chat_usage',
                  {
                    action: 'streaming_first_chunk',
                    isGuest: false,
                    ...streamingTtftMetricPayload(ttftMetrics),
                  },
                  userId.toString(),
                  {
                    conversationId: String(conversation._id),
                    transport: 'socket',
                    endpoint: 'chat',
                    surface: 'registered',
                    streaming: true,
                  },
                )
                .catch(() => {});
            }
            socket.emit(SOCKET_EVENTS.MESSAGE_CHUNK, {
              content: chunkText,
              conversationId: conversation._id.toString(),
            });
          } else if (event.type === 'done') {
            streamResponse = { content: event.content, context: event.context };
            break;
          }
        }

        if (turnControl.aborted) {
          socket.emit(SOCKET_EVENTS.AI_TYPING, false);
          return;
        }

        if (!streamResponse?.content) {
          throw new Error('Respuesta vacía del stream de chat');
        }

        if (!firstChunkAt && streamResponse.content) {
          socket.emit(SOCKET_EVENTS.MESSAGE_CHUNK, {
            content: streamResponse.content,
            conversationId: conversation._id.toString(),
            synthetic: true,
          });
        }

        const response = streamResponse;
        
        // 7. Guardar mensaje del asistente
        const assistantMessage = new Message({
          userId: userId,
          content: response.content,
          role: 'assistant',
          conversationId: conversation._id,
          metadata: buildAssistantMetadataWithEnhancements(
            {
              status: 'sent',
              crisis: { riskLevel: normalizeStoredCrisisRiskLevel(riskLevel) },
              context: {
                emotional: emotionalAnalysis,
                contextual: contextualAnalysis,
                response: JSON.stringify(response.context)
              }
            },
            turnEnhancements.tccLitePlan,
            socketLanguage,
          ),
        });
        await assistantMessage.save();

        intenseChatCheckInService
          .maybeSchedule({
            userId,
            conversationId: conversation._id,
            assistantMessageId: assistantMessage._id,
            emotionalAnalysis,
            riskLevel,
            isCrisis,
          })
          .catch(() => {});

        await finalizeChatTurnEnhancements({
          conversationId: conversation._id,
          userId,
          assistantMessageId: assistantMessage._id,
          tccLitePlan: turnEnhancements.tccLitePlan,
          suggestionPlan: turnEnhancements.suggestionPlan,
          emotionalAnalysis,
          contextualAnalysis,
          userContent: messageText,
          riskLevel,
          commitmentFollowUpPlan: turnEnhancements.commitmentFollowUpPlan,
          commitmentFollowUpCommitmentId: turnEnhancements.commitmentFollowUpCommitmentId,
          showCommitmentFollowUpChips,
        }).catch(() => {});
        
        // 8. Actualizar última conversación
        await Conversation.findByIdAndUpdate(conversation._id, { 
          lastMessage: assistantMessage._id 
        });

        let proposedProductActions = [];
        let productActionStatus = { paused: false, reason: null, askFirst: false };
        const productActionEnrichmentCtx =
          chatProductActionProposalService.resolveProductActionEnrichmentContext({
            userContent: messageText,
            assistantContent: response.content,
            conversationHistory,
          });
        try {
          proposedProductActions = chatProductActionProposalService.buildProposedProductActions({
            riskLevel,
            isCrisis,
            userContent: messageText,
            sessionIntention: conversation?.sessionIntention,
            conversationId: conversation._id,
            assistantMessageId: assistantMessage._id,
            conversationHistory,
          });
        } catch (propErr) {
          console.error('[SocketIO] proposedProductActions:', propErr);
        }
        if (proposedProductActions.length > 0) {
          try {
            const proposalEval =
              await conversationProductProposalCapService.evaluateProposedProductActionsState(
                messageText,
                conversation._id,
                proposedProductActions
              );
            proposedProductActions = proposalEval.actions;
            productActionStatus = proposalEval.status || productActionStatus;
          } catch (capErr) {
            console.warn('[SocketIO] product proposal cap:', capErr?.message || capErr);
          }
        }
        if (proposedProductActions.length > 0) {
          try {
            proposedProductActions =
              await chatProductActionLlmService.enrichProposedProductActionsWithLlm(
                proposedProductActions,
                {
                  userContent: productActionEnrichmentCtx.userContent,
                  assistantContent: productActionEnrichmentCtx.assistantContent,
                  primaryPsychoeducationId:
                    turnEnhancements.suggestionPlan?.primaryPsychoeducationId || null,
                  language: socketLanguage,
                }
              );
          } catch (llmPropErr) {
            console.warn('[SocketIO] proposedProductActions LLM:', llmPropErr?.message || llmPropErr);
          }
          metricsService
            .recordMetric(
              'product_action_proposed',
              {
                count: proposedProductActions.length,
                types: proposedProductActions.map((a) => a.type),
                transport: 'socket'
              },
              currentUserId,
              { conversationId: String(conversation._id) }
            )
            .catch(() => {});
          conversationProductProposalCapService
            .incrementNonExplicitProductProposalCountIfApplied(
              messageText,
              conversation._id,
              proposedProductActions.length
            )
            .catch((incErr) =>
              console.warn('[SocketIO] product proposal cap inc:', incErr?.message || incErr)
            );
        }

        const proposedCommitments =
          proposedProductActions.length > 0
            ? []
            : await chatCommitmentProposalService.resolveProposedCommitmentsForTurn(
                {
                  userId,
                  riskLevel,
                  isCrisis,
                  userContent: messageText,
                  assistantContent: response.content,
                  sessionIntention: conversation?.sessionIntention,
                  conversationId: conversation._id,
                  assistantMessageId: assistantMessage._id,
                  interventionId: turnEnhancements.suggestionPlan?.primaryPsychoeducationId || null,
                },
                { transport: 'socket' },
              );

        await persistProposedCommitmentsOnMessage(
          assistantMessage._id,
          proposedCommitments,
        ).catch(() => {});
        
        const clientTurn = buildClientTurnPayload({
          tccLitePlan: turnEnhancements.tccLitePlan,
          suggestionPlan: turnEnhancements.suggestionPlan,
          language: socketLanguage,
          riskLevel,
          userMessage: messageText,
          commitmentFollowUpPlan: turnEnhancements.commitmentFollowUpPlan,
          showCommitmentFollowUpChips,
        });
        // 9. Emitir respuesta al cliente
        metricsService
          .recordMetric(
            'chat_usage',
            {
              action: 'streaming_done',
              isGuest: false,
              timeToDoneMs: Date.now() - turnStartTime,
            },
            userId.toString(),
            {
              conversationId: String(conversation._id),
              transport: 'socket',
              endpoint: 'chat',
              surface: 'registered',
              streaming: true,
            },
          )
          .catch(() => {});

        socket.emit(SOCKET_EVENTS.AI_TYPING, false);
        socket.emit(SOCKET_EVENTS.MESSAGE_RECEIVED, {
          id: assistantMessage._id.toString(),
          text: response.content,
          userId: currentUserId,
          conversationId: conversation._id.toString(),
          timestamp: new Date(),
          proposedProductActions,
          proposedCommitments,
          productActionStatus,
          suggestions: clientTurn.suggestions,
          suggestionsPersonalized: clientTurn.suggestionsPersonalized,
          tccLite: clientTurn.tccLite,
          commitmentFollowUp: clientTurn.commitmentFollowUp,
          ...buildSocketCrisisPayload(),
        });
        
        console.log(`[SocketIO] Mensaje procesado para usuario ${currentUserId}`);
        
      } catch (error) {
        console.error('[SocketIO] Error en el manejo del mensaje:', error);
        socket.emit(SOCKET_EVENTS.AI_TYPING, false);
        socket.emit(SOCKET_EVENTS.ERROR, buildSocketChatErrorPayload(error));
      }
    });
    
    /**
     * Cancelar respuesta en proceso
     * Permite al usuario cancelar una respuesta que se está generando
     */
    socket.on(SOCKET_EVENTS.CANCEL_RESPONSE, () => {
      if (socket._chatTurnControl) {
        socket._chatTurnControl.aborted = true;
      }
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      socket.emit(SOCKET_EVENTS.AI_TYPING, false);
      console.log(`[SocketIO] Respuesta cancelada por usuario ${currentUserId}`);
    });
    
    /**
     * Manejo de desconexión
     * Limpia recursos y notifica la desconexión
     */
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      if (socket._chatTurnControl) {
        socket._chatTurnControl.aborted = true;
        socket._chatTurnControl = null;
      }
      // Limpiar timeout si existe
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      
      // Salir de la sala del usuario
      if (currentUserId) {
        socket.leave(currentUserId);
        console.log(`[SocketIO] Usuario ${currentUserId} desconectado del socket ${socket.id}`);
      } else {
        console.log(`[SocketIO] Usuario desconectado: ${socket.id}`);
      }
    });
  });

  // Exportar instancia de io y eventos para uso en otros módulos
  io.SOCKET_EVENTS = SOCKET_EVENTS;
  
  return io;
};

// Helper: Emitir evento de alerta de emergencia a un usuario específico
export const emitEmergencyAlert = (io, userId, alertData) => {
  if (!io || !userId) {
    console.error('[SocketIO] No se puede emitir alerta: io o userId no válidos');
    return;
  }
  
  try {
    io.to(userId.toString()).emit(SOCKET_EVENTS.EMERGENCY_ALERT_SENT, {
      ...alertData,
      timestamp: new Date().toISOString()
    });
    console.log(`[SocketIO] ✅ Alerta de emergencia emitida a usuario ${userId}`);
  } catch (error) {
    console.error('[SocketIO] Error emitiendo alerta de emergencia:', error);
  }
};
