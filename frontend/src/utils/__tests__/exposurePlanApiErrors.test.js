import { resolveExposurePlanErrorMessage } from '../exposurePlanApiErrors';

describe('resolveExposurePlanErrorMessage (#87 / #190)', () => {
  const texts = {
    toastError: 'Error genérico',
    stepLocked: 'Completa el paso anterior',
    completeNeedsAttempt: 'Registra un intento primero',
    stepAlreadyCompleted: 'Paso ya completado',
  };

  it('prioriza mensaje local para STEP_LOCKED', () => {
    expect(
      resolveExposurePlanErrorMessage(
        { code: 'STEP_LOCKED', error: 'API' },
        texts,
      ),
    ).toBe('Completa el paso anterior');
  });

  it('usa completeNeedsAttempt para STEP_NEEDS_ATTEMPT', () => {
    expect(
      resolveExposurePlanErrorMessage({ code: 'STEP_NEEDS_ATTEMPT' }, texts),
    ).toBe('Registra un intento primero');
  });

  it('cae en error del payload si no hay code conocido', () => {
    expect(resolveExposurePlanErrorMessage({ error: 'Fallo servidor' }, texts)).toBe(
      'Fallo servidor',
    );
  });
});
