import { describe, expect, it } from '@jest/globals';
import {
  detectHarmIntrusiveThoughtDistress,
  resolveHarmIntrusiveDistressContext,
  hasExplicitSuicideIdeation,
  HARM_INTRUSIVE_DISTRESS_THEME
} from '../../../constants/harmIntrusiveThoughts.js';

describe('harmIntrusiveThoughts — validación y blindaje', () => {
  it('no activa angustia intrusiva si hay ideación suicida explícita', () => {
    const content = 'tengo pensamientos intrusivos y quiero morir';
    expect(hasExplicitSuicideIdeation(content)).toBe(true);
    expect(detectHarmIntrusiveThoughtDistress(content).detected).toBe(false);
  });

  it('mantiene el tema en turnos cortos si ya estaba persistido', () => {
    const out = resolveHarmIntrusiveDistressContext({
      content: 'si que?',
      persistedDistressTheme: HARM_INTRUSIVE_DISTRESS_THEME,
      riskLevel: 'LOW'
    });
    expect(out.active).toBe(true);
    expect(out.detectedNow).toBe(false);
    expect(out.distress?.theme).toBe(HARM_INTRUSIVE_DISTRESS_THEME);
  });

  it('desactiva el sub-protocolo en crisis MEDIUM/HIGH', () => {
    const out = resolveHarmIntrusiveDistressContext({
      content: 'pensamientos intrusivos de hacer daño',
      persistedDistressTheme: HARM_INTRUSIVE_DISTRESS_THEME,
      riskLevel: 'HIGH'
    });
    expect(out.active).toBe(false);
    expect(out.distress).toBeNull();
  });

  it('no detecta con intención declarada de daño', () => {
    const out = detectHarmIntrusiveThoughtDistress('quiero hacerle daño a mi pareja');
    expect(out.detected).toBe(false);
  });
});
