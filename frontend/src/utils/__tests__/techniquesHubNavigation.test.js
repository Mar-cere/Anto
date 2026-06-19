import {
  openPomodoroFromTechniquesHub,
  openTechniquesHubScreen,
  POMODORO_ROUTE,
  resolvePomodoroBackHandler,
  TECHNIQUES_HUB_ROUTE,
  THERAPEUTIC_TECHNIQUES_ROUTE,
} from '../techniquesHubNavigation';

describe('techniquesHubNavigation', () => {
  it('expone rutas estables del hub', () => {
    expect(TECHNIQUES_HUB_ROUTE).toBe('Techniques');
    expect(POMODORO_ROUTE).toBe('Pomodoro');
    expect(THERAPEUTIC_TECHNIQUES_ROUTE).toBe('TherapeuticTechniques');
  });

  it('navega de forma defensiva', () => {
    const navigate = jest.fn();
    openTechniquesHubScreen({ navigate }, 'Pomodoro', { foo: 1 });
    expect(navigate).toHaveBeenCalledWith('Pomodoro', { foo: 1 });
    expect(() => openTechniquesHubScreen(null, 'Techniques')).not.toThrow();
  });

  it('abre Pomodoro desde el hub', () => {
    const navigate = jest.fn();
    openPomodoroFromTechniquesHub({ navigate });
    expect(navigate).toHaveBeenCalledWith('Pomodoro', undefined);
  });

  it('usa handler personalizado si se provee', () => {
    const custom = jest.fn();
    const handler = resolvePomodoroBackHandler({ canGoBack: () => true, goBack: jest.fn() }, custom);
    handler();
    expect(custom).toHaveBeenCalled();
  });

  it('vuelve atrás si hay historial', () => {
    const goBack = jest.fn();
    const handler = resolvePomodoroBackHandler({ canGoBack: () => true, goBack }, null);
    handler();
    expect(goBack).toHaveBeenCalled();
  });

  it('cae al hub si no hay historial (deep link)', () => {
    const navigate = jest.fn();
    const handler = resolvePomodoroBackHandler(
      { canGoBack: () => false, navigate },
      null,
    );
    handler();
    expect(navigate).toHaveBeenCalledWith(TECHNIQUES_HUB_ROUTE, undefined);
  });
});
