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
      expect(responseGenerator.hasEmotionalContent('Hola cómo estás')).toBe(false);
      expect(responseGenerator.hasEmotionalContent('')).toBe(false);
    });

    it('debe generar respuesta de error por defecto', () => {
      const response = responseGenerator.getDefaultErrorResponse();
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });
});

