/**
 * Servicio de Métricas y Monitoreo
 * 
 * Recolecta y almacena métricas del sistema para análisis y monitoreo
 */
import mongoose from 'mongoose';

// Schema de métricas (opcional, puede usarse en memoria también)
const metricsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  type: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  data: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

// Índices para consultas eficientes
metricsSchema.index({ timestamp: -1, type: 1 });
metricsSchema.index({ userId: 1, timestamp: -1 });

// Solo crear modelo si no existe
let Metric;
try {
  Metric = mongoose.models.Metric || mongoose.model('Metric', metricsSchema);
} catch (error) {
  Metric = mongoose.model('Metric', metricsSchema);
}

class MetricsService {
  constructor() {
    // Métricas en memoria (para acceso rápido)
    this.inMemoryMetrics = {
      chatUsage: {
        conversationsCreated: 0,
        messagesUserSaved: 0,
        messagesAssistantSaved: 0,
        messageFeedbackEvents: 0,
        streamingRequests: 0,
        streamingResponsesCompleted: 0,
        streamingFirstChunks: 0,
        ttftMsSamples: [],
        nonStreamLatencyMsSamples: [],
        /**
         * Latencia por ruta/superficie (solo memoria).
         * Key sugerida: `${transport}:${endpoint}:${surface}`.
         */
        latencyByRoute: {},
        guestSessionsCreated: 0,
        guestMessagesUserSaved: 0,
        guestMessagesAssistantSaved: 0,
        errors: 0,
        errorsByCode: {},
        avgUserMessageChars: 0,
        avgAssistantMessageChars: 0,
        /** Solo memoria: rechazos 4xx y señales de producto (sin persistir en Mongo por evento). */
        friction: {
          total: 0,
          byReason: {},
          byHttpStatus: {},
          bySurface: { registered: 0, guest: 0 }
        },
        /** Solo memoria: cómo exploran el chat (GETs). */
        exploration: {
          listConversations: 0,
          listConversationsByPagination: { offset: 0, cursor: 0 },
          loadConversationMessages: 0,
          loadMessagesByPage: { first_page: 0, other_page: 0 },
          guestLoadConversationMessages: 0
        }
      },
      emotionalAnalysis: {
        total: 0,
        byEmotion: {},
        bySubtype: {},
        byTopic: {},
        averageIntensity: 0,
        averageConfidence: 0
      },
      sessionMemory: {
        activeSessions: 0,
        totalAnalyses: 0,
        averageSessionLength: 0
      },
      therapeuticTemplates: {
        usage: {},
        effectiveness: {}
      },
      protocols: {
        started: 0,
        completed: 0,
        byType: {}
      },
      actionSuggestions: {
        generated: 0,
        clicked: 0,
        byType: {}
      },
      /** Propuestas tarea/hábito desde chat (CONTRATO_CHAT_ACCIONES_V1). */
      productActionProposals: {
        events: 0,
        proposalsEmitted: 0,
        byTransport: {}
      },
      /** Resultados tras confirmación o abandono (memoria + historial; ver §8 contrato). */
      productActionOutcomes: {
        created: 0,
        createdFromChat: 0,
        idempotentFromChat: 0,
        createFailed: 0,
        createFailedFromChat: 0,
        confirmDismissed: 0,
        bySurface: {}
      },
      responseGeneration: {
        total: 0,
        averageTime: 0,
        errors: 0
      },
      promptHistoryTruncation: {
        events: 0,
        truncatedEvents: 0,
        tailOnlyEvents: 0,
        sumDroppedTotal: 0,
        sumNonempty: 0,
        maxDroppedInEvent: 0,
        bySource: {},
        byCallSite: {}
      },
      /** Contadores ligeros en memoria: todas las selecciones vs truncadas (sin escribir en Mongo por mensaje). */
      promptHistorySelectionSamples: {
        totalSelections: 0,
        truncatedSelections: 0
      },
      /** Respuestas del asistente: frases tipo plantilla y solapamiento con el último mensaje del usuario. */
      chatTemplateSignals: {
        total: 0,
        sumStockScore: 0,
        sumEchoRatio: 0,
        sumEchoUsefulRatio: 0,
        sumEchoEmptyRatio: 0,
        hitsByPhrase: {},
        byResponseStyle: {},
        byChatPrefsKey: {}
      },
      /** Pulgar arriba/abajo en mensajes del asistente */
      messageFeedback: {
        up: 0,
        down: 0,
        cleared: 0
      },
      /** Telemetría de política de turno y carga conversacional. */
      chatTurnPolicy: {
        total: 0,
        questionStreakOver2: 0,
        shortReplyStreakOver2: 0,
        closureRiskSignals: 0,
        cognitiveLoadByType: {}
      },
      /** Camino A vs B en crisis (#205 / camino B fase 3). */
      crisisRouting: {
        hardStop: 0,
        llmPath: 0,
        sanitizedResponses: 0,
        byRiskLevel: {},
        byTransport: {},
        hardStopByRiskLevel: {},
        llmPathByRiskLevel: {},
        hardStopByTransport: {},
        llmPathByTransport: {},
        sanitizeHits: {},
        sanitizedByTransport: {},
        sanitizedByRiskLevel: {},
      },
      /** Acciones en segundo plano §3 (push, CrisisEvent, alertas). */
      crisisBackgroundActions: {
        total: 0,
        errors: 0,
        byRiskLevel: {},
        byTransport: {},
        byPhase: { sync: 0, async: 0 },
        byAction: {},
      },
    };

    // Historial de métricas (últimas 1000 entradas)
    this.metricsHistory = [];
    this.MAX_HISTORY_SIZE = 1000;

    /** Límite defensivo de keys en latencyByRoute (evita crecimiento sin límite). */
    this.MAX_LATENCY_ROUTES = 30;
  }

