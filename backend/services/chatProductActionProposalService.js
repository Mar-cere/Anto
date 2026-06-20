/**
 * Propuestas productivas post-turno (CONTRATO_CHAT_ACCIONES_V1.md).
 * Solo borradores validados en servidor; la persistencia ocurre tras confirmación en cliente.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { normalizeSessionIntention } from '../constants/sessionIntention.js';
import {
  getPsychoeducationCardFields,
  PSYCHOEDUCATION_TOPIC_META,
} from '../constants/psychoeducationTopics.js';

function isValidObjectIdParam(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return s.length > 0 && mongoose.Types.ObjectId.isValid(s);
}

const HABIT_HINTS = /h[áa]bito|rutina\s+diaria|todos\s+los\s+días|cada\s+día|constancia\s+diaria/i;

/**
 * Señales de que el mensaje puede traducirse en tarea u hábito sin pedido explícito (“ponlo en mis tareas”).
 * Incluye planificación, orden en la vida cotidiana, micro-pasos, rutinas y sobrecarga + intención de ordenar.
 * No cubre solo malestar sin ancla accionable (p. ej. “estoy triste” sin más).
 */
const NATURAL_PRODUCT_LEXICON =
  /planific|organiz|orden(?:ar|o)?|limpi(?:ar)?|lavar|recoger|tarea|tareas|pendiente|to-?do|checklist|lista\s+de|prioridad|agendar|recordatorio|esta\s+semana|próxim[oa]s?\s+días|mañana|pasado\s+mañana|bloque\s+de\s+tiempo|empezar\s+por|primer(?:o)?\s+paso|paso\s+(?:chico|pequeño|concreto)|micro(?:\s|-)?paso|algo\s+concreto|rutina|constancia|h[aá]bito|todos\s+los\s+días|cada\s+día|diari[oa]s?|levantarme|acostarme|dormir\s+mejor|despertar|ejercicio|meditar|\b(?:beber|tomar)\s+m[aá]s\s+agua\b|estiramientos|generar\s+tareas|crear\s+tareas|tengo\s+que\s+(?:hacer|terminar|ordenar|limpiar|preparar|llamar|mandar|escribir|empezar|entregar|pagar)|deber[ií]a\s+(?:hacer|ordenar|empezar|terminar)|necesito\s+(?:ordenar|hacer|terminar|preparar|empezar)|quiero\s+(?:organizar|ordenar|empezar|dejar|lograr)|me\s+agobia|abruma|no\s+doy\s+abasto|mucho\s+encima|muchas\s+cosas\s+(?:a\s+la\s+vez|encima)|no\s+sé\s+por\s+dónde\s+empezar|sin\s+saber\s+por\s+dónde|(?:la\s+)?cocina|encimera|escritorio|desorden/i;

/**
 * Pide guardar en la app aunque la sesión sea "desahogar" (vent). Ej.: "genera esto en mis tareas".
 * El título concreto suele venir del turno anterior del asistente (refinar con LLM si está activo).
 */
const EXPLICIT_TASK_TO_APP =
  /\ben\s+mis\s+tareas\b|guard(?:a|ar)(?:me|te)?\s+como\s+tarea(?:s)?\b|agreg(?:a|ar)(?:lo|la)?\s+a\s+mis\s+tareas\b|\bgener(?:á|a)(?:la|lo)?\s+en\s+mis\s+tareas\b|\b(?:puedes|pod[eé]s|podrias|podr[ií]as)?\s*(?:crear|crea|generar|genera|generar[ií]as|armar|arma|hacer|haz)\s+(?:la\s+|las\s+)?tarea(?:s)?\b|\b(?:crea|crear|genera|generar|generar[ií]as)\s+(?:una\s+|unas\s+)?tarea(?:s)?\b|\b(?:generame|gen[eé]rame|armame|pasame)\s+(?:una\s+|unas\s+)?tarea(?:s)?\b/i;

