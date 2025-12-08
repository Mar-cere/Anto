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

    it('debe tener método getAvailableSubtypes', () => {
      expect(typeof emotionalSubtypeDetector.getAvailableSubtypes).toBe('function');
    });
  });

  describe('detectSubtype', () => {
    it('debe detectar subtipo soledad en tristeza', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('tristeza', 'Me siento muy solo y aislado');
      
      expect(subtype).toBe('soledad');
    });

    it('debe detectar subtipo duelo en tristeza', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('tristeza', 'Estoy en duelo por la pérdida');
      
      expect(subtype).toBe('duelo');
    });

    it('debe detectar subtipo social en ansiedad', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('ansiedad', 'Tengo miedo a hablar en público');
      
      expect(subtype).toBe('social');
    });

    it('debe detectar subtipo anticipatoria en ansiedad', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('ansiedad', 'Me preocupa mucho lo que puede pasar mañana');
      
      expect(subtype).toBe('anticipatoria');
    });

    it('debe detectar subtipo injusticia en enojo', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('enojo', 'No es justo lo que me hicieron');
      
      expect(subtype).toBe('injusticia');
    });

    it('debe detectar subtipo frustración en enojo', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('enojo', 'Estoy frustrado porque no me sale');
      
      expect(subtype).toBe('frustración');
    });

    it('debe detectar subtipo logro en alegria', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('alegria', 'Logré completar mi objetivo');
      
      expect(subtype).toBe('logro');
    });

    it('debe detectar subtipo gratitud en alegria', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('alegria', 'Me siento agradecido por todo');
      
      expect(subtype).toBe('gratitud');
    });

    it('debe retornar null para emoción inválida', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('invalid', 'Test');
      
      expect(subtype).toBeNull();
    });

    it('debe retornar null para contenido vacío', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('tristeza', '');
      
      expect(subtype).toBeNull();
    });

    it('debe retornar null para contenido null', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype('tristeza', null);
      
      expect(subtype).toBeNull();
    });

    it('debe retornar null para emoción null', () => {
      const subtype = emotionalSubtypeDetector.detectSubtype(null, 'Test');
      
      expect(subtype).toBeNull();
    });
  });

  describe('getAvailableSubtypes', () => {
    it('debe retornar subtipos para tristeza', () => {
      const subtypes = emotionalSubtypeDetector.getAvailableSubtypes('tristeza');
      
      expect(Array.isArray(subtypes)).toBe(true);
      expect(subtypes.length).toBeGreaterThan(0);
      expect(subtypes).toContain('soledad');
      expect(subtypes).toContain('duelo');
    });

    it('debe retornar subtipos para ansiedad', () => {
      const subtypes = emotionalSubtypeDetector.getAvailableSubtypes('ansiedad');
      
      expect(Array.isArray(subtypes)).toBe(true);
      expect(subtypes.length).toBeGreaterThan(0);
    });

    it('debe retornar array vacío para emoción inválida', () => {
      const subtypes = emotionalSubtypeDetector.getAvailableSubtypes('invalid');
      
      expect(Array.isArray(subtypes)).toBe(true);
      expect(subtypes.length).toBe(0);
    });
  });
});