  /**
   * Registra una métrica
   * @param {string} type - Tipo de métrica
   * @param {Object} data - Datos de la métrica
   * @param {string} userId - ID del usuario (opcional)
   * @param {Object} metadata - Metadata adicional (opcional)
   */
  /**
   * Muestra en memoria cada llamada a selectHistoryForPrompt (barato; no persiste en Mongo).
   * @param {{ truncated?: boolean }} data
   */
  recordPromptHistorySelectionSample(data) {
    const s = this.inMemoryMetrics.promptHistorySelectionSamples;
    s.totalSelections++;
    if (data.truncated) s.truncatedSelections++;
  }

  /**
   * Fricción de producto (4xx esperados, validaciones): solo contadores en memoria.
   * @param {string} reason - Clave estable (snake_case), p. ej. subscription_required_for_chat
   * @param {{ httpStatus?: number, surface?: 'registered' | 'guest' }} [opts]
   */
  bumpChatFriction(reason, opts = {}) {
    try {
      if (!reason || typeof reason !== 'string') return;
      const { httpStatus = null, surface = 'registered' } = opts;
      const fr = this.inMemoryMetrics.chatUsage.friction;
      fr.total++;
      fr.byReason[reason] = (fr.byReason[reason] || 0) + 1;
      if (httpStatus != null && Number.isFinite(httpStatus)) {
        const k = String(Math.trunc(httpStatus));
        fr.byHttpStatus[k] = (fr.byHttpStatus[k] || 0) + 1;
      }
      const surf = surface === 'guest' ? 'guest' : 'registered';
      fr.bySurface[surf] = (fr.bySurface[surf] || 0) + 1;
    } catch {
      // no-op
    }
  }

  /**
   * Uso exploratorio del chat (GET list / historial): solo memoria.
   * @param {'list_conversations' | 'load_messages' | 'guest_load_messages'} explorationType
   * @param {{ paginationType?: string, page?: number }} [detail]
   */
  bumpChatExploration(explorationType, detail = {}) {
    try {
      const ex = this.inMemoryMetrics.chatUsage.exploration;
      if (explorationType === 'list_conversations') {
        ex.listConversations++;
        const pt =
          detail.paginationType === 'cursor' || detail.paginationType === 'offset'
            ? detail.paginationType
            : 'offset';
        ex.listConversationsByPagination[pt] =
          (ex.listConversationsByPagination[pt] || 0) + 1;
      } else if (explorationType === 'load_messages') {
        ex.loadConversationMessages++;
        const page = parseInt(detail.page, 10);
        const bucket =
          Number.isFinite(page) && page === 1 ? 'first_page' : 'other_page';
        ex.loadMessagesByPage[bucket] = (ex.loadMessagesByPage[bucket] || 0) + 1;
      } else if (explorationType === 'guest_load_messages') {
        ex.guestLoadConversationMessages =
          (ex.guestLoadConversationMessages || 0) + 1;
      }
    } catch {
      // no-op
    }
  }

  async recordMetric(type, data, userId = null, metadata = {}) {
    try {
      // Actualizar métricas en memoria
      this.updateInMemoryMetrics(type, data, userId, metadata);

      // Agregar al historial
      this.addToHistory({
        timestamp: new Date(),
        type,
        userId,
        data,
        metadata
      });

      // Guardar en BD si está disponible (opcional, puede ser async)
      if (mongoose.connection.readyState === 1) {
        Metric.create({
          type,
          userId: userId ? new mongoose.Types.ObjectId(userId) : null,
          data,
          metadata
        }).catch(error => {
          // No bloquear si falla el guardado en BD
          console.warn('[MetricsService] Error guardando métrica en BD:', error.message);
        });
      }
    } catch (error) {
      console.error('[MetricsService] Error registrando métrica:', error);
    }
  }

