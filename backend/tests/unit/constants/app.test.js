/**
 * Tests unitarios para constantes de la aplicación
 * 
 * @author AntoApp Team
 */

import { APP_NAME, APP_NAME_FULL, LOGO_URL, EMAIL_FROM_NAME, NOTIFICATION_ICON_URL } from '../../../constants/app.js';

describe('App Constants', () => {
  it('debe exportar APP_NAME', () => {
    expect(APP_NAME).toBe('Anto');
  });

  it('debe exportar APP_NAME_FULL', () => {
    expect(APP_NAME_FULL).toBe('AntoApp');
  });

  it('debe exportar LOGO_URL', () => {
    expect(LOGO_URL).toBeDefined();
    expect(typeof LOGO_URL).toBe('string');
    expect(LOGO_URL.length).toBeGreaterThan(0);
  });

  it('debe exportar EMAIL_FROM_NAME', () => {
    expect(EMAIL_FROM_NAME).toBe('Anto');
  });

  it('debe exportar NOTIFICATION_ICON_URL', () => {
    expect(NOTIFICATION_ICON_URL).toBeDefined();
    expect(typeof NOTIFICATION_ICON_URL).toBe('string');
  });

  it('debe usar LOGO_URL como fallback para NOTIFICATION_ICON_URL si no está configurado', () => {
    // NOTIFICATION_ICON_URL debe estar definido (usa LOGO_URL como fallback)
    expect(NOTIFICATION_ICON_URL).toBeDefined();
    expect(typeof NOTIFICATION_ICON_URL).toBe('string');
    // Si no hay variable de entorno, debe ser igual a LOGO_URL
    if (!process.env.NOTIFICATION_ICON_URL) {
      expect(NOTIFICATION_ICON_URL).toBe(LOGO_URL);
    }
  });
});

