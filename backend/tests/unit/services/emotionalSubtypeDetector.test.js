/**
 * Tests unitarios para detector de subtipos emocionales
 * 
 * @author AntoApp Team
 */

import emotionalSubtypeDetector from '../../../services/emotionalSubtypeDetector.js';

describe('EmotionalSubtypeDetector Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método detectSubtype', () => {
      expect(typeof emotionalSubtypeDetector.detectSubtype).toBe('function');
    });
  });

  describe('detectSubtype', () => {
    it('debe retornar subtipo para emoción válida', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('tristeza', 'Me siento muy solo');
      
      expect(subtype).toBeDefined();
    });

    it('debe retornar null para emoción inválida', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('invalid', 'Test');
      
      expect(subtype).toBeNull();
    });
  });
});

