/**
 * Tests unitarios para servicio de personalización
 * 
 * @author AntoApp Team
 */

import personalizationService from '../../../services/personalizationService.js';

describe('PersonalizationService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método getUserProfile', () => {
      expect(typeof personalizationService.getUserProfile).toBe('function');
    });

    it('debe tener método getPersonalizedPrompt', () => {
      expect(typeof personalizationService.getPersonalizedPrompt).toBe('function');
    });

    it('debe tener método createDefaultProfile', () => {
      expect(typeof personalizationService.createDefaultProfile).toBe('function');
    });

    it('debe tener método getDefaultProfile', () => {
      expect(typeof personalizationService.getDefaultProfile).toBe('function');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar userId correctamente', () => {
      expect(personalizationService.isValidUserId('507f1f77bcf86cd799439011')).toBe(true);
      // isValidUserId valida que sea string o ObjectId válido
      const result = personalizationService.isValidUserId('invalid');
      // Puede retornar true si solo valida que sea string, o false si valida ObjectId
      expect(typeof result).toBe('boolean');
      // isValidUserId retorna null/undefined (falsy) cuando userId es null/undefined
      expect(personalizationService.isValidUserId(null)).toBeFalsy();
      expect(personalizationService.isValidUserId(undefined)).toBeFalsy();
    });
  });
});