const EXPLICIT_HABIT_TO_APP =
  /\ben\s+mis\s+h[aá]bitos\b|guard(?:a|ar)(?:me|te)?\s+como\s+h[aá]bito(?:s)?\b|agreg(?:a|ar)(?:lo|la)?\s+a\s+mis\s+h[aá]bitos\b|\b(?:puedes|pod[eé]s|podrias|podr[ií]as)?\s*(?:crear|crea|generar|genera|generar[ií]as|armar|arma|hacer|haz)\s+(?:el\s+|un\s+|los\s+|unos\s+)?h[aá]bito(?:s)?\b|\b(?:crea|crear|genera|generar|generar[ií]as)\s+(?:un\s+|unos\s+)?h[aá]bito(?:s)?\b|\b(?:generame|gen[eé]rame|armame|pasame)\s+(?:un\s+|unos\s+)?h[aá]bito(?:s)?\b/i;

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

/** Check-in positivo sin pedido accionable (p. ej. «hoy bien, me siento bien»). */
const POSITIVE_EMOTIONAL_CHECKOUT =
  /(?:me\s+siento\s+(?:bien|tranquil[oa]|calm[oa]|content[oa]|feliz|mejor|genial)|(?:estoy|anda|va)\s+bien|todo\s+(?:bien|tranquilo|en\s+orden)|(?:hoy|ahora)\s+(?:bien|mejor|tranquil[oa])|(?:muy\s+)?bien\s+gracias|sin\s+novedad)/i;

export function isLowValueEmotionalCheckout(content) {
  const text = String(content || '').trim();
  if (!text || text.length > 160) return false;
  if (!POSITIVE_EMOTIONAL_CHECKOUT.test(text)) return false;
  if (hasConcreteActionAnchor(text)) return false;
  if (EXPLICIT_TASK_TO_APP.test(text) || EXPLICIT_HABIT_TO_APP.test(text)) return false;
  if (OVERLOAD_CUES.test(text) || STUDY_CONTEXT_CUES.test(text)) return false;
  if (NATURAL_PRODUCT_LEXICON.test(text) && proposalConfidenceScore(text) >= 2) return false;
  return true;
}

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
  // Umbrales: ligeramente menos conservadores para capturar más casos accionables.
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * @param {'vent'|'organize'|'technique'|'plan'|null} intention
 * @param {string} content
 */
function sessionAllowsProductDraft(intention, content) {
  if (EXPLICIT_TASK_TO_APP.test(content) || EXPLICIT_HABIT_TO_APP.test(content)) return true;
  if (NO_PRODUCT_ACTION_INTENT.test(content)) return false;
  if (isLowValueEmotionalCheckout(content)) return false;
  if (isAbstractWithoutAction(content)) return false;
  const score = proposalConfidenceScore(content);
  if (intention === 'plan' || intention === 'organize') {
    if (score >= 3) return true;
    if (score >= 2 && (hasConcreteActionAnchor(content) || NATURAL_PRODUCT_LEXICON.test(content))) {
      return true;
    }
    if (score >= 1 && HABIT_HINTS.test(content) && NATURAL_PRODUCT_LEXICON.test(content)) {
      return true;
    }
    return false;
  }
  if (intention === 'technique' && NATURAL_PRODUCT_LEXICON.test(content)) return score >= 2;
  if (
    intention === 'vent' &&
    NATURAL_PRODUCT_LEXICON.test(content) &&
    hasConcreteActionAnchor(content) &&
    score >= 3
  ) {
    return true;
  }
  return false;
}

/** Comando corto tipo "genera esto en mis tareas" sin descripción en el mismo mensaje. */
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

function topicFromInterventionId(interventionId) {
  const id = String(interventionId || '').trim();
  if (!id) return null;
  for (const [topic, meta] of Object.entries(PSYCHOEDUCATION_TOPIC_META)) {
    if (meta.interventionId === id) return topic;
  }
  return null;
}

const HABIT_ICON_BY_TOPIC = {
  sleep: 'sleep',
  anxiety: 'meditation',
  depression: 'journal',
  stress: 'meditation',
  anger: 'journal',
  emotionRegulation: 'journal',
  trauma: 'journal',
};

