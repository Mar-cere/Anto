/**
 * Tests unitarios para constantes de la pantalla Configuración.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => jest.requireActual('../../../styles/globalStyles'));

import {
  TEXTS,
  STORAGE_KEYS,
  NAVIGATION_ROUTES,
  buildSettingsCOLORS,
  RESPONSE_STYLE_LABELS,
  RESPONSE_STYLE_PREVIEW,
  RESPONSE_STYLES,
  DEFAULT_RESPONSE_STYLE,
  normalizeResponseStyle,
  SCROLL_PADDING_BOTTOM,
  ICON_SIZE,
  MODAL_WIDTH,
} from '../settingsScreenConstants';
import { lightColors } from '../../../styles/themePalettes';

const COLORS = buildSettingsCOLORS(lightColors);

describe('settingsScreenConstants', () => {
  describe('TEXTS', () => {
    it('debe tener título y secciones', () => {
      expect(TEXTS.TITLE).toBe('Configuración');
      expect(TEXTS.SECTION_SYSTEM).toBe('Sistema');
      expect(TEXTS.SECTION_CHAT).toBe('Chat');
      expect(TEXTS.SECTION_ACCOUNT_AND_PLAN).toBe('Cuenta y suscripción');
      expect(TEXTS.ACCOUNT).toBe('Cuenta');
      expect(TEXTS.SUPPORT).toBe('Soporte');
      expect(TEXTS.ABOUT).toBe('Acerca de');
      expect(TEXTS.SECTION_SYSTEM_INTRO.length).toBeLessThan(40);
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
    it('debe tener subsecciones de Chat (estilo y tono)', () => {
      expect(TEXTS.CHAT_SUBSECTION_RESPONSE_STYLE).toBe('Estilo de respuesta');
      expect(TEXTS.CHAT_TONE_TITLE).toContain('Tono');
      expect(TEXTS.CHAT_CUSTOMIZATION_TITLE).toBe('Personalización del chat');
      expect(TEXTS.SECTION_CHAT_INTRO).toContain('Amplía');
      expect(TEXTS.RESPONSE_STYLE_A11Y_LABEL).toBeDefined();
    });
    it('debe tener textos de notificaciones detalladas', () => {
      expect(TEXTS.NOTIFICATIONS_TYPES_TITLE).toBe('Tipos');
      expect(TEXTS.NOTIFICATIONS_ADVANCED_TITLE).toBe('Avanzado');
      expect(TEXTS.NOTIFICATIONS_HINT_SCHEDULE).toContain('Diarios');
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
      expect(COLORS.ACCENT).toBe('#44D7FB');
      expect(COLORS.ERROR).toBe('#FF6B6B');
      expect(COLORS.SWITCH_DISABLED).toBe(lightColors.textSecondary);
    });
    it('debe tener estilos de modal e ítem', () => {
      expect(COLORS.ITEM_BACKGROUND).toBeDefined();
      expect(COLORS.ITEM_BORDER).toBeDefined();
      expect(COLORS.MODAL_BACKGROUND).toBeDefined();
      expect(COLORS.MODAL_BUTTON_CANCEL).toBeDefined();
      expect(COLORS.MODAL_BUTTON_DELETE).toBe(lightColors.dangerSoft);
    });
  });

  describe('RESPONSE_STYLE_LABELS', () => {
    it('debe tener etiqueta para cada estilo de respuesta', () => {
      expect(RESPONSE_STYLE_LABELS.brief).toBe('Breve');
      expect(RESPONSE_STYLE_LABELS.balanced).toBe('Equilibrado');
      expect(RESPONSE_STYLE_LABELS.deep).toBe('Profundo');
      expect(RESPONSE_STYLE_LABELS.empatico).toBe('Empático');
      expect(RESPONSE_STYLE_LABELS.estructurado).toBe('Estructurado');
    });
  });

  describe('RESPONSE_STYLE_PREVIEW', () => {
    it('tiene una vista previa por cada estilo del array', () => {
      RESPONSE_STYLES.forEach((key) => {
        expect(typeof RESPONSE_STYLE_PREVIEW[key]).toBe('string');
        expect(RESPONSE_STYLE_PREVIEW[key].length).toBeGreaterThan(4);
      });
    });
    it('cada estilo tiene etiqueta y preview definidos', () => {
      RESPONSE_STYLES.forEach((key) => {
        expect(RESPONSE_STYLE_LABELS[key]).toBeTruthy();
        expect(RESPONSE_STYLE_PREVIEW[key]).toBeTruthy();
      });
    });
  });

  describe('normalizeResponseStyle', () => {
    it('devuelve la clave cuando es válida', () => {
      expect(normalizeResponseStyle('brief')).toBe('brief');
      expect(normalizeResponseStyle('balanced')).toBe('balanced');
    });
    it('recorta espacios en claves válidas', () => {
      expect(normalizeResponseStyle('  deep  ')).toBe('deep');
    });
    it('usa DEFAULT_RESPONSE_STYLE ante valores inválidos', () => {
      expect(normalizeResponseStyle('')).toBe(DEFAULT_RESPONSE_STYLE);
      expect(normalizeResponseStyle(null)).toBe(DEFAULT_RESPONSE_STYLE);
      expect(normalizeResponseStyle('legacy-unknown')).toBe(
        DEFAULT_RESPONSE_STYLE,
      );
      expect(normalizeResponseStyle(123)).toBe(DEFAULT_RESPONSE_STYLE);
    });
    it('mapea estilos legados a los canónicos', () => {
      expect(normalizeResponseStyle('calido')).toBe('empatico');
      expect(normalizeResponseStyle('profesional')).toBe('estructurado');
      expect(normalizeResponseStyle('directo')).toBe('brief');
    });
  });

  describe('RESPONSE_STYLES', () => {
    it('debe ser array de 5 estilos canónicos', () => {
      expect(Array.isArray(RESPONSE_STYLES)).toBe(true);
      expect(RESPONSE_STYLES).toHaveLength(5);
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
