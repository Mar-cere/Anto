/**
 * Constantes para ProfileScreen y subcomponentes
 */
import { colors } from '../../styles/globalStyles';

export const TEXTS = {
  LOADING: 'Cargando perfil...',
  ERROR_LOAD: 'Error',
  ERROR_LOAD_MESSAGE: 'No se pudieron cargar los datos del perfil',
  LOGOUT_TITLE: 'Cerrar Sesión',
  LOGOUT_MESSAGE: '¿Estás seguro que deseas cerrar sesión?',
  CANCEL: 'Cancelar',
  LOGOUT: 'Cerrar Sesión',
  ERROR_LOGOUT: 'Error',
  ERROR_LOGOUT_MESSAGE: 'No se pudo cerrar sesión. Por favor, intenta nuevamente.',
  PROFILE_TITLE: 'Mi Perfil',
  STATS_TITLE: 'Estadísticas',
  TASKS_COMPLETED: 'Tareas Completadas',
  HABITS_ACTIVE: 'Hábitos Activos',
  CURRENT_STREAK: 'Racha Actual',
  THIS_WEEK: 'esta semana',
  COMPLETED_TODAY: 'completados hoy',
  BEST: 'Mejor',
  DAYS: 'días',
  EDIT_PROFILE: 'Editar Perfil',
  HELP: 'Ayuda',
  BACK: 'Volver',
  SETTINGS: 'Ir a configuración',
  EDIT_PROFILE_LABEL: 'Editar perfil',
  HELP_LABEL: 'Ayuda',
  LOGOUT_LABEL: 'Cerrar sesión',
  EMERGENCY_CONTACTS: 'Contactos de Emergencia',
  NO_CONTACTS: 'No hay contactos configurados',
  ADD_CONTACTS: 'Agregar contactos',
  DELETE_CONTACT: 'Eliminar contacto',
  DELETE_CONTACT_CONFIRM: '¿Estás seguro de que deseas eliminar este contacto?',
  CONTACT_DELETED: 'Contacto eliminado exitosamente',
  CONTACT_DELETE_ERROR: 'Error al eliminar contacto',
  CRISIS_DASHBOARD: 'Dashboard de Crisis',
  CRISIS_DASHBOARD_DESC: 'Ver métricas y estadísticas de crisis detectadas',
  ALERTS_HISTORY: 'Historial de Alertas',
  ALERTS_HISTORY_DESC: 'Ver historial, estadísticas y patrones de alertas enviadas',
  SUCCESS: 'Éxito',
  ERROR: 'Error',
  DELETE: 'Eliminar',
  LOADING_CONTACTS: 'Cargando...',
};

export const BACKGROUND_OPACITY = 0.1;
export const REFRESH_ANIMATION_DURATION = 300;
export const REFRESH_SCALE_MAX = 1.05;
export const REFRESH_OPACITY_MIN = 0.7;
export const SCROLL_PADDING_BOTTOM = 48;
export const HEADER_PADDING_HORIZONTAL = 16;
export const HEADER_PADDING_VERTICAL = 12;
export const HEADER_BUTTON_SIZE = 40;
export const HEADER_BUTTON_BORDER_RADIUS = 20;
export const HEADER_BORDER_WIDTH = 1;
export const PROFILE_SECTION_PADDING = 20;
export const USER_NAME_MARGIN_BOTTOM = 4;
export const USER_EMAIL_MARGIN_BOTTOM = 16;
export const STATS_CONTAINER_PADDING = 16;
export const SECTION_TITLE_MARGIN_BOTTOM = 16;
export const STAT_ITEM_WIDTH = 160;
export const STAT_ITEM_BORDER_RADIUS = 12;
export const STAT_ITEM_PADDING = 16;
export const STAT_ITEM_MARGIN_RIGHT = 12;
export const STAT_ITEM_BORDER_WIDTH = 1;
export const STATS_GRID_PADDING_VERTICAL = 4;
export const STAT_VALUE_MARGIN_VERTICAL = 8;
export const STAT_SUB_LABEL_MARGIN_TOP = 4;
export const OPTIONS_CONTAINER_PADDING = 16;
export const OPTION_BUTTON_BORDER_RADIUS = 12;
export const OPTION_BUTTON_PADDING = 16;
export const OPTION_BUTTON_MARGIN_BOTTOM = 12;
export const OPTION_BUTTON_BORDER_WIDTH = 1;
export const OPTION_TEXT_MARGIN_LEFT = 16;
export const LOGOUT_BUTTON_BORDER_RADIUS = 12;
export const LOGOUT_BUTTON_PADDING = 16;
export const LOGOUT_BUTTON_MARGIN = 16;
export const LOGOUT_TEXT_MARGIN_LEFT = 8;
export const LOADING_TEXT_MARGIN_TOP = 10;
export const ICON_SIZE = 24;
export const STAT_ICON_SIZE = 24;

export const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  GOLD: '#FFD700',
  ORANGE: '#FF9F1C',
  ERROR: '#FF6B6B',
  HEADER_BACKGROUND: 'rgba(3, 10, 36, 0.8)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  HEADER_BUTTON_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.1)',
  REFRESH_PROGRESS_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  LOGOUT_BUTTON_BACKGROUND: 'rgba(255, 107, 107, 0.1)',
  LOGOUT_BUTTON_BORDER: 'rgba(255, 107, 107, 0.3)',
};

export const DEFAULT_USER_DATA = {
  username: '',
  email: '',
  lastLogin: null,
  preferences: { theme: 'light', notifications: true },
  stats: { tasksCompleted: 0, habitsStreak: 0, lastActive: null },
};

export const DEFAULT_DETAILED_STATS = {
  totalTasks: 0,
  tasksCompleted: 0,
  tasksThisWeek: 0,
  habitsActive: 0,
  habitsCompleted: 0,
  totalHabits: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActive: null,
};

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  USER_PREFERENCES: 'userPreferences',
};

export const BACKGROUND_IMAGE = require('../../images/back.png');
