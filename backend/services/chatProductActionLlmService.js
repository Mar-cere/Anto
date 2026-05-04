/**
 * Enriquecimiento opcional de borradores de acciones de producto (tarea/hábito) vía LLM.
 * Desactivar: CHAT_PRODUCT_ACTION_LLM=false
 * Modelo dedicado (opcional): OPENAI_PRODUCT_ACTION_MODEL
 */
import openaiService from './openaiService.js';
import { mergeProductActionDraftFromLlm } from './chatProductActionProposalService.js';
import { OPENAI_MODEL } from '../constants/openai.js';
import { withTimeout } from '../utils/withTimeout.js';

const LLM_TIMEOUT_RAW = parseInt(process.env.CHAT_PRODUCT_ACTION_LLM_TIMEOUT_MS || '12000', 10);
const LLM_TIMEOUT_MS = Math.min(
  60000,
  Math.max(3000, Number.isFinite(LLM_TIMEOUT_RAW) ? LLM_TIMEOUT_RAW : 12000)
);
const MAX_USER_CHARS = 8000;
const MAX_ASSISTANT_CHARS = 6000;
const MAX_ACTIONS_LLM = 2;
const MAX_COMPLETION_JSON_CHARS = 65536;

const TASK_LLM_KEYS = ['title', 'description', 'dueDate', 'priority', 'itemType', 'category', 'tags'];
const HABIT_LLM_KEYS = ['title', 'description', 'icon', 'frequency', 'priority', 'reminderTime', 'reminder'];

function pickSanitizedLlmFields(proposalType, obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const keys = proposalType === 'propose_habit' ? HABIT_LLM_KEYS : TASK_LLM_KEYS;
  /** @type {Record<string, unknown>} */
  const out = Object.create(null);
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
}

function isSafeProductAction(action) {
  return (
    action &&
    typeof action === 'object' &&
    (action.type === 'propose_task' || action.type === 'propose_habit') &&
    action.draft &&
    typeof action.draft === 'object' &&
    !Array.isArray(action.draft)
  );
}

