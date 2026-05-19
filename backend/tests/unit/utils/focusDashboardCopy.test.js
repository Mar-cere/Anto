import { describe, expect, it } from '@jest/globals';
import {
  focusCopy,
  localizeLastSessionSummaryForDisplay,
  looksLikeSpanishText
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
    expect(out.headline).toBe('Chat continuity');
    expect(out.snippet).toMatch(/Open your last conversation/i);
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
});
