import { describe, expect, it } from '@jest/globals';
import {
  buildRecentThreadSummarySnippet,
  getSessionPhaseSystemSnippet,
  inferChatSessionPhase
} from '../../../../services/chat/sessionPhaseHints.js';

describe('inferChatSessionPhase', () => {
  const baseCtx = { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 };

  it('acute por riesgo MEDIUM', () => {
    expect(
      inferChatSessionPhase({
        riskLevel: 'MEDIUM',
        contextualAnalysis: { intencion: baseCtx },
        userContent: 'Hola',
        conversationHistoryNewestFirst: []
      })
    ).toBe('acute');
  });

  it('acute por léxico de autolesión en el mensaje actual', () => {
    expect(
      inferChatSessionPhase({
        riskLevel: 'LOW',
        contextualAnalysis: { intencion: baseCtx },
        userContent: 'A veces me autolesiono cuando tengo ansiedad',
        conversationHistoryNewestFirst: []
      })
    ).toBe('acute');
  });

  it('settled tras mensajes de calma y riesgo bajo', () => {
    // Orden tipo Mongo: createdAt desc (el índice 0 es el más reciente)
    const historyNewestFirst = [
      { role: 'user', content: 'Solo quería contarte' },
      { role: 'assistant', content: 'Bien' },
      { role: 'user', content: 'Estoy bien solo un poco de ansiedad' },
      { role: 'assistant', content: 'Te escucho' },
      { role: 'user', content: 'Mal' }
    ];
    expect(
      inferChatSessionPhase({
        riskLevel: 'LOW',
        contextualAnalysis: { intencion: baseCtx },
        userContent: 'Solo quería contarte',
        conversationHistoryNewestFirst: historyNewestFirst
      })
    ).toBe('settled');
  });

  it('default si no hay señales', () => {
    expect(
      inferChatSessionPhase({
        riskLevel: 'LOW',
        contextualAnalysis: { intencion: baseCtx },
        userContent: 'Qué tal el clima',
        conversationHistoryNewestFirst: [{ role: 'user', content: 'Hola' }]
      })
    ).toBe('default');
  });
});

describe('getSessionPhaseSystemSnippet', () => {
  it('default devuelve vacío', () => {
    expect(getSessionPhaseSystemSnippet('default')).toBe('');
  });
  it('acute y settled tienen texto', () => {
    expect(getSessionPhaseSystemSnippet('acute')).toContain('riesgo');
    expect(getSessionPhaseSystemSnippet('settled')).toContain('tranquila');
  });
});

describe('buildRecentThreadSummarySnippet', () => {
  it('no genera si hay pocos mensajes', () => {
    expect(buildRecentThreadSummarySnippet([{ role: 'user', content: 'a' }], { minMessages: 8 })).toBe('');
  });

  it('genera lista con suficiente historial', () => {
    // Índice 0 = más reciente (como Message.find sort desc)
    const hist = [{ role: 'user', content: 'último usuario largo '.repeat(20) }];
    for (let i = 1; i < 8; i++) {
      hist.push({ role: i % 2 === 1 ? 'assistant' : 'user', content: `m${i}` });
    }
    const snip = buildRecentThreadSummarySnippet(hist, { minMessages: 8, maxCharsPerLine: 40 });
    expect(snip).toContain('Hilo reciente');
    expect(snip).toContain('último usuario');
  });
});
