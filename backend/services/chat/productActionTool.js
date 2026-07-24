/**
 * Tool OpenAI propose_product_action + parse/validate hacia proposedProductActions.
 */
import crypto from 'crypto';
import {
  getProductActionNeedLevel,
  isExplicitProductActionRequest,
  isGenericProductActionTitle,
  isLowValueEmotionalCheckout,
  shouldOfferProductActions,
} from '../chatProductActionProposalService.js';
import { normalizeSessionIntention } from '../../constants/sessionIntention.js';
import { isLlmCrisisTherapeuticExtrasBlocked } from '../../utils/chatObservationalContext.js';

export const PROPOSE_PRODUCT_ACTION_TOOL_NAME = 'propose_product_action';

const NO_PRODUCT_ACTION_INTENT =
  /\b(no\s+me\s+sugieras?\s+tareas?|sin\s+tareas?|solo\s+escuchar|solo\s+desahogar|no\s+quiero\s+planificar|no\s+quiero\s+tareas?)\b/i;

const NATURAL_PRODUCT_LEXICON =
  /planific|organiz|orden(?:ar|o)?|tarea|tareas|pendiente|to-?do|h[aá]bito|rutina|agendar|recordatorio|micro(?:\s|-)?paso|paso\s+(?:chico|pequeño|concreto)|en\s+mis\s+tareas|en\s+mis\s+h[aá]bitos/i;

const VALID_HABIT_ICONS = new Set([
  'exercise',
  'meditation',
  'reading',
  'water',
  'sleep',
  'study',
  'diet',
  'coding',
  'workout',
  'yoga',
  'journal',
  'music',
  'art',
  'language',
]);

/**
 * Schema OpenAI tools API.
 */
export function getProposeProductActionToolDefinition() {
  return {
    type: 'function',
    function: {
      name: PROPOSE_PRODUCT_ACTION_TOOL_NAME,
      description:
        'Propose at most one task or habit draft for the user to confirm in the app. Prefer not calling this. Never invent generic routines.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['propose_task', 'propose_habit'],
          },
          title: {
            type: 'string',
            description: 'Concrete micro-step the user named or agreed (max 100 chars)',
          },
          description: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
          },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            description: 'Habits only',
          },
          icon: {
            type: 'string',
            description: 'Habits only; one of allowed habit icons',
          },
          rationaleShort: {
            type: 'string',
            description: 'Optional short card rationale',
          },
        },
        required: ['type', 'title'],
      },
    },
  };
}

/**
 * @param {object} params
 * @returns {boolean}
 */
export function isProductActionToolEligible({
  isGuest = false,
  crisis = null,
  emotional = null,
  contextual = null,
  userMessage = '',
  sessionIntention = null,
  softCrisisCheckInActive = false,
  softLandingActive = false,
  capAllows = true,
  riskLevel = null,
  isCrisis = false,
} = {}) {
  if (isGuest) return false;
  if (softCrisisCheckInActive) return false;
  if (softLandingActive) return false;
  if (
    !shouldOfferProductActions({
      riskLevel: riskLevel || crisis?.riskLevel,
      isCrisis: isCrisis || Boolean(crisis?.riskLevel === 'HIGH'),
      softLandingActive,
    })
  ) {
    return false;
  }
  if (isLlmCrisisTherapeuticExtrasBlocked({ crisis, emotional, contextual })) return false;

  const content = String(userMessage || '').trim();
  if (!content) return false;
  if (NO_PRODUCT_ACTION_INTENT.test(content)) return false;
  if (isLowValueEmotionalCheckout(content)) return false;

  if (isExplicitProductActionRequest(content)) return true;
  if (!capAllows) return false;

  const intention = normalizeSessionIntention(sessionIntention);
  const need = getProductActionNeedLevel(content);
  if (intention === 'plan' || intention === 'organize') {
    return need === 'medium' || need === 'high' || NATURAL_PRODUCT_LEXICON.test(content);
  }
  if (intention === 'technique') {
    return need === 'high' || (need === 'medium' && NATURAL_PRODUCT_LEXICON.test(content));
  }
  return need === 'high' && NATURAL_PRODUCT_LEXICON.test(content);
}

/**
 * @param {unknown} toolCalls
 * @returns {object|null} raw args
 */
