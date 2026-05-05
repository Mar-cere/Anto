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

const HABIT_HINTS = /h[áa]bito|rutina\s+diaria|todos\s+los\s+días|cada\s+día|constancia\s+diaria/i;

/**
 * Señales de que el mensaje puede traducirse en tarea u hábito sin pedido explícito (“ponelo en mis tareas”).
 * Incluye planificación, orden en la vida cotidiana, micro-pasos, rutinas y sobrecarga + intención de ordenar.
 * No cubre solo malestar sin ancla accionable (p. ej. “estoy triste” sin más).
 */
const NATURAL_PRODUCT_LEXICON =
  /planific|organiz|orden(?:ar|o)?|limpi(?:ar)?|lavar|recoger|tarea|tareas|pendiente|to-?do|checklist|lista\s+de|prioridad|agendar|recordatorio|esta\s+semana|próxim[oa]s?\s+días|mañana|pasado\s+mañana|bloque\s+de\s+tiempo|empezar\s+por|primer(?:o)?\s+paso|paso\s+(?:chico|pequeño|concreto)|micro(?:\s|-)?paso|algo\s+concreto|rutina|constancia|h[aá]bito|todos\s+los\s+días|cada\s+día|diari[oa]s?|levantarme|acostarme|dormir\s+mejor|despertar|ejercicio|meditar|\b(?:beber|tomar)\s+m[aá]s\s+agua\b|estiramientos|generar\s+tareas|crear\s+tareas|tengo\s+que\s+(?:hacer|terminar|ordenar|limpiar|preparar|llamar|mandar|escribir|empezar|entregar|pagar)|deber[ií]a\s+(?:hacer|ordenar|empezar|terminar)|necesito\s+(?:ordenar|hacer|terminar|preparar|empezar)|quiero\s+(?:organizar|ordenar|empezar|dejar|lograr)|me\s+agobia|abruma|no\s+doy\s+abasto|mucho\s+encima|muchas\s+cosas\s+(?:a\s+la\s+vez|encima)|no\s+sé\s+por\s+dónde\s+empezar|sin\s+saber\s+por\s+dónde|(?:la\s+)?cocina|encimera|escritorio|desorden/i;

/**
 * Pide guardar en la app aunque la sesión sea "desahogar" (vent). Ej.: "generala en mis tareas".
 * El título concreto suele venir del turno anterior del asistente (refinar con LLM si está activo).
 */
const EXPLICIT_TASK_TO_APP =
  /\ben\s+mis\s+tareas\b|guard(?:a|ar)(?:me|te)?\s+como\s+tarea\b|agreg(?:a|ar)(?:lo|la)?\s+a\s+mis\s+tareas\b|\bgener(?:á|a)(?:la|lo)?\s+en\s+mis\s+tareas\b|\b(?:puedes|pod[eé]s|podrias|podr[ií]as)?\s*(?:crear|crea|generar|genera|armar|arma|hacer|haz)\s+(?:la\s+)?tarea\b|\b(?:crea|crear|genera|generar)\s+(?:una\s+)?tarea\b/i;

const EXPLICIT_HABIT_TO_APP =
  /\ben\s+mis\s+h[aá]bitos\b|guard(?:a|ar)(?:me|te)?\s+como\s+h[aá]bito\b|agreg(?:a|ar)(?:lo|la)?\s+a\s+mis\s+h[aá]bitos\b|\b(?:puedes|pod[eé]s|podrias|podr[ií]as)?\s*(?:crear|crea|generar|genera|armar|arma|hacer|haz)\s+(?:el\s+|un\s+)?h[aá]bito\b|\b(?:crea|crear|genera|generar)\s+(?:un\s+)?h[aá]bito\b/i;

const CONCRETE_ACTION_ANCHORS =
  /\b(ordenar|limpiar|lavar|recoger|agendar|estudiar|repasar|resumir|leer|escribir|entregar|pagar|llamar|preparar|cocinar|entrenar|meditar|hidratarme|dormir|tarea|pendiente|h[aá]bito|rutina)\b|\b(cocina|encimera|escritorio|materia|examen|parcial|cap[ií]tulo|apunte|temario)\b/i;

const ABSTRACT_ONLY_THEMES =
  /\b(sobreplanific|perfeccionism|ansiedad|estr[eé]s|rumiaci[oó]n|autoexigencia|agobio)\b/i;

const TIME_COMMITMENT_CUES =
  /\b(hoy|mañana|esta\s+semana|próxim[oa]s?\s+días|antes\s+de|para\s+el\s+(?:viernes|sábado|domingo|lunes|martes|miércoles|jueves)|a\s+las?\s+\d{1,2})\b/i;

