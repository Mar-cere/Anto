/**
 * Propuestas productivas post-turno (CONTRATO_CHAT_ACCIONES_V1.md).
 * Solo borradores validados en servidor; la persistencia ocurre tras confirmación en cliente.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { normalizeSessionIntention } from '../constants/sessionIntention.js';

function isValidObjectIdParam(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return s.length > 0 && mongoose.Types.ObjectId.isValid(s);
}

const HABIT_HINTS = /hábito|rutina\s+diaria|todos\s+los\s+días|cada\s+día|constancia\s+diaria/i;

/** Intención "técnica" pero el texto huele a planificación concreta (no sobrecargar: solo con señal clara). */
const PLANNING_LEXICON =
  /planific|organiz|tarea|pendiente|mañana|pasado\s+mañana|recordatorio|esta\s+semana|próxim[oa]s?\s+días|checklist|lista\s+de|prioridad|agendar|bloque\s+de\s+tiempo/i;

/**
 * @param {'vent'|'organize'|'technique'|'plan'|null} intention
 * @param {string} content
 */
function sessionAllowsProductDraft(intention, content) {
  if (intention === 'plan' || intention === 'organize') return true;
  if (intention === 'technique' && PLANNING_LEXICON.test(content)) return true;
  return false;
}

function defaultDueDateNextEvening() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  return d;
}

function clampTitle(raw, minLen = 3, maxLen = 100) {
  const t = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);
  if (t.length >= minLen) return t;
  return 'Paso acordado en el chat'.slice(0, maxLen);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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
  'language'
]);

const TASK_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
const TASK_ITEM_TYPES = new Set(['task', 'reminder', 'goal']);
const HABIT_PRIORITIES = new Set(['low', 'medium', 'high']);
const HABIT_FREQUENCIES = new Set(['daily', 'weekly', 'monthly']);

/**
 * Fusiona salida del LLM con el borrador heurístico; siempre queda dentro de límites compatibles con POST /tasks.
 * @param {Record<string, unknown>} baseline
 * @param {Record<string, unknown>} llm
 */
export function mergeTaskDraftFromLlm(baseline, llm) {
  const out = { ...baseline };
  if (llm.title != null && String(llm.title).trim() !== '') {
    out.title = clampTitle(String(llm.title), 3, 100);
  }
  if (llm.description != null) {
    out.description = String(llm.description).trim().slice(0, 500);
  }
  if (llm.dueDate != null) {
    const d = new Date(String(llm.dueDate));
    if (!Number.isNaN(d.getTime()) && d >= startOfToday()) {
      out.dueDate = d.toISOString();
    }
  }
  if (typeof llm.priority === 'string' && TASK_PRIORITIES.has(llm.priority)) {
    out.priority = llm.priority;
  }
  if (typeof llm.itemType === 'string' && TASK_ITEM_TYPES.has(llm.itemType)) {
    out.itemType = llm.itemType;
  }
  if (llm.category != null) {
    const c = String(llm.category).trim().slice(0, 50);
    if (c) out.category = c;
  }
  if (Array.isArray(llm.tags)) {
    out.tags = llm.tags
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim().slice(0, 20))
      .filter(Boolean)
      .slice(0, 10);
  }
  return out;
}

/**
 * Fusiona salida del LLM con el borrador heurístico; compatible con POST /habits.
 * @param {Record<string, unknown>} baseline
 * @param {Record<string, unknown>} llm
 */
export function mergeHabitDraftFromLlm(baseline, llm) {
  const out = {
    ...baseline,
    reminder:
      baseline.reminder && typeof baseline.reminder === 'object'
        ? { ...baseline.reminder }
        : { enabled: true, time: defaultDueDateNextEvening().toISOString() }
  };
  if (llm.title != null && String(llm.title).trim() !== '') {
    out.title = clampTitle(String(llm.title), 3, 100);
  }
  if (llm.description != null) {
    out.description = String(llm.description).trim().slice(0, 500);
  }
  if (typeof llm.icon === 'string' && VALID_HABIT_ICONS.has(llm.icon)) {
    out.icon = llm.icon;
  }
  if (typeof llm.frequency === 'string' && HABIT_FREQUENCIES.has(llm.frequency)) {
    out.frequency = llm.frequency;
  }
  if (typeof llm.priority === 'string' && HABIT_PRIORITIES.has(llm.priority)) {
    out.priority = llm.priority;
  }
  const reminderTimeRaw =
    llm.reminderTime ??
    (llm.reminder && typeof llm.reminder === 'object' ? llm.reminder.time : undefined);
  if (reminderTimeRaw != null) {
    const t = new Date(String(reminderTimeRaw));
    if (!Number.isNaN(t.getTime()) && t >= startOfToday()) {
      out.reminder = {
        enabled: true,
        time: t.toISOString()
      };
    }
  }
  return out;
}

