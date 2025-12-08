/**
 * Tests unitarios para servicio de seguimiento de crisis
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import crisisFollowUpService from '../../../services/crisisFollowUpService.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

// Mock dependencies
const mockCrisisEvent = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  getPendingFollowUps: jest.fn()
};

jest.mock('../../../models/CrisisEvent.js', () => ({
  __esModule: true,
  default: mockCrisisEvent
}));

jest.mock('../../../models/Message.js', () => ({
  find: jest.fn(() => ({
    sort: jest.fn(() => ({
      limit: jest.fn(() => ({
        lean: jest.fn()
      }))
    }))
  }))
}));

jest.mock('../../../models/User.js', () => ({
  findById: jest.fn()
}));

jest.mock('../../../services/pushNotificationService.js', () => ({
  sendNotification: jest.fn()
}));

describe('CrisisFollowUpService', () => {
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
    it('debe tener método scheduleFollowUps', () => {
      expect(typeof crisisFollowUpService.scheduleFollowUps).toBe('function');
    });

    it('debe tener método processPendingFollowUps', () => {
      expect(typeof crisisFollowUpService.processPendingFollowUps).toBe('function');
    });

    it('debe tener constantes de intervalos', () => {
      expect(crisisFollowUpService.FOLLOW_UP_INTERVALS).toBeDefined();
      expect(crisisFollowUpService.FOLLOW_UP_INTERVALS.FIRST).toBe(24);
      expect(crisisFollowUpService.FOLLOW_UP_INTERVALS.SECOND).toBe(48);
      expect(crisisFollowUpService.FOLLOW_UP_INTERVALS.THIRD).toBe(168);
    });
  });

  describe('scheduleFollowUps', () => {
    it('debe retornar error si el evento no existe', async () => {
      const mongoose = await import('mongoose');
      const validObjectId = new mongoose.default.Types.ObjectId();
      mockCrisisEvent.findById.mockResolvedValue(null);

      const result = await crisisFollowUpService.scheduleFollowUps(validObjectId.toString(), 'MEDIUM');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('no encontrado');
    });

    it('debe programar seguimiento para nivel HIGH con intervalo de 12 horas', async () => {
      const mongoose = await import('mongoose');
      const validObjectId = new mongoose.default.Types.ObjectId();
      const scheduleFollowUpMock = jest.fn().mockResolvedValue(undefined);
      const mockEvent = {
        _id: validObjectId,
        followUp: { scheduledAt: new Date() },
        scheduleFollowUp: scheduleFollowUpMock
      };
      mockCrisisEvent.findById.mockResolvedValue(mockEvent);

      const result = await crisisFollowUpService.scheduleFollowUps(validObjectId.toString(), 'HIGH');

      expect(scheduleFollowUpMock).toHaveBeenCalledWith(12);
      expect(result.success).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('debe programar seguimiento para nivel MEDIUM con intervalo de 24 horas', async () => {
      const mongoose = await import('mongoose');
      const validObjectId = new mongoose.default.Types.ObjectId();
      const mockEvent = {
        _id: validObjectId,
        followUp: { scheduledAt: new Date() },
        scheduleFollowUp: jest.fn(function(hours) {
          this.followUp.scheduledAt = new Date(Date.now() + hours * 60 * 60 * 1000);
          return Promise.resolve(this);
        })
      };
      mockCrisisEvent.findById.mockResolvedValue(mockEvent);

      const result = await crisisFollowUpService.scheduleFollowUps(validObjectId.toString(), 'MEDIUM');

      expect(mockEvent.scheduleFollowUp).toHaveBeenCalledWith(24);
      expect(result.success).toBe(true);
    });

    it('debe manejar errores correctamente', async () => {
      const mongoose = await import('mongoose');
      const validObjectId = new mongoose.default.Types.ObjectId();
      mockCrisisEvent.findById.mockRejectedValue(new Error('Database error'));

      const result = await crisisFollowUpService.scheduleFollowUps(validObjectId.toString(), 'MEDIUM');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Database error');
    });
  });

  describe('processPendingFollowUps', () => {
    it('debe procesar seguimientos pendientes', async () => {
      mockCrisisEvent.getPendingFollowUps.mockResolvedValue([]);

      const result = await crisisFollowUpService.processPendingFollowUps();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('errors');
    });
  });
});
