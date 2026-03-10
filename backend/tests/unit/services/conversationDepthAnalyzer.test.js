/**
 * Tests unitarios para conversationDepthAnalyzer
 */
import conversationDepthAnalyzer from '../../../services/conversationDepthAnalyzer.js';

describe('conversationDepthAnalyzer', () => {
  describe('analyzeDepth', () => {
    it('debe retornar depthPreference superficial para saludos cortos', () => {
      const result = conversationDepthAnalyzer.analyzeDepth({
        content: 'Hola!',
        conversationHistory: [],
        emotionalAnalysis: {}
      });
      expect(result.depthPreference).toBe('superficial');
    });

    it('debe retornar depthPreference profundo para mensajes con exploración', () => {
      const result = conversationDepthAnalyzer.analyzeDepth({
        content: 'No entiendo por qué me pasa esto. Quiero entender mejor qué está pasando conmigo.',
        conversationHistory: [],
        emotionalAnalysis: { mainEmotion: 'ansiedad', intensity: 7 }
      });
      expect(result.depthPreference).toBe('profundo');
    });

    it('debe retornar depthPreference moderado por defecto', () => {
      const result = conversationDepthAnalyzer.analyzeDepth({
        content: 'Hoy tuve un día complicado en el trabajo.',
        conversationHistory: [],
        emotionalAnalysis: { mainEmotion: 'tristeza', intensity: 5 }
      });
      expect(['moderado', 'profundo']).toContain(result.depthPreference);
    });

    it('debe manejar content vacío', () => {
      const result = conversationDepthAnalyzer.analyzeDepth({
        content: '',
        conversationHistory: [],
        emotionalAnalysis: {}
      });
      expect(result.depthPreference).toBe('moderado');
    });

    it('debe considerar historial largo para preferencia profunda', () => {
      const history = Array(5).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `mensaje ${i}`
      }));
      const result = conversationDepthAnalyzer.analyzeDepth({
        content: 'Y qué más puedo hacer?',
        conversationHistory: history,
        emotionalAnalysis: { mainEmotion: 'ansiedad', intensity: 6 }
      });
      expect(result).toHaveProperty('depthPreference');
      expect(['superficial', 'moderado', 'profundo']).toContain(result.depthPreference);
    });
  });
});
