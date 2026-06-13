import { describe, expect, it } from '@jest/globals';
import {
  buildAntiRepeatTriageSnippet,
  isMultiOptionTriageQuestion,
  isTotalizingReply,
  shouldSuppressRepeatTriage
} from '../../../../services/chat/chatTriageLoopHints.js';

describe('chatTriageLoopHints', () => {
  describe('isTotalizingReply', () => {
    it('detecta "Todo" y variantes cortas', () => {
      expect(isTotalizingReply('Todo')).toBe(true);
      expect(isTotalizingReply('todo eso')).toBe(true);
      expect(isTotalizingReply('las tres')).toBe(true);
      expect(isTotalizingReply('un poco de todo')).toBe(true);
    });

    it('no confunde frases largas con totalizador', () => {
      expect(isTotalizingReply('Todo empezó cuando me rechazaron')).toBe(false);
    });
  });

  describe('isMultiOptionTriageQuestion', () => {
    it('detecta preguntas con tres opciones', () => {
      const q =
        '¿lo que más te angustia ahora es lo económico, la sensación de estancamiento o el miedo a que tarde en llegar algo?';
      expect(isMultiOptionTriageQuestion(q)).toBe(true);
    });

    it('ignora preguntas abiertas simples', () => {
      expect(isMultiOptionTriageQuestion('¿Qué te gustaría contarme ahora?')).toBe(false);
    });
  });

  describe('shouldSuppressRepeatTriage', () => {
    const lastAssistant =
      '¿lo que más te angustia ahora es lo económico, la sensación de estancamiento o el miedo a que tarde en llegar algo?';

    it('activa con "Todo" tras triage del asistente', () => {
      expect(
        shouldSuppressRepeatTriage({
          userMessage: 'Todo',
          safetyHistory: [{ role: 'assistant', content: lastAssistant }]
        })
      ).toBe(true);
    });

    it('no activa si el asistente no hizo triage', () => {
      expect(
        shouldSuppressRepeatTriage({
          userMessage: 'Todo',
          safetyHistory: [{ role: 'assistant', content: 'Cuéntame un poco más.' }]
        })
      ).toBe(false);
    });
  });

  describe('buildAntiRepeatTriageSnippet', () => {
    it('devuelve snippet cuando aplica', () => {
      const snip = buildAntiRepeatTriageSnippet({
        currentMessage: 'Todo',
        safetyHistory: [
          {
            role: 'assistant',
            content:
              '¿qué te está apretando más hoy, lo económico, la ansiedad o el cansancio de seguir buscando?'
          }
        ]
      });
      expect(snip).toContain('Evitar triage repetido');
      expect(snip).toContain('pregunta abierta');
    });

    it('devuelve vacío cuando no aplica', () => {
      expect(
        buildAntiRepeatTriageSnippet({
          currentMessage: 'El estar sin trabajo',
          safetyHistory: []
        })
      ).toBe('');
    });
  });
});
