/**
 * Tests unitarios para constantes del chat (ChatScreen y subcomponentes)
 *
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (d) => d.ios, isPad: false, isTVOS: false },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
}));

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
  MESSAGE_TYPES,
  MESSAGE_ROLES,
  MESSAGE_ID_PREFIXES,
  LAYOUT,
  CHAT_COLORS,
  ICON_SIZES,
  MODAL_WIDTH_REF,
  SCROLL_THRESHOLD,
} from '../chatScreenConstants';

describe('chatScreenConstants', () => {
  describe('TEXTS', () => {
    it('debe tener textos de bienvenida y placeholder', () => {
      expect(TEXTS.WELCOME).toBeDefined();
      expect(TEXTS.PLACEHOLDER).toBe('Escribe un mensaje...');
      expect(TEXTS.TITLE).toBe('Anto');
    });
    it('debe tener textos de error', () => {
      expect(TEXTS.ERROR_LOAD).toBeDefined();
      expect(TEXTS.ERROR_SEND).toBeDefined();
      expect(TEXTS.MODAL_TITLE).toBe('Borrar conversación');
      expect(TEXTS.CANCEL).toBe('Cancelar');
      expect(TEXTS.DELETE).toBe('Borrar');
    });
    it('debe tener texto de sugerencias', () => {
      expect(TEXTS.SUGGESTIONS_TITLE).toContain('Sugerencias');
    });
  });

  describe('STORAGE_KEYS', () => {
    it('debe tener claves de AsyncStorage', () => {
      expect(STORAGE_KEYS.CONVERSATION_ID).toBe('currentConversationId');
      expect(STORAGE_KEYS.TRIAL_BANNER_DISMISSED).toBe('trialBannerDismissed');
    });
  });

  describe('MESSAGE_TYPES y MESSAGE_ROLES', () => {
    it('debe definir tipos de mensaje', () => {
      expect(MESSAGE_TYPES.TEXT).toBe('text');
      expect(MESSAGE_TYPES.ERROR).toBe('error');
      expect(MESSAGE_TYPES.WELCOME).toBe('welcome');
    });
    it('debe definir roles', () => {
      expect(MESSAGE_ROLES.USER).toBe('user');
      expect(MESSAGE_ROLES.ASSISTANT).toBe('assistant');
    });
  });

  describe('MESSAGE_ID_PREFIXES', () => {
    it('debe tener prefijos para IDs', () => {
      expect(MESSAGE_ID_PREFIXES.WELCOME).toBe('welcome');
      expect(MESSAGE_ID_PREFIXES.TEMP).toBe('temp');
      expect(MESSAGE_ID_PREFIXES.ERROR).toBe('error');
      expect(MESSAGE_ID_PREFIXES.MESSAGE).toBe('msg');
    });
  });

  describe('LAYOUT', () => {
    it('debe tener constantes numéricas de layout', () => {
      expect(LAYOUT.HEADER_AVATAR_SIZE).toBe(30);
      expect(LAYOUT.MESSAGE_BUBBLE_PADDING).toBe(12);
      expect(LAYOUT.INPUT_MAX_HEIGHT).toBe(100);
      expect(LAYOUT.MAX_MESSAGE_LENGTH).toBe(500);
      expect(LAYOUT.FLATLIST_INITIAL_NUM_TO_RENDER).toBe(15);
    });
    it('debe tener constantes de FlatList', () => {
      expect(LAYOUT.FLATLIST_WINDOW_SIZE).toBe(10);
      expect(LAYOUT.FLATLIST_MAX_TO_RENDER_PER_BATCH).toBe(10);
    });
  });

  describe('SCROLL_THRESHOLD', () => {
    it('debe ser 100', () => {
      expect(SCROLL_THRESHOLD).toBe(100);
    });
  });

  describe('CHAT_COLORS', () => {
    it('debe tener colores para burbujas y UI', () => {
      expect(CHAT_COLORS.USER_BUBBLE).toBeDefined();
      expect(CHAT_COLORS.BOT_BUBBLE).toBe('#1D2B5F');
      expect(CHAT_COLORS.ACCENT).toBe('#A3B8E8');
      expect(CHAT_COLORS.ERROR).toBe('#FF6464');
    });
  });

  describe('ICON_SIZES', () => {
    it('debe tener tamaños de iconos', () => {
      expect(ICON_SIZES.BACK).toBe(24);
      expect(ICON_SIZES.MENU).toBe(20);
      expect(ICON_SIZES.SEND).toBe(20);
      expect(ICON_SIZES.SCROLL).toBe(24);
    });
  });

  describe('MODAL_WIDTH_REF', () => {
    it('debe ser un número (width de Dimensions)', () => {
      expect(typeof MODAL_WIDTH_REF).toBe('number');
      expect(MODAL_WIDTH_REF).toBe(390);
    });
  });
});
