import { describe, expect, it } from '@jest/globals';
import {
  formatEmergencyNumbers,
  formatRegionalEmergencyFallbackEs,
  getEmergencyInfoByIso,
  getEmergencyLines,
  resolveCrisisEmergencySource,
  resolveEmergencyInfoFromPreferences,
} from '../../../constants/emergencyNumbers.js';
import { generateCrisisMessage } from '../../../constants/crisis.js';

describe('resolveEmergencyInfoFromPreferences', () => {
  it('resuelve por ISO alpha-2', () => {
    const info = resolveEmergencyInfoFromPreferences({ country: 'CL' });
    expect(info?.countryCode).toBe('CL');
    expect(info?.emergency).toBe('133');
  });

  it('resuelve por prefijo telefónico numérico', () => {
    const info = resolveEmergencyInfoFromPreferences({ country: '54' });
    expect(info?.countryCode).toBe('AR');
  });

  it('resuelve por regionCountry del dispositivo', () => {
    const info = resolveEmergencyInfoFromPreferences({ regionCountry: 'PE' });
    expect(info?.countryCode).toBe('PE');
    expect(info?.suicidePrevention).toBe('0800 10828');
  });

  it('resuelve por timezone cuando no hay país explícito', () => {
    const info = resolveEmergencyInfoFromPreferences({
      timezone: 'America/Bogota',
    });
    expect(info?.countryCode).toBe('CO');
  });

  it('desambigua +1 con regionCountry CA', () => {
    const info = resolveEmergencyInfoFromPreferences(
      { regionCountry: 'CA' },
      '+14165551234',
    );
    expect(info?.countryCode).toBe('CA');
    expect(info?.suicidePrevention).toBe('988');
  });
});

describe('getEmergencyLines', () => {
  it('resuelve legacy CHILE desde catálogo unificado', () => {
    const lines = getEmergencyLines('CHILE');
    expect(lines.EMERGENCY).toBe('133');
    expect(lines.SUICIDE_PREVENTION).toBe('*4141');
  });

  it('resuelve desde preferencias con regionCountry', () => {
    const lines = getEmergencyLines({ preferences: { regionCountry: 'PE' } });
    expect(lines.EMERGENCY).toBe('911');
    expect(lines.SUICIDE_PREVENTION).toBe('0800 10828');
  });

  it('GENERAL devuelve orientación regional', () => {
    const lines = getEmergencyLines('GENERAL');
    expect(lines.EMERGENCY).toMatch(/112/);
    expect(lines.SUICIDE_PREVENTION).toMatch(/024/);
  });
});

describe('resolveCrisisEmergencySource', () => {
  it('prioriza preferences sobre country legacy', () => {
    expect(
      resolveCrisisEmergencySource({
        country: 'GENERAL',
        preferences: { regionCountry: 'CL' },
      }),
    ).toEqual({ preferences: { regionCountry: 'CL' }, phone: null });
  });
});

describe('getEmergencyInfoByIso', () => {
  it('incluye países solo-ISO como Canadá', () => {
    const info = getEmergencyInfoByIso('CA');
    expect(info?.countryCode).toBe('CA');
    expect(info?.emergency).toBe('911');
  });

  it('incluye Reino Unido', () => {
    const info = getEmergencyInfoByIso('GB');
    expect(info?.emergency).toBe('999');
    expect(info?.suicidePrevention).toBe('116 123');
  });
});

describe('formatEmergencyNumbers', () => {
  it('sin país: texto España + Latinoamérica con ejemplos regionales', () => {
    const text = formatEmergencyNumbers(null);
    expect(text).toBe(formatRegionalEmergencyFallbackEs());
    expect(text).toMatch(/España/);
    expect(text).toMatch(/Latinoamérica/);
    expect(text).toMatch(/112/);
    expect(text).toMatch(/024/);
  });
});

describe('generateCrisisMessage unificado', () => {
  it('usa números de Chile vía preferencias', () => {
    const msg = generateCrisisMessage('HIGH', {
      preferences: { regionCountry: 'CL' },
    });
    expect(msg).toContain('133');
    expect(msg).toContain('*4141');
  });
});
