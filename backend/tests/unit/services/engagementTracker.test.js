/**
 * Tests unitarios para engagementTracker
 */
import engagementTracker from '../../../services/engagementTracker.js';

describe('engagementTracker', () => {
  describe('analyzeEngagement', () => {
    it('debe retornar unknown con pocos mensajes', () => {
      const result = engagementTracker.analyzeEngagement([
        { content: 'hola' },
        { content: 'bien' }
      ]);
      expect(result.engagementLevel).toBe('unknown');
      expect(result.preferredResponseLength).toBe('MEDIUM');
    });

    it('debe detectar engagement bajo con mensajes cortos', () => {
      const messages = Array(6).fill(null).map(() => ({ content: 'ok' }));
      const result = engagementTracker.analyzeEngagement(messages);
      expect(result.engagementLevel).toBe('low');
      expect(result.preferredResponseLength).toBe('SHORT');
    });

    it('debe detectar engagement alto con mensajes largos', () => {
      const messages = Array(6).fill(null).map(() => ({
        content: 'Hola, tengo muchas cosas que contarte sobre lo que me pasó esta semana. Fue muy intenso y quiero que me ayudes a entender mejor qué está pasando conmigo.'
      }));
      const result = engagementTracker.analyzeEngagement(messages);
      expect(result.engagementLevel).toBe('high');
      expect(result.preferredResponseLength).toBe('LONG');
    });

    it('debe retornar responseToQuestionRatio', () => {
      const messages = [
        { content: 'Cómo estás?' },
        { content: 'Qué piensas?' },
        { content: 'Bien' },
        { content: 'Gracias' },
        { content: 'Y tú?' }
      ];
      const result = engagementTracker.analyzeEngagement(messages);
      expect(result).toHaveProperty('responseToQuestionRatio');
      expect(result.responseToQuestionRatio).toBeGreaterThanOrEqual(0);
      expect(result.responseToQuestionRatio).toBeLessThanOrEqual(1);
    });
  });
});
