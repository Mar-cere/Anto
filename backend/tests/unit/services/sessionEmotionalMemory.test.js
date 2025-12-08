/**
 * Tests unitarios para servicio de memoria emocional de sesión
 * 
 * @author AntoApp Team
 */

import sessionEmotionalMemory from '../../../services/sessionEmotionalMemory.js';

describe('SessionEmotionalMemory Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método addAnalysis', () => {
      expect(typeof sessionEmotionalMemory.addAnalysis).toBe('function');
    });

    it('debe tener método getBuffer', () => {
      expect(typeof sessionEmotionalMemory.getBuffer).toBe('function');
    });

    it('debe agregar análisis al buffer', () => {
      const userId = 'test-user-123';
      const analysis = {
        mainEmotion: 'tristeza',
        intensity: 7
      };
      
      sessionEmotionalMemory.addAnalysis(userId, analysis);
      const buffer = sessionEmotionalMemory.getBuffer(userId);
      
      expect(Array.isArray(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('debe retornar array vacío para userId inválido', () => {
      const buffer = sessionEmotionalMemory.getBuffer(null);
      
      expect(Array.isArray(buffer)).toBe(true);
      expect(buffer.length).toBe(0);
    });
  });
});

