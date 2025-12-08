/**
 * Tests unitarios para servicio de métricas de crisis
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import crisisMetricsService from '../../../services/crisisMetricsService.js';
import CrisisEvent from '../../../models/CrisisEvent.js';
import Message from '../../../models/Message.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

// Mock models
jest.mock('../../../models/CrisisEvent.js', () => ({
  find: jest.fn(() => ({
    lean: jest.fn()
  }))
}));

jest.mock('../../../models/Message.js', () => ({
  find: jest.fn(() => ({
    select: jest.fn(() => ({
      sort: jest.fn(() => ({
        lean: jest.fn()
      }))
    }))
  }))
}));

jest.mock('../../../models/TherapeuticTechniqueUsage.js', () => ({
  find: jest.fn(() => ({
    lean: jest.fn()
  }))
}));

describe('CrisisMetricsService', () => {
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
    it('debe tener método getCrisisSummary', () => {
      expect(typeof crisisMetricsService.getCrisisSummary).toBe('function');
    });

    it('debe tener método getEmotionalTrends', () => {
      expect(typeof crisisMetricsService.getEmotionalTrends).toBe('function');
    });
  });

  describe('getCrisisSummary', () => {
    it('debe ser una función', () => {
      expect(typeof crisisMetricsService.getCrisisSummary).toBe('function');
    });

    it('debe retornar resumen de crisis', async () => {
      const mockCrises = [
        { riskLevel: 'HIGH', detectedAt: new Date(), outcome: 'resolved', resolvedAt: new Date(), alerts: { sent: true }, followUp: { completed: true } },
        { riskLevel: 'MEDIUM', detectedAt: new Date(), outcome: null, resolvedAt: null, alerts: { sent: false }, followUp: { completed: false } }
      ];

      CrisisEvent.find = jest.fn(() => ({
        lean: jest.fn().mockResolvedValue(mockCrises)
      }));

      const result = await crisisMetricsService.getCrisisSummary('test-user-id', 30);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalCrises');
      expect(result).toHaveProperty('crisesByLevel');
      expect(result).toHaveProperty('resolutionRate');
      expect(result.totalCrises).toBe(2);
    });

    it('debe manejar errores correctamente', async () => {
      CrisisEvent.find = jest.fn(() => ({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      await expect(crisisMetricsService.getCrisisSummary('test-user-id', 30)).rejects.toThrow();
    });
  });

  describe('getEmotionalTrends', () => {
    it('debe ser una función', () => {
      expect(typeof crisisMetricsService.getEmotionalTrends).toBe('function');
    });
  });
});
