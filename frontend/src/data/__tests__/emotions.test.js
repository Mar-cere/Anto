/**
 * Tests unitarios para datos de emociones (banner, categorías, helpers)
 *
 * @author AntoApp Team
 */

import {
  emotions,
  emotionCategories,
  getRandomEmotion,
  getRandomEmotionByCategory,
} from '../emotions';

describe('emotions data', () => {
  describe('emotions', () => {
    it('debe ser un array no vacío', () => {
      expect(Array.isArray(emotions)).toBe(true);
      expect(emotions.length).toBeGreaterThan(0);
    });
    it('debe contener solo strings', () => {
      emotions.forEach((e) => {
        expect(typeof e).toBe('string');
        expect(e.length).toBeGreaterThan(0);
      });
    });
    it('debe incluir emociones esperadas', () => {
      expect(emotions).toContain('¿Ansiedad?');
      expect(emotions).toContain('¿Estrés?');
      expect(emotions).toContain('¿Miedo?');
    });
  });

  describe('emotionCategories', () => {
    it('debe tener categorías conocidas', () => {
      expect(emotionCategories.ansiedad).toBeDefined();
      expect(emotionCategories.tristeza).toBeDefined();
      expect(emotionCategories.estres).toBeDefined();
      expect(emotionCategories.miedo).toBeDefined();
      expect(emotionCategories.confusion).toBeDefined();
    });
    it('cada categoría debe ser array de strings contenidos en emotions', () => {
      Object.values(emotionCategories).forEach((arr) => {
        expect(Array.isArray(arr)).toBe(true);
        arr.forEach((e) => {
          expect(emotions).toContain(e);
        });
      });
    });
  });

  describe('getRandomEmotion', () => {
    it('debe retornar un string de la lista emotions', () => {
      const result = getRandomEmotion();
      expect(typeof result).toBe('string');
      expect(emotions).toContain(result);
    });
    it('debe retornar valores válidos en múltiples llamadas', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(getRandomEmotion());
      }
      results.forEach((r) => expect(emotions).toContain(r));
    });
  });

  describe('getRandomEmotionByCategory', () => {
    it('con categoría válida debe retornar emoción de esa categoría', () => {
      const result = getRandomEmotionByCategory('ansiedad');
      expect(emotionCategories.ansiedad).toContain(result);
    });
    it('con categoría inválida debe retornar emoción de la lista global', () => {
      const result = getRandomEmotionByCategory('inexistente');
      expect(emotions).toContain(result);
    });
    it('con categoría undefined/null debe retornar emoción de la lista global', () => {
      const r1 = getRandomEmotionByCategory(undefined);
      const r2 = getRandomEmotionByCategory(null);
      expect(emotions).toContain(r1);
      expect(emotions).toContain(r2);
    });
  });
});
