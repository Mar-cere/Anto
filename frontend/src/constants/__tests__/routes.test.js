/**
 * Tests unitarios para constantes de rutas de navegación
 *
 * @author AntoApp Team
 */

import { ROUTES } from '../routes';

describe('routes constants', () => {
  it('debe exportar ROUTES como objeto', () => {
    expect(ROUTES).toBeDefined();
    expect(typeof ROUTES).toBe('object');
    expect(Array.isArray(ROUTES)).toBe(false);
  });

  it('debe tener rutas de auth', () => {
    expect(ROUTES.SIGN_IN).toBe('SignIn');
    expect(ROUTES.REGISTER).toBe('Register');
    expect(ROUTES.RECOVER_PASSWORD).toBe('RecoverPassword');
    expect(ROUTES.VERIFY_CODE).toBe('VerifyCode');
    expect(ROUTES.VERIFY_EMAIL).toBe('VerifyEmail');
    expect(ROUTES.NEW_PASSWORD).toBe('NewPassword');
  });

  it('debe tener rutas de app principal', () => {
    expect(ROUTES.DASHBOARD).toBe('Dash');
    expect(ROUTES.MAIN_TABS).toBe('MainTabs');
    expect(ROUTES.CHAT).toBe('Chat');
    expect(ROUTES.PROFILE).toBe('Profile');
    expect(ROUTES.SETTINGS).toBe('Settings');
  });

  it('debe tener valores string no vacíos', () => {
    Object.values(ROUTES).forEach((value) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it('debe tener claves en MAYÚSCULAS con SNAKE_CASE', () => {
    Object.keys(ROUTES).forEach((key) => {
      expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
    });
  });
});
