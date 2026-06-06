/**
 * Resuelve scores de ranking #127 para sugerencias de chat (best-effort).
 */
import interventionRankingService from './interventionRankingService.js';

export async function resolveChatSuggestionRankingScores({
  userId,
  emotionalAnalysis,
  contextualAnalysis,
}) {
  if (!userId) return null;
  try {
    const scores = await interventionRankingService.fetchRankingScoresForUser({
      userId,
      emotionalAnalysis,
      contextualAnalysis,
    });
    return scores?.size > 0 ? scores : null;
  } catch {
    return null;
  }
}
