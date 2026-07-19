/**
 * Constantes para ProfileScreen y subcomponentes
 */
import { useMemo } from 'react';
import { SPACING } from '../../constants/ui';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { lightColors } from '../../styles/themePalettes';

const G = SPACING.SCREEN_EDGE_INSET;

export const TEXTS = {
  LOADING: 'Cargando perfil...',
  ERROR_LOAD: 'Error',
  ERROR_LOAD_MESSAGE: 'No se pudieron cargar los datos del perfil',
  SUBSCRIPTION_STATUS_ERROR:
    'No se pudo actualizar el estado de la suscripción.',
  SUBSCRIPTION_STATUS_NETWORK_ERROR:
    'No se pudo conectar para actualizar la suscripción. Verifica tu internet.',
  SUBSCRIPTION_STATUS_TIMEOUT_ERROR:
    'La actualización de suscripción tardó demasiado. Intenta nuevamente.',
  SUBSCRIPTION_STATUS_RATE_LIMIT_ERROR:
    'Demasiados intentos al actualizar la suscripción. Espera un momento.',
  LOGOUT_TITLE: 'Cerrar Sesión',
  LOGOUT_MESSAGE: '¿Estás seguro que deseas cerrar sesión?',
  CANCEL: 'Cancelar',
  LOGOUT: 'Cerrar Sesión',
  ERROR_LOGOUT: 'Error',
  ERROR_LOGOUT_MESSAGE: 'No se pudo cerrar sesión. Por favor, intenta nuevamente.',
  PROFILE_TITLE: 'Mi Perfil',
  PROGRESS_TITLE: 'Progreso',
  PROGRESS_INTRO:
    'Patrones observacionales, tu resumen e intervenciones. No sustituyen orientación profesional.',
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
  SUMMARY_NAV: 'Tu resumen',
  SUMMARY_NAV_LABEL: 'Abrir resumen de actividad',
  WEEKLY_INSIGHT_NAV: 'Patrones de la semana',
  WEEKLY_INSIGHT_NAV_LABEL: 'Abrir informe semanal de patrones',
  INTERVENTION_GRAPH_NAV: 'Mapa de temas e intervenciones',
  INTERVENTION_GRAPH_NAV_LABEL: 'Abrir mapa de temas e intervenciones',
  LOGOUT_LABEL: 'Cerrar sesión',
  EMERGENCY_CONTACTS: 'Contactos de Emergencia',
  NO_CONTACTS: 'No hay contactos configurados',
  ADD_CONTACTS: 'Agregar contactos',
  EDIT_CONTACT: 'Editar contacto',
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
  /** #4 + #47: continuidad del hilo (no confundir con resumen semanal/mensual). */
  CHAT_CONTINUITY_TITLE: 'Continuidad del chat',
  CHAT_CONTINUITY_QUICK_BADGE: 'Vista rápida',
  CHAT_CONTINUITY_OPEN_CHAT: 'Abrir chat',
};

export function useProfileTexts() {
  const translated = useSectionTranslations('PROFILE');
  return useMemo(() => ({ ...TEXTS, ...(translated || {}) }), [translated]);
}

export const BACKGROUND_OPACITY = 0.1;
export const REFRESH_ANIMATION_DURATION = 300;
export const REFRESH_SCALE_MAX = 1.05;
export const REFRESH_OPACITY_MIN = 0.7;
export const SCROLL_PADDING_BOTTOM = SPACING.xxl;
export const HEADER_PADDING_HORIZONTAL = G;
export const HEADER_PADDING_VERTICAL = SPACING.CHIP_INSET;
export const HEADER_BUTTON_SIZE = 40;
export const HEADER_BUTTON_BORDER_RADIUS = 20;
export const HEADER_BORDER_WIDTH = 1;
export const PROFILE_SECTION_PADDING = G;
export const USER_NAME_MARGIN_BOTTOM = 4;
export const USER_EMAIL_MARGIN_BOTTOM = G;
export const STATS_CONTAINER_PADDING = G;
export const SECTION_TITLE_MARGIN_BOTTOM = G;
export const STAT_ITEM_WIDTH = 160;
export const STAT_ITEM_BORDER_RADIUS = 12;
export const STAT_ITEM_PADDING = G;
export const STAT_ITEM_MARGIN_RIGHT = 12;
export const STAT_ITEM_BORDER_WIDTH = 1;
export const STATS_GRID_PADDING_VERTICAL = SPACING.xs;
export const STAT_VALUE_MARGIN_VERTICAL = 8;
export const STAT_SUB_LABEL_MARGIN_TOP = 4;
export const OPTIONS_CONTAINER_PADDING = G;
export const OPTION_BUTTON_BORDER_RADIUS = 12;
export const OPTION_BUTTON_PADDING = G;
export const OPTION_BUTTON_MARGIN_BOTTOM = 12;
export const OPTION_BUTTON_BORDER_WIDTH = 1;
export const OPTION_TEXT_MARGIN_LEFT = G;
export const LOGOUT_BUTTON_BORDER_RADIUS = 12;
export const LOGOUT_BUTTON_PADDING = G;
export const LOGOUT_BUTTON_MARGIN = G;
export const LOGOUT_TEXT_MARGIN_LEFT = 8;
export const LOADING_TEXT_MARGIN_TOP = 10;
export const ICON_SIZE = 24;
export const STAT_ICON_SIZE = 24;

export function createProfileColors(colors) {
  return {
    BACKGROUND: colors.background,
    PRIMARY: colors.primary,
    WHITE: colors.white,
    /** Texto principal (encabezado cromado, títulos sobre fondo, tarjetas claras). */
    TEXT: colors.text,
    TEXT_SECONDARY: colors.textSecondary,
    TEXT_MUTED: colors.textMuted,
    ACCENT: colors.primaryBright ?? colors.primary,
    /** Icono hábitos: primary legible sobre tarjeta clara en tema light. */
    STAT_ICON_HABITS: colors.primary,
    /** Icono racha actual (fuego). */
    STAT_ICON_STREAK: colors.accentWarm,
    ERROR: colors.error,
    HEADER_BACKGROUND: colors.chromeHeader ?? colors.background,
    HEADER_BORDER: colors.chromeHeaderBorder ?? colors.border,
    HEADER_BUTTON_BACKGROUND: colors.chromeIconButton ?? colors.glassFill ?? colors.accentLineSoft,
    CARD_BACKGROUND: colors.chromeCard ?? colors.cardBackground ?? colors.surface,
    CARD_BORDER: colors.chromeCardBorder ?? colors.border,
    REFRESH_PROGRESS_BACKGROUND: colors.chromeCard ?? colors.cardBackground ?? colors.surface,
    LOGOUT_BUTTON_BACKGROUND: colors.dangerSoft,
    LOGOUT_BUTTON_BORDER: colors.dangerBorder,
    CONTACT_ACTION_EDIT_BACKGROUND: colors.accentLineSoft,
    CONTACT_ACTION_DELETE_BACKGROUND: colors.dangerSoft,
    /** Mismo rol que bloques de Configuración (`settingsSectionSurface`). */
    SETTINGS_SECTION_SURFACE: colors.settingsSectionSurface,
    GLASS_SHADOW: colors.glassShadow,
  };
}

/** Compatibilidad legacy (tests/archivos no migrados) */
export const COLORS = createProfileColors(lightColors);

export const DEFAULT_USER_DATA = {
  username: '',
  email: '',
  lastLogin: null,
  preferences: { theme: 'light', notifications: { enabled: true } },
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
