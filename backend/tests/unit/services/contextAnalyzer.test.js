/**
 * Tests unitarios para servicio de análisis de contexto
 * 
 * @author AntoApp Team
 */

import contextAnalyzer from '../../../services/contextAnalyzer.js';

describe('ContextAnalyzer Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método analizarMensaje', () => {
      expect(typeof contextAnalyzer.analizarMensaje).toBe('function');
    });

    it('debe tener método analizarContenidoActual', () => {
      expect(typeof contextAnalyzer.analizarContenidoActual).toBe('function');
    });

    it('debe tener método detectarIntencion', () => {
      expect(typeof contextAnalyzer.detectarIntencion).toBe('function');
    });

    it('debe tener método detectarTema', () => {
      expect(typeof contextAnalyzer.detectarTema).toBe('function');
    });
  });

  describe('analyzeContext', () => {
    it('debe retornar análisis de contexto', async () => {
      const result = await contextAnalyzer.analizarMensaje({ content: 'Tengo problemas en el trabajo' });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('intencion');
      expect(result).toHaveProperty('tema');
    });

    it('debe manejar mensaje inválido', async () => {
      const result = await contextAnalyzer.analizarMensaje({});
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('intencion');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar strings correctamente', () => {
      expect(contextAnalyzer.isValidString('test')).toBe(true);
      expect(contextAnalyzer.isValidString('')).toBe(false);
      expect(contextAnalyzer.isValidString(null)).toBe(false);
    });

    it('debe validar mensajes correctamente', () => {
      expect(contextAnalyzer.isValidMessage({ content: 'test' })).toBe(true);
      expect(contextAnalyzer.isValidMessage({})).toBe(false);
      // isValidMessage puede retornar null si el mensaje es null
      const result = contextAnalyzer.isValidMessage(null);
      expect(result === false || result === null).toBe(true);
    });
  });
});