export function extractProposeProductActionArgs(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const call = toolCalls.find(
    (t) =>
      t?.function?.name === PROPOSE_PRODUCT_ACTION_TOOL_NAME ||
      t?.name === PROPOSE_PRODUCT_ACTION_TOOL_NAME,
  );
  if (!call) return null;
  const raw = call.function?.arguments ?? call.arguments;
  if (raw == null) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Convierte args de tool en proposedProductActions validados (máx. 1).
 * @param {object|null} args
 * @returns {object[]}
 */
export function buildProposedActionsFromToolArgs(args) {
  if (!args || typeof args !== 'object') return [];
  const type = args.type === 'propose_habit' ? 'propose_habit' : 'propose_task';
  const title = String(args.title || '').trim().slice(0, 100);
  if (title.length < 3) return [];
  if (isGenericProductActionTitle(title)) return [];

  const draft =
    type === 'propose_habit'
      ? {
          title,
          description: args.description ? String(args.description).slice(0, 500) : undefined,
          icon: VALID_HABIT_ICONS.has(args.icon) ? args.icon : 'journal',
          frequency: ['daily', 'weekly', 'monthly'].includes(args.frequency)
            ? args.frequency
            : 'daily',
          priority: ['low', 'medium', 'high'].includes(args.priority) ? args.priority : 'medium',
          reminder: {
            enabled: true,
            time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      : {
          title,
          description: args.description ? String(args.description).slice(0, 500) : undefined,
          priority: ['low', 'medium', 'high', 'urgent'].includes(args.priority)
            ? args.priority
            : 'medium',
          itemType: 'task',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

  const action = {
    type,
    id: crypto.randomUUID(),
    draft,
    confidence: 0.75,
    source: 'chat_tool_v1',
  };
  if (args.rationaleShort) {
    action.rationaleShort = String(args.rationaleShort).slice(0, 160);
  }

  return [action];
}

/**
 * Si la tool estuvo disponible pero no devolvió draft válido, la heurística
 * solo corre con pedido explícito o necesidad alta (anti-cargante).
 * Si la tool no estuvo disponible, la heurística sigue siendo el camino primario.
 *
 * @param {{ productActionToolEnabled?: boolean, userContent?: string }} p
 * @returns {boolean}
 */
export function shouldFallbackToHeuristicProductActions({
  productActionToolEnabled = false,
  userContent = '',
} = {}) {
  if (!productActionToolEnabled) return true;
  if (isExplicitProductActionRequest(userContent)) return true;
  return getProductActionNeedLevel(userContent) === 'high';
}

/**
 * Prioridad: tool validada → heurística (condicional) → vacío.
 *
 * @param {object} p
 * @param {unknown[]} [p.toolActions]
 * @param {boolean} [p.productActionToolEnabled]
 * @param {string} [p.userContent]
 * @param {() => object[]} [p.buildHeuristic]
 * @returns {{ actions: object[], source: 'chat_tool_v1'|'heuristic'|'none', toolEnabled: boolean }}
 */
export function resolveTurnProposedProductActions({
  toolActions = [],
  productActionToolEnabled = false,
  userContent = '',
  buildHeuristic,
} = {}) {
  const toolEnabled = productActionToolEnabled === true;
  const fromTool = Array.isArray(toolActions)
    ? toolActions.filter((a) => a && typeof a === 'object').slice(0, 1)
    : [];
  if (fromTool.length > 0) {
    return { actions: fromTool, source: 'chat_tool_v1', toolEnabled };
  }
  if (
    !shouldFallbackToHeuristicProductActions({
      productActionToolEnabled: toolEnabled,
      userContent,
    })
  ) {
    return { actions: [], source: 'none', toolEnabled };
  }
  const heuristic =
    typeof buildHeuristic === 'function' ? buildHeuristic() : [];
  const actions = Array.isArray(heuristic)
    ? heuristic.filter((a) => a && typeof a === 'object').slice(0, 1)
    : [];
  return {
    actions,
    source: actions.length > 0 ? 'heuristic' : 'none',
    toolEnabled,
  };
}

/**
 * Payload de métrica para funil tool-disponible → origen → propuesta.
 * @param {{ toolEnabled?: boolean, source?: string, actions?: object[], transport?: string }} p
 */
export function buildProductActionResolveMetricData({
  toolEnabled = false,
  source = 'none',
  actions = [],
  transport = 'unknown',
} = {}) {
  const list = Array.isArray(actions) ? actions : [];
  return {
    toolEnabled: toolEnabled === true,
    source: ['chat_tool_v1', 'heuristic', 'none'].includes(source) ? source : 'none',
    count: list.length,
    types: list.map((a) => a?.type).filter(Boolean),
    toolCalled: source === 'chat_tool_v1',
    transport,
  };
}

/**
 * Acumula tool_calls desde chunks de stream OpenAI.
 * @param {object[]} acc
 * @param {object} delta
 * @returns {object[]}
 */
export function accumulateStreamToolCallDeltas(acc, delta) {
  const list = Array.isArray(acc) ? [...acc] : [];
  const deltas = delta?.tool_calls;
  if (!Array.isArray(deltas)) return list;

  for (const d of deltas) {
    const idx = Number.isFinite(d.index) ? d.index : list.length;
    if (!list[idx]) {
      list[idx] = {
        id: d.id || '',
        type: 'function',
        function: { name: '', arguments: '' },
      };
    }
    if (d.id) list[idx].id = d.id;
    if (d.function?.name) {
      list[idx].function.name = (list[idx].function.name || '') + d.function.name;
    }
    if (d.function?.arguments) {
      list[idx].function.arguments =
        (list[idx].function.arguments || '') + d.function.arguments;
    }
  }
  return list;
}
