import { describe, expect, it } from '@jest/globals';
import {
  detectHarmIntrusiveThoughtDistress,
  shouldStartHarmIntrusiveThoughtsProtocol,
  buildHarmIntrusiveThoughtsDistressSnippet
} from '../../../constants/harmIntrusiveThoughts.js';

describe('harmIntrusiveThoughts', () => {
  const sampleMessage =
    'tengo ansiedad con pensamientos intrusivos negativos de que me voy a volver loca y le puedo llegar a hacer daño a la gente que mas quiero';

  it('detecta angustia por pensamientos intrusivos de daño', () => {
    const out = detectHarmIntrusiveThoughtDistress(sampleMessage);
    expect(out.detected).toBe(true);
    expect(out.level).toBe('elevated');
  });

  it('marca rejectedIntent cuando la persona rechaza el daño', () => {
    const out = detectHarmIntrusiveThoughtDistress(
      'no quiero hacerle daño a nadie ni a mi misma pero me da miedo pensar eso'
    );
    expect(out.detected).toBe(true);
    expect(out.rejectedIntent).toBe(true);
    expect(out.level).toBe('moderate');
  });

  it('propone protocolo para el mensaje de la conversación de ejemplo', () => {
    expect(shouldStartHarmIntrusiveThoughtsProtocol(sampleMessage)).toBe(true);
  });

  it('incluye copy distinto de crisis suicida', () => {
    const snippet = buildHarmIntrusiveThoughtsDistressSnippet('es', { rejectedIntent: true });
    expect(snippet).toMatch(/NO es crisis suicida/i);
    expect(snippet).toMatch(/pensamiento vs intención/i);
  });
});
