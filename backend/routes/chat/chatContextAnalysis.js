/**
 * Funciones helper para análisis de contexto conversacional y riesgo.
 * Extraído de chatRoutes para mantener el archivo de rutas más legible.
 */

export function detectEmotionalEscalation(conversationHistory, currentEmotionalAnalysis) {
  if (!conversationHistory || conversationHistory.length < 2) return false;

  const recentMessages = conversationHistory
    .filter(msg => msg.role === 'user' && msg.metadata?.context?.emotional?.intensity)
    .slice(0, 3)
    .map(msg => msg.metadata.context.emotional.intensity);

  if (recentMessages.length < 2) return false;

  const currentIntensity = currentEmotionalAnalysis?.intensity || 5;
  const previousIntensity = recentMessages[0] || 5;

  return currentIntensity > previousIntensity + 1.5;
}

export function detectHelpRejection(conversationHistory, currentContent) {
  const content = (currentContent || '').toLowerCase();
  const rejectionPatterns = /(?:no.*quiero.*ayuda|no.*necesito.*ayuda|no.*me.*ayudes|déjame.*solo|no.*me.*importa|no.*sirve.*de.*nada)/i;
  return rejectionPatterns.test(content);
}

export function detectAbruptToneChange(conversationHistory, currentEmotionalAnalysis) {
  if (!conversationHistory || conversationHistory.length < 2) return false;

  const recentMessages = conversationHistory
    .filter(msg => msg.role === 'user' && msg.metadata?.context?.emotional?.mainEmotion)
    .slice(0, 2);

  if (recentMessages.length < 1) return false;

  const previousEmotion = recentMessages[0].metadata.context.emotional.mainEmotion;
  const currentEmotion = currentEmotionalAnalysis?.mainEmotion;

  const positiveEmotions = ['alegria', 'esperanza', 'neutral'];
  const negativeEmotions = ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'];

  return positiveEmotions.includes(previousEmotion) && negativeEmotions.includes(currentEmotion);
}

export function analyzeMessageFrequency(conversationHistory, currentContent) {
  if (!conversationHistory || conversationHistory.length < 2) {
    return { veryFrequent: false, frequencyChange: false };
  }

  const userMessages = conversationHistory.filter(msg => msg.role === 'user');

  if (userMessages.length < 3) {
    return { veryFrequent: false, frequencyChange: false };
  }

  const recentMessages = userMessages.slice(0, 5);
  const timeDiffs = [];

  for (let i = 0; i < recentMessages.length - 1; i++) {
    const diff = new Date(recentMessages[i].createdAt) - new Date(recentMessages[i + 1].createdAt);
    timeDiffs.push(diff / (1000 * 60));
  }

  const averageTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  const veryFrequent = averageTimeDiff < 2;

  if (userMessages.length >= 6) {
    const recent3 = userMessages.slice(0, 3);
    const previous3 = userMessages.slice(3, 6);
    const recentAvg = calculateAverageTimeDiff(recent3);
    const previousAvg = calculateAverageTimeDiff(previous3);
    const frequencyChange = Math.abs(recentAvg - previousAvg) / (previousAvg || 1) > 0.5;
    return { veryFrequent, frequencyChange };
  }

  return { veryFrequent, frequencyChange: false };
}

export function calculateAverageTimeDiff(messages) {
  if (messages.length < 2) return 0;

  const diffs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const diff = new Date(messages[i].createdAt) - new Date(messages[i + 1].createdAt);
    diffs.push(diff / (1000 * 60));
  }

  return diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
}

