import { describe, it, expect } from '@jest/globals';
import {
  emailDateLocale,
  normalizeEmailLanguage,
  resolveUserEmailLanguage,
} from '../../../utils/emailLanguage.js';

describe('normalizeEmailLanguage', () => {
  it('acepta en y normaliza variantes', () => {
    expect(normalizeEmailLanguage('en')).toBe('en');
    expect(normalizeEmailLanguage('EN')).toBe('en');
    expect(normalizeEmailLanguage('en-US')).toBe('en');
  });

  it('cualquier otro valor cae en es', () => {
    expect(normalizeEmailLanguage('es')).toBe('es');
    expect(normalizeEmailLanguage('fr')).toBe('es');
    expect(normalizeEmailLanguage(undefined)).toBe('es');
  });
});

describe('resolveUserEmailLanguage', () => {
  it('prioriza preferences.language del usuario', () => {
    expect(resolveUserEmailLanguage({ preferences: { language: 'en' } }, 'es')).toBe('en');
    expect(resolveUserEmailLanguage({ preferences: { language: 'es' } }, 'en')).toBe('es');
  });

  it('usa fallback cuando no hay preferencia', () => {
    expect(resolveUserEmailLanguage({}, 'en')).toBe('en');
    expect(resolveUserEmailLanguage(null, 'es')).toBe('es');
  });
});

describe('emailDateLocale', () => {
  it('devuelve locale según idioma de correo', () => {
    expect(emailDateLocale('en')).toBe('en-US');
    expect(emailDateLocale('es')).toBe('es-CL');
  });
});