  /**
   * Actualiza métricas en memoria
   * @param {string} type - Tipo de métrica
   * @param {Object} data - Datos
   * @param {string} userId - ID del usuario
   */
  updateInMemoryMetrics(type, data, userId, metadata = {}) {
    switch (type) {
      case 'emotional_analysis':
        this.inMemoryMetrics.emotionalAnalysis.total++;
        if (data.mainEmotion) {
          this.inMemoryMetrics.emotionalAnalysis.byEmotion[data.mainEmotion] = 
            (this.inMemoryMetrics.emotionalAnalysis.byEmotion[data.mainEmotion] || 0) + 1;
        }
        if (data.subtype) {
          this.inMemoryMetrics.emotionalAnalysis.bySubtype[data.subtype] = 
            (this.inMemoryMetrics.emotionalAnalysis.bySubtype[data.subtype] || 0) + 1;
        }
        if (data.topic) {
          this.inMemoryMetrics.emotionalAnalysis.byTopic[data.topic] = 
            (this.inMemoryMetrics.emotionalAnalysis.byTopic[data.topic] || 0) + 1;
        }
        // Actualizar promedios
        const total = this.inMemoryMetrics.emotionalAnalysis.total;
        const currentAvgIntensity = this.inMemoryMetrics.emotionalAnalysis.averageIntensity;
        const currentAvgConfidence = this.inMemoryMetrics.emotionalAnalysis.averageConfidence;
        this.inMemoryMetrics.emotionalAnalysis.averageIntensity = 
          ((currentAvgIntensity * (total - 1)) + (data.intensity || 0)) / total;
        this.inMemoryMetrics.emotionalAnalysis.averageConfidence = 
          ((currentAvgConfidence * (total - 1)) + (data.confidence || 0)) / total;
        break;

      case 'session_memory':
        if (data.action === 'add') {
          this.inMemoryMetrics.sessionMemory.totalAnalyses++;
        } else if (data.action === 'active') {
          this.inMemoryMetrics.sessionMemory.activeSessions = data.count || 0;
        }
        break;

      case 'therapeutic_template':
        const templateKey = `${data.emotion}_${data.subtype || 'none'}`;
        this.inMemoryMetrics.therapeuticTemplates.usage[templateKey] = 
          (this.inMemoryMetrics.therapeuticTemplates.usage[templateKey] || 0) + 1;
        break;

      case 'protocol':
        if (data.action === 'start') {
          this.inMemoryMetrics.protocols.started++;
          this.inMemoryMetrics.protocols.byType[data.protocolType] = 
            (this.inMemoryMetrics.protocols.byType[data.protocolType] || 0) + 1;
        } else if (data.action === 'complete') {
          this.inMemoryMetrics.protocols.completed++;
        }
        break;

      case 'action_suggestion':
        if (data.action === 'generate') {
          this.inMemoryMetrics.actionSuggestions.generated++;
          if (data.suggestionType) {
            this.inMemoryMetrics.actionSuggestions.byType[data.suggestionType] = 
              (this.inMemoryMetrics.actionSuggestions.byType[data.suggestionType] || 0) + 1;
          }
        } else if (data.action === 'click') {
          this.inMemoryMetrics.actionSuggestions.clicked++;
        }
        break;

      case 'product_action_proposed': {
        const pa = this.inMemoryMetrics.productActionProposals;
        pa.events++;
        pa.proposalsEmitted += Number(data.count) || 0;
        const tr = data.transport || 'unknown';
        pa.byTransport[tr] = (pa.byTransport[tr] || 0) + 1;
        break;
      }

      case 'product_action_created': {
        const o = this.inMemoryMetrics.productActionOutcomes;
        o.created++;
        if (data.fromChat) o.createdFromChat++;
        if (data.idempotentReplay) o.idempotentFromChat++;
        break;
      }

      case 'product_action_create_failed': {
        const o = this.inMemoryMetrics.productActionOutcomes;
        o.createFailed++;
        if (data.fromChat) o.createFailedFromChat++;
        break;
      }

      case 'product_action_confirm_dismissed': {
        const o = this.inMemoryMetrics.productActionOutcomes;
        o.confirmDismissed++;
        const surf = data.surface || 'unknown';
        o.bySurface[surf] = (o.bySurface[surf] || 0) + 1;
        break;
      }

      case 'response_generation':
        this.inMemoryMetrics.responseGeneration.total++;
        if (data.error) {
          this.inMemoryMetrics.responseGeneration.errors++;
        }
        if (data.time) {
          const total = this.inMemoryMetrics.responseGeneration.total;
          const currentAvg = this.inMemoryMetrics.responseGeneration.averageTime;
          this.inMemoryMetrics.responseGeneration.averageTime = 
            ((currentAvg * (total - 1)) + data.time) / total;
        }
        break;

      case 'prompt_history_truncation': {
        const ph = this.inMemoryMetrics.promptHistoryTruncation;
        ph.events++;
        if (data.truncated) ph.truncatedEvents++;
        if (data.tailOnly) ph.tailOnlyEvents++;
        ph.sumDroppedTotal += data.droppedTotal || 0;
        ph.sumNonempty += data.nonemptyCount || 0;
        const dropped = data.droppedTotal || 0;
        if (dropped > ph.maxDroppedInEvent) ph.maxDroppedInEvent = dropped;
        const src = data.source || 'unknown';
        ph.bySource[src] = (ph.bySource[src] || 0) + 1;
        const cs = data.callSite || 'unknown';
        ph.byCallSite[cs] = (ph.byCallSite[cs] || 0) + 1;
        break;
      }

      case 'chat_template_signals': {
        const c = this.inMemoryMetrics.chatTemplateSignals;
        c.total++;
        c.sumStockScore += data.stockPhraseScore || 0;
        c.sumEchoRatio += data.echoOverlapRatio || 0;
        c.sumEchoUsefulRatio += data.echoUsefulRatio || 0;
        c.sumEchoEmptyRatio += data.echoEmptyRatio || 0;
        const hits = data.stockPhraseHits || {};
        for (const k of Object.keys(hits)) {
          c.hitsByPhrase[k] = (c.hitsByPhrase[k] || 0) + hits[k];
        }
        const rs = data.responseStyle || 'unknown';
        c.byResponseStyle[rs] = (c.byResponseStyle[rs] || 0) + 1;
        const pk = data.chatPrefsKey || 'r0a0p0';
        c.byChatPrefsKey[pk] = (c.byChatPrefsKey[pk] || 0) + 1;
        break;
      }

      case 'message_feedback': {
        const mf = this.inMemoryMetrics.messageFeedback;
        const h = data.helpful;
        if (h === 'up') mf.up++;
        else if (h === 'down') mf.down++;
        else if (h === 'cleared') mf.cleared++;
        break;
      }

      case 'chat_turn_policy': {
        const cp = this.inMemoryMetrics.chatTurnPolicy;
        cp.total++;
        const q = Number(data?.questionStreakCount || 0);
        const s = Number(data?.shortReplyStreak || 0);
        if (q >= 2) cp.questionStreakOver2++;
        if (s >= 2) cp.shortReplyStreakOver2++;
        if (data?.closureRisk === true) cp.closureRiskSignals++;
        const load = data?.cognitiveLoadSignal || 'none';
        cp.cognitiveLoadByType[load] = (cp.cognitiveLoadByType[load] || 0) + 1;
        break;
      }

      case 'crisis_hard_stop':
        this._bumpCrisisRouting('hardStop', data);
        break;

      case 'crisis_llm_path':
        this._bumpCrisisRouting('llmPath', data);
        break;

      case 'crisis_llm_sanitized': {
        const cr = this.inMemoryMetrics.crisisRouting;
        cr.sanitizedResponses++;
        const transport = String(data?.transport || 'unknown');
        cr.sanitizedByTransport[transport] = (cr.sanitizedByTransport[transport] || 0) + 1;
        const rl = String(data?.riskLevel || 'UNKNOWN').toUpperCase();
        cr.sanitizedByRiskLevel[rl] = (cr.sanitizedByRiskLevel[rl] || 0) + 1;
        const hits = Array.isArray(data?.hits) ? data.hits : [];
        for (const hit of hits) {
          cr.sanitizeHits[hit] = (cr.sanitizeHits[hit] || 0) + 1;
        }
        break;
      }

      case 'crisis_background_action': {
        const bg = this.inMemoryMetrics.crisisBackgroundActions;
        bg.total++;
        const rl = String(data?.riskLevel || 'UNKNOWN').toUpperCase();
        bg.byRiskLevel[rl] = (bg.byRiskLevel[rl] || 0) + 1;
        const transport = String(data?.transport || 'unknown');
        bg.byTransport[transport] = (bg.byTransport[transport] || 0) + 1;
        const phase = data?.phase === 'sync' ? 'sync' : 'async';
        bg.byPhase[phase] = (bg.byPhase[phase] || 0) + 1;
        const action = String(data?.action || 'unknown');
        bg.byAction[action] = (bg.byAction[action] || 0) + 1;
        if (action === 'error') bg.errors++;
        break;
      }

      case 'chat_usage': {
        const cu = this.inMemoryMetrics.chatUsage;
        const action = data?.action;
        const isGuest = data?.isGuest === true;
        const routeKey = this._routeKeyFromMetadata(metadata, { isGuest });
        const now = Date.now();
        const routeBucket =
          routeKey && cu.latencyByRoute
            ? (cu.latencyByRoute[routeKey] ||= {
                streamingFirstChunks: 0,
                nonStreamingResponses: 0,
                ttftMsSamples: [],
                nonStreamLatencyMsSamples: [],
                lastSeenAt: now
              })
            : null;
        if (routeBucket) {
          routeBucket.lastSeenAt = now;
          this._enforceLatencyRouteCap(cu);
        }

        if (action === 'conversation_created') {
          cu.conversationsCreated++;
          if (isGuest) cu.guestSessionsCreated++;
        }

        if (action === 'user_message_saved') {
          if (isGuest) cu.guestMessagesUserSaved++;
          else cu.messagesUserSaved++;
          const n = isGuest ? cu.guestMessagesUserSaved : cu.messagesUserSaved;
          const chars = typeof data?.chars === 'number' ? data.chars : null;
          if (chars != null) {
            const cur = cu.avgUserMessageChars;
            cu.avgUserMessageChars = ((cur * (n - 1)) + chars) / n;
          }
        }

        if (action === 'assistant_message_saved') {
          if (isGuest) cu.guestMessagesAssistantSaved++;
          else cu.messagesAssistantSaved++;
          const n = isGuest ? cu.guestMessagesAssistantSaved : cu.messagesAssistantSaved;
          const chars = typeof data?.chars === 'number' ? data.chars : null;
          if (chars != null) {
            const cur = cu.avgAssistantMessageChars;
            cu.avgAssistantMessageChars = ((cur * (n - 1)) + chars) / n;
          }
        }

        if (action === 'streaming_request') {
          cu.streamingRequests++;
        }
        if (action === 'streaming_done') {
          cu.streamingResponsesCompleted++;
        }
        if (action === 'streaming_first_chunk') {
          cu.streamingFirstChunks++;
          const ttftMs = Number(data?.ttftMs);
          if (Number.isFinite(ttftMs) && ttftMs >= 0) {
            cu.ttftMsSamples.push(ttftMs);
            if (cu.ttftMsSamples.length > 1000) cu.ttftMsSamples.shift();
            if (routeBucket) {
              routeBucket.streamingFirstChunks++;
              routeBucket.ttftMsSamples.push(ttftMs);
              if (routeBucket.ttftMsSamples.length > 500) routeBucket.ttftMsSamples.shift();
            }
          }
        }
        if (action === 'non_stream_response_ready') {
          const latencyMs = Number(data?.latencyMs);
          if (Number.isFinite(latencyMs) && latencyMs >= 0) {
            cu.nonStreamLatencyMsSamples.push(latencyMs);
            if (cu.nonStreamLatencyMsSamples.length > 1000) cu.nonStreamLatencyMsSamples.shift();
            if (routeBucket) {
              routeBucket.nonStreamingResponses++;
              routeBucket.nonStreamLatencyMsSamples.push(latencyMs);
              if (routeBucket.nonStreamLatencyMsSamples.length > 500) {
                routeBucket.nonStreamLatencyMsSamples.shift();
              }
            }
          }
        }

        if (action === 'message_feedback') {
          cu.messageFeedbackEvents++;
        }

        if (action === 'error') {
          cu.errors++;
          const code = data?.code || 'unknown';
          cu.errorsByCode[code] = (cu.errorsByCode[code] || 0) + 1;
        }

        break;
      }
    }
  }

