import {
  pickClusterDisplayLabel,
  summarizeGraphSourceLabel,
} from '../../../utils/graphSourceLabel.js';

describe('graphSourceLabel', () => {
  it('quita muletillas y acorta snippets en español', () => {
    const label = summarizeGraphSourceLabel('No se solo me siento muy abrumado');
    expect(label).toBe('Me siento muy abrumado');
    expect(label).not.toMatch(/^no se/i);
  });

  it('recorta en límite de palabra', () => {
    const label = summarizeGraphSourceLabel(
      'Me preocupa constantemente el futuro de mi familia y mi trabajo',
      'es',
      { maxLen: 28 },
    );
    expect(label.endsWith('…')).toBe(true);
    expect(label.length).toBeLessThanOrEqual(28);
  });

  it('pickClusterDisplayLabel elige la versión más corta pulida', () => {
    const label = pickClusterDisplayLabel(
      [
        'No sé, solo me siento muy abrumado con todo',
        'Me siento abrumado',
      ],
      'es',
    );
    expect(label.length).toBeLessThan(40);
  });

  it('maneja inglés con fillers', () => {
    const label = summarizeGraphSourceLabel("I don't know, I just feel overwhelmed", 'en');
    expect(label.toLowerCase()).toContain('feel overwhelmed');
  });
});