/**
 * @param {{ type: string, draft: object, id?: string, rationaleShort?: string }} action
 * @param {Record<string, unknown> | null | undefined} llmPayload
 */
function shallowCloneAction(action) {
  if (!action || typeof action !== 'object') return action;
  const draft = action.draft;
  const nextDraft =
    draft && typeof draft === 'object' && !Array.isArray(draft) ? { ...draft } : draft;
  return { ...action, draft: nextDraft };
}

export function mergeProductActionDraftFromLlm(action, llmPayload) {
  if (!action) return shallowCloneAction(action);
  if (!llmPayload || typeof llmPayload !== 'object') {
    return shallowCloneAction(action);
  }
  let flat = llmPayload;
  if (flat.draft && typeof flat.draft === 'object') {
    flat = /** @type {Record<string, unknown>} */ (flat.draft);
  }
  try {
    if (action.type === 'propose_task') {
      return { ...action, draft: mergeTaskDraftFromLlm(action.draft, flat) };
    }
    if (action.type === 'propose_habit') {
      return { ...action, draft: mergeHabitDraftFromLlm(action.draft, flat) };
    }
  } catch (_) {
    return shallowCloneAction(action);
  }
  return shallowCloneAction(action);
}

/**
 * @param {{ riskLevel?: string, isCrisis?: boolean }} p
 * @returns {boolean}
 */
export function shouldOfferProductActions({ riskLevel, isCrisis }) {
  if (isCrisis) return false;
  if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') return false;
  return true;
}

/**
 * @param {{
 *   riskLevel?: string,
 *   isCrisis?: boolean,
 *   userContent: string,
 *   sessionIntention: unknown,
 *   conversationId: unknown,
 *   assistantMessageId: unknown,
 * }} input
 * @returns {Array<{ type: 'propose_task'|'propose_habit', id: string, draft: object, rationaleShort?: string }>}
 */
export function buildProposedProductActions(input) {
  const {
    riskLevel,
    isCrisis,
    userContent,
    sessionIntention,
    conversationId,
    assistantMessageId
  } = input;

  if (!shouldOfferProductActions({ riskLevel, isCrisis })) {
    return [];
  }

  const content = String(userContent || '').trim();
  if (content.length < 8) {
    return [];
  }

  const intention = normalizeSessionIntention(sessionIntention);
  if (!sessionAllowsProductDraft(intention, content)) {
    return [];
  }

  if (!isValidObjectIdParam(conversationId) || !isValidObjectIdParam(assistantMessageId)) {
    return [];
  }

  const firstLine = content.split('\n')[0] || content;

  if (HABIT_HINTS.test(content)) {
    return [
      {
        type: 'propose_habit',
        id: crypto.randomUUID(),
        draft: {
          title: clampTitle(firstLine),
          description: '',
          icon: 'meditation',
          frequency: 'daily',
          reminder: {
            enabled: true,
            time: defaultDueDateNextEvening().toISOString()
          },
          priority: 'medium'
        },
        rationaleShort: 'Podés convertirlo en hábito con recordatorio.'
      }
    ];
  }

  return [
    {
      type: 'propose_task',
      id: crypto.randomUUID(),
      draft: {
        title: clampTitle(content),
        description: '',
        dueDate: defaultDueDateNextEvening().toISOString(),
        priority: 'medium',
        itemType: 'task',
        category: 'General',
        tags: []
      },
      rationaleShort: 'Si querés, dejalo como tarea con fecha.'
    }
  ];
}

export default {
  shouldOfferProductActions,
  buildProposedProductActions,
  mergeProductActionDraftFromLlm,
  mergeTaskDraftFromLlm,
  mergeHabitDraftFromLlm
};
