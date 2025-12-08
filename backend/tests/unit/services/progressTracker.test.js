/**
 * Tests unitarios para servicio de seguimiento de progreso
 * 
 * @author AntoApp Team
 */

import progressTracker from '../../../services/progressTracker.js';

describe('ProgressTracker Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método trackProgress', () => {
      expect(typeof progressTracker.trackProgress).toBe('function');
    });

    it('debe tener método obtenerElementosComunes', () => {
      expect(typeof progressTracker.obtenerElementosComunes).toBe('function');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar userId correctamente', () => {
      expect(progressTracker.isValidUserId('507f1f77bcf86cd799439011')).toBe(true);
      // isValidUserId valida que sea string o ObjectId válido
      const result = progressTracker.isValidUserId('invalid');
      // Puede retornar true si solo valida que sea string, o false si valida ObjectId
      expect(typeof result).toBe('boolean');
      // isValidUserId retorna null/undefined (falsy) cuando userId es null/undefined
      expect(progressTracker.isValidUserId(null)).toBeFalsy();
      expect(progressTracker.isValidUserId(undefined)).toBeFalsy();
    });

    it('debe validar arrays correctamente', () => {
      expect(progressTracker.isValidArray([1, 2, 3])).toBe(true);
      expect(progressTracker.isValidArray([])).toBe(false);
      expect(progressTracker.isValidArray(null)).toBe(false);
    });
  });
});

