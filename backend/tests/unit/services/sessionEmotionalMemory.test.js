/**
 * Tests unitarios para servicio de memoria emocional de sesión
 * 
 * @author AntoApp Team
 */

import sessionEmotionalMemory from '../../../services/sessionEmotionalMemory.js';

describe('SessionEmotionalMemory Service', () => {
  beforeEach(() => {
    // Limpiar buffers antes de cada test
    sessionEmotionalMemory.sessionBuffers.clear();
  });

  describe('Métodos del servicio', () => {
    it('debe tener método addAnalysis', () => {
      expect(typeof sessionEmotionalMemory.addAnalysis).toBe('function');
    });

    it('debe tener método getBuffer', () => {
      expect(typeof sessionEmotionalMemory.getBuffer).toBe('function');
    });

    it('debe tener método analyzeTrends', () => {
      expect(typeof sessionEmotionalMemory.analyzeTrends).toBe('function');
    });

    it('debe tener método clearBuffer', () => {
      expect(typeof sessionEmotionalMemory.clearBuffer).toBe('function');
    });
  });

  describe('addAnalysis', () => {
    it('debe agregar análisis al buffer', () => {
      const userId = 'test-user-123';
      const analysis = {
        mainEmotion: 'tristeza',
        intensity: 7
      };
      
      sessionEmotionalMemory.addAnalysis(userId, analysis);
      const buffer = sessionEmotionalMemory.getBuffer(userId);
      
      expect(Array.isArray(buffer)).toBe(true);
      expect(buffer.length).toBe(1);
      expect(buffer[0].mainEmotion).toBe('tristeza');
    });

    it('debe agregar timestamp si no existe', () => {
      const userId = 'test-user-123';
      const analysis = {
        mainEmotion: 'ansiedad',
        intensity: 5
      };
      
      sessionEmotionalMemory.addAnalysis(userId, analysis);
      const buffer = sessionEmotionalMemory.getBuffer(userId);
      
      expect(buffer[0].timestamp).toBeDefined();
    });

    it('debe mantener solo los últimos N análisis', () => {
      const userId = 'test-user-123';
      const maxSize = sessionEmotionalMemory.MAX_BUFFER_SIZE;
      
      // Agregar más análisis de los permitidos
      for (let i = 0; i < maxSize + 5; i++) {
        sessionEmotionalMemory.addAnalysis(userId, {
          mainEmotion: 'tristeza',
          intensity: i
        });
      }
      
      const buffer = sessionEmotionalMemory.getBuffer(userId);
      expect(buffer.length).toBe(maxSize);
    });

    it('no debe agregar análisis si userId es null', () => {
      sessionEmotionalMemory.addAnalysis(null, { mainEmotion: 'tristeza' });
      const buffer = sessionEmotionalMemory.getBuffer(null);
      expect(buffer.length).toBe(0);
    });

    it('no debe agregar análisis si analysis es null', () => {
      sessionEmotionalMemory.addAnalysis('test-user', null);
      const buffer = sessionEmotionalMemory.getBuffer('test-user');
      expect(buffer.length).toBe(0);
    });
  });

  describe('getBuffer', () => {
    it('debe retornar array vacío para userId inválido', () => {
      const buffer = sessionEmotionalMemory.getBuffer(null);
      
      expect(Array.isArray(buffer)).toBe(true);
      expect(buffer.length).toBe(0);
    });

    it('debe retornar array vacío para userId sin buffer', () => {
      const buffer = sessionEmotionalMemory.getBuffer('non-existent-user');
      
      expect(Array.isArray(buffer)).toBe(true);
      expect(buffer.length).toBe(0);
    });

    it('debe retornar buffer completo para userId válido', () => {
      const userId = 'test-user-123';
      sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7 });
      sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'ansiedad', intensity: 5 });
      
      const buffer = sessionEmotionalMemory.getBuffer(userId);
      
      expect(buffer.length).toBe(2);
    });
  });

  describe('analyzeTrends', () => {
    it('debe retornar tendencias para usuario con análisis', () => {
      const userId = 'test-user-123';
      sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7, category: 'negative' });
      sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 8, category: 'negative' });
      sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'ansiedad', intensity: 5, category: 'negative' });
      
      const trends = sessionEmotionalMemory.analyzeTrends(userId);
      
      expect(trends).toBeDefined();
      expect(typeof trends).toBe('object');
      expect(trends).toHaveProperty('streakNegative');
      expect(trends).toHaveProperty('trend');
    });

    it('debe retornar valores por defecto para usuario sin análisis', () => {
      const trends = sessionEmotionalMemory.analyzeTrends('non-existent-user');
      
      expect(trends).toBeDefined();
      expect(trends.streakNegative).toBe(0);
      expect(trends.trend).toBe('stable');
    });
  });

  describe('clearBuffer', () => {
    it('debe limpiar buffer de usuario', () => {
      const userId = 'test-user-123';
      sessionEmotionalMemory.addAnalysis(userId, { mainEmotion: 'tristeza', intensity: 7 });
      
      sessionEmotionalMemory.clearBuffer(userId);
      
      const buffer = sessionEmotionalMemory.getBuffer(userId);
      expect(buffer.length).toBe(0);
    });

    it('no debe fallar si el buffer no existe', () => {
      expect(() => sessionEmotionalMemory.clearBuffer('non-existent-user')).not.toThrow();
    });
  });
});

