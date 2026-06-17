/**
 * Tests unitarios para acciones en segundo plano de crisis (§3).
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockUserFindById = jest.fn();
const mockCrisisEventCreate = jest.fn();
const mockSendEmergencyAlerts = jest.fn();
const mockSendCrisisHigh = jest.fn();
const mockSendCrisisMedium = jest.fn();
const mockSendCrisisWarning = jest.fn();
const mockScheduleFollowUps = jest.fn();

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findById: (...args) => mockUserFindById(...args),
  },
}));

jest.unstable_mockModule('../../../models/CrisisEvent.js', () => ({
  default: {
    create: (...args) => mockCrisisEventCreate(...args),
  },
}));

jest.unstable_mockModule('../../../services/emergencyAlertService.js', () => ({
  default: {
    sendEmergencyAlerts: (...args) => mockSendEmergencyAlerts(...args),
  },
}));

jest.unstable_mockModule('../../../services/pushNotificationService.js', () => ({
  default: {
    sendCrisisHigh: (...args) => mockSendCrisisHigh(...args),
    sendCrisisMedium: (...args) => mockSendCrisisMedium(...args),
    sendCrisisWarning: (...args) => mockSendCrisisWarning(...args),
  },
}));

jest.unstable_mockModule('../../../services/crisisFollowUpService.js', () => ({
  default: {
    scheduleFollowUps: (...args) => mockScheduleFollowUps(...args),
  },
}));

const { shouldRunCrisisBackgroundActions, runCrisisBackgroundActions } = await import(
  '../../../services/crisisBackgroundActionsService.js'
);

describe('crisisBackgroundActionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ pushToken: null }),
    });
    mockCrisisEventCreate.mockResolvedValue({ _id: '507f1f77bcf86cd799439099' });
    mockSendEmergencyAlerts.mockResolvedValue({ sent: false, successfulSends: 0, totalContacts: 0 });
    mockSendCrisisHigh.mockResolvedValue(undefined);
    mockSendCrisisMedium.mockResolvedValue(undefined);
    mockSendCrisisWarning.mockResolvedValue(undefined);
    mockScheduleFollowUps.mockResolvedValue({ success: true });
  });

  describe('shouldRunCrisisBackgroundActions', () => {
    it('ejecuta acciones para WARNING aunque isCrisis sea false', () => {
      expect(
        shouldRunCrisisBackgroundActions({ riskLevel: 'WARNING', isCrisis: false }),
      ).toBe(true);
      expect(
        shouldRunCrisisBackgroundActions({ riskLevel: 'warning', isCrisis: false }),
      ).toBe(true);
    });

    it('ejecuta acciones para MEDIUM y HIGH', () => {
      expect(shouldRunCrisisBackgroundActions({ riskLevel: 'MEDIUM' })).toBe(true);
      expect(shouldRunCrisisBackgroundActions({ riskLevel: 'HIGH' })).toBe(true);
    });

    it('omite LOW sin isCrisis', () => {
      expect(shouldRunCrisisBackgroundActions({ riskLevel: 'LOW', isCrisis: false })).toBe(false);
    });

    it('ejecuta con isCrisis y nivel no LOW', () => {
      expect(shouldRunCrisisBackgroundActions({ riskLevel: 'LOW', isCrisis: true })).toBe(false);
    });
  });

  describe('runCrisisBackgroundActions', () => {
    it('omite cuando no aplica', async () => {
      const result = await runCrisisBackgroundActions({
        userId: '507f1f77bcf86cd799439011',
        messageId: '507f1f77bcf86cd799439012',
        messageContent: 'hola',
        riskLevel: 'LOW',
        emotionalAnalysis: {},
        contextualAnalysis: {},
        isCrisis: false,
      });
      expect(result.skipped).toBe(true);
      expect(mockCrisisEventCreate).not.toHaveBeenCalled();
    });

    it('omite userId inválido', async () => {
      const result = await runCrisisBackgroundActions({
        userId: 'invalid',
        messageId: '507f1f77bcf86cd799439012',
        messageContent: 'hola',
        riskLevel: 'HIGH',
        emotionalAnalysis: {},
        contextualAnalysis: {},
      });
      expect(result).toEqual({ skipped: true, reason: 'invalid_user_id' });
      expect(mockCrisisEventCreate).not.toHaveBeenCalled();
    });

    it('programa MEDIUM de forma async sin bloquear', async () => {
      const result = await runCrisisBackgroundActions({
        userId: '507f1f77bcf86cd799439011',
        messageId: '507f1f77bcf86cd799439012',
        messageContent: 'no quiero seguir',
        riskLevel: 'MEDIUM',
        emotionalAnalysis: { mainEmotion: 'tristeza', intensity: 8 },
        contextualAnalysis: { intencion: { tipo: 'CRISIS', confianza: 0.5 } },
        transport: 'http',
        isCrisis: true,
      });
      expect(result.skipped).toBe(false);
      expect(result.phase).toBe('async');
      expect(result.riskLevel).toBe('MEDIUM');

      await new Promise((resolve) => setImmediate(resolve));
      expect(mockCrisisEventCreate).toHaveBeenCalledTimes(1);
    });
  });
});
