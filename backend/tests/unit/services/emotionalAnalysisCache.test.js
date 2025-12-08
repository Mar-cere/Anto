/**
 * Tests unitarios para servicio de caché de análisis emocional
 * 
 * @author AntoApp Team
 */

import emotionalAnalysisCache from '../../../services/emotionalAnalysisCache.js';

describe('EmotionalAnalysisCache Service', () => {
  beforeEach(() => {
    // Limpiar caché antes de cada test
    emotionalAnalysisCache.cache.clear();
  });

  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(emotionalAnalysisCache).toBeDefined();
      expect(typeof emotionalAnalysisCache).toBe('object');
    });

    it('debe tener método get', () => {
      expect(typeof emotionalAnalysisCache.get).toBe('function');
    });

    it('debe tener método set', () => {
      expect(typeof emotionalAnalysisCache.set).toBe('function');
    });

    it('debe tener método generateCacheKey', () => {
      expect(typeof emotionalAnalysisCache.generateCacheKey).toBe('function');
    });

    it('debe tener método cleanup', () => {
      expect(typeof emotionalAnalysisCache.cleanup).toBe('function');
    });
  });

  describe('generateCacheKey', () => {
    it('debe generar clave de caché', () => {
      const key = emotionalAnalysisCache.generateCacheKey('Test message');
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('debe generar la misma clave para contenido idéntico', () => {
      const key1 = emotionalAnalysisCache.generateCacheKey('Test message');
      const key2 = emotionalAnalysisCache.generateCacheKey('Test message');
      expect(key1).toBe(key2);
    });

    it('debe normalizar espacios en blanco', () => {
      const key1 = emotionalAnalysisCache.generateCacheKey('Test   message');
      const key2 = emotionalAnalysisCache.generateCacheKey('Test message');
      expect(key1).toBe(key2);
    });

    it('debe ser case-insensitive', () => {
      const key1 = emotionalAnalysisCache.generateCacheKey('TEST MESSAGE');
      const key2 = emotionalAnalysisCache.generateCacheKey('test message');
      expect(key1).toBe(key2);
    });

    it('debe retornar null para contenido inválido', () => {
      expect(emotionalAnalysisCache.generateCacheKey(null)).toBeNull();
      expect(emotionalAnalysisCache.generateCacheKey('')).toBeNull();
      expect(emotionalAnalysisCache.generateCacheKey(undefined)).toBeNull();
    });
  });

  describe('get y set', () => {
    it('debe guardar y recuperar análisis', () => {
      const content = 'Test message';
      const analysis = {
        mainEmotion: 'tristeza',
        intensity: 7
      };

      emotionalAnalysisCache.set(content, analysis);
      const retrieved = emotionalAnalysisCache.get(content);

      expect(retrieved).toBeDefined();
      expect(retrieved.mainEmotion).toBe('tristeza');
      expect(retrieved.intensity).toBe(7);
    });

    it('debe retornar null para contenido no cacheado', () => {
      const result = emotionalAnalysisCache.get('Non-cached message');
      expect(result).toBeNull();
    });

    it('debe retornar null para contenido inválido', () => {
      const result = emotionalAnalysisCache.get(null);
      expect(result).toBeNull();
    });

    it('no debe guardar si el análisis es null', () => {
      emotionalAnalysisCache.set('Test message', null);
      const result = emotionalAnalysisCache.get('Test message');
      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('debe limpiar entradas expiradas', () => {
      const content = 'Test message';
      const analysis = { mainEmotion: 'tristeza' };

      // Simular entrada expirada modificando el timestamp directamente
      emotionalAnalysisCache.set(content, analysis);
      const key = emotionalAnalysisCache.generateCacheKey(content);
      const cached = emotionalAnalysisCache.cache.get(key);
      cached.timestamp = Date.now() - (emotionalAnalysisCache.TTL + 1000); // Expirado

      emotionalAnalysisCache.cleanup();

      const result = emotionalAnalysisCache.get(content);
      expect(result).toBeNull();
    });
  });
});

