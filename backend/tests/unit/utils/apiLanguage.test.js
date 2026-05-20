import { normalizeApiLanguage, resolveRequestLanguage } from '../../../utils/apiLanguage.js';

describe('apiLanguage', () => {
  it('normaliza en y default es', () => {
    expect(normalizeApiLanguage('en')).toBe('en');
    expect(normalizeApiLanguage('fr')).toBe('es');
  });

  it('resuelve desde preferencia de usuario', () => {
    expect(
      resolveRequestLanguage({
        headers: {},
        user: { preferences: { language: 'en' } },
      }),
    ).toBe('en');
  });
});
