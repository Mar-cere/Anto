/**
 * Snippet de prompt (#78): alinea la respuesta del modelo con tarjetas de psicoed en UI.
 */
import actionSuggestionService, {
  resolveContextualPsychoeducationIds,
} from './actionSuggestionService.js';
import { shouldShowChatActionSuggestions } from '../routes/chat/chatContextAnalysis.js';
import { resolveChatSuggestionRankingScores } from './chatSuggestionRanking.js';
import { enrichSuggestionsWithAbcPrefill } from './abcRecordPrefillService.js';
import { enrichSuggestionsWithBaPrefill } from './baRecordPrefillService.js';
import { enrichSuggestionsWithAtPrefill } from './atRecordPrefillService.js';

export function isPsychoeducationSuggestion(suggestion) {
  return (
    suggestion?.interventionType === 'psychoeducation' ||
    String(suggestion?.id || '').startsWith('psychoeducation_')
  );
}

export function extractPsychoeducationSuggestions(formatted = []) {
  return (formatted || []).filter(isPsychoeducationSuggestion);
}

const EMOTION_PRIMARY_PSYCHO_ID = {
  ansiedad: 'psychoeducation_anxiety',
  miedo: 'psychoeducation_anxiety',
  tristeza: 'psychoeducation_depression',
  enojo: 'psychoeducation_anger',
};

/**
 * Elige la psicoed principal cuando hay varias (evita saturar en crisis).
 */
export function pickPredominantPsychoeducationId(formatted, options = {}) {
  const psychos = extractPsychoeducationSuggestions(formatted);
  if (psychos.length === 0) return null;
  if (psychos.length === 1) return psychos[0].id;

  const text = String(options.userContent || '');
  const ids = new Set(psychos.map((p) => p.id));

  if (
    /(?:crisis\s+de\s+p[aá]nico|ataque\s+de\s+p[aá]nico|p[aá]nico|panico|panic\s+attack|having\s+a\s+panic|panicking)/i.test(
      text,
    ) &&
    ids.has('psychoeducation_anxiety')
  ) {
    return 'psychoeducation_anxiety';
  }

  for (const id of resolveContextualPsychoeducationIds(text)) {
    if (ids.has(id)) return id;
  }

  const emotionId = EMOTION_PRIMARY_PSYCHO_ID[options.mainEmotion];
  if (emotionId && ids.has(emotionId)) return emotionId;

  return psychos[0].id;
}

/**
 * Una tarjeta expandida (LLM + pasos); el resto compactas si hay 2+ psicoed.
 */
export function applyPsychoeducationCardTiers(formatted, options = {}) {
  const psychos = extractPsychoeducationSuggestions(formatted);
  if (psychos.length === 0) return formatted;

  const primaryId = pickPredominantPsychoeducationId(formatted, options);
  const tiered = formatted.map((s) => {
    if (!isPsychoeducationSuggestion(s)) return s;
    if (psychos.length === 1 || s.id === primaryId) {
      return {
        ...s,
        cardDisplayMode: 'expanded',
        isPrimaryPsychoeducation: true,
      };
    }
    return {
      ...s,
      cardDisplayMode: 'compact',
      isPrimaryPsychoeducation: false,
      microSteps: [],
      mechanismLine: undefined,
      previewSummary: undefined,
      description: undefined,
    };
  });

  const techniques = tiered.filter((s) => !isPsychoeducationSuggestion(s));
  const psychoCards = tiered.filter(isPsychoeducationSuggestion);
  const primary = psychoCards.find((p) => p.id === primaryId);
  const secondary = psychoCards.filter((p) => p.id !== primaryId);
  return [...techniques, ...(primary ? [primary] : []), ...secondary];
}

/**
 * @param {Array<{ previewTitle?: string, label?: string }>} formatted
 * @param {string} [language='es']
 * @param {string} [primaryId] — solo esta tarjeta alimenta el snippet LLM
 * @returns {string|null}
 */
