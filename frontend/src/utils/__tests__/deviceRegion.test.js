import { inferDeviceRegionCountry } from '../deviceRegion';

jest.mock('../appLanguage', () => ({
  getDeviceLocaleCandidates: () => ['es-CL', 'en-US'],
}));

describe('deviceRegion', () => {
  it('infiere ISO desde candidatos de locale', () => {
    expect(inferDeviceRegionCountry()).toBe('CL');
  });
});
