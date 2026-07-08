/**
 * Tests unitarios para crisisProtocolService (protocolo v1).
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockRecordMetric = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../services/metricsService.js', () => ({
  default: {
    recordMetric: (...args) => mockRecordMetric(...args),
  },
}));

const {
  advanceCrisisProtocolState,
  evaluateCrisisProtocolTurn,
  hasCrisisBatterySignal,
  isUserExplicitWellbeingMessage,
  recordCrisisProtocolExit,
  shouldActivateCrisisProtocol,
} = await import('../../../services/crisisProtocolService.js');

describe('crisisProtocolService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldActivateCrisisProtocol', () => {
    it('activa en MEDIUM, HIGH y hard-stop', () => {
      expect(shouldActivateCrisisProtocol({ riskLevel: 'MEDIUM' })).toBe(true);
      expect(shouldActivateCrisisProtocol({ riskLevel: 'HIGH' })).toBe(true);
      expect(shouldActivateCrisisProtocol({ riskLevel: 'LOW', hardStop: true })).toBe(true);
    });

    it('activa en WARNING con batería de crisis', () => {
      expect(
        shouldActivateCrisisProtocol({
          riskLevel: 'WARNING',
          messageContent: 'quiero morir',
        }),
      ).toBe(true);
      expect(shouldActivateCrisisProtocol({ riskLevel: 'WARNING' })).toBe(false);
    });
  });

  describe('hasCrisisBatterySignal', () => {
    it('detecta ideación, adicción y señales críticas', () => {
      expect(hasCrisisBatterySignal('quiero morir')).toBe(true);
      expect(hasCrisisBatterySignal('tengo miedo a recaer')).toBe(true);
      expect(hasCrisisBatterySignal('hola', { evidence: { criticalSignals: 1 } })).toBe(true);
      expect(hasCrisisBatterySignal('estoy cansado')).toBe(false);
    });
  });

  describe('isUserExplicitWellbeingMessage', () => {
    it('detecta mensajes explícitos de bienestar', () => {
      expect(isUserExplicitWellbeingMessage('ya estoy bien, gracias')).toBe(true);
      expect(isUserExplicitWellbeingMessage("I'm okay now")).toBe(true);
      expect(isUserExplicitWellbeingMessage('sigo mal')).toBe(false);
    });

    it('no cierra protocolo con mensaje mixto «a salvo pero terrible»', () => {
      expect(
        isUserExplicitWellbeingMessage('Si estoy a salvo pero me siento terrible'),
      ).toBe(false);
    });
  });

  describe('advanceCrisisProtocolState', () => {
    it('entra al protocolo en MEDIUM', () => {
      const { nextState, exit } = advanceCrisisProtocolState(null, {
        riskLevel: 'MEDIUM',
        userContent: 'no aguanto más',
      });
      expect(nextState.active).toBe(true);
      expect(nextState.stableUserTurns).toBe(0);
      expect(exit).toBeNull();
    });

    it('sale tras 2 turnos estables en LOW/WARNING sin batería', () => {
      const entered = advanceCrisisProtocolState(null, {
        riskLevel: 'HIGH',
        userContent: 'mal',
      }).nextState;

      const afterOne = advanceCrisisProtocolState(entered, {
        riskLevel: 'WARNING',
        userContent: 'un poco mejor',
      });
      expect(afterOne.nextState.active).toBe(true);
      expect(afterOne.nextState.stableUserTurns).toBe(1);

      const afterTwo = advanceCrisisProtocolState(afterOne.nextState, {
        riskLevel: 'LOW',
        userContent: 'sigo tranquilo',
      });
      expect(afterTwo.exit?.reason).toBe('meters_stable_2_turns');
      expect(afterTwo.nextState.active).toBe(false);
    });

    it('sale por mensaje explícito del usuario', () => {
      const entered = advanceCrisisProtocolState(null, {
        riskLevel: 'HIGH',
        userContent: 'mal',
      }).nextState;

      const result = advanceCrisisProtocolState(entered, {
        riskLevel: 'HIGH',
        userContent: 'ya estoy bien',
      });
      expect(result.exit?.reason).toBe('user_explicit_ok');
      expect(result.nextState.active).toBe(false);
    });

    it('reinicia contador estable si reaparece batería', () => {
      const entered = advanceCrisisProtocolState(null, {
        riskLevel: 'HIGH',
        userContent: 'mal',
      }).nextState;

      const stable = advanceCrisisProtocolState(entered, {
        riskLevel: 'WARNING',
        userContent: 'mejor',
      }).nextState;

      const reset = advanceCrisisProtocolState(stable, {
        riskLevel: 'MEDIUM',
        userContent: 'quiero morir otra vez',
      });
      expect(reset.nextState.stableUserTurns).toBe(0);
      expect(reset.exit).toBeNull();
    });
  });

  describe('recordCrisisProtocolExit', () => {
    it('registra métrica crisis_protocol_exit', async () => {
      await recordCrisisProtocolExit('user1', 'conv1', {
        reason: 'user_explicit_ok',
        riskLevelAtExit: 'LOW',
        hadContactAlert: true,
        protocolVersion: '1.0',
      });
      expect(mockRecordMetric).toHaveBeenCalledWith(
        'crisis_protocol_exit',
        expect.objectContaining({
          reason: 'user_explicit_ok',
          hadContactAlert: true,
        }),
        'user1',
        { conversationId: 'conv1' },
      );
    });
  });

  describe('evaluateCrisisProtocolTurn', () => {
    it('expone crisisDecision y estado de protocolo', () => {
      const result = evaluateCrisisProtocolTurn({
        previousState: null,
        riskLevel: 'MEDIUM',
        messageContent: 'estoy solo y preocupado',
        contextualAnalysis: { intencion: { tipo: 'CRISIS', confianza: 0.84 } },
        trendAnalysis: { trends: { rapidDecline: false, escalation: false, sustainedLow: true } },
        crisisHistory: { recentCrises: 0 },
        conversationContext: {},
      });
      expect(result.crisisDecision.riskLevel).toBe('MEDIUM');
      expect(result.crisisProtocolState.active).toBe(true);
    });
  });
});