  /**
   * Evita crecimiento infinito de latencyByRoute.
   * Estrategia: si supera el máximo, eliminar las rutas menos recientes.
   * @param {any} cu - chatUsage bucket
   */
  _enforceLatencyRouteCap(cu) {
    try {
      const map = cu?.latencyByRoute;
      if (!map || typeof map !== 'object') return;
      const keys = Object.keys(map);
      if (keys.length <= this.MAX_LATENCY_ROUTES) return;

      const toDrop = keys
        .map((k) => ({ k, t: Number(map[k]?.lastSeenAt || 0) }))
        .sort((a, b) => a.t - b.t)
        .slice(0, Math.max(1, keys.length - this.MAX_LATENCY_ROUTES));

      toDrop.forEach(({ k }) => {
        delete map[k];
      });
    } catch {
      // no-op
    }
  }

  /**
   * Key canónica para agrupar latencia por ruta.
   * @param {Object} metadata
   * @param {{ isGuest?: boolean }} hint
   * @returns {string | null}
   */
  _routeKeyFromMetadata(metadata, hint = {}) {
    try {
      const transport = typeof metadata?.transport === 'string' ? metadata.transport.trim() : '';
      const endpoint = typeof metadata?.endpoint === 'string' ? metadata.endpoint.trim() : '';
      const surfaceRaw = typeof metadata?.surface === 'string' ? metadata.surface.trim() : '';
      const surface =
        surfaceRaw ||
        (hint.isGuest === true ? 'guest' : hint.isGuest === false ? 'registered' : '');
      const clean = (s) =>
        String(s || '')
          .replace(/[\u0000-\u001F]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 32);
      const t = clean(transport) || 'unknown';
      const e = clean(endpoint) || 'chat';
      const s = clean(surface) || 'unknown';
      return `${t}:${e}:${s}`;
    } catch {
      return null;
    }
  }

