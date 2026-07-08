import { describe, it, expect } from '@jest/globals';

const {
  buildCrisisProtocolFollowUpContent,
  shouldUseCrisisProtocolFollowUpFastPath,
  resolveCrisisStructuredAssistantContent,
  wasLastAssistantTurnCrisisHardStop,
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

    it('se dispara aunque el estado esté corrupto si el turno previo fue hard-stop', () => {
      expect(
        shouldUseCrisisProtocolFollowUpFastPath({
          protocolWasActive: false,
          willHardStop: false,
          previousAssistantWasHardStop: true,
        }),
      ).toBe(true);
      expect(
        shouldUseCrisisProtocolFollowUpFastPath({
          protocolWasActive: false,
          willHardStop: true,
          previousAssistantWasHardStop: true,
        }),
      ).toBe(false);
    });
  });

  describe('wasLastAssistantTurnCrisisHardStop', () => {
    it('detecta hard-stop en el asistente más reciente (objeto plano)', () => {
      const history = [
        { role: 'assistant', metadata: { crisis: { hardStop: true } } },
        { role: 'user', content: 'me quiero morir' },
      ];
      expect(wasLastAssistantTurnCrisisHardStop(history)).toBe(true);
    });

    it('detecta hard-stop cuando metadata es un Map de Mongoose', () => {
      const metadata = new Map([['crisis', { hardStop: true }]]);
      const history = [{ role: 'assistant', metadata }];
      expect(wasLastAssistantTurnCrisisHardStop(history)).toBe(true);
    });

    it('devuelve false si el último asistente no fue hard-stop', () => {
      const history = [
        { role: 'assistant', metadata: { crisis: { hardStop: false } } },
        { role: 'user', content: 'hola' },
      ];
      expect(wasLastAssistantTurnCrisisHardStop(history)).toBe(false);
      expect(wasLastAssistantTurnCrisisHardStop([])).toBe(false);
      expect(wasLastAssistantTurnCrisisHardStop(null)).toBe(false);
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

    it('recupera el follow-up tras hard-stop aunque el protocolo se haya cerrado por error', () => {
      const out = resolveCrisisStructuredAssistantContent({
        willHardStop: false,
        protocolWasActive: false,
        previousAssistantWasHardStop: true,
        messageContent: 'Si estoy a salvo pero me siento terrible',
        language: 'es',
      });
      expect(out?.kind).toBe('protocol_follow_up');
      expect(out?.content).toMatch(/Gracias por responder/i);
    });
  });
});
