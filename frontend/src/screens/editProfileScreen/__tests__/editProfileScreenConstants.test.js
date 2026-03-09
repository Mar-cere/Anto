/**
 * Tests unitarios para constantes de EditProfileScreen
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({
  colors: {
    background: '#030A24',
    primary: '#1ADDDB',
    white: '#FFFFFF',
  },
}));

// Evitar require de imagen en tests
jest.mock('../../../images/back.png', () => ({}), { virtual: true });

import {
  TEXTS,
  MIN_NAME_LENGTH,
  EMAIL_REGEX,
  STORAGE_KEYS,
  DEFAULT_FORM_DATA,
  COLORS,
  FADE_ANIMATION_DURATION,
  SAVE_SUCCESS_DELAY,
  ICON_SIZE,
} from '../editProfileScreenConstants';

describe('editProfileScreenConstants', () => {
  describe('TEXTS', () => {
    it('debe tener textos de carga y error', () => {
      expect(TEXTS.LOADING).toBe('Cargando perfil...');
      expect(TEXTS.ERROR).toBe('Error');
      expect(TEXTS.ERROR_DEFAULT).toBeDefined();
      expect(TEXTS.ERROR_NETWORK).toContain('conexión');
      expect(TEXTS.RETRY).toBe('Reintentar');
      expect(TEXTS.OK).toBe('OK');
    });
    it('debe tener textos de validación y perfil', () => {
      expect(TEXTS.VALIDATION_ERRORS).toBe('Errores de validación');
      expect(TEXTS.SUCCESS).toBe('Éxito');
      expect(TEXTS.PROFILE_UPDATED).toContain('actualizado');
      expect(TEXTS.PROFILE_TITLE).toBe('Mi Perfil');
      expect(TEXTS.SAVE_CHANGES).toBe('Guardar cambios');
      expect(TEXTS.EDIT_PROFILE).toBe('Editar perfil');
      expect(TEXTS.PERSONAL_INFO).toBe('Información Personal');
      expect(TEXTS.NAME).toBe('Nombre');
      expect(TEXTS.USERNAME).toBe('Nombre de Usuario');
      expect(TEXTS.EMAIL).toBe('Correo Electrónico');
      expect(TEXTS.SAVED).toBe('¡Guardado!');
    });
    it('debe tener textos de cambios sin guardar y sesión', () => {
      expect(TEXTS.UNSAVED_CHANGES).toBe('Cambios sin guardar');
      expect(TEXTS.UNSAVED_CHANGES_MESSAGE).toContain('descartar');
      expect(TEXTS.CANCEL).toBe('Cancelar');
      expect(TEXTS.DISCARD).toBe('Descartar');
      expect(TEXTS.SESSION_EXPIRED).toBe('Sesión Expirada');
      expect(TEXTS.NAME_MIN_LENGTH).toContain('3 caracteres');
      expect(TEXTS.EMAIL_REQUIRED).toBeDefined();
      expect(TEXTS.EMAIL_INVALID).toBeDefined();
    });
  });

  describe('validación', () => {
    it('MIN_NAME_LENGTH debe ser 3', () => {
      expect(MIN_NAME_LENGTH).toBe(3);
    });
    it('EMAIL_REGEX debe validar emails correctos', () => {
      expect(EMAIL_REGEX.test('a@b.co')).toBe(true);
      expect(EMAIL_REGEX.test('user@domain.com')).toBe(true);
      expect(EMAIL_REGEX.test('invalid')).toBe(false);
      expect(EMAIL_REGEX.test('@domain.com')).toBe(false);
      expect(EMAIL_REGEX.test('user@')).toBe(false);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('debe tener USER_TOKEN y USER_DATA', () => {
      expect(STORAGE_KEYS.USER_TOKEN).toBe('userToken');
      expect(STORAGE_KEYS.USER_DATA).toBe('userData');
    });
  });

  describe('DEFAULT_FORM_DATA', () => {
    it('debe tener name, username, email vacíos', () => {
      expect(DEFAULT_FORM_DATA).toEqual({
        name: '',
        username: '',
        email: '',
      });
    });
  });

  describe('COLORS', () => {
    it('debe tener colores principales y de estado', () => {
      expect(COLORS.BACKGROUND).toBeDefined();
      expect(COLORS.PRIMARY).toBeDefined();
      expect(COLORS.WHITE).toBeDefined();
      expect(COLORS.ACCENT).toBe('#A3B8E8');
      expect(COLORS.ERROR).toBe('#FF6B6B');
      expect(COLORS.SUCCESS).toBe('#4CAF50');
      expect(COLORS.HEADER_BACKGROUND).toBeDefined();
      expect(COLORS.INPUT_BACKGROUND).toBe('#1D2B5F');
    });
  });

  describe('layout / animación', () => {
    it('FADE_ANIMATION_DURATION y SAVE_SUCCESS_DELAY son números', () => {
      expect(FADE_ANIMATION_DURATION).toBe(500);
      expect(SAVE_SUCCESS_DELAY).toBe(2000);
    });
    it('ICON_SIZE es 24', () => {
      expect(ICON_SIZE).toBe(24);
    });
  });
});
