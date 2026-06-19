import { INSTAGRAM_URLS, resolveInstagramUrl } from '../socialLinks';

describe('socialLinks', () => {
  it('resolveInstagramUrl usa antoapp.es en español', () => {
    expect(resolveInstagramUrl('es')).toBe(INSTAGRAM_URLS.es);
    expect(INSTAGRAM_URLS.es).toContain('antoapp.es');
  });

  it('resolveInstagramUrl usa antoapp.en en inglés', () => {
    expect(resolveInstagramUrl('en')).toBe(INSTAGRAM_URLS.en);
    expect(INSTAGRAM_URLS.en).toContain('antoapp.en');
  });
});
