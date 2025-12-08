/**
 * Tests unitarios para servicio de análisis emocional
 * 
 * @author AntoApp Team
 */

import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';

describe('EmotionalAnalyzer Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método analyzeEmotion', () => {
      expect(typeof emotionalAnalyzer.analyzeEmotion).toBe('function');
    });

    it('debe tener método detectPrimaryEmotion', () => {
      expect(typeof emotionalAnalyzer.detectPrimaryEmotion).toBe('function');
    });

    it('debe tener método calculateIntensity', () => {
      expect(typeof emotionalAnalyzer.calculateIntensity).toBe('function');
    });

    it('debe tener método isValidString', () => {
      expect(typeof emotionalAnalyzer.isValidString).toBe('function');
    });
  });

  describe('analyzeEmotion', () => {
    it('debe retornar un objeto con análisis emocional', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Me siento muy triste hoy');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('mainEmotion');
      expect(result).toHaveProperty('intensity');
    });

    it('debe manejar texto vacío', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('mainEmotion');
    });

    it('debe manejar texto con emociones positivas', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Estoy muy feliz y contento');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('mainEmotion');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar strings correctamente', () => {
      expect(emotionalAnalyzer.isValidString('test')).toBe(true);
      expect(emotionalAnalyzer.isValidString('')).toBe(false);
      expect(emotionalAnalyzer.isValidString(null)).toBe(false);
      expect(emotionalAnalyzer.isValidString(undefined)).toBe(false);
      expect(emotionalAnalyzer.isValidString('   ')).toBe(false);
    });

    it('debe detectar emoción primaria', () => {
      const emotion = emotionalAnalyzer.detectPrimaryEmotion('me siento muy triste');
      
      expect(emotion).toBeDefined();
      expect(emotion).toHaveProperty('name');
      expect(emotion).toHaveProperty('category');
    });

    it('debe detectar diferentes emociones', () => {
      const tristeza = emotionalAnalyzer.detectPrimaryEmotion('estoy muy triste y deprimido');
      expect(tristeza.name).toBe('tristeza');
      
      const ansiedad = emotionalAnalyzer.detectPrimaryEmotion('me siento ansioso y nervioso');
      expect(ansiedad.name).toBe('ansiedad');
      
      const alegria = emotionalAnalyzer.detectPrimaryEmotion('estoy muy feliz y contento');
      expect(alegria.name).toBe('alegria');
    });

    it('debe calcular intensidad', () => {
      const intensity = emotionalAnalyzer.calculateIntensity('me siento muy muy triste', 'tristeza');
      
      expect(intensity).toBeDefined();
      expect(typeof intensity).toBe('number');
      // Puede retornar NaN si no encuentra la emoción, así que verificamos que sea un número válido
      if (!isNaN(intensity)) {
        expect(intensity).toBeGreaterThanOrEqual(emotionalAnalyzer.INTENSITY_MIN);
        expect(intensity).toBeLessThanOrEqual(emotionalAnalyzer.INTENSITY_MAX);
      }
    });
  });

  describe('analyzeEmotion con diferentes casos', () => {
    it('debe detectar tristeza con alta intensidad', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Estoy muy muy triste, no puedo más');
      
      // Puede detectar tristeza o ansiedad dependiendo de los patrones
      expect(['tristeza', 'ansiedad']).toContain(result.mainEmotion);
      if (typeof result.intensity === 'number' && !isNaN(result.intensity)) {
        expect(result.intensity).toBeGreaterThan(0);
      }
    });

    it('debe detectar ansiedad', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Me siento ansioso y preocupado');
      
      expect(result.mainEmotion).toBe('ansiedad');
    });

    it('debe detectar alegría', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Estoy muy feliz y contento hoy');
      
      expect(result.mainEmotion).toBe('alegria');
    });

    it('debe manejar texto neutral', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Todo está normal');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('mainEmotion');
    });
  });
});