export function detectSilenceAfterNegative(conversationHistory) {
  if (!conversationHistory || conversationHistory.length < 2) return false;

  const lastUserMessage = conversationHistory.find(msg =>
    msg.role === 'user' &&
    msg.metadata?.context?.emotional?.mainEmotion &&
    ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'].includes(
      msg.metadata.context.emotional.mainEmotion
    )
  );

  if (!lastUserMessage) return false;

  const messagesAfter = conversationHistory.filter(msg =>
    new Date(msg.createdAt) > new Date(lastUserMessage.createdAt)
  );

  if (messagesAfter.length === 0) {
    const hoursSince = (Date.now() - new Date(lastUserMessage.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSince > 24;
  }

  return false;
}

export function shouldShowActionSuggestions(emotionalAnalysis, contextualAnalysis, conversationHistory, userId) {
  const intensity = emotionalAnalysis?.intensity || 5;
  if (intensity >= 7) return true;

  if (contextualAnalysis?.intencion?.tipo === 'CRISIS' ||
      contextualAnalysis?.urgencia === 'alta' ||
      emotionalAnalysis?.requiresAttention) {
    return true;
  }

  if (conversationHistory && conversationHistory.length >= 2) {
    const recentUserMessages = conversationHistory
      .filter(msg => msg.role === 'user' && msg.metadata?.context?.emotional?.mainEmotion)
      .slice(0, 2);

    if (recentUserMessages.length >= 1) {
      const previousEmotion = recentUserMessages[0].metadata.context.emotional.mainEmotion;
      const currentEmotion = emotionalAnalysis?.mainEmotion;
      const positiveEmotions = ['alegria', 'esperanza', 'neutral'];
      const negativeEmotions = ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'];

      if (positiveEmotions.includes(previousEmotion) && negativeEmotions.includes(currentEmotion)) {
        return true;
      }
    }
  }

  if (conversationHistory && conversationHistory.length > 0) {
    const recentContent = conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(0, 3)
      .map(msg => msg.content?.toLowerCase() || '')
      .join(' ');

    const rejectionPatterns = /(?:no.*quiero.*ayuda|no.*necesito.*ayuda|no.*me.*ayudes|déjame.*solo|no.*me.*importa|no.*sirve.*de.*nada|no.*gracias)/i;
    if (rejectionPatterns.test(recentContent)) {
      return false;
    }
  }

  if (conversationHistory && conversationHistory.length > 0) {
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const totalUserMessages = userMessages.length;
    const shouldShowByCount = totalUserMessages > 0 &&
      (totalUserMessages % 3 === 0 || totalUserMessages % 4 === 0);

    if (!shouldShowByCount) {
      return false;
    }
  }

  return false;
}

export function calculateRiskScore(emotionalAnalysis, contextualAnalysis, content, options = {}) {
  let score = 0;

  if (contextualAnalysis?.intencion?.tipo === 'CRISIS') score += 3;
  if (/suicid/i.test(content || '')) score += 4;
  if (emotionalAnalysis?.intensity >= 9) score += 2;
  if (options?.trendAnalysis?.riskAdjustment) score += options.trendAnalysis.riskAdjustment;
  if (options?.crisisHistory?.recentCrises > 0) score += 2;

  return score;
}

export function extractRiskFactors(emotionalAnalysis, contextualAnalysis, content, options = {}) {
  const factors = [];

  if (contextualAnalysis?.intencion?.tipo === 'CRISIS') factors.push('Intención de crisis');
  if (/suicid/i.test(content || '')) factors.push('Ideación suicida');
  if (emotionalAnalysis?.intensity >= 9) factors.push('Intensidad emocional muy alta');
  if (options?.trendAnalysis?.trends?.rapidDecline) factors.push('Deterioro rápido');
  if (options?.crisisHistory?.recentCrises > 0) factors.push('Crisis recientes');
  if (options?.conversationContext?.emotionalEscalation) factors.push('Escalada emocional');

  return factors;
}

export function extractProtectiveFactors(emotionalAnalysis, content) {
  const factors = [];
  const text = (content || '').toLowerCase();

  if (/ayuda|hablar|compartir/i.test(text)) factors.push('Búsqueda de ayuda');
  if (emotionalAnalysis?.secondary?.includes('esperanza')) factors.push('Esperanza detectada');
  if (/mejor|mejorando|progreso/i.test(text)) factors.push('Expresiones de mejora');
  if (/familia|amigos|apoyo/i.test(text)) factors.push('Menciones de apoyo social');

  return factors;
}
