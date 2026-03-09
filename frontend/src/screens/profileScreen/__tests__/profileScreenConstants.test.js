/**
 * Tests unitarios para constantes de la pantalla Perfil.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({
  colors: { background: '#0a0', primary: '#1dd', white: '#fff' },
}));

import {
  TEXTS,
  BACKGROUND_OPACITY,
  REFRESH_ANIMATION_DURATION,
  REFRESH_SCALE_MAX,
  REFRESH_OPACITY_MIN,
  SCROLL_PADDING_BOTTOM,
  COLORS,
  DEFAULT_USER_DATA,
  DEFAULT_DETAILED_STATS,
  STORAGE_KEYS,
} from '../profileScreenConstants';

describe('profileScreenConstants', () => {
  describe('TEXTS', () => {
    it('debe tener textos de carga y error', () => {
      expect(TEXTS.LOADING).toBe('Cargando perfil...');
      expect(TEXTS.ERROR_LOAD).toBe('Error');
      expect(TEXTS.ERROR_LOAD_MESSAGE).toBeDefined();
    });
    it('debe tener textos de logout', () => {
      expect(TEXTS.LOGOUT_TITLE).toBe('Cerrar Sesión');
      expect(TEXTS.LOGOUT_MESSAGE).toBeDefined();
      expect(TEXTS.CANCEL).toBe('Cancelar');
      expect(TEXTS.LOGOUT).toBe('Cerrar Sesión');
      expect(TEXTS.ERROR_LOGOUT).toBe('Error');
      expect(TEXTS.ERROR_LOGOUT_MESSAGE).toBeDefined();
    });
    it('debe tener título y secciones', () => {
      expect(TEXTS.PROFILE_TITLE).toBe('Mi Perfil');
      expect(TEXTS.STATS_TITLE).toBe('Estadísticas');
      expect(TEXTS.EDIT_PROFILE).toBe('Editar Perfil');
      expect(TEXTS.HELP).toBe('Ayuda');
      expect(TEXTS.SETTINGS).toBeDefined();
    });
    it('debe tener textos de contactos de emergencia', () => {
      expect(TEXTS.EMERGENCY_CONTACTS).toBe('Contactos de Emergencia');
      expect(TEXTS.NO_CONTACTS).toBeDefined();
      expect(TEXTS.DELETE_CONTACT).toBe('Eliminar contacto');
      expect(TEXTS.DELETE_CONTACT_CONFIRM).toBeDefined();
      expect(TEXTS.CONTACT_DELETED).toBeDefined();
      expect(TEXTS.CONTACT_DELETE_ERROR).toBeDefined();
    });
  });

  describe('constantes numéricas', () => {
    it('debe tener BACKGROUND_OPACITY y duración de animación', () => {
      expect(BACKGROUND_OPACITY).toBe(0.1);
      expect(REFRESH_ANIMATION_DURATION).toBe(300);
    });
    it('debe tener REFRESH_SCALE_MAX y REFRESH_OPACITY_MIN', () => {
      expect(REFRESH_SCALE_MAX).toBe(1.05);
      expect(REFRESH_OPACITY_MIN).toBe(0.7);
    });
    it('debe tener SCROLL_PADDING_BOTTOM', () => {
      expect(typeof SCROLL_PADDING_BOTTOM).toBe('number');
      expect(SCROLL_PADDING_BOTTOM).toBe(48);
    });
  });

  describe('COLORS', () => {
    it('debe tener BACKGROUND, PRIMARY, WHITE', () => {
      expect(COLORS.BACKGROUND).toBe('#0a0');
      expect(COLORS.PRIMARY).toBe('#1dd');
      expect(COLORS.WHITE).toBe('#fff');
    });
    it('debe tener colores de acento y error', () => {
      expect(COLORS.ACCENT).toBeDefined();
      expect(COLORS.ERROR).toBeDefined();
      expect(COLORS.HEADER_BACKGROUND).toBeDefined();
      expect(COLORS.LOGOUT_BUTTON_BACKGROUND).toBeDefined();
    });
  });

  describe('DEFAULT_USER_DATA', () => {
    it('debe tener username, email, lastLogin, preferences, stats', () => {
      expect(DEFAULT_USER_DATA).toHaveProperty('username', '');
      expect(DEFAULT_USER_DATA).toHaveProperty('email', '');
      expect(DEFAULT_USER_DATA).toHaveProperty('lastLogin', null);
      expect(DEFAULT_USER_DATA.preferences).toMatchObject({
        theme: 'light',
        notifications: true,
      });
      expect(DEFAULT_USER_DATA.stats).toHaveProperty('tasksCompleted', 0);
      expect(DEFAULT_USER_DATA.stats).toHaveProperty('habitsStreak', 0);
      expect(DEFAULT_USER_DATA.stats).toHaveProperty('lastActive', null);
    });
  });

  describe('DEFAULT_DETAILED_STATS', () => {
    it('debe tener totalTasks, tasksCompleted, habitsActive, streaks', () => {
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('totalTasks', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('tasksCompleted', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('tasksThisWeek', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('habitsActive', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('habitsCompleted', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('totalHabits', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('currentStreak', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('bestStreak', 0);
      expect(DEFAULT_DETAILED_STATS).toHaveProperty('lastActive', null);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('debe tener USER_TOKEN, USER_DATA, USER_PREFERENCES', () => {
      expect(STORAGE_KEYS.USER_TOKEN).toBe('userToken');
      expect(STORAGE_KEYS.USER_DATA).toBe('userData');
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe('userPreferences');
    });
  });
});