  /**
   * Agrega métrica al historial
   * @param {Object} metric - Métrica a agregar
   */
  addToHistory(metric) {
    this.metricsHistory.push(metric);
    
    // Limitar tamaño del historial
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory.shift(); // Eliminar la más antigua
    }
  }

  /**
   * Contadores en memoria del enrutamiento de crisis (hard-stop vs LLM).
   */
  getCrisisRoutingSnapshot() {
    const cr = this.inMemoryMetrics.crisisRouting;
    return {
      hardStop: cr.hardStop,
      llmPath: cr.llmPath,
      sanitizedResponses: cr.sanitizedResponses,
      byRiskLevel: { ...cr.byRiskLevel },
      byTransport: { ...cr.byTransport },
      hardStopByRiskLevel: { ...cr.hardStopByRiskLevel },
      llmPathByRiskLevel: { ...cr.llmPathByRiskLevel },
      hardStopByTransport: { ...cr.hardStopByTransport },
      llmPathByTransport: { ...cr.llmPathByTransport },
      sanitizeHits: { ...cr.sanitizeHits },
      sanitizedByTransport: { ...cr.sanitizedByTransport },
      sanitizedByRiskLevel: { ...cr.sanitizedByRiskLevel },
    };
  }

  /**
   * Vista ops: desglose A/B por dimensión + ratios derivados.
   * Deuda técnica: agregación multi-instancia, ventanas temporales, persistencia Mongo.
   */
  getCrisisRoutingOpsSnapshot() {
    const cr = this.inMemoryMetrics.crisisRouting;
    const bg = this.inMemoryMetrics.crisisBackgroundActions;
    const routingTotal = cr.hardStop + cr.llmPath;
    const sanitizeDenom = cr.llmPath > 0 ? cr.llmPath : 0;

    const pct = (num, den) =>
      den > 0 ? Number(((num / den) * 100).toFixed(2)) : null;

    return {
      scope: 'process_memory',
      note: 'Contadores por proceso; se reinician al redeploy. Agregación multi-instancia pendiente.',
      routing: {
        hardStop: cr.hardStop,
        llmPath: cr.llmPath,
        total: routingTotal,
        hardStopSharePct: pct(cr.hardStop, routingTotal),
        llmPathSharePct: pct(cr.llmPath, routingTotal),
        hardStopByRiskLevel: { ...cr.hardStopByRiskLevel },
        llmPathByRiskLevel: { ...cr.llmPathByRiskLevel },
        hardStopByTransport: { ...cr.hardStopByTransport },
        llmPathByTransport: { ...cr.llmPathByTransport },
        byRiskLevel: { ...cr.byRiskLevel },
        byTransport: { ...cr.byTransport },
      },
      sanitization: {
        sanitizedResponses: cr.sanitizedResponses,
        sanitizeRatePct: pct(cr.sanitizedResponses, sanitizeDenom),
        sanitizeHits: { ...cr.sanitizeHits },
        sanitizedByTransport: { ...cr.sanitizedByTransport },
        sanitizedByRiskLevel: { ...cr.sanitizedByRiskLevel },
      },
      backgroundActions: {
        total: bg.total,
        errors: bg.errors,
        byRiskLevel: { ...bg.byRiskLevel },
        byTransport: { ...bg.byTransport },
        byPhase: { ...bg.byPhase },
        byAction: { ...bg.byAction },
      },
      capturedAt: new Date().toISOString(),
    };
  }

  _bumpCrisisRouting(counterKey, data = {}) {
    const cr = this.inMemoryMetrics.crisisRouting;
    if (counterKey === 'hardStop') cr.hardStop++;
    if (counterKey === 'llmPath') cr.llmPath++;
    const rl = String(data?.riskLevel || 'UNKNOWN').toUpperCase();
    const transport = String(data?.transport || 'unknown');
    cr.byRiskLevel[rl] = (cr.byRiskLevel[rl] || 0) + 1;
    cr.byTransport[transport] = (cr.byTransport[transport] || 0) + 1;
    if (counterKey === 'hardStop') {
      cr.hardStopByRiskLevel[rl] = (cr.hardStopByRiskLevel[rl] || 0) + 1;
      cr.hardStopByTransport[transport] = (cr.hardStopByTransport[transport] || 0) + 1;
    }
    if (counterKey === 'llmPath') {
      cr.llmPathByRiskLevel[rl] = (cr.llmPathByRiskLevel[rl] || 0) + 1;
      cr.llmPathByTransport[transport] = (cr.llmPathByTransport[transport] || 0) + 1;
    }
  }

  /**
   * Obtiene métricas en memoria
   * @returns {Object} Métricas actuales
   */
  getMetrics() {
    return {
      ...this.inMemoryMetrics,
      historySize: this.metricsHistory.length,
      lastUpdated: new Date()
    };
  }

  /**
   * Obtiene métricas de un tipo específico
   * @param {string} type - Tipo de métrica
   * @returns {Object} Métricas del tipo
   */
  getMetricsByType(type) {
    return this.metricsHistory
      .filter(m => m.type === type)
      .slice(-100); // Últimas 100 del tipo
  }

  /**
   * Obtiene métricas de un usuario específico
   * @param {string} userId - ID del usuario
   * @returns {Array} Métricas del usuario
   */
  getUserMetrics(userId) {
    return this.metricsHistory
      .filter(m => m.userId && m.userId.toString() === userId.toString())
      .slice(-50); // Últimas 50 del usuario
  }

  /**
   * Obtiene estadísticas de salud del sistema
   * @returns {Promise<Object>} Estadísticas de salud
   */
  async getHealthStats() {
    const recentErrors = this.metricsHistory
      .filter(m => m.type === 'response_generation' && m.data?.error)
      .slice(-10);

    const errorRate = this.inMemoryMetrics.responseGeneration.total > 0
      ? (this.inMemoryMetrics.responseGeneration.errors / this.inMemoryMetrics.responseGeneration.total) * 100
      : 0;

    const cacheStats = await this.getCacheStats();

    const ph = this.inMemoryMetrics.promptHistoryTruncation;
    const samples = this.inMemoryMetrics.promptHistorySelectionSamples;
    const promptHistory = {
      samples: {
        totalSelections: samples.totalSelections,
        truncatedSelections: samples.truncatedSelections,
        truncatedRateOfSelections:
          samples.totalSelections > 0
            ? ((samples.truncatedSelections / samples.totalSelections) * 100).toFixed(2) + '%'
            : '0%'
      },
      truncatedEventsDetail:
        ph.events > 0
          ? {
              persistedEvents: ph.events,
              truncatedRate: ((ph.truncatedEvents / ph.events) * 100).toFixed(2) + '%',
              tailOnlyEvents: ph.tailOnlyEvents,
              avgDroppedWhenTruncated:
                ph.truncatedEvents > 0
                  ? (ph.sumDroppedTotal / ph.truncatedEvents).toFixed(2)
                  : '0',
              maxDroppedInEvent: ph.maxDroppedInEvent,
              bySource: ph.bySource,
              byCallSite: ph.byCallSite
            }
          : null
    };

    const cts = this.inMemoryMetrics.chatTemplateSignals;
    const chatTemplateSignals =
      cts.total > 0
        ? {
            samples: cts.total,
            avgStockScore: (cts.sumStockScore / cts.total).toFixed(3),
            avgEchoOverlap: (cts.sumEchoRatio / cts.total).toFixed(3),
            avgEchoUseful: (cts.sumEchoUsefulRatio / cts.total).toFixed(3),
            avgEchoEmpty: (cts.sumEchoEmptyRatio / cts.total).toFixed(3),
            byResponseStyle: cts.byResponseStyle,
            byChatPrefsKey: cts.byChatPrefsKey
          }
        : null;

    const cu = this.inMemoryMetrics.chatUsage;
    const calcPercentile = (samples, p) => {
      if (!Array.isArray(samples) || samples.length === 0) return null;
      const sorted = [...samples].sort((a, b) => a - b);
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
      return sorted[idx];
    };

    const latencyByRoute = Object.entries(cu.latencyByRoute || {}).reduce((acc, [k, v]) => {
      const ttftSamples = Array.isArray(v?.ttftMsSamples) ? v.ttftMsSamples : [];
      const nonSamples = Array.isArray(v?.nonStreamLatencyMsSamples) ? v.nonStreamLatencyMsSamples : [];
      acc[k] = {
        streamingFirstChunks: Number(v?.streamingFirstChunks || 0),
        nonStreamingResponses: Number(v?.nonStreamingResponses || 0),
        ttft: {
          samples: ttftSamples.length,
          p50Ms: calcPercentile(ttftSamples, 50),
          p95Ms: calcPercentile(ttftSamples, 95)
        },
        nonStreaming: {
          samples: nonSamples.length,
          p50Ms: calcPercentile(nonSamples, 50),
          p95Ms: calcPercentile(nonSamples, 95)
        }
      };
      return acc;
    }, {});
    const chatUsage = {
      conversationsCreated: cu.conversationsCreated,
      messages: {
        userSaved: cu.messagesUserSaved,
        assistantSaved: cu.messagesAssistantSaved,
        guestUserSaved: cu.guestMessagesUserSaved,
        guestAssistantSaved: cu.guestMessagesAssistantSaved
      },
      streaming: {
        requests: cu.streamingRequests,
        completed: cu.streamingResponsesCompleted,
        firstChunks: cu.streamingFirstChunks,
        completionRate:
          cu.streamingRequests > 0
            ? ((cu.streamingResponsesCompleted / cu.streamingRequests) * 100).toFixed(2) + '%'
            : '0%',
        ttft: {
          samples: cu.ttftMsSamples.length,
          p50Ms: calcPercentile(cu.ttftMsSamples, 50),
          p95Ms: calcPercentile(cu.ttftMsSamples, 95)
        }
      },
      nonStreaming: {
        samples: cu.nonStreamLatencyMsSamples.length,
        p50Ms: calcPercentile(cu.nonStreamLatencyMsSamples, 50),
        p95Ms: calcPercentile(cu.nonStreamLatencyMsSamples, 95)
      },
      latencyByRoute,
      guest: {
        sessionsCreated: cu.guestSessionsCreated
      },
      feedbackEvents: cu.messageFeedbackEvents,
      errors: {
        total: cu.errors,
        byCode: cu.errorsByCode
      },
      averages: {
        userMessageChars: Number.isFinite(cu.avgUserMessageChars)
          ? cu.avgUserMessageChars.toFixed(1)
          : '0.0',
        assistantMessageChars: Number.isFinite(cu.avgAssistantMessageChars)
          ? cu.avgAssistantMessageChars.toFixed(1)
          : '0.0'
      },
      friction: {
        total: cu.friction.total,
        topReasons: Object.entries(cu.friction.byReason)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .reduce((acc, [k, v]) => {
            acc[k] = v;
            return acc;
          }, {}),
        byHttpStatus: cu.friction.byHttpStatus,
        bySurface: cu.friction.bySurface
      },
      exploration: cu.exploration,
      /** Pulgar arriba/abajo sobre respuestas guardadas (aprox. adopción de feedback). */
      feedbackVsAssistantReplies: {
        feedbackEvents: cu.messageFeedbackEvents,
        assistantRepliesSaved: cu.messagesAssistantSaved,
        eventsPerReply:
          cu.messagesAssistantSaved > 0
            ? Number((cu.messageFeedbackEvents / cu.messagesAssistantSaved).toFixed(4))
            : null
      }
    };
    const turnPolicy = this.inMemoryMetrics.chatTurnPolicy;

    return {
      status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
      errorRate: errorRate.toFixed(2),
      totalRequests: this.inMemoryMetrics.responseGeneration.total,
      averageResponseTime: this.inMemoryMetrics.responseGeneration.averageTime.toFixed(2),
      recentErrors: recentErrors.length,
      activeSessions: this.inMemoryMetrics.sessionMemory.activeSessions,
      cacheStats: cacheStats,
      promptHistoryTruncation: promptHistory,
      chatTemplateSignals,
      chatUsage,
      chatTurnPolicy: turnPolicy
    };
  }

  /**
   * Obtiene estadísticas de caché (si está disponible)
   * @returns {Object} Estadísticas de caché
   */
  getCacheStats() {
    try {
      const { default: analysisCache } = require('./emotionalAnalysisCache.js');
      return analysisCache.getStats();
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Limpia métricas antiguas
   * @param {number} daysToKeep - Días de métricas a mantener
   */
  async cleanupOldMetrics(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      if (mongoose.connection.readyState === 1) {
        const result = await Metric.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        
        console.log(`[MetricsService] Limpieza: ${result.deletedCount} métricas antiguas eliminadas`);
        return result.deletedCount;
      }
    } catch (error) {
      console.error('[MetricsService] Error limpiando métricas antiguas:', error);
      return 0;
    }
  }
}

export default new MetricsService();

