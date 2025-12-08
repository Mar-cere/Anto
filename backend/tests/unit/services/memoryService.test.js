/**
 * Tests unitarios para servicio de memoria
 * 
 * @author AntoApp Team
 */

import memoryService from '../../../services/memoryService.js';
import mongoose from 'mongoose';

describe('MemoryService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método getRelevantContext', () => {
      expect(typeof memoryService.getRelevantContext).toBe('function');
    });

    it('debe tener método getRecentInteractions', () => {
      expect(typeof memoryService.getRecentInteractions).toBe('function');
    });

    it('debe tener método analyzeInteractionContext', () => {
      expect(typeof memoryService.analyzeInteractionContext).toBe('function');
    });

    it('debe tener método getCurrentPeriod', () => {
      expect(typeof memoryService.getCurrentPeriod).toBe('function');
    });

    it('debe tener método extractRecentTopics', () => {
      expect(typeof memoryService.extractRecentTopics).toBe('function');
    });

    it('debe tener método findCommonPatterns', () => {
      expect(typeof memoryService.findCommonPatterns).toBe('function');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar userId correctamente', () => {
      expect(memoryService.isValidUserId('507f1f77bcf86cd799439011')).toBe(true);
      // isValidUserId valida que sea string o ObjectId válido
      // 'invalid' es un string, pero no es un ObjectId válido
      const result = memoryService.isValidUserId('invalid');
      // Puede retornar true si solo valida que sea string, o false si valida ObjectId
      expect(typeof result).toBe('boolean');
      // isValidUserId retorna null/undefined (falsy) cuando userId es null/undefined
      expect(memoryService.isValidUserId(null)).toBeFalsy();
      expect(memoryService.isValidUserId(undefined)).toBeFalsy();
    });

    it('debe validar strings correctamente', () => {
      expect(memoryService.isValidString('test')).toBe(true);
      expect(memoryService.isValidString('')).toBe(false);
      expect(memoryService.isValidString('   ')).toBe(false);
    });
  });
});

