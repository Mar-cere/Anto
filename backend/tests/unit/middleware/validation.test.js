/**
 * Tests unitarios para middleware de validación
 * 
 * @author AntoApp Team
 */

import { validateUserObjectId } from '../../../middleware/validation.js';

describe('Validation Middleware', () => {
  describe('validateUserObjectId', () => {
    it('debe ser una función', () => {
      expect(typeof validateUserObjectId).toBe('function');
    });

    it('debe ser un middleware (función que retorna función o función directa)', () => {
      // validateUserObjectId puede ser un middleware directo o una función que retorna middleware
      const middleware = validateUserObjectId;
      expect(typeof middleware).toBe('function');
    });
  });
});
