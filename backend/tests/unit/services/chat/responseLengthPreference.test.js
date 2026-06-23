import { describe, expect, it } from '@jest/globals';
import {
  detectExpandedResponseMode,
  detectShortModeFromSession,
  resolveResponseLengthLimits
} from '../../../../services/chat/responseLengthPreference.js';

describe('responseLengthPreference', () => {
  it('activa short mode cuando el mensaje actual pide brevedad', () => {
    const result = detectShortModeFromSession({
      currentMessage: 'por favor responde breve, no me mandes textos largos'
    });
    expect(result).toBe(true);
  });

  it('activa short mode por preferencia explícita en historial reciente', () => {
    const result = detectShortModeFromSession({
      currentMessage: 'me pasa esto con mi pareja',
      conversationHistoryNewestFirst: [
        { role: 'assistant', content: 'Te leo.' },
        { role: 'user', content: 'sé breve por favor' }
      ]
    });
    expect(result).toBe(true);
  });

  it('desactiva short mode si el pedido más reciente es más detalle', () => {
    const result = detectShortModeFromSession({
      currentMessage: 'mejor explícame con más detalle',
      conversationHistoryNewestFirst: [
        { role: 'user', content: 'sé breve porfa' }
      ]
    });
    expect(result).toBe(false);
  });

  it('detecta pedido de tips o consejos', () => {
    expect(
      detectExpandedResponseMode({
        currentMessage: 'me das mas tips, asi los voy poniendo en practica'
      })
    ).toBe(true);
  });

  it('amplía límites cuando piden tips', () => {
    const limits = resolveResponseLengthLimits({
      userMessage: 'me das mas tips',
      emotional: { intensity: 5 },
      contextual: { tema: { categoria: 'EMOCIONAL' } }
    });
    expect(limits.mode).toBe('expanded');
    expect(limits.maxChars).toBeGreaterThan(400);
    expect(limits.maxSentencesReduce).toBeGreaterThan(2);
  });

  it('amplía límites con alta carga emocional en ayuda emocional', () => {
    const limits = resolveResponseLengthLimits({
      userMessage: 'tengo mucho miedo',
      emotional: { intensity: 9, requiresAttention: true },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL' },
        tema: { categoria: 'EMOCIONAL' }
      }
    });
    expect(limits.mode).toBe('high_load');
    expect(limits.maxChars).toBeGreaterThan(400);
  });

  it('respeta short mode por encima de expanded', () => {
    const limits = resolveResponseLengthLimits({
      forceShortMode: true,
      userMessage: 'me das mas tips'
    });
    expect(limits.mode).toBe('short');
    expect(limits.maxChars).toBeLessThanOrEqual(180);
  });

  it('usa high_load con pico de sesión y tema de angustia activo', () => {
    const limits = resolveResponseLengthLimits({
      userMessage: 'si que?',
      emotional: { intensity: 4, requiresAttention: false },
      contextual: { tema: { categoria: 'GENERAL' } },
      sessionEmotionalIntensity: 10,
      distressTheme: 'harm_intrusive_thoughts'
    });
    expect(limits.mode).toBe('high_load');
    expect(limits.maxChars).toBeGreaterThan(400);
  });
});