function trimContent(s, max) {
  const t = String(s || '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

function parseJsonFromCompletion(content) {
  if (content == null) return null;
  let text = String(content).trim();
  if (text.length > MAX_COMPLETION_JSON_CHARS) {
    text = text.slice(0, MAX_COMPLETION_JSON_CHARS);
  }
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    const idx = text.indexOf('{');
    if (idx < 0) return null;
    try {
      return JSON.parse(text.slice(idx, idx + MAX_COMPLETION_JSON_CHARS));
    } catch {
      return null;
    }
  }
}

function baselineDraftForPrompt(draft) {
  if (!draft || typeof draft !== 'object') return {};
  const minimal = {
    title: String(draft.title ?? '').slice(0, 120),
    description: String(draft.description ?? '').slice(0, 400),
    dueDate: draft.dueDate,
    priority: draft.priority,
    itemType: draft.itemType,
    category: draft.category,
    tags: draft.tags,
    icon: draft.icon,
    frequency: draft.frequency,
    reminder: draft.reminder
  };
  try {
    const s = JSON.stringify(minimal);
    if (s.length > 14000) {
      return { title: minimal.title, description: minimal.description?.slice(0, 200) };
    }
    return minimal;
  } catch {
    return { title: minimal.title };
  }
}

async function extractDraftWithLlm(action, userContent, assistantContent) {
  if (!process.env.OPENAI_API_KEY) return null;

  const model = (process.env.OPENAI_PRODUCT_ACTION_MODEL || '').trim() || OPENAI_MODEL;
  const proposalType = action.type;

  const system = `Sos un extractor de datos para una app de bienestar (Anto). No emitís diagnósticos ni consejo médico.
Debés responder con un único objeto JSON (sin markdown, sin texto antes ni después).

Si proposalType es "propose_task", usá estas claves en el JSON raíz:
- title (string, español, acción concreta del usuario)
- description (string, opcional, breve)
- dueDate (string ISO 8601; no anterior al inicio del día de hoy en la zona horaria local implícita)
- priority: "low" | "medium" | "high" | "urgent"
- itemType: "task" | "reminder" | "goal"
- category (string opcional, máximo 50 caracteres)
- tags (array opcional de strings cortos)

Si proposalType es "propose_habit", usá:
- title, description (opcional)
- icon: uno de exercise, meditation, reading, water, sleep, study, diet, coding, workout, yoga, journal, music, art, language
- frequency: "daily" | "weekly" | "monthly"
- reminderTime (string ISO 8601; no anterior al inicio de hoy)
- priority: "low" | "medium" | "high"

Reglas: priorizá el mensaje del usuario; el mensaje del asistente es solo contexto. Si falta detalle, reutilizá valores razonables del baselineDraft. No anidés otro objeto "draft".`;

  const userPayload = {
    proposalType,
    userMessage: trimContent(userContent, MAX_USER_CHARS),
    assistantMessage: trimContent(assistantContent, MAX_ASSISTANT_CHARS),
    baselineDraft: baselineDraftForPrompt(action.draft)
  };

  const bodyBase = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(userPayload) }
    ],
    max_completion_tokens: 450
  };

  let completion;
  try {
    completion = await withTimeout(
      openaiService.createChatCompletionResilient({
        ...bodyBase,
        response_format: { type: 'json_object' }
      }),
      LLM_TIMEOUT_MS,
      { label: 'chatProductActionLlm' }
    );
  } catch (firstErr) {
    const msg = String(firstErr?.message || '');
    const status = firstErr?.status;
    const retryWithoutFormat =
      status === 400 ||
      /response_format|json_schema|unsupported/i.test(msg);
    if (!retryWithoutFormat) throw firstErr;
    completion = await withTimeout(
      openaiService.createChatCompletionResilient({
        ...bodyBase,
        messages: [
          {
            role: 'system',
            content: `${system}\n\nImportante: respondé solo JSON válido, una sola línea o bloque, sin comentarios.`
          },
          bodyBase.messages[1]
        ]
      }),
      LLM_TIMEOUT_MS,
      { label: 'chatProductActionLlm_fallback' }
    );
  }

  const raw = completion?.choices?.[0]?.message?.content;
  const parsed = parseJsonFromCompletion(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const safe = pickSanitizedLlmFields(proposalType, parsed);

  if (proposalType === 'propose_habit' && safe.reminderTime && !safe.reminder) {
    safe.reminder = { time: safe.reminderTime, enabled: true };
    delete safe.reminderTime;
  }

  return safe;
}

/**
 * @param {Array<{ type: string, draft: object, id?: string, rationaleShort?: string }>} actions
 * @param {{ userContent: string, assistantContent: string }} ctx
 * @returns {Promise<Array<{ type: string, draft: object, id?: string, rationaleShort?: string }>>}
 */
function cloneProductAction(action) {
  if (!action || typeof action !== 'object') return action;
  const d = action.draft;
  const draft =
    d && typeof d === 'object' && !Array.isArray(d) ? { ...d } : d !== undefined ? d : {};
  return { ...action, draft };
}

export async function enrichProposedProductActionsWithLlm(actions, ctx) {
  if (!Array.isArray(actions) || actions.length === 0) return actions;
  if (process.env.CHAT_PRODUCT_ACTION_LLM === 'false') return actions;

  const userContent = ctx?.userContent ?? '';
  const assistantContent = ctx?.assistantContent ?? '';

  const out = [];
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    if (!action || typeof action !== 'object') {
      continue;
    }
    const allowLlm = i < MAX_ACTIONS_LLM && isSafeProductAction(action);
    if (!allowLlm) {
      out.push(cloneProductAction(action));
      continue;
    }
    try {
      const payload = await extractDraftWithLlm(action, userContent, assistantContent);
      if (payload && Object.keys(payload).length > 0) {
        out.push(mergeProductActionDraftFromLlm(action, payload));
      } else {
        out.push(cloneProductAction(action));
      }
    } catch (e) {
      console.warn('[chatProductActionLlm] enriquecimiento omitido:', e?.message || e);
      out.push(cloneProductAction(action));
    }
  }
  return out;
}

export default {
  enrichProposedProductActionsWithLlm
};
