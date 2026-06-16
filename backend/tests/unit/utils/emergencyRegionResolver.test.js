import { describe, expect, it } from '@jest/globals';
import {
  inferIsoCountryFromDeviceSignals,
  inferIsoCountryFromLocale,
  inferIsoCountryFromTimezone,
} from '../../../utils/emergencyRegionResolver.js';

describe('emergencyRegionResolver', () => {
  it('infiere ISO desde locale es-CL', () => {
    expect(inferIsoCountryFromLocale('es-CL')).toBe('CL');
    expect(inferIsoCountryFromLocale('es_CL')).toBe('CL');
  });

  it('infiere ISO desde locale en-GB', () => {
    expect(inferIsoCountryFromLocale('en-GB')).toBe('GB');
  });

  it('infiere ISO desde timezone America/Santiago', () => {
    expect(inferIsoCountryFromTimezone('America/Santiago')).toBe('CL');
  });

  it('prioriza regionCountry sobre timezone en señales de dispositivo', () => {
    expect(
      inferIsoCountryFromDeviceSignals({
        regionCountry: 'MX',
        timezone: 'America/Santiago',
      }),
    ).toBe('MX');
  });

  it('usa timezone si no hay regionCountry', () => {
    expect(
      inferIsoCountryFromDeviceSignals({
        timezone: 'Europe/Madrid',
      }),
    ).toBe('ES');
  });
});
