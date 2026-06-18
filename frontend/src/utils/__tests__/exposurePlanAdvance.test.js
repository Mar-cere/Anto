import {
  buildExposureAdvanceConfirmCopy,
  canMarkExposureStepComplete,
} from '../exposurePlanAdvance';

describe('exposurePlanAdvance (#87 / #190)', () => {
  const texts = {
    currentStepFallback: 'Paso actual',
    confirmCompleteTitle: '¿Listo para avanzar?',
    confirmCompleteBody:
      'Completaste «{step}». Siguiente: «{next}»',
    confirmCompleteLastTitle: '¿Completar jerarquía?',
    confirmCompleteLastBody: 'Completaste «{step}». ¿Continuar?',
  };

  it('canMarkExposureStepComplete exige al menos un intento', () => {
    expect(canMarkExposureStepComplete(0)).toBe(false);
    expect(canMarkExposureStepComplete(1)).toBe(true);
  });

  it('buildExposureAdvanceConfirmCopy incluye paso actual y siguiente', () => {
    const out = buildExposureAdvanceConfirmCopy({
      stepLabel: 'Hablar en reunión',
      nextStepLabel: 'Presentar un tema',
      isLastStep: false,
      texts,
    });
    expect(out.title).toBe('¿Listo para avanzar?');
    expect(out.message).toContain('Hablar en reunión');
    expect(out.message).toContain('Presentar un tema');
  });

  it('buildExposureAdvanceConfirmCopy usa plantilla de último paso', () => {
    const out = buildExposureAdvanceConfirmCopy({
      stepLabel: 'Exponerme al miedo',
      isLastStep: true,
      texts,
    });
    expect(out.title).toBe('¿Completar jerarquía?');
    expect(out.message).toContain('Exponerme al miedo');
  });
});
