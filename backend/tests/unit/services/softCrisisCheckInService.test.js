/**
 * Tests unitarios para softCrisisCheckInService (#19).
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockRecordMetric = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../services/metricsService.js', () => ({
  default: {
    recordMetric: (...args) => mockRecordMetric(...args),
  },
}));

const {
  advanceSoftCrisisCheckInState,
  evaluateSoftCrisisCheckInTurn,
  recordSoftCrisisCheckInExit,
  shouldOfferSoftCrisisCheckIn,
} = await import('../../../services/softCrisisCheckInService.js');

describe('softCrisisCheckInService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldOfferSoftCrisisCheckIn', () => {
    it('ofrece en WARNING sin batería ni hard-stop', () => {
      expect(
        shouldOfferSoftCrisisCheckIn({
          riskLevel: 'WARNING',
          messageContent: 'me siento muy mal y no puedo más',
        }),
      ).toBe(true);
    });

    it('no ofrece en WARNING con batería de crisis', () => {
      expect(
        shouldOfferSoftCrisisCheckIn({
          riskLevel: 'WARNING',
          messageContent: 'quiero morir',
        }),
      ).toBe(false);
    });

    it('no ofrece en MEDIUM/HIGH ni con hard-stop', () => {
      expect(shouldOfferSoftCrisisCheckIn({ riskLevel: 'MEDIUM' })).toBe(false);
      expect(shouldOfferSoftCrisisCheckIn({ riskLevel: 'HIGH' })).toBe(false);
      expect(
        shouldOfferSoftCrisisCheckIn({ riskLevel: 'WARNING', hardStop: true }),
      ).toBe(false);
    });

    it('no ofrece si el protocolo #93 ya está activo', () => {
      expect(
        shouldOfferSoftCrisisCheckIn({
          riskLevel: 'WARNING',
          messageContent: 'ansiedad fuerte',
          crisisProtocolActive: true,
        }),
      ).toBe(false);
    });
  });

  describe('advanceSoftCrisisCheckInState', () => {
    it('entra en check-in suave en WARNING sin batería', () => {
      const { nextState, exit } = advanceSoftCrisisCheckInState(null, {
        riskLevel: 'WARNING',
        userContent: 'estoy muy agobiado',
      });
      expect(nextState.active).toBe(true);
      expect(nextState.dismissed).toBe(false);
      expect(exit).toBeNull();
    });

    it('sale tras 2 turnos estables o mensaje explícito de bienestar', () => {
      const entered = advanceSoftCrisisCheckInState(null, {
        riskLevel: 'WARNING',
        userContent: 'mal',
      }).nextState;

      const afterOne = advanceSoftCrisisCheckInState(entered, {
        riskLevel: 'WARNING',
        userContent: 'un poco mejor',
      }).nextState;

      const { nextState, exit } = advanceSoftCrisisCheckInState(afterOne, {
        riskLevel: 'LOW',
        userContent: 'ya estoy bien',
      });
      expect(nextState.active).toBe(false);
      expect(exit?.reason).toBe('both');
    });

    it('sale al escalar a protocolo por batería', () => {
      const entered = advanceSoftCrisisCheckInState(null, {
        riskLevel: 'WARNING',
        userContent: 'muy mal',
      }).nextState;

      const { nextState, exit } = advanceSoftCrisisCheckInState(entered, {
        riskLevel: 'WARNING',
        userContent: 'quiero hacerme daño',
        crisisDecision: { evidence: { criticalSignals: 0 } },
      });
      expect(nextState.active).toBe(false);
      expect(exit?.reason).toBe('escalated_to_protocol');
    });
  });

  describe('evaluateSoftCrisisCheckInTurn', () => {
    it('arma payload cliente con técnicas de regulación', () => {
      const result = evaluateSoftCrisisCheckInTurn({
        previousState: null,
        riskLevel: 'WARNING',
        messageContent: 'no aguanto',
        language: 'es',
        preferences: { country: 'ES' },
      });
      expect(result.softCrisisCheckInState.active).toBe(true);
      expect(result.softCrisisCheckIn?.active).toBe(true);
      expect(result.softCrisisCheckIn?.techniques?.length).toBe(2);
      expect(result.softCrisisCheckIn?.techniques[0].screen).toBe('BreathingExercise');
    });

    it('no arma payload si el protocolo entra en el mismo turno', () => {
      const result = evaluateSoftCrisisCheckInTurn({
        previousState: null,
        riskLevel: 'MEDIUM',
        messageContent: 'no aguanto',
        crisisProtocolEntering: true,
        crisisProtocolActive: true,
        language: 'en',
      });
      expect(result.softCrisisCheckIn).toBeNull();
    });

    it('no arma payload si el estado está dismissed', () => {
      const result = evaluateSoftCrisisCheckInTurn({
        previousState: { active: true, stableUserTurns: 0, dismissed: true },
        riskLevel: 'WARNING',
        messageContent: 'sigo mal',
        language: 'es',
      });
      expect(result.softCrisisCheckIn).toBeNull();
      expect(result.softCrisisCheckInState.dismissed).toBe(true);
    });

    it('copy EN en payload cliente', () => {
      const result = evaluateSoftCrisisCheckInTurn({
        previousState: null,
        riskLevel: 'WARNING',
        messageContent: 'overwhelmed',
        language: 'en',
      });
      expect(result.softCrisisCheckIn?.validation).toMatch(/heavy right now/i);
    });
  });

  describe('recordSoftCrisisCheckInExit', () => {
    it('registra métrica soft_crisis_check_in_exit', async () => {
      await recordSoftCrisisCheckInExit('user1', 'conv1', {
        reason: 'user_explicit_ok',
        riskLevelAtExit: 'LOW',
      });
      expect(mockRecordMetric).toHaveBeenCalledWith(
        'soft_crisis_check_in_exit',
        expect.objectContaining({ reason: 'user_explicit_ok' }),
        'user1',
        { conversationId: 'conv1' },
      );
    });
  });
});
