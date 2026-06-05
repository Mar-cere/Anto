import {
  AT_PICKER_DISTORTION_TYPES,
  getAutomaticThoughtDistortionDisplay,
  getAutomaticThoughtDistortionLabel,
  getAutomaticThoughtDistortionPickerOptions,
} from '../../../constants/automaticThoughtDistortionPicker.js';

describe('automaticThoughtDistortionPicker (#89 UX)', () => {
  it('expone 8 patrones curados', () => {
    expect(AT_PICKER_DISTORTION_TYPES).toHaveLength(8);
  });

  it('getAutomaticThoughtDistortionPickerOptions devuelve labels accesibles en ES', () => {
    const options = getAutomaticThoughtDistortionPickerOptions('es');
    expect(options).toHaveLength(8);
    expect(options.some((o) => o.label.includes('Polarizado'))).toBe(false);
    expect(options.some((o) => o.label === 'Predigo lo peor')).toBe(true);
    options.forEach((option) => {
      expect(option.type).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.hint).toBeTruthy();
    });
  });

  it('prioriza suggestedType fuera del catálogo con fallback amigable', () => {
    const options = getAutomaticThoughtDistortionPickerOptions('es', {
      suggestedTypes: ['what_if'],
    });
    expect(options[0].type).toBe('what_if');
    expect(options[0].label).toBe('¿Y si…?');
    expect(options[0].suggested).toBe(true);
    expect(options.some((o) => o.type === 'fortune_telling')).toBe(true);
  });

  it('getAutomaticThoughtDistortionLabel usa copy curado', () => {
    expect(getAutomaticThoughtDistortionLabel('mind_reading', 'es')).toBe('Creo saber qué piensan');
    expect(getAutomaticThoughtDistortionDisplay('mind_reading', 'en')?.label).toBe('Mind reading');
  });
});
