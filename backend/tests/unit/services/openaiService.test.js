/**
 * Tests unitarios para servicio de OpenAI
 * 
 * @author AntoApp Team
 */

import openaiService from '../../../services/openaiService.js';

describe('OpenAIService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(openaiService).toBeDefined();
      expect(typeof openaiService).toBe('object');
    });

    it('debe tener método generateResponse si existe', () => {
      if (typeof openaiService.generateResponse === 'function') {
        expect(typeof openaiService.generateResponse).toBe('function');
      }
    });
  });
});

