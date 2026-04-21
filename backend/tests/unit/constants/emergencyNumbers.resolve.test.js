import { describe, expect, it } from '@jest/globals';
import {
  formatEmergencyNumbers,
  formatRegionalEmergencyFallbackEs,
  resolveEmergencyInfoFromPreferences
} from '../../../constants/emergencyNumbers.js';

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
});

describe('formatEmergencyNumbers', () => {
  it('sin país: texto España + Latinoamérica, sin 988 USA', () => {
    const text = formatEmergencyNumbers(null);
    expect(text).toBe(formatRegionalEmergencyFallbackEs());
    expect(text).not.toMatch(/988/);
    expect(text).toMatch(/España/);
    expect(text).toMatch(/Latinoamérica/);
    expect(text).toMatch(/112/);
    expect(text).toMatch(/024/);
  });
});
