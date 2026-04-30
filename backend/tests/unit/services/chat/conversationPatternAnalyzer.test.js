import { describe, expect, it } from '@jest/globals';
import { analyzeConversationPattern } from '../../../../services/chat/conversationPatternAnalyzer.js';

describe('conversationPatternAnalyzer', () => {
  it('detecta racha de preguntas del asistente y respuestas cortas del usuario', () => {
    const historyNewestFirst = [
      { role: 'assistant', content: '¿Qué pasó después?' },
      { role: 'user', content: 'No sé' },
      { role: 'assistant', content: '¿Te pesa más lo de pareja o trabajo?' },
      { role: 'user', content: 'Pareja' },
      { role: 'assistant', content: '¿Quieres contarme más?' }
    ];

    const result = analyzeConversationPattern(historyNewestFirst, 'si');
    expect(result.questionStreakCount).toBeGreaterThanOrEqual(2);
    expect(result.shortReplyStreak).toBeGreaterThanOrEqual(2);
    expect(result.cognitiveLoadSignal).toBeTruthy();
  });

  it('detecta señal de cierre por desahogo', () => {
    const result = analyzeConversationPattern([], 'gracias, ya me desahogué');
    expect(result.closureRisk).toBe(true);
  });
});

