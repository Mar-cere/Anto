/**
 * Tests unitarios para servicio de generación de respuestas
 * 
 * @author AntoApp Team
 */

import responseGenerator from '../../../services/responseGenerator.js';

describe('ResponseGenerator Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método generateResponse', () => {
      expect(typeof responseGenerator.generateResponse).toBe('function');
    });

    it('debe tener método generateFallbackResponse', () => {
      expect(typeof responseGenerator.generateFallbackResponse).toBe('function');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar tipo de respuesta', () => {
      // isValidType retorna el array si el tipo existe, o false/null si no existe
      const result1 = responseGenerator.isValidType('general');
      expect(result1).toBeTruthy(); // Debe ser truthy (array)
      expect(Array.isArray(result1)).toBe(true);
      
      const result2 = responseGenerator.isValidType('error');
      expect(result2).toBeTruthy();
      expect(Array.isArray(result2)).toBe(true);
      
      const result3 = responseGenerator.isValidType('emotional');
      expect(result3).toBeTruthy();
      expect(Array.isArray(result3)).toBe(true);
      
      expect(responseGenerator.isValidType('invalid')).toBeFalsy();
      expect(responseGenerator.isValidType(null)).toBeFalsy();
      expect(responseGenerator.isValidType(undefined)).toBeFalsy();
    });

    it('debe detectar contenido emocional', () => {
      expect(responseGenerator.hasEmotionalContent('Estoy muy triste')).toBe(true);
      expect(responseGenerator.hasEmotionalContent('Estoy feliz')).toBe(true);
      expect(responseGenerator.hasEmotionalContent('Estoy enojado')).toBe(true);
      expect(responseGenerator.hasEmotionalContent('Hola cómo estás')).toBe(false);
      expect(responseGenerator.hasEmotionalContent('')).toBe(false);
      expect(responseGenerator.hasEmotionalContent(null)).toBe(false);
    });

    it('debe generar respuesta de error por defecto', () => {
      const response = responseGenerator.getDefaultErrorResponse();
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('debe obtener respuesta aleatoria', () => {
      const responses = ['respuesta1', 'respuesta2', 'respuesta3'];
      const result = responseGenerator.getRandomResponse(responses);
      
      expect(responses).toContain(result);
    });

    it('debe retornar error por defecto si array está vacío', () => {
      const result = responseGenerator.getRandomResponse([]);
      
      expect(result).toBe(responseGenerator.getDefaultErrorResponse());
    });
  });

  describe('generateResponse', () => {
    it('debe generar respuesta general', async () => {
      const response = await responseGenerator.generateResponse({}, 'general');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('debe generar respuesta emocional', async () => {
      const response = await responseGenerator.generateResponse({}, 'emotional');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('debe generar respuesta de error', async () => {
      const response = await responseGenerator.generateResponse({}, 'error');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('debe usar tipo general si el tipo es inválido', async () => {
      const response = await responseGenerator.generateResponse({}, 'invalid');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('generateFallbackResponse', () => {
    it('debe generar respuesta emocional para mensaje con emoción', async () => {
      const mensaje = { content: 'Estoy muy triste hoy' };
      const response = await responseGenerator.generateFallbackResponse(mensaje);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('debe generar respuesta general para mensaje sin emoción', async () => {
      const mensaje = { content: 'Hola, cómo estás' };
      const response = await responseGenerator.generateFallbackResponse(mensaje);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('debe retornar error por defecto si mensaje no tiene content', async () => {
      const response = await responseGenerator.generateFallbackResponse({});
      
      expect(response).toBe(responseGenerator.getDefaultErrorResponse());
    });

    it('debe retornar error por defecto si mensaje es null', async () => {
      const response = await responseGenerator.generateFallbackResponse(null);
      
      expect(response).toBe(responseGenerator.getDefaultErrorResponse());
    });
  });
});

