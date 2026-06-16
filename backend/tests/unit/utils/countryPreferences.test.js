import { describe, expect, it } from '@jest/globals';
import {
  isValidCountryPreference,
  isValidRegionCountryPreference,
  normalizeCountryPreferences,
  sanitizeCountryPreference,
  sanitizeRegionCountryPreference,
} from '../../../utils/countryPreferences.js';
import { getUpdateProfileSchema } from '../../../utils/userSchemas.js';

const copy = {
  joiNameMin: 'min',
  joiNameMax: 'max',
  joiUsernameMin: 'min',
  joiUsernameMax: 'max',
  joiUsernamePattern: 'pattern',
  joiEmailInvalid: 'email',
};

describe('countryPreferences', () => {
  it('sanitiza ISO y legacy', () => {
    expect(sanitizeCountryPreference('cl')).toBe('CL');
    expect(sanitizeCountryPreference('ESPANA')).toBe('ES');
    expect(sanitizeCountryPreference('54')).toBe('54');
    expect(sanitizeCountryPreference('INVALID')).toBeNull();
    expect(sanitizeCountryPreference(null)).toBeNull();
  });

  it('sanitiza regionCountry solo ISO conocido', () => {
    expect(sanitizeRegionCountryPreference('pe')).toBe('PE');
    expect(sanitizeRegionCountryPreference('ZZ')).toBeNull();
  });

  it('normalizeCountryPreferences limpia valores inválidos', () => {
    expect(
      normalizeCountryPreferences({
        country: 'CHILE',
        regionCountry: 'CL',
      }),
    ).toEqual({ country: 'CL', regionCountry: 'CL' });
    expect(
      normalizeCountryPreferences({
        country: '<script>',
        regionCountry: 'XX',
      }),
    ).toEqual({ country: null, regionCountry: null });
  });
});

describe('getUpdateProfileSchema — país en preferencias', () => {
  const schema = getUpdateProfileSchema(copy);

  it('acepta country y regionCountry válidos', () => {
    const { error, value } = schema.validate({
      preferences: {
        country: 'MX',
        regionCountry: 'CL',
      },
    });
    expect(error).toBeUndefined();
    expect(value.preferences.country).toBe('MX');
    expect(value.preferences.regionCountry).toBe('CL');
  });

  it('acepta country null (automático)', () => {
    const { error, value } = schema.validate({
      preferences: { country: null, language: 'es' },
    });
    expect(error).toBeUndefined();
    expect(value.preferences.country).toBeNull();
  });

  it('rechaza country inválido', () => {
    const { error } = schema.validate({
      preferences: { country: 'NOT_A_COUNTRY' },
    });
    expect(error).toBeDefined();
  });

  it('rechaza regionCountry inválido', () => {
    const { error } = schema.validate({
      preferences: { regionCountry: 'ZZ' },
    });
    expect(error).toBeDefined();
  });
});

describe('isValidCountryPreference', () => {
  it('valida entradas admitidas', () => {
    expect(isValidCountryPreference('CL')).toBe(true);
    expect(isValidCountryPreference('')).toBe(true);
    expect(isValidCountryPreference('bogus')).toBe(false);
  });

  it('valida regionCountry', () => {
    expect(isValidRegionCountryPreference('AR')).toBe(true);
    expect(isValidRegionCountryPreference('ZZ')).toBe(false);
  });
});