const OVERLOAD_CUES =
  /\b(ataread[oa]|me\s+agobia|abruma|no\s+doy\s+abasto|mucho\s+que\s+hacer|no\s+s[eé]\s+por\s+d[oó]nde\s+empezar)\b/i;

const STUDY_CONTEXT_CUES =
  /\b(estudiar|estudio|materia|examen|parcial|temario|apunte|final)\b/i;

const NO_PRODUCT_ACTION_INTENT =
  /\b(no\s+me\s+sugieras?\s+tareas?|sin\s+tareas?|solo\s+escuchar|solo\s+desahogar|no\s+quiero\s+planificar|no\s+quiero\s+tareas?)\b/i;

function hasConcreteActionAnchor(content) {
  return CONCRETE_ACTION_ANCHORS.test(content);
}

function isAbstractWithoutAction(content) {
  return ABSTRACT_ONLY_THEMES.test(content) && !hasConcreteActionAnchor(content);
}

function proposalConfidenceScore(content) {
  let score = 0;
  if (hasConcreteActionAnchor(content)) score += 2;
  if (TIME_COMMITMENT_CUES.test(content)) score += 1;
  if (OVERLOAD_CUES.test(content)) score += 1;
  if (STUDY_CONTEXT_CUES.test(content)) score += 1;
  if (NATURAL_PRODUCT_LEXICON.test(content)) score += 1;
  return score;
}

/**
 * Nivel de necesidad para modular cap/cooldown de propuestas no explícitas.
 * @param {string} content
 * @returns {'low'|'medium'|'high'}
 */
export function getProductActionNeedLevel(content) {
  const score = proposalConfidenceScore(String(content || ''));
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * @param {'vent'|'organize'|'technique'|'plan'|null} intention
 * @param {string} content
 */
function sessionAllowsProductDraft(intention, content) {
  if (EXPLICIT_TASK_TO_APP.test(content) || EXPLICIT_HABIT_TO_APP.test(content)) return true;
  if (NO_PRODUCT_ACTION_INTENT.test(content)) return false;
  if (isAbstractWithoutAction(content)) return false;
  const score = proposalConfidenceScore(content);
  if (intention === 'plan' || intention === 'organize') return score >= 1;
  if (intention === 'technique' && NATURAL_PRODUCT_LEXICON.test(content)) return score >= 2;
  if (
    intention === 'vent' &&
    NATURAL_PRODUCT_LEXICON.test(content) &&
    hasConcreteActionAnchor(content) &&
    score >= 4
  ) {
    return true;
  }
  return false;
}

/** Comando corto tipo "generala en mis tareas" sin descripción en el mismo mensaje. */
function isShortExplicitTaskCommand(content) {
  const line = String(content || '')
    .trim()
    .split('\n')[0]
    .trim();
  if (!EXPLICIT_TASK_TO_APP.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  return words.length <= 8 || line.length <= 44;
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

function deriveTaskTitle(content, firstLine) {
  if (isShortExplicitTaskCommand(content)) {
    return 'Paso acordado en el chat';
  }
  if (/\bestudiar|materia|examen|parcial|temario|apunte\b/i.test(content)) {
    return 'Bloque de estudio prioritario';
  }
  if (/\b(?:la\s+)?cocina|encimera\b/i.test(content)) {
    return 'Ordenar encimera de cocina';
  }
  if (/\bescritorio|desorden\b/i.test(content)) {
    return 'Ordenar escritorio';
  }
  if (isAbstractWithoutAction(content)) {
    return 'Paso concreto acordado en el chat';
  }
  return firstLine;
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

/** True si el usuario pidió guardar en la app (no cuenta para el tope por conversación). */
export function isExplicitProductActionRequest(userContent) {
  const c = String(userContent || '');
  return EXPLICIT_TASK_TO_APP.test(c) || EXPLICIT_HABIT_TO_APP.test(c);
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
    const habitTitle = EXPLICIT_HABIT_TO_APP.test(firstLine) && firstLine.split(/\s+/).filter(Boolean).length <= 8
      ? 'Hábito acordado en el chat'
      : firstLine;
    return [
      {
        type: 'propose_habit',
        id: crypto.randomUUID(),
        draft: {
          title: clampTitle(habitTitle),
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

  const taskTitle = deriveTaskTitle(content, firstLine);

  return [
    {
      type: 'propose_task',
      id: crypto.randomUUID(),
      draft: {
        title: clampTitle(taskTitle),
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
  isExplicitProductActionRequest,
  getProductActionNeedLevel,
  buildProposedProductActions,
  mergeProductActionDraftFromLlm,
  mergeTaskDraftFromLlm,
  mergeHabitDraftFromLlm
};
