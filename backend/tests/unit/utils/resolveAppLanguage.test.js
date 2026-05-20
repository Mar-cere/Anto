import { describe, expect, it } from '@jest/globals';
import { resolveAppLanguage } from '../../../utils/resolveAppLanguage.js';

describe('resolveAppLanguage', () => {
  it('prioriza header X-App-Language sobre preferencias', () => {
    expect(
      resolveAppLanguage({
        headerLanguage: 'en',
        preferenceLanguage: 'es',
      }),
    ).toBe('en');
  });

  it('usa preferencia cuando no hay header', () => {
    expect(
      resolveAppLanguage({
        preferenceLanguage: 'en',
      }),
    ).toBe('en');
  });

  it('usa query language como fallback intermedio', () => {
    expect(
      resolveAppLanguage({
        queryLanguage: 'en',
        preferenceLanguage: 'es',
      }),
    ).toBe('en');
  });

  it('usa accept-language en inglés como último fallback', () => {
    expect(
      resolveAppLanguage({
        acceptLanguage: 'en-US,en;q=0.9',
      }),
    ).toBe('en');
  });

  it('default es español sin señales de idioma', () => {
    expect(resolveAppLanguage({})).toBe('es');
  });

  it('accept-language no español cae en inglés', () => {
    expect(
      resolveAppLanguage({
        acceptLanguage: 'pt-BR,pt;q=0.9',
      }),
    ).toBe('en');
    expect(
      resolveAppLanguage({
        acceptLanguage: 'ja-JP',
      }),
    ).toBe('en');
  });
});
