/**
 * Generación de subtareas (1–5) para una tarea principal vía LLM.
 * Desactivar: TASK_SUBTASKS_LLM_ENABLED=false
 * Modelo opcional: TASK_SUBTASKS_LLM_MODEL
 */
import openaiService from './openaiService.js';
import { OPENAI_MODEL } from '../constants/openai.js';
import { withTimeout } from '../utils/withTimeout.js';

const MAX_GENERATE_PER_CALL = 5;
const MAX_SUBTASKS_TOTAL = 25;
const MAX_TITLE_LEN = 100;
const MIN_TITLE_LEN = 2;
const MAX_COMPLETION_JSON_CHARS = 8000;
/** Tope de elementos leídos del array del LLM antes de sanear (evita respuestas abusivas). */
const MAX_RAW_SUBTASKS_FROM_LLM = 24;

const TIMEOUT_RAW = parseInt(process.env.TASK_SUBTASKS_LLM_TIMEOUT_MS || '14000', 10);
const LLM_TIMEOUT_MS = Math.min(60000, Math.max(5000, Number.isFinite(TIMEOUT_RAW) ? TIMEOUT_RAW : 14000));

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
      return JSON.parse(text.slice(idx));
    } catch {
      return null;
    }
  }
}

/**
 * @param {Array<{ title?: string }>} existingSubtasks
 * @param {string[]} rawTitles from LLM
 * @param {{ maxGenerate?: number, maxTotal?: number }} [opts]
 * @returns {string[]}
 */
export function pickNewSubtaskTitles(existingSubtasks, rawTitles, opts = {}) {
  const maxGen = opts.maxGenerate ?? MAX_GENERATE_PER_CALL;
  const maxTotal = opts.maxTotal ?? MAX_SUBTASKS_TOTAL;
  const existing = new Set(
    (existingSubtasks || [])
      .map((s) => String(s?.title || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const room = Math.max(0, maxTotal - (existingSubtasks?.length || 0));
  const limit = Math.min(maxGen, room);
  if (limit < 1) return [];

  const out = [];
  const list = Array.isArray(rawTitles) ? rawTitles : [];
  for (const raw of list) {
    const title = String(raw || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, MAX_TITLE_LEN);
    if (title.length < MIN_TITLE_LEN) continue;
    const key = title.toLowerCase();
    if (existing.has(key)) continue;
    existing.add(key);
    out.push(title);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * @param {{ title?: string, description?: string, itemType?: string }} task
 * @returns {Promise<string[]>}
 */
export async function generateSubtaskTitlesWithLlm(task) {
  if (process.env.TASK_SUBTASKS_LLM_ENABLED === 'false') {
    throw new Error('SUBTASKS_LLM_DISABLED');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_NOT_CONFIGURED');
  }

  const title = String(task?.title || '').trim().slice(0, 120);
  const description = String(task?.description || '').trim().slice(0, 500);
  if (title.length < 1) {
    throw new Error('TASK_TITLE_REQUIRED');
  }

  const model =
    (process.env.TASK_SUBTASKS_LLM_MODEL || '').trim() || OPENAI_MODEL;

  const system = `Eres un asistente de productividad. El usuario tiene una tarea principal en español.
Debes proponer entre 1 y ${MAX_GENERATE_PER_CALL} subtareas concretas y accionables que desglosen el trabajo para completar esa tarea.
Reglas:
- Títulos cortos (máximo ~80 caracteres cada uno), en español, sin numeración en el texto si puedes evitarla.
- Orden lógico de ejecución (primero lo que desbloquea el resto).
- No repetir el título de la tarea principal ni ser redundante.
- No incluir subtareas genéricas vacías ("hacer la tarea").
Responde SOLO con un JSON válido: {"subtasks":["...","..."]}`;

  const user = JSON.stringify({
    taskTitle: title,
    taskDescription: description || null,
    itemType: task?.itemType || 'task'
  });

  const bodyBase = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    max_completion_tokens: 500
  };

  let completion;
  try {
    completion = await withTimeout(
      openaiService.createChatCompletionResilient({
        ...bodyBase,
        response_format: { type: 'json_object' }
      }),
      LLM_TIMEOUT_MS,
      { label: 'taskSubtasksLlm' }
    );
  } catch (firstErr) {
    const msg = String(firstErr?.message || '');
    const status = firstErr?.status;
    const retryWithoutFormat =
      status === 400 || /response_format|json_schema|unsupported/i.test(msg);
    if (!retryWithoutFormat) throw firstErr;
    completion = await withTimeout(
      openaiService.createChatCompletionResilient({
        ...bodyBase,
        messages: [
          {
            role: 'system',
            content: `${system}\n\nImportante: responde solo con JSON válido, sin markdown ni comentarios.`
          },
          bodyBase.messages[1]
        ]
      }),
      LLM_TIMEOUT_MS,
      { label: 'taskSubtasksLlm_fallback' }
    );
  }

  const raw = completion?.choices?.[0]?.message?.content;
  const parsed = parseJsonFromCompletion(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('LLM_PARSE_FAILED');
  }
  const arr = parsed.subtasks;
  if (!Array.isArray(arr)) {
    throw new Error('LLM_PARSE_FAILED');
  }
  return arr
    .slice(0, MAX_RAW_SUBTASKS_FROM_LLM)
    .map((x) => String(x ?? '').trim())
    .filter(Boolean);
}

export {
  MAX_GENERATE_PER_CALL,
  MAX_SUBTASKS_TOTAL,
  MAX_TITLE_LEN,
  LLM_TIMEOUT_MS
};
