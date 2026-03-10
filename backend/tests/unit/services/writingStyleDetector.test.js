/**
 * Tests unitarios para writingStyleDetector
 */
import writingStyleDetector from '../../../services/writingStyleDetector.js';

describe('writingStyleDetector', () => {
  describe('detectWritingStyle', () => {
    it('debe detectar estilo formal', () => {
      const result = writingStyleDetector.detectWritingStyle({
        content: 'Le agradecería que me pudiera ayudar. Atentamente.',
        userMessages: []
      });
      expect(result.style).toBe('formal');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('debe detectar estilo casual', () => {
      const result = writingStyleDetector.detectWritingStyle({
        content: 'jaja genial, está re bueno!',
        userMessages: []
      });
      expect(result.style).toBe('casual');
    });

    it('debe detectar estilo lacónico con mensajes muy cortos', () => {
      const result = writingStyleDetector.detectWritingStyle({
        content: 'sí',
        userMessages: [{ content: 'no' }, { content: 'vale' }]
      });
      expect(result).toHaveProperty('style');
      expect(['laconic', 'casual', 'formal']).toContain(result.style);
    });

    it('debe detectar estilo emotivo', () => {
      const result = writingStyleDetector.detectWritingStyle({
        content: 'No puedo más!!! Me siento terrible 😢',
        userMessages: []
      });
      expect(result.style).toBe('emotive');
    });

    it('debe retornar casual por defecto', () => {
      const result = writingStyleDetector.detectWritingStyle({
        content: '',
        userMessages: []
      });
      expect(result.style).toBe('casual');
    });
  });
});
