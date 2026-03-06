/**
 * Tests unitarios para constantes de la pantalla Configuración.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({
  colors: {
    background: '#030A24',
    primary: '#1ADDDB',
    white: '#FFFFFF',
  },
}));

import {
  TEXTS,
  STORAGE_KEYS,
  NAVIGATION_ROUTES,
  COLORS,
  RESPONSE_STYLE_LABELS,
  RESPONSE_STYLES,
  SCROLL_PADDING_BOTTOM,
  ICON_SIZE,
  MODAL_WIDTH,
} from '../settingsScreenConstants';

describe('settingsScreenConstants', () => {
  describe('TEXTS', () => {
    it('debe tener título y secciones', () => {
      expect(TEXTS.TITLE).toBe('Configuración');
      expect(TEXTS.PREFERENCES).toBe('Preferencias');
      expect(TEXTS.ACCOUNT).toBe('Cuenta');
      expect(TEXTS.SUPPORT).toBe('Soporte');
      expect(TEXTS.ABOUT).toBe('Acerca de');
    });
    it('debe tener textos de cuenta y modales', () => {
      expect(TEXTS.CHANGE_PASSWORD).toBeDefined();
      expect(TEXTS.LOGOUT).toBe('Cerrar sesión');
      expect(TEXTS.DELETE_ACCOUNT).toBe('Eliminar cuenta');
      expect(TEXTS.LOGOUT_TITLE).toBeDefined();
      expect(TEXTS.LOGOUT_MESSAGE).toContain('cerrar sesión');
      expect(TEXTS.DELETE_TITLE).toBeDefined();
      expect(TEXTS.DELETE_MESSAGE).toContain('no se puede deshacer');
    });
    it('debe tener CANCEL, CONFIRM, DELETE, ERROR', () => {
      expect(TEXTS.CANCEL).toBe('Cancelar');
      expect(TEXTS.CONFIRM).toBe('Confirmar');
      expect(TEXTS.DELETE).toBe('Eliminar');
      expect(TEXTS.ERROR).toBe('Error');
    });
    it('debe tener textos de suscripción e historial', () => {
      expect(TEXTS.SUBSCRIPTION).toBeDefined();
      expect(TEXTS.TRANSACTION_HISTORY).toBeDefined();
    });
  });

  describe('STORAGE_KEYS', () => {
    it('debe tener NOTIFICATIONS', () => {
      expect(STORAGE_KEYS.NOTIFICATIONS).toBe('notifications');
    });
  });

  describe('NAVIGATION_ROUTES', () => {
    it('debe tener rutas de auth y pantallas', () => {
      expect(NAVIGATION_ROUTES.SIGN_IN).toBe('SignIn');
      expect(NAVIGATION_ROUTES.CHANGE_PASSWORD).toBe('ChangePassword');
      expect(NAVIGATION_ROUTES.FAQ).toBe('FAQ');
      expect(NAVIGATION_ROUTES.ABOUT).toBe('About');
    });
  });

  describe('COLORS', () => {
    it('debe tener BACKGROUND, PRIMARY, WHITE, ACCENT, ERROR', () => {
      expect(COLORS.BACKGROUND).toBeDefined();
      expect(COLORS.PRIMARY).toBeDefined();
      expect(COLORS.WHITE).toBeDefined();
      expect(COLORS.ACCENT).toBe('#A3B8E8');
      expect(COLORS.ERROR).toBe('#FF6B6B');
    });
    it('debe tener estilos de modal e ítem', () => {
      expect(COLORS.ITEM_BACKGROUND).toBeDefined();
      expect(COLORS.ITEM_BORDER).toBeDefined();
      expect(COLORS.MODAL_BACKGROUND).toBeDefined();
      expect(COLORS.MODAL_BUTTON_CANCEL).toBeDefined();
      expect(COLORS.MODAL_BUTTON_DELETE).toBeDefined();
    });
  });

  describe('RESPONSE_STYLE_LABELS', () => {
    it('debe tener etiqueta para cada estilo de respuesta', () => {
      expect(RESPONSE_STYLE_LABELS.brief).toBe('Breve');
      expect(RESPONSE_STYLE_LABELS.balanced).toBe('Equilibrado');
      expect(RESPONSE_STYLE_LABELS.deep).toBe('Profundo');
      expect(RESPONSE_STYLE_LABELS.empatico).toBe('Empático');
      expect(RESPONSE_STYLE_LABELS.profesional).toBe('Profesional');
      expect(RESPONSE_STYLE_LABELS.directo).toBe('Directo');
      expect(RESPONSE_STYLE_LABELS.calido).toBe('Cálido');
      expect(RESPONSE_STYLE_LABELS.estructurado).toBe('Estructurado');
    });
  });

  describe('RESPONSE_STYLES', () => {
    it('debe ser array de 8 estilos', () => {
      expect(Array.isArray(RESPONSE_STYLES)).toBe(true);
      expect(RESPONSE_STYLES).toHaveLength(8);
      expect(RESPONSE_STYLES).toContain('brief');
      expect(RESPONSE_STYLES).toContain('balanced');
      expect(RESPONSE_STYLES).toContain('estructurado');
    });
  });

  describe('layout constants', () => {
    it('SCROLL_PADDING_BOTTOM debe ser número', () => {
      expect(typeof SCROLL_PADDING_BOTTOM).toBe('number');
      expect(SCROLL_PADDING_BOTTOM).toBe(32);
    });
    it('ICON_SIZE debe ser 24', () => {
      expect(ICON_SIZE).toBe(24);
    });
    it('MODAL_WIDTH debe ser string', () => {
      expect(MODAL_WIDTH).toBe('80%');
    });
  });
});
