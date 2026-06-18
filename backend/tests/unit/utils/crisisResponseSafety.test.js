import {
  shouldApplyCrisisResponseSafety,
  shouldStripCrisisConductualLanguage,
  stripInappropriateCrisisConductualLanguage,
  sanitizeCrisisLlmResponse,
  detectInappropriateCrisisContent,
  getCrisisSanitizeFallback,
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

  it('sanitizeCrisisLlmResponse reporta hits y wasSanitized', () => {
    const input =
      'Te escucho. Hagamos grounding juntos. Mañana podemos planificar un hábito. ¿Estás a salvo?';
    const result = sanitizeCrisisLlmResponse(input);
    expect(result.wasSanitized).toBe(true);
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.text).not.toMatch(/grounding/i);
    expect(result.text).toContain('¿Estás a salvo?');
  });

  it('detectInappropriateCrisisContent identifica plan de seguridad co-creado', () => {
    const hits = detectInappropriateCrisisContent(
      'Podemos armar un plan de seguridad juntos para esta semana.',
    );
    expect(hits).toContain('safety_plan_co_create');
  });

  it('detectInappropriateCrisisContent detecta invitaciones en inglés', () => {
    const hits = detectInappropriateCrisisContent(
      "Let's try grounding together and schedule a habit tomorrow.",
    );
    expect(hits).toContain('en_grounding_invite');
    expect(hits).toContain('en_conductual');
  });

  it('getCrisisSanitizeFallback devuelve línea mínima de seguridad', () => {
    expect(getCrisisSanitizeFallback('es')).toMatch(/¿Estás a salvo/i);
    expect(getCrisisSanitizeFallback('en')).toMatch(/Are you safe/i);
  });

  it('sanitizeCrisisLlmResponse usa fallback implícito vía texto vacío detectable', () => {
    const input = 'Hagamos grounding juntos. Mañana podemos planificar un hábito.';
    const result = sanitizeCrisisLlmResponse(input);
    expect(result.wasSanitized).toBe(true);
    expect(result.text.length).toBeLessThan(input.length);
  });

  it('sanitizeCrisisLlmResponse neutraliza voseo en español', () => {
    const input = 'Gracias por decírmelo. ¿Podés decirme si estás a salvo?';
    const result = sanitizeCrisisLlmResponse(input);
    expect(result.text).toMatch(/contármelo/i);
    expect(result.text).toMatch(/puedes/i);
    expect(result.text).not.toMatch(/decírmelo|podés/i);
  });

  it('shouldStripCrisisConductualLanguage en crisis elevada', () => {
    expect(shouldStripCrisisConductualLanguage({ riskLevel: 'MEDIUM' })).toBe(true);
    expect(shouldStripCrisisConductualLanguage({ riskLevel: 'LOW' })).toBe(false);
  });
});
