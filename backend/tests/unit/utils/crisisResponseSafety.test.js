import {
  shouldApplyCrisisResponseSafety,
  shouldStripCrisisConductualLanguage,
  stripInappropriateCrisisConductualLanguage,
} from '../../../utils/crisisResponseSafety.js';

describe('crisisResponseSafety', () => {
  it('shouldApplyCrisisResponseSafety en WARNING/MEDIUM/HIGH', () => {
    expect(shouldApplyCrisisResponseSafety({ crisis: { riskLevel: 'WARNING' } })).toBe(true);
    expect(shouldApplyCrisisResponseSafety({ crisis: { riskLevel: 'MEDIUM' } })).toBe(true);
    expect(shouldApplyCrisisResponseSafety({ crisis: { riskLevel: 'LOW' } })).toBe(false);
  });

  it('shouldApplyCrisisResponseSafety con intención CRISIS e intensidad alta', () => {
    expect(
      shouldApplyCrisisResponseSafety({
        crisis: { riskLevel: 'LOW' },
        contextual: { intencion: { tipo: 'CRISIS' } },
        emotional: { intensity: 8 },
      }),
    ).toBe(true);
  });

  it('stripInappropriateCrisisConductualLanguage quita invitaciones conductuales', () => {
    const input =
      'Te escucho. Mañana podemos planificar una activación conductual suave. ¿Estás a salvo?';
    const output = stripInappropriateCrisisConductualLanguage(input);
    expect(output).not.toMatch(/activación conductual/i);
    expect(output).not.toMatch(/mañana podemos planificar/i);
    expect(output).toContain('¿Estás a salvo?');
  });

  it('shouldStripCrisisConductualLanguage en crisis elevada', () => {
    expect(shouldStripCrisisConductualLanguage({ riskLevel: 'MEDIUM' })).toBe(true);
    expect(shouldStripCrisisConductualLanguage({ riskLevel: 'LOW' })).toBe(false);
  });
});
