import { describe, expect, it } from '@jest/globals';
import {
  calendarDaysBetweenInTz,
  fixContinuationTemporalOpeners,
  focusCopy,
  getChatContinuityInviteSubtitle,
  getLastSessionDisplayText,
  hasChatContinuityDisplayText,
  localizeLastSessionSummaryForDisplay,
  looksLikeChatClosureText,
  looksLikeSpanishText,
  shouldSuppressFocusLineForContinuity,
} from '../../../utils/focusDashboardCopy.js';

describe('focusDashboardCopy', () => {
  it('looksLikeSpanishText detecta español', () => {
    expect(looksLikeSpanishText('Hoy planificaste tus tareas')).toBe(true);
    expect(looksLikeSpanishText('Open your last conversation')).toBe(false);
  });

  it('localizeLastSessionSummaryForDisplay traduce headline y fallback legacy', () => {
    const raw = {
      snippet: 'Hoy planificaste tus tareas de psicología y tecnología.',
      bridge: 'Podés retomar cuando quieras.',
      placeholder: false,
      language: 'es',
      conversationId: 'abc'
    };
    const out = localizeLastSessionSummaryForDisplay(raw, 'en');
    expect(out.headline).toBe('Resume chat');
    expect(out.snippet).toMatch(/Open your last conversation/i);
  });

  it('corrige "Hoy" cuando la sesión no es del día actual', () => {
    const sessionDay = new Date('2026-05-20T15:00:00Z');
    const now = new Date('2026-06-03T10:00:00Z');
    const fixed = fixContinuationTemporalOpeners(
      'Hoy planificaste tus tareas de psicología y tecnología.',
      sessionDay,
      'es',
      now
    );
    expect(fixed).toMatch(/^Hace \d+ días planificaste/);
    expect(fixed).not.toMatch(/^Hoy\b/i);
  });

  it('localizeLastSessionSummaryForDisplay ajusta temporalidad con generatedAt legacy', () => {
    const raw = {
      snippet: 'Hoy planificaste tus tareas de psicología y tecnología.',
      bridge: '',
      placeholder: false,
      language: 'es',
      generatedAt: '2026-05-20T12:00:00.000Z',
      conversationId: 'abc'
    };
    const out = localizeLastSessionSummaryForDisplay(raw, 'es', {
      now: new Date('2026-06-03T12:00:00.000Z')
    });
    expect(out.snippet).toMatch(/^Hace \d+ días planificaste/);
  });

  it('calendarDaysBetweenInTz respeta días calendario en UTC', () => {
    const a = new Date('2026-06-03T01:00:00Z');
    const b = new Date('2026-06-03T23:00:00Z');
    expect(calendarDaysBetweenInTz(a, b, 'UTC')).toBe(0);
    const c = new Date('2026-06-02T12:00:00Z');
    expect(calendarDaysBetweenInTz(c, b, 'UTC')).toBe(1);
  });

  it('placeholder en inglés cuando language es en', () => {
    const raw = {
      snippet: 'Charla breve — seguí cuando quieras.',
      bridge: 'Esta charla fue breve.',
      placeholder: true,
      language: 'es',
      conversationId: 'abc'
    };
    const out = localizeLastSessionSummaryForDisplay(raw, 'en');
    expect(out.snippet).toBe(focusCopy('en').lastSessionPlaceholderSnippet);
  });

  it('detecta continuidad y suprime líneas genéricas al chat', () => {
    const session = {
      snippet: 'Hoy te sentiste bien después de un día difícil.',
      bridge: '',
      placeholder: false,
      language: 'es',
    };
    expect(getLastSessionDisplayText(session)).toMatch(/chat|retoma/i);
    expect(hasChatContinuityDisplayText(session)).toBe(true);
    expect(
      shouldSuppressFocusLineForContinuity(focusCopy('es').focusResumeOrCheckIn, 'es'),
    ).toBe(true);
    expect(
      shouldSuppressFocusLineForContinuity('Próximo foco práctico: llamar al banco.', 'es'),
    ).toBe(false);
  });

  it('evita despedidas del asistente en subtítulo de continuidad', () => {
    expect(
      looksLikeChatClosureText('Chau, cuídate. Cuando quieras volver, aquí estaré.'),
    ).toBe(true);
    const invite = getChatContinuityInviteSubtitle(
      {
        snippet: 'Chau, cuídate. Cuando quieras volver, aquí estaré.',
        bridge: 'Chau, cuídate. Cuando quieras volver, aquí estaré.',
        placeholder: false,
        language: 'es',
      },
      'es',
    );
    expect(invite).not.toMatch(/chau|cuídate/i);
    expect(invite).toMatch(/retoma|chat|hilo/i);
  });
});
