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

    it('detecta "Ambos" / "ambas" / "both"', () => {
      expect(isTotalizingReply('Ambos')).toBe(true);
      expect(isTotalizingReply('ambos')).toBe(true);
      expect(isTotalizingReply('Ambas')).toBe(true);
      expect(isTotalizingReply('ambos!')).toBe(true);
      expect(isTotalizingReply('Both')).toBe(true);
      expect(isTotalizingReply('los dos')).toBe(true);
      expect(isTotalizingReply('cuerpo y mente')).toBe(true);
    });

    it('no confunde frases largas con totalizador', () => {
      expect(isTotalizingReply('Todo empezó cuando me rechazaron')).toBe(false);
    });

    it('ignora entradas vacías o no texto', () => {
      expect(isTotalizingReply('')).toBe(false);
      expect(isTotalizingReply(null)).toBe(false);
    });
  });

  describe('isMultiOptionTriageQuestion', () => {
    it('detecta preguntas con tres opciones', () => {
      const q =
        '¿lo que más te angustia ahora es lo económico, la sensación de estancamiento o el miedo a que tarde en llegar algo?';
      expect(isMultiOptionTriageQuestion(q)).toBe(true);
    });

    it('detecta cansancio cuerpo/cabeza/ambos', () => {
      expect(
        isMultiOptionTriageQuestion(
          '¿Ese cansancio ahora se siente más en el cuerpo, en la cabeza, o en ambos?',
        ),
      ).toBe(true);
    });

    it('detecta disyuntiva binaria cuerpo/mente', () => {
      expect(
        isMultiOptionTriageQuestion('¿Qué parte te pesa más ahora: el cuerpo o la mente?'),
      ).toBe(true);
    });

    it('ignora preguntas abiertas simples', () => {
      expect(isMultiOptionTriageQuestion('¿Qué te gustaría contarme ahora?')).toBe(false);
    });

    it('ignora binarias de acción sin contraste somatocognitivo', () => {
      expect(isMultiOptionTriageQuestion('¿Prefieres hablar o hacer una técnica?')).toBe(false);
    });
  });

  describe('shouldSuppressRepeatTriage', () => {
    const lastAssistant =
      '¿lo que más te angustia ahora es lo económico, la sensación de estancamiento o el miedo a que tarde en llegar algo?';

    const crisisSoma =
      'Tiene sentido: después de una crisis así, el cuerpo y la mente pueden quedar agotados. ¿Ese cansancio ahora se siente más en el cuerpo, en la cabeza, o en ambos?';

    it('activa con "Todo" tras triage del asistente', () => {
      expect(
        shouldSuppressRepeatTriage({
          userMessage: 'Todo',
          safetyHistory: [{ role: 'assistant', content: lastAssistant }]
        })
      ).toBe(true);
    });

    it('activa con "Ambos" tras triage cuerpo/cabeza', () => {
      expect(
        shouldSuppressRepeatTriage({
          userMessage: 'Ambos',
          safetyHistory: [{ role: 'assistant', content: crisisSoma }]
        })
      ).toBe(true);
    });

    it('activa con historial newest-first (usuario actual primero)', () => {
      expect(
        shouldSuppressRepeatTriage({
          userMessage: 'Todo',
          safetyHistory: [
            { role: 'user', content: 'Todo' },
            { role: 'assistant', content: lastAssistant },
            { role: 'user', content: 'El estar sin trabajo' }
          ]
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
      expect(snip).toContain('ambos');
    });

    it('devuelve snippet con Ambos tras pregunta de cansancio', () => {
      const snip = buildAntiRepeatTriageSnippet({
        currentMessage: 'Ambos',
        safetyHistory: [
          {
            role: 'assistant',
            content:
              '¿Ese cansancio ahora se siente más en el cuerpo, en la cabeza, o en ambos?'
          }
        ]
      });
      expect(snip).toContain('Evitar triage repetido');
      expect(snip).toMatch(/renombr/i);
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
