/**
 * Insight diario del home — narrativa cálida vía LLM (salud mental, no reporte).
 */
import openaiService from './openaiService.js';
import cacheService from './cacheService.js';
import { normalizeFocusLanguage } from '../utils/focusDashboardCopy.js';
import {
  failsClinicalGuardrails,
  sanitizeObservationalText,
} from '../utils/clinicalContentGuardrails.js';
import { cacheTtlSecondsUntilUtcEndOfDay } from './homeRotatingInsightCache.js';
import { buildObservationalFidelitySnippet } from './chat/observationalFidelitySnippet.js';

const HOME_INSIGHT_MIN_LEN = 24;
const HOME_INSIGHT_MAX_LEN = 220;

const DEMOTIVATING_PATTERNS = [
  /\b0\s+tarea/i,
  /\b0\s+task/i,
  /\bcompletaste\s+0\b/i,
  /\byou\s+completed\s+0\b/i,
  /\bno\s+completaste\b/i,
  /\bdidn'?t\s+complete\b/i,
  /\bning[uú]n\s+avance\b/i,
  /\bno\s+avance\b/i,
];

/** Insights warm genéricos / desalineados con malestar. */
const VAGUE_WELLNESS_PATTERNS = [
  /\bespacio\s+de\s+calma\b/i,
  /\bspace\s+of\s+calm\b/i,
  /\bdescubrir\s+nuevos\s+patrones\b/i,
  /\bdiscover(?:ing)?\s+new\s+patterns\b/i,
  /\ben\s+tu\s+viaje\b/i,
  /\bon\s+your\s+journey\b/i,
  /\bcada\s+peque[nñ]o\s+paso\s+que\s+elijas\b/i,
];

export function isHomeInsightLlmEnabled() {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.HOME_INSIGHT_LLM_ENABLED === 'false') return false;
  return (
    process.env.HOME_INSIGHT_LLM_ENABLED === 'true' ||
    process.env.DASHBOARD_FOCUS_LLM_ENABLED === 'true'
  );
}

export function isDemotivatingHomeInsightText(text) {
  const raw = String(text || '').trim();
  if (!raw) return true;
  if (failsClinicalGuardrails(raw)) return true;
  return DEMOTIVATING_PATTERNS.some((re) => re.test(raw));
}

export function isVagueWellnessHomeInsightText(text) {
  const raw = String(text || '').trim();
  if (!raw) return true;
  return VAGUE_WELLNESS_PATTERNS.some((re) => re.test(raw));
}

export function validateHomeInsightLlmText(text) {
  const sanitized = sanitizeObservationalText(text, HOME_INSIGHT_MAX_LEN);
  if (!sanitized || sanitized.length < HOME_INSIGHT_MIN_LEN) return null;
  if (isDemotivatingHomeInsightText(sanitized)) return null;
  if (isVagueWellnessHomeInsightText(sanitized)) return null;
  return sanitized;
}

function buildLlmContextPayload({
  summary = null,
  weeklyInsight = null,
  graphCorrelations = [],
} = {}) {
  const topTopics = (summary?.emotions?.progressTopicsTop || [])
    .slice(0, 3)
    .map((row) => row?.topic)
    .filter(Boolean);
  const topEmotions = (summary?.emotions?.insightsEmotionsTop || [])
    .slice(0, 3)
    .map((row) => row?.emotion)
    .filter(Boolean);

  return {
    week: {
      label: summary?.period?.label || null,
      userMessages: summary?.chat?.userMessages ?? 0,
      activeDays: summary?.chat?.distinctActiveDays ?? 0,
      tasksCompleted: summary?.tasks?.completedInPeriod ?? 0,
      habitsCompletions: summary?.habits?.completionsInPeriod ?? 0,
      journalEntries: summary?.journal?.entriesCount ?? 0,
      techniquesUses: summary?.techniques?.totalUses ?? 0,
      habitStreak: summary?.habits?.bestCurrentStreakAmongActive ?? 0,
    },
    themes: topTopics,
    emotions: topEmotions,
    weeklyHeadline: weeklyInsight?.headline || null,
    weeklySamples: (weeklyInsight?.insights || [])
      .slice(0, 2)
      .map((row) => row?.detail)
      .filter(Boolean),
    graphSamples: (graphCorrelations || [])
      .slice(0, 2)
      .map((row) => ({
        type: row?.type,
        topic: row?.sourceLabel || row?.sourceId,
        intervention: row?.interventionLabel || row?.targetId,
      })),
  };
}

