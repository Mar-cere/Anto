/**
 * Analiza patrones conversacionales para guiar el estilo de respuesta.
 * Enfocado en evitar interrogatorio, detectar sobrecarga y mejorar cierres.
 */

const SHORT_REPLY_MAX_WORDS = 3;
const SHORT_REPLY_MIN_CHARS = 2;
const MAX_RECENT_USER_MESSAGES = 8;

function isQuestion(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return trimmed.includes('?') || trimmed.includes('¿');
}

function wordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isShortUserReply(text) {
  const trimmed = (text || '').trim();
  if (trimmed.length < SHORT_REPLY_MIN_CHARS) return false;
  const envMaxWords = parseInt(process.env.CHAT_SHORT_REPLY_MAX_WORDS || `${SHORT_REPLY_MAX_WORDS}`, 10);
  const maxWords = Number.isFinite(envMaxWords) ? Math.min(8, Math.max(1, envMaxWords)) : SHORT_REPLY_MAX_WORDS;
  return wordCount(trimmed) <= maxWords;
}

function detectCognitiveLoad(text) {
  const content = (text || '').toLowerCase();
  if (!content) return null;

  if (/(?:son\s+demasiadas?\s+cosas|demasiado|no\s+quiero\s+ser\s+espec[ií]fic[oa]|prefiero\s+no\s+entrar)/i.test(content)) {
    return 'high';
  }

  if (/(?:no\s+s[eé]|no\s+tengo\s+cabeza|estoy\s+agotad[oa]|no\s+puedo\s+pensar)/i.test(content)) {
    return 'medium';
  }

  return null;
}

function detectClosureRisk(text) {
  const content = (text || '').toLowerCase();
  if (!content) return false;
  return /(?:me\s+voy|luego\s+vuelvo|ya\s+me\s+desahogu[eé]|gracias\s+ya\s+est[aá]|solo\s+quer[ií]a\s+desahogarme)/i.test(content);
}

export function analyzeConversationPattern(historyNewestFirst = [], currentUserContent = '') {
  const chronological = [...(historyNewestFirst || [])].reverse();
  const assistantMessages = chronological.filter((m) => m.role === 'assistant');
  const userMessages = chronological.filter((m) => m.role === 'user').slice(-MAX_RECENT_USER_MESSAGES);

  let questionStreakCount = 0;
  for (let i = assistantMessages.length - 1; i >= 0; i -= 1) {
    const candidate = assistantMessages[i]?.content || '';
    if (isQuestion(candidate)) questionStreakCount += 1;
    else break;
  }

  let shortReplyStreak = 0;
  for (let i = userMessages.length - 1; i >= 0; i -= 1) {
    const candidate = userMessages[i]?.content || '';
    if (isShortUserReply(candidate)) shortReplyStreak += 1;
    else break;
  }

  const envShortStreak = parseInt(process.env.CHAT_SHORT_REPLY_STREAK_THRESHOLD || '2', 10);
  const shortStreakThreshold = Number.isFinite(envShortStreak) ? Math.min(5, Math.max(1, envShortStreak)) : 2;

  const currentLoad = detectCognitiveLoad(currentUserContent);
  const recentLoad = detectCognitiveLoad(userMessages[userMessages.length - 1]?.content || '');
  const cognitiveLoadSignal =
    currentLoad || recentLoad || (shortReplyStreak >= shortStreakThreshold ? 'medium' : null);

  return {
    questionStreakCount,
    shortReplyStreak,
    cognitiveLoadSignal,
    closureRisk: detectClosureRisk(currentUserContent),
    userMessageWordCount: wordCount(currentUserContent)
  };
}

export default { analyzeConversationPattern };
