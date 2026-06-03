/**
 * Snippet de prompt (#78): alinea la respuesta del modelo con tarjetas de psicoed en UI.
 */
import actionSuggestionService from './actionSuggestionService.js';
import { shouldShowChatActionSuggestions } from '../routes/chat/chatContextAnalysis.js';
import { resolveChatSuggestionRankingScores } from './chatSuggestionRanking.js';

export function extractPsychoeducationSuggestions(formatted = []) {
  return (formatted || []).filter(
    (s) =>
      s?.interventionType === 'psychoeducation' ||
      String(s?.id || '').startsWith('psychoeducation_'),
  );
}

/**
 * @param {Array<{ previewTitle?: string, label?: string }>} formatted
 * @param {string} [language='es']
 * @returns {string|null}
 */
export function buildPsychoeducationPromptSnippet(formatted, language = 'es') {
  const cards = extractPsychoeducationSuggestions(formatted);
  if (cards.length === 0) return null;

  const titles = cards
    .map((c) => String(c.previewTitle || c.label || '').trim())
    .filter(Boolean);
  if (titles.length === 0) return null;

  const en = String(language || 'es').toLowerCase().startsWith('en');
  const list = titles.map((t) => `«${t}»`).join(en ? ', ' : ', ');

  if (en) {
    return (
      '\n\n### Psychoeducation cards in the UI (internal)\n' +
      `After your reply the user will see brief (~2 min) psychoeducation cards: ${list}.\n` +
      '- You may naturally mention they can open those modules if helpful; do not sound like marketing.\n' +
      '- Do not repeat every card title as a bullet list; one bridging sentence is enough.\n' +
      '- Prioritize emotional safety and grounding before inviting them to read.'
    );
  }

  return (
    '\n\n### Tarjetas de psicoeducación en la interfaz (interno)\n' +
    `Después de tu respuesta el usuario verá tarjetas breves (~2 min) de psicoeducación: ${list}.\n` +
    '- Puedes mencionar de forma natural que puede abrir esos módulos si le sirve; evita tono de marketing.\n' +
    '- No repitas cada título como lista; basta una frase puente.\n' +
    '- Prioriza contención, seguridad y grounding antes de invitar a leer.'
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
    const formatted = actionSuggestionService.formatSuggestions(actionIds, language);
    return {
      shouldShow: true,
      actionIds,
      formatted,
      psychoeducationPromptSnippet: buildPsychoeducationPromptSnippet(formatted, language),
    };
  } catch {
    return empty;
  }
}
