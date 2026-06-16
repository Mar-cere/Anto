/**
 * Tests — copy de insight de sesión
 */
import {
  buildCrisisSessionInsightCopy,
  buildInsightCopy,
  localizeTopic,
} from '../../../utils/sessionInsightCopy.js';

describe('sessionInsightCopy', () => {
  describe('buildCrisisSessionInsightCopy', () => {
    it('devuelve copy seguro en español para HIGH', () => {
      const copy = buildCrisisSessionInsightCopy({
        language: 'es',
        riskTier: 'high',
        intensity: 8,
      });
      expect(copy.headline).toMatch(/seguridad/i);
      expect(copy.reflection).toMatch(/8\/10/);
    });

    it('devuelve copy seguro en inglés para WARNING', () => {
      const copy = buildCrisisSessionInsightCopy({
        language: 'en',
        riskTier: 'warning',
        intensity: 6,
      });
      expect(copy.headline).toMatch(/difficult moment/i);
      expect(copy.reflection).toMatch(/6\/10/);
    });
  });

  describe('buildInsightCopy', () => {
    it('no usa titular optimista genérico sin patrón', () => {
      const copy = buildInsightCopy({
        language: 'es',
        dominantEmotion: 'neutral',
        intensity: 5,
        themes: ['Vida diaria'],
        hasPattern: false,
      });
      expect(copy.headline).toBeTruthy();
      expect(copy.reflection).toMatch(/Vida diaria/i);
    });
  });

  describe('localizeTopic', () => {
    it('traduce salud en ambos idiomas', () => {
      expect(localizeTopic('salud', 'es')).toBe('Salud');
      expect(localizeTopic('salud', 'en')).toBe('Health');
    });
  });
});
