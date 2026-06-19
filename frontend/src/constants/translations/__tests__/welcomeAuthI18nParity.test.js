import en from '../en';
import es from '../es';

const HOME_WELCOME_KEYS = [
  'BRAND_PREFIX',
  'BRAND_NAME',
  'BADGE',
  'HEADLINE_PREFIX',
  'HEADLINE_ACCENT',
  'SUBTITLE',
  'START_FREE',
  'ALREADY_HAVE_ACCOUNT',
  'START_FREE_HINT',
  'SIGN_IN_HINT',
  'FAQ',
];

describe('welcomeAuth i18n parity', () => {
  it('HOME incluye claves de bienvenida rediseñada en ES y EN', () => {
    HOME_WELCOME_KEYS.forEach((key) => {
      expect(es.HOME[key]).toBeTruthy();
      expect(en.HOME[key]).toBeTruthy();
    });
  });

  it('HOME no conserva claves legacy de chat de emergencia', () => {
    expect(es.HOME.EMERGENCY_CHAT_ENTRY).toBeUndefined();
    expect(en.HOME.EMERGENCY_CHAT_ENTRY).toBeUndefined();
    expect(es.HOME.CONTINUE_WITHOUT_ACCOUNT).toBeUndefined();
    expect(en.HOME.CONTINUE_WITHOUT_ACCOUNT).toBeUndefined();
  });

  it('copy de bienvenida mantiene tono de apoyo sin diagnóstico', () => {
    expect(es.HOME.SUBTITLE).toMatch(/profesional/i);
    expect(es.HOME.HEADLINE_ACCENT).not.toMatch(/diagnóstico/i);
    expect(en.HOME.SUBTITLE).toMatch(/professional/i);
  });
});