function systemPrompt(language) {
  const lang = normalizeFocusLanguage(language);
  const fidelity = buildObservationalFidelitySnippet(lang);
  if (lang === 'en') {
    return [
      'You write one short home insight for a mental health companion app (Anto).',
      'Tone: warm, curious, validating — invite reflection, never shame.',
      fidelity,
      'Rules:',
      '- One sentence only, max 200 characters.',
      '- Ground the sentence in the themes/emotions/samples from the JSON (sleep, stress, etc.).',
      '- Never invent a calm week or "space of calm" if themes/emotions show distress.',
      '- Highlight a pattern, small win, or gentle observation.',
      '- Never mention zero counts, failures, or what the user did not do.',
      '- No diagnosis, no clinical labels, no guilt.',
      '- Do not start with "You completed 0…".',
      'Reply with the sentence only, no quotes or prefix.',
    ].join('\n');
  }
  return [
    'Escribes un insight breve para el home de una app de salud mental (Anto).',
    'Tono: cálido, curioso, validante — invita a mirar el patrón, nunca avergonzar.',
    fidelity,
    'Reglas:',
    '- Una sola oración, máximo 200 caracteres.',
    '- Ancla la frase en los temas/emociones/muestras del JSON (sueño, estrés, etc.).',
    '- Nunca inventes una semana de calma o un «espacio de calma» si temas/emociones muestran malestar.',
    '- Destaca un patrón, un micro-logro o una observación amable.',
    '- Nunca menciones ceros, fracasos ni lo que la persona no hizo.',
    '- Sin diagnóstico, sin etiquetas clínicas, sin culpa.',
    '- No empieces con «Completaste 0…».',
    'Responde solo con la oración, sin comillas ni prefijo.',
  ].join('\n');
}

function userPrompt(language, payload) {
  const lang = normalizeFocusLanguage(language);
  const label = lang === 'en' ? 'User context (JSON)' : 'Contexto del usuario (JSON)';
  const suffix =
    lang === 'en'
      ? 'Write one inviting insight sentence for the home card.'
      : 'Escribe una oración de insight invitante para la tarjeta del home.';
  return `${label}:\n${JSON.stringify(payload)}\n\n${suffix}`;
}

/**
 * @param {string} userId
 * @param {{ summary?: object, weeklyInsight?: object, graphCorrelations?: Array, language?: string }} input
 */
export async function generateHomeInsightWithLlm(userId, input = {}) {
  if (!userId || !isHomeInsightLlmEnabled()) return null;

  const language = normalizeFocusLanguage(input.language);
  const dayKey = new Date().toISOString().slice(0, 10);
  const cacheKey = cacheService.generateKey('home_insight_llm_v1', {
    userId: String(userId),
    day: dayKey,
    language,
  });

  const cached = await cacheService.get(cacheKey);
  if (typeof cached === 'string' && cached.trim()) {
    return validateHomeInsightLlmText(cached);
  }
  if (cached === null) {
    /* miss */
  }

  const payload = buildLlmContextPayload(input);
  const model = process.env.HOME_INSIGHT_LLM_MODEL || process.env.DASHBOARD_FOCUS_LLM_MODEL || 'gpt-4o-mini';

  try {
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        { role: 'system', content: systemPrompt(language) },
        { role: 'user', content: userPrompt(language, payload) },
      ],
      max_completion_tokens: 120,
      temperature: 0.45,
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const text = validateHomeInsightLlmText(raw);
    if (!text) {
      await cacheService.set(cacheKey, '', Math.min(300, cacheTtlSecondsUntilUtcEndOfDay()));
      return null;
    }

    await cacheService.set(cacheKey, text, cacheTtlSecondsUntilUtcEndOfDay());
    return text;
  } catch {
    return null;
  }
}

/**
 * Señal mínima para mostrar un insight real (no copy de bienvenida).
 */
export function hasMeaningfulHomeInsightSignal({
  summary = null,
  weeklyInsight = null,
  graphCorrelations = [],
} = {}) {
  if (weeklyInsight?.status === 'ready') {
    const hasWeekly =
      Boolean(weeklyInsight.headline) ||
      (Array.isArray(weeklyInsight.insights) && weeklyInsight.insights.length > 0);
    if (hasWeekly) return true;
  }
  if (Array.isArray(graphCorrelations) && graphCorrelations.length > 0) return true;
  if (!summary || typeof summary !== 'object') return false;

  const chat = summary.chat || {};
  const habits = summary.habits || {};
  const tasks = summary.tasks || {};
  const journal = summary.journal || {};
  const techniques = summary.techniques || {};

  if ((chat.userMessages ?? 0) >= 1) return true;
  if ((habits.completionsInPeriod ?? 0) > 0) return true;
  if ((tasks.completedInPeriod ?? 0) > 0) return true;
  if ((journal.entriesCount ?? 0) > 0) return true;
  if ((techniques.totalUses ?? 0) > 0) return true;
  if ((habits.bestCurrentStreakAmongActive ?? 0) >= 1) return true;

  return false;
}