export function buildPsychoeducationPromptSnippet(formatted, language = 'es', primaryId = null) {
  const cards = extractPsychoeducationSuggestions(formatted);
  if (cards.length === 0) return null;

  const resolvedPrimary =
    primaryId || pickPredominantPsychoeducationId(formatted, {});
  const primary =
    cards.find((c) => c.id === resolvedPrimary) || cards[0];
  const title = String(primary.previewTitle || primary.label || '').trim();
  if (!title) return null;

  const secondaryCount = cards.length - 1;
  const en = String(language || 'es').toLowerCase().startsWith('en');

  if (en) {
    return (
      '\n\n### Psychoeducation card in the UI (internal)\n' +
      `After your reply the user will see one main psychoeducation card: «${title}»` +
      (secondaryCount > 0
        ? ` (plus ${secondaryCount} shorter optional link${secondaryCount > 1 ? 's' : ''}).`
        : '.') +
      '\n- You may briefly mention that main module if helpful; do not sound like marketing.\n' +
      '- Do not list multiple module titles; one bridging sentence is enough.\n' +
      '- Prioritize emotional safety and grounding before inviting them to read; keep your reply short if they are overwhelmed.'
    );
  }

  return (
    '\n\n### Tarjeta de psicoeducación en la interfaz (interno)\n' +
    `Después de tu respuesta verá una tarjeta principal de psicoeducación: «${title}»` +
    (secondaryCount > 0
      ? ` (y ${secondaryCount} enlace${secondaryCount > 1 ? 's' : ''} breve${secondaryCount > 1 ? 's' : ''} opcional${secondaryCount > 1 ? 'es' : ''}, sin tanto texto).`
      : '.') +
    '\n- Puedes mencionar solo ese módulo principal si encaja; evita tono de marketing.\n' +
    '- No enumeres varios títulos; basta una frase puente.\n' +
    '- Prioriza contención, seguridad y grounding; si está saturado, responde breve antes de invitar a leer.'
  );
}

/**
 * Planifica sugerencias de chat una vez por turno (reutilizar tras la respuesta del modelo).
 */
export async function planChatActionSuggestions({
  emotionalAnalysis,
  contextualAnalysis,
  userContent,
  userId,
  conversationId,
  conversationHistory,
  language = 'es',
}) {
  const empty = {
    shouldShow: false,
    actionIds: [],
    formatted: [],
    psychoeducationPromptSnippet: null,
  };

  const shouldShow = await shouldShowChatActionSuggestions({
    emotionalAnalysis,
    contextualAnalysis,
    conversationHistory,
    userId,
    conversationId,
    userContent,
  });
  if (!shouldShow) return empty;

  try {
    const rankingScores = await resolveChatSuggestionRankingScores({
      userId,
      emotionalAnalysis,
      contextualAnalysis,
    });
    const actionIds = actionSuggestionService.generateSuggestions(
      emotionalAnalysis,
      contextualAnalysis,
      { rankingScores, userContent },
    );
    const rawFormatted = actionSuggestionService.formatSuggestions(actionIds, language);
    const primaryPsychoeducationId = pickPredominantPsychoeducationId(rawFormatted, {
      userContent,
      mainEmotion: emotionalAnalysis?.mainEmotion,
    });
    const tiered = applyPsychoeducationCardTiers(rawFormatted, {
      userContent,
      mainEmotion: emotionalAnalysis?.mainEmotion,
    });
    const formatted = enrichSuggestionsWithAtPrefill(
      enrichSuggestionsWithBaPrefill(
        enrichSuggestionsWithAbcPrefill(tiered, userContent),
        userContent,
        language,
      ),
      userContent,
      language,
    );
    return {
      shouldShow: true,
      actionIds,
      formatted,
      primaryPsychoeducationId,
      psychoeducationPromptSnippet: buildPsychoeducationPromptSnippet(
        formatted,
        language,
        primaryPsychoeducationId,
      ),
    };
  } catch {
    return empty;
  }
}
