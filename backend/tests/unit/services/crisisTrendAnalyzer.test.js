/**
 * Tests unitarios para servicio de análisis de tendencias de crisis
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import crisisTrendAnalyzer from '../../../services/crisisTrendAnalyzer.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import Message from '../../../models/Message.js';

// Mock Message model
jest.mock('../../../models/Message.js', () => ({
  find: jest.fn(() => ({
    select: jest.fn(() => ({
      sort: jest.fn(() => ({
        lean: jest.fn()
      }))
    }))
  }))
}));

describe('CrisisTrendAnalyzer Service', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Métodos del servicio', () => {
    it('debe tener método analyzeTrends', () => {
      expect(typeof crisisTrendAnalyzer.analyzeTrends).toBe('function');
    });

    it('debe tener método getMessagesInPeriod', () => {
      expect(typeof crisisTrendAnalyzer.getMessagesInPeriod).toBe('function');
    });

    it('debe tener constantes de configuración', () => {
      expect(crisisTrendAnalyzer.SHORT_TERM_DAYS).toBe(7);
      expect(crisisTrendAnalyzer.MEDIUM_TERM_DAYS).toBe(30);
      expect(crisisTrendAnalyzer.LONG_TERM_DAYS).toBe(90);
    });
  });

  describe('analyzeTrends', () => {
    it('debe ser una función', () => {
      expect(typeof crisisTrendAnalyzer.analyzeTrends).toBe('function');
    });

    it('debe retornar estructura de análisis incluso con errores', async () => {
      // Mock que retorna array vacío para evitar errores de base de datos
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      
      Message.find = jest.fn(() => ({ select: mockSelect }));

      const result = await crisisTrendAnalyzer.analyzeTrends('test-user-id');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('periods');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('riskAdjustment');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('getMessagesInPeriod', () => {
    it('debe ser una función', () => {
      expect(typeof crisisTrendAnalyzer.getMessagesInPeriod).toBe('function');
    });

    it('debe retornar array vacío en caso de error', async () => {
      const mockLean = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      
      Message.find = jest.fn(() => ({ select: mockSelect }));

      const result = await crisisTrendAnalyzer.getMessagesInPeriod('test-user-id', new Date(), new Date());

      expect(result).toEqual([]);
    });
  });
});