const WELCOME_HOME_INSIGHT_MESSAGES = {
  es: [
    'Cuando quieras, aquí verás patrones de tu bienestar.',
    'Que hayas descargado la app ya es un gesto de cuidado.',
    'Preocuparte por tu salud mental ya es un paso importante.',
  ],
  en: [
    "Whenever you're ready, you'll see your wellbeing patterns here.",
    'Downloading the app is already an act of care.',
    'Caring about your mental health is already an important step.',
  ],
};

/**
 * Copy de primer contacto — sin fingir que Anto «notó» un patrón.
 */
export function buildWelcomeHomeInsight(language = 'es', seed = '') {
  const lang = normalizeFocusLanguage(language);
  const messages = WELCOME_HOME_INSIGHT_MESSAGES[lang] || WELCOME_HOME_INSIGHT_MESSAGES.es;
  let hash = 0;
  const s = String(seed || 'welcome');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  const index = messages.length > 0 ? hash % messages.length : 0;
  const text = messages[index];

  return {
    text,
    variant: 'welcome',
    sectionKey: 'HOME_INSIGHT_WELCOME_SECTION',
    ctaKey: 'HOME_INSIGHT_CTA_CHAT',
    destination: 'Chat',
    source: 'welcome',
  };
}

export function buildWarmDeterministicHomeInsight(summary, language = 'es') {
  const lang = normalizeFocusLanguage(language);
  const tasksDone = summary?.tasks?.completedInPeriod ?? 0;
  const habitCompletions = summary?.habits?.completionsInPeriod ?? 0;
  const activeDays = summary?.chat?.distinctActiveDays ?? 0;
  const userMessages = summary?.chat?.userMessages ?? 0;
  const journalEntries = summary?.journal?.entriesCount ?? 0;
  const techniquesUses = summary?.techniques?.totalUses ?? 0;
  const streak = summary?.habits?.bestCurrentStreakAmongActive ?? 0;
  const topTopic = summary?.emotions?.progressTopicsTop?.[0]?.topic;

  const candidates = [];

  if (lang === 'en') {
    if (streak >= 3) {
      candidates.push(`You are holding a ${streak}-day streak — that consistency matters, even in small doses.`);
    }
    if (habitCompletions > 0) {
      candidates.push('You showed up for your habits this week; each check-in is a real act of care.');
    }
    if (tasksDone > 0) {
      candidates.push('You moved a few things forward this week — worth noticing what helped.');
    }
    if (journalEntries > 0) {
      candidates.push('You made space to write what you feel; that pause can change the tone of the day.');
    }
    if (techniquesUses > 0) {
      candidates.push('You tried regulation tools this week — that is active self-care, not distraction.');
    }
    if (userMessages >= 2) {
      candidates.push('You opened up in chat a few times; naming what you feel is already a step.');
    } else if (activeDays > 0) {
      candidates.push('You returned to the app this week — showing up counts, even on quiet days.');
    }
    if (topTopic && topTopic !== 'general') {
      candidates.push(`Themes around ${topTopic} came up — there may be a thread worth exploring gently.`);
    }
    candidates.push('Every small gesture of care adds up; this week still has room for one more.');
  } else {
    if (streak >= 3) {
      candidates.push(`Llevas una racha de ${streak} días — esa constancia importa, aunque sea en dosis pequeñas.`);
    }
    if (habitCompletions > 0) {
      candidates.push('Apareciste por tus hábitos esta semana; cada marca es un gesto real de cuidado.');
    }
    if (tasksDone > 0) {
      candidates.push('Moviste algunas cosas esta semana — vale la pena notar qué te ayudó.');
    }
    if (journalEntries > 0) {
      candidates.push('Te hiciste espacio para escribir lo que sientes; esa pausa puede cambiar el tono del día.');
    }
    if (techniquesUses > 0) {
      candidates.push('Probaste herramientas de regulación esta semana — eso es autocuidado activo.');
    }
    if (userMessages >= 2) {
      candidates.push('Abriste el chat varias veces; poner palabras a lo que sientes ya es un paso.');
    } else if (activeDays > 0) {
      candidates.push('Volviste a la app esta semana — aparecer cuenta, incluso en días tranquilos.');
    }
    if (topTopic && topTopic !== 'general') {
      candidates.push(`Aparecieron temas alrededor de ${topTopic} — puede haber un hilo que merezca seguir explorando.`);
    }
    candidates.push('Cada gesto pequeño de cuidado suma; esta semana aún tiene espacio para uno más.');
  }

  const usable = candidates
    .map((text) => validateHomeInsightLlmText(text) || text)
    .filter((text) => text && !isDemotivatingHomeInsightText(text));

  return usable[0] || null;
}
