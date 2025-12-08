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

  describe('analizarMensaje', () => {
    it('debe retornar análisis de contexto', async () => {
      const result = await contextAnalyzer.analizarMensaje({ content: 'Tengo problemas en el trabajo' });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('intencion');
      expect(result).toHaveProperty('tema');
      expect(result).toHaveProperty('urgencia');
    });

    it('debe manejar mensaje inválido', async () => {
      const result = await contextAnalyzer.analizarMensaje({});
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('intencion');
      expect(result).toHaveProperty('tema');
    });

    it('debe manejar mensaje null', async () => {
      const result = await contextAnalyzer.analizarMensaje(null);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('intencion');
    });

    it('debe detectar urgencia en mensajes', async () => {
      const result = await contextAnalyzer.analizarMensaje({ 
        content: 'Necesito ayuda urgente, es una emergencia' 
      });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('urgencia');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar strings correctamente', () => {
      expect(contextAnalyzer.isValidString('test')).toBe(true);
      expect(contextAnalyzer.isValidString('')).toBe(false);
      expect(contextAnalyzer.isValidString(null)).toBe(false);
      expect(contextAnalyzer.isValidString(undefined)).toBe(false);
      expect(contextAnalyzer.isValidString('   ')).toBe(false);
    });

    it('debe validar mensajes correctamente', () => {
      expect(contextAnalyzer.isValidMessage({ content: 'test' })).toBe(true);
      expect(contextAnalyzer.isValidMessage({})).toBe(false);
      expect(contextAnalyzer.isValidMessage(null)).toBeFalsy(); // Puede ser null o false
      expect(contextAnalyzer.isValidMessage({ content: '' })).toBe(false);
      expect(contextAnalyzer.isValidMessage({ content: '   ' })).toBe(false);
    });

    it('debe buscar patrones en contenido', () => {
      const patrones = ['test', 'ejemplo'];
      
      expect(contextAnalyzer.matchesPattern('test content', patrones)).toBe(true);
      expect(contextAnalyzer.matchesPattern('ejemplo texto', patrones)).toBe(true);
      expect(contextAnalyzer.matchesPattern('otro texto', patrones)).toBe(false);
      expect(contextAnalyzer.matchesPattern('', patrones)).toBe(false);
      expect(contextAnalyzer.matchesPattern('test', null)).toBe(false);
    });

    it('debe detectar patrón en diccionario', () => {
      const diccionario = {
        'PATRON1': ['test', 'ejemplo'],
        'PATRON2': ['otro', 'diferente']
      };
      
      const resultado = contextAnalyzer.detectarPatron('test content', diccionario);
      expect(resultado).toBe('PATRON1');
      
      const resultado2 = contextAnalyzer.detectarPatron('otro texto', diccionario);
      expect(resultado2).toBe('PATRON2');
      
      const resultado3 = contextAnalyzer.detectarPatron('sin patrón', diccionario);
      expect(resultado3).toBeNull();
    });

    it('debe retornar null para contenido inválido en detectarPatron', () => {
      const diccionario = { 'PATRON1': ['test'] };
      
      expect(contextAnalyzer.detectarPatron('', diccionario)).toBeNull();
      expect(contextAnalyzer.detectarPatron(null, diccionario)).toBeNull();
      expect(contextAnalyzer.detectarPatron(undefined, diccionario)).toBeNull();
    });
  });

  describe('detectarIntencion', () => {
    it('debe detectar intención en mensaje', () => {
      const mensaje = { content: 'Necesito ayuda' };
      const intencion = contextAnalyzer.detectarIntencion(mensaje);
      
      expect(intencion).toBeDefined();
      expect(intencion).toHaveProperty('tipo');
      expect(intencion).toHaveProperty('confianza');
    });

    it('debe retornar valores por defecto para mensaje sin patrón', () => {
      const mensaje = { content: 'Texto sin patrón específico' };
      const intencion = contextAnalyzer.detectarIntencion(mensaje);
      
      expect(intencion).toBeDefined();
      expect(intencion.tipo).toBeDefined();
    });
  });

  describe('detectarTema', () => {
    it('debe detectar tema en mensaje', () => {
      const mensaje = { content: 'Tengo problemas en el trabajo' };
      const tema = contextAnalyzer.detectarTema(mensaje);
      
      expect(tema).toBeDefined();
      expect(tema).toHaveProperty('categoria');
      expect(tema).toHaveProperty('confianza');
    });

    it('debe retornar valores por defecto para mensaje sin tema específico', () => {
      const mensaje = { content: 'Texto general' };
      const tema = contextAnalyzer.detectarTema(mensaje);
      
      expect(tema).toBeDefined();
      expect(tema.categoria).toBeDefined();
    });
  });

  describe('analizarContenidoActual', () => {
    it('debe analizar contenido del mensaje', () => {
      const mensaje = { content: 'Estoy triste hoy' };
      const analisis = contextAnalyzer.analizarContenidoActual(mensaje);
      
      expect(analisis).toBeDefined();
      expect(typeof analisis).toBe('object');
    });

    it('debe manejar mensaje sin contenido', () => {
      const mensaje = { content: '' };
      const analisis = contextAnalyzer.analizarContenidoActual(mensaje);
      
      expect(analisis).toBeDefined();
    });
  });
});

