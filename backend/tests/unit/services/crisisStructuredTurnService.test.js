import { describe, it, expect } from '@jest/globals';

const {
  buildCrisisProtocolFollowUpContent,
  shouldUseCrisisProtocolFollowUpFastPath,
  resolveCrisisStructuredAssistantContent,
} = await import('../../../services/crisisStructuredTurnService.js');

describe('crisisStructuredTurnService', () => {
  describe('shouldUseCrisisProtocolFollowUpFastPath', () => {
    it('activa seguimiento cuando el protocolo ya estaba activo y no hay hard-stop', () => {
      expect(
        shouldUseCrisisProtocolFollowUpFastPath({
          protocolWasActive: true,
          willHardStop: false,
        }),
      ).toBe(true);
      expect(
        shouldUseCrisisProtocolFollowUpFastPath({
          protocolWasActive: true,
          willHardStop: true,
        }),
      ).toBe(false);
      expect(
        shouldUseCrisisProtocolFollowUpFastPath({
          protocolWasActive: false,
          willHardStop: false,
        }),
      ).toBe(false);
    });
  });

  describe('buildCrisisProtocolFollowUpContent', () => {
    it('responde al mensaje mixto «a salvo pero terrible» sin cerrar el protocolo', () => {
      const out = buildCrisisProtocolFollowUpContent({
        messageContent: 'Si estoy a salvo pero me siento terrible',
        language: 'es',
      });
      expect(out).toMatch(/a salvo/i);
      expect(out).toMatch(/muy mal|mal/i);
      expect(out).toMatch(/0 al 10/i);
      expect(out).not.toMatch(/Me alegra que ahora te sientas a salvo\./);
    });

    it('responde cuando solo menciona seguridad', () => {
      const out = buildCrisisProtocolFollowUpContent({
        messageContent: 'Sí, estoy a salvo',
        language: 'es',
      });
      expect(out).toMatch(/Me alegra que ahora te sientas a salvo/i);
    });
  });

  describe('resolveCrisisStructuredAssistantContent', () => {
    it('prioriza hard-stop sobre follow-up', () => {
      const out = resolveCrisisStructuredAssistantContent({
        willHardStop: true,
        protocolWasActive: true,
        messageContent: 'quiero morir',
        language: 'es',
      });
      expect(out?.kind).toBe('hard_stop');
      expect(out?.hardStop).toBe(true);
      expect(out?.content).toMatch(/seguridad/i);
    });

    it('devuelve follow-up estructurado tras hard-stop previo', () => {
      const out = resolveCrisisStructuredAssistantContent({
        willHardStop: false,
        protocolWasActive: true,
        messageContent: 'Si estoy a salvo pero me siento terrible',
        language: 'es',
      });
      expect(out?.kind).toBe('protocol_follow_up');
      expect(out?.hardStop).toBe(false);
      expect(out?.content).toMatch(/Gracias por responder/i);
    });

    it('no interviene si el protocolo no estaba activo', () => {
      const out = resolveCrisisStructuredAssistantContent({
        willHardStop: false,
        protocolWasActive: false,
        messageContent: 'me siento mal',
        language: 'es',
      });
      expect(out).toBeNull();
    });
  });
});