/** Señales de que el título ya encaja con el módulo de psicoeducación activo. */
const TOPIC_TITLE_ALIGNMENT = {
  sleep:
    /dormir|sueño|acostar|despertar|insomnio|pantalla|preocup|pensar|rumi|mente\s+antes|noche/i,
  anxiety: /ansiedad|miedo|p[aá]nico|preocup|ancl|respir|tensi[oó]n|alarma/i,
  depression: /[áa]nimo|activ|energ|inercia|paso\s+peque|desmotiv/i,
  stress: /estr[eé]s|agot|sobrecarga|controlable|descanso/i,
  anger: /enoj|ira|l[ií]mite|pausa|mensaje/i,
  emotionRegulation: /emoci[oó]n|desbord|pausa|nombr/i,
  trauma: /trauma|flashback|segur|ancl|ground/i,
};

const SLEEP_RUMINATION_CUES =
  /(?:pensando|preocup|rumi|salió\s+mal|darle\s+vueltas|no\s+paro\s+de\s+pensar|todo\s+lo\s+que)/i;
const SLEEP_SCREEN_CUES = /(?:pantalla|móvil|celular|tablet|redes|scroll|tiktok|instagram)/i;

function titleMatchesMicroSteps(title, microSteps = []) {
  const t = String(title || '').toLowerCase();
  return microSteps.some((step) => {
    const words = String(step || '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 5);
    return words.some((w) => t.includes(w));
  });
}

function isProductActionOnPsychoeducationTopic(title, topic, microSteps = []) {
  const pattern = TOPIC_TITLE_ALIGNMENT[topic];
  if (!pattern) return false;
  const t = String(title || '');
  return pattern.test(t) || titleMatchesMicroSteps(t, microSteps);
}

function resolvePsychoeducationAlignedTitle(topic, userContent, microSteps = [], language = 'es') {
  const steps = Array.isArray(microSteps) ? microSteps : [];
  const text = String(userContent || '');

  if (topic === 'sleep') {
    if (SLEEP_RUMINATION_CUES.test(text)) {
      return language === 'en'
        ? 'Briefly note what is worrying me before bed'
        : 'Anotar brevemente lo que me preocupa antes de acostarme';
    }
    if (SLEEP_SCREEN_CUES.test(text) && steps[1]) {
      return steps[1];
    }
  }

  return steps[0] || null;
}

/**
 * Contexto de psicoeducación para enriquecer propuestas con LLM.
 * @param {string|null|undefined} primaryPsychoeducationId
 * @param {string} language
 */
export function getPsychoeducationProductActionContext(primaryPsychoeducationId, language = 'es') {
  const topic = topicFromInterventionId(primaryPsychoeducationId);
  if (!topic) return null;
  const fields = getPsychoeducationCardFields(topic, language);
  if (!fields?.microSteps?.length) return null;
  return {
    topicTitle: fields.previewTitle,
    microSteps: fields.microSteps.slice(0, 2),
    interventionId: String(primaryPsychoeducationId),
  };
}

/**
 * Corrige tareas solo si están claramente fuera del módulo de psicoeducación del turno.
 * Si el borrador ya encaja con el tema (p. ej. preocupaciones + sueño), se conserva.
 * @param {Array<{ type: string, draft: object, id?: string, rationaleShort?: string }>} actions
 * @param {{ primaryPsychoeducationId?: string|null, language?: string, userContent?: string }} options
 */
export function alignProductActionsWithPsychoeducation(
  actions,
  { primaryPsychoeducationId, language = 'es', userContent = '' } = {},
) {
  if (!primaryPsychoeducationId || !Array.isArray(actions) || actions.length === 0) {
    return actions;
  }

  const topic = topicFromInterventionId(primaryPsychoeducationId);
  if (!topic) return actions;

  const fields = getPsychoeducationCardFields(topic, language);
  const microSteps = fields?.microSteps || [];
  if (microSteps.length === 0) return actions;

  const topicTitle = fields.previewTitle || topic;

  return actions.map((action) => {
    if (!action || typeof action !== 'object') return action;
    if (action.type !== 'propose_task' && action.type !== 'propose_habit') return action;

    const currentTitle = String(action.draft?.title || '');
    if (isProductActionOnPsychoeducationTopic(currentTitle, topic, microSteps)) {
      return action;
    }

    const fallbackTitle = resolvePsychoeducationAlignedTitle(
      topic,
      userContent,
      microSteps,
      language,
    );
    if (!fallbackTitle) return action;

    const alignedTitle = clampTitle(fallbackTitle);
    const rationaleShort = `Relacionado con ${topicTitle}: un paso pequeño del módulo que acabas de ver.`;
    const draft = { ...(action.draft || {}), title: alignedTitle };
    if (action.type === 'propose_habit' && HABIT_ICON_BY_TOPIC[topic]) {
      draft.icon = HABIT_ICON_BY_TOPIC[topic];
    }
    return { ...action, draft, rationaleShort };
  });
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

function deriveRationaleShort(content, type, needLevel) {
  if (STUDY_CONTEXT_CUES.test(content)) {
    return 'Mencionaste estudio/examen y carga cercana.';
  }
  if (/\b(?:la\s+)?cocina|encimera|escritorio|desorden\b/i.test(content)) {
    return 'Hay una zona concreta; conviene empezar con algo pequeño.';
  }
  if (OVERLOAD_CUES.test(content) && TIME_COMMITMENT_CUES.test(content)) {
    return 'Nombraste sobrecarga y horizonte temporal.';
  }
  if (type === 'propose_habit') {
    return 'Suena a algo que se repite; encaja mejor como hábito.';
  }
  if (needLevel === 'high') {
    return 'Hay señales claras para bajar esto a un paso accionable.';
  }
  if (needLevel === 'medium') {
    return 'Puedo ayudarte a convertirlo en un paso concreto si te sirve.';
  }
  return 'Si te ayuda, podemos convertirlo en una tarea concreta.';
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
  const level = String(riskLevel || 'LOW').trim().toUpperCase();
  if (level === 'HIGH' || level === 'MEDIUM' || level === 'WARNING') return false;
  return true;
}

/** True si el usuario pidió guardar en la app (no cuenta para el tope por conversación). */
export function isExplicitProductActionRequest(userContent) {
  const c = String(userContent || '');
  return EXPLICIT_TASK_TO_APP.test(c) || EXPLICIT_HABIT_TO_APP.test(c);
}

const AFFIRMATIVE_PRODUCT_CONFIRMATION =
  /^(?:s[ií]|sip|sii|ok(?:ay)?|vale|claro|dale|de\s+acuerdo|perfecto|bueno|genial|hazlo|hagámoslo|si\s+por\s+favor|yes|yep|sure|agree|al\s+tanto)[.!?\s]*$/iu;

const ASSISTANT_PRODUCT_OFFER_CUES =
  /(?:tarea\s+concreta|pas(?:emos|ar)\s+(?:a\s+)?una\s+tarea|convertir(?:lo|la)?\s+en\s+(?:una\s+)?tarea|te\s+propongo|podemos\s+(?:empezar|convertir)|¿quieres\s+que\s+lo|paso\s+concreto|bloque\s+de\s+estudio|ordenar\s+(?:el\s+)?(?:escritorio|encimera))/iu;

/** Respuesta breve de confirmación tras una oferta de tarea/hábito en el hilo. */
export function isAffirmativeProductActionConfirmation(userContent) {
  const t = String(userContent || '').trim();
  if (!t || t.length > 24) return false;
  return AFFIRMATIVE_PRODUCT_CONFIRMATION.test(t);
}

function normalizeHistoryMessages(conversationHistory) {
  if (!Array.isArray(conversationHistory)) return [];
  return conversationHistory
    .map((m) => {
      const role = m?.role === 'assistant' ? 'assistant' : m?.role === 'user' ? 'user' : null;
      const content = String(m?.content || '').trim();
      return role && content ? { role, content } : null;
    })
    .filter(Boolean);
}

/**
 * Si el usuario confirma con «Sí»/«vale», reutiliza el turno anterior accionable del hilo.
 * @param {string} userContent
 * @param {Array<{ role?: string, content?: string }>} conversationHistory newest-first
 * @returns {{ effectiveUserContent: string, priorUserContent: string, priorAssistantContent: string } | null}
 */
export function resolveProductActionSourceFromHistory(userContent, conversationHistory) {
  if (!isAffirmativeProductActionConfirmation(userContent)) return null;

  const msgs = normalizeHistoryMessages(conversationHistory);
  const priorUser = msgs.find((m, i) => i > 0 && m.role === 'user');
  const priorAssistant = msgs.find((m, i) => i > 0 && m.role === 'assistant');
  if (!priorUser && !priorAssistant) return null;

  const assistantOffered =
    Boolean(priorAssistant) && ASSISTANT_PRODUCT_OFFER_CUES.test(priorAssistant.content);
  const userHadActionable =
    Boolean(priorUser) && proposalConfidenceScore(priorUser.content) >= 2;

  if (!assistantOffered && !userHadActionable) return null;

  const effectiveUserContent = priorUser?.content || priorAssistant?.content || userContent;
  return {
    effectiveUserContent,
    priorUserContent: priorUser?.content || '',
    priorAssistantContent: priorAssistant?.content || '',
  };
}

/**
 * Contexto para enriquecer el borrador con LLM (p. ej. confirmación «Sí» usa el turno previo).
 */
export function resolveProductActionEnrichmentContext({
  userContent,
  assistantContent,
  conversationHistory = [],
}) {
  const resolved = resolveProductActionSourceFromHistory(userContent, conversationHistory);
  if (!resolved) {
    return {
      userContent: String(userContent || ''),
      assistantContent: String(assistantContent || ''),
    };
  }
  return {
    userContent: resolved.priorUserContent || resolved.effectiveUserContent,
    assistantContent: resolved.priorAssistantContent || String(assistantContent || ''),
  };
}

/**
 * @param {{
 *   riskLevel?: string,
 *   isCrisis?: boolean,
 *   userContent: string,
 *   sessionIntention: unknown,
 *   conversationId: unknown,
 *   assistantMessageId: unknown,
 *   conversationHistory?: Array<{ role?: string, content?: string }>,
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
    assistantMessageId,
    conversationHistory = [],
  } = input;

  if (!shouldOfferProductActions({ riskLevel, isCrisis })) {
    return [];
  }

  const confirmationContext = resolveProductActionSourceFromHistory(
    userContent,
    conversationHistory,
  );
  let content = String(userContent || '').trim();
  if (confirmationContext) {
    content = confirmationContext.effectiveUserContent;
  }
  if (content.length < 8 && !confirmationContext) {
    return [];
  }
  if (isLowValueEmotionalCheckout(content)) {
    return [];
  }

  const intention = normalizeSessionIntention(sessionIntention);
  const allowsDraft =
    confirmationContext != null || sessionAllowsProductDraft(intention, content);
  if (!allowsDraft) {
    return [];
  }

  if (!isValidObjectIdParam(conversationId) || !isValidObjectIdParam(assistantMessageId)) {
    return [];
  }

  const firstLine = content.split('\n')[0] || content;
  const needLevel = getProductActionNeedLevel(content);

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
        rationaleShort: deriveRationaleShort(content, 'propose_habit', needLevel)
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
      rationaleShort: deriveRationaleShort(content, 'propose_task', needLevel)
    }
  ];
}

export default {
  shouldOfferProductActions,
  isExplicitProductActionRequest,
  isAffirmativeProductActionConfirmation,
  isLowValueEmotionalCheckout,
  resolveProductActionSourceFromHistory,
  resolveProductActionEnrichmentContext,
  getProductActionNeedLevel,
  buildProposedProductActions,
  alignProductActionsWithPsychoeducation,
  mergeProductActionDraftFromLlm,
  mergeTaskDraftFromLlm,
  mergeHabitDraftFromLlm
};
