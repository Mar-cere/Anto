/**
 * Tests unitarios para acciones en segundo plano de crisis (§3).
 */
import {
  shouldRunCrisisBackgroundActions,
  runCrisisBackgroundActions,
} from '../../../services/crisisBackgroundActionsService.js';

describe('crisisBackgroundActionsService', () => {
  describe('shouldRunCrisisBackgroundActions', () => {
    it('ejecuta acciones para WARNING aunque isCrisis sea false', () => {
      expect(
        shouldRunCrisisBackgroundActions({ riskLevel: 'WARNING', isCrisis: false }),
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
    });
  });
});
