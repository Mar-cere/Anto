import {
  resolveTccLiteBubbleDisplay,
  shouldShowTccLiteBubbleFooter,
} from '../chatTccLiteDisplay';

describe('chatTccLiteDisplay', () => {
  it('resuelve copy conversacional ES', () => {
    const display = resolveTccLiteBubbleDisplay(
      {
        step: 'check_evidence',
        stepIndex: 1,
        stepTotal: 4,
        stepShort: 'Revisar hechos',
      },
      'es',
    );
    expect(display.frameLabel).toBe('Explorando tu pensamiento');
    expect(display.progressLabel).toBe('2 de 4');
    expect(display.stepShort).toBe('Revisar hechos');
  });

  it('resuelve copy EN', () => {
    const display = resolveTccLiteBubbleDisplay(
      {
        step: 'capture_thought',
        stepIndex: 0,
        stepTotal: 4,
      },
      'en',
    );
    expect(display.frameLabel).toBe('Working through this thought');
    expect(display.progressLabel).toBe('1 of 4');
  });

  it('no muestra pie si el paso está completado', () => {
    expect(shouldShowTccLiteBubbleFooter({ step: 'wrap_up', completed: true })).toBe(false);
    expect(resolveTccLiteBubbleDisplay({ step: 'wrap_up', completed: true }, 'es')).toBeNull();
  });
});
