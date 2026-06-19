import {
  COUNTRY_PREFERENCE_AUTO,
  formatCountryPreferenceRowLabel,
  getEmergencyCountryLabel,
  resolveEffectiveCountryIso,
  resolveStoredCountryPreference,
} from '../emergencyCountries';

describe('emergencyCountries', () => {
  it('resuelve etiqueta de país por ISO', () => {
    expect(getEmergencyCountryLabel('CL', 'es')).toBe('Chile');
    expect(getEmergencyCountryLabel('CL', 'en')).toBe('Chile');
    expect(getEmergencyCountryLabel('ES', 'en')).toBe('Spain');
  });

  it('prioriza país explícito sobre regionCountry', () => {
    expect(
      resolveEffectiveCountryIso({ country: 'MX', regionCountry: 'CL' }),
    ).toBe('MX');
  });

  it('usa regionCountry si no hay país explícito', () => {
    expect(resolveEffectiveCountryIso({ regionCountry: 'AR' })).toBe('AR');
  });

  it('formatea fila automática y detectada', () => {
    const texts = {
      COUNTRY_AUTO_LABEL: 'Automático',
      COUNTRY_DETECTED_SUFFIX: '(detectado)',
    };
    expect(formatCountryPreferenceRowLabel({}, 'es', texts)).toBe('Automático');
    expect(
      formatCountryPreferenceRowLabel({ regionCountry: 'PE' }, 'es', texts),
    ).toBe('Perú (detectado)');
    expect(
      formatCountryPreferenceRowLabel({ country: 'PE' }, 'es', texts),
    ).toBe('Perú');
  });

  it('stored preference vacío cuando solo hay detección', () => {
    expect(
      resolveStoredCountryPreference({ regionCountry: 'CL' }),
    ).toBe(COUNTRY_PREFERENCE_AUTO);
    expect(resolveStoredCountryPreference({ country: 'CL' })).toBe('CL');
  });
});
