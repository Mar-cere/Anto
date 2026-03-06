/**
 * Constantes de la pantalla de hábitos (HabitsScreen y subcomponentes).
 * @author AntoApp Team
 */

import { StatusBar } from 'react-native';
import { colors } from '../../styles/globalStyles';

// Animación
export const SWIPE_THRESHOLD = -3;
export const SWIPE_ANIMATION_DURATION = 200;
export const DELETE_ANIMATION_DURATION = 300;
export const SWIPE_DISTANCE = -130;
export const DELETE_DISTANCE = -400;
export const PROGRESS_MAX_DISTANCE = 100;
export const ANIMATION_FINAL_OPACITY = 1;
export const ANIMATION_INITIAL_OPACITY = 0;

// Gestos
export const ACTIVE_OFFSET_X = [-3, 0];
export const ACTIVE_OFFSET_Y = [-100, 100];
export const DELAY_PRESS_IN = 300;
export const DELAY_COMPLETE_PRESS_IN = 500;
export const HIT_SLOP_SIZE = 10;
export const ACTIVE_OPACITY = 0.7;

// FlatList
export const FLATLIST_INITIAL_NUM_TO_RENDER = 10;
export const FLATLIST_WINDOW_SIZE = 10;
export const FLATLIST_MAX_TO_RENDER_PER_BATCH = 10;

export const FILTER_TYPES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export const FREQUENCY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
};

export const TEXTS = {
  TITLE: 'Mis Hábitos',
  ACTIVE: 'Activos',
  ARCHIVED: 'Archivados',
  DELETE_CONFIRM_TITLE: 'Confirmar eliminación',
  DELETE_CONFIRM_MESSAGE: '¿Estás seguro de que deseas eliminar este hábito? Esta acción no se puede deshacer.',
  CANCEL: 'Cancelar',
  DELETE: 'Eliminar',
  ARCHIVE: 'archivar',
  UNARCHIVE: 'desarchivar',
  ARCHIVE_CONFIRM: 'Confirmar archivar',
  UNARCHIVE_CONFIRM: 'Confirmar desarchivar',
  PROGRESS_HINT: 'Desliza para acciones',
  STREAK: 'Racha:',
  BEST_STREAK: 'Mejor:',
  DAYS: 'días',
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  ERROR_LOAD: 'Error al cargar hábitos',
  RETRY: 'Reintentar',
  EMPTY_ACTIVE: 'No hay hábitos activos',
  EMPTY_ARCHIVED: 'No hay hábitos archivados',
  EMPTY_ACTIVE_SUBTITLE: 'Tu primer hábito es el primer paso',
  CREATE_FIRST: 'Crear primer hábito',
  SESSION_EXPIRED: 'Sesión expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesión nuevamente',
  ERROR_CREATE: 'Error',
  ERROR_UPDATE: 'Error',
  ERROR_DELETE: 'Error',
  ERROR_ARCHIVE: 'Error',
  ERROR_CREATE_MESSAGE: 'No se pudo crear el hábito',
  ERROR_UPDATE_MESSAGE: 'No se pudo actualizar el hábito',
  ERROR_DELETE_MESSAGE: 'No se pudo eliminar el hábito',
  ERROR_ARCHIVE_MESSAGE: 'No se pudo archivar el hábito',
  NO_TOKEN: 'No se encontró token de autenticación',
};

export const STATUS_BAR_STYLE = 'light-content';
export const STATUS_BAR_BACKGROUND = colors.background;
export const DEFAULT_IOS_PADDING_TOP = 50;
export const DEFAULT_ANDROID_PADDING_TOP = StatusBar.currentHeight ?? 0;

export const HEADER_PADDING = 16;
export const HEADER_TITLE_MARGIN_BOTTOM = 16;
export const FILTER_GAP = 12;
export const FILTER_PADDING_VERTICAL = 8;
export const FILTER_PADDING_HORIZONTAL = 16;
export const FILTER_BORDER_RADIUS = 20;
export const LIST_PADDING = 16;
export const LIST_GAP = 12;
export const LIST_PADDING_BOTTOM = 100;
export const FAB_SIZE = 56;
export const FAB_BORDER_RADIUS = 28;
export const FAB_BOTTOM = 100;
export const FAB_RIGHT = 16;
export const ICON_SIZE = 24;
export const ACTION_ICON_SIZE = 32;
export const PROGRESS_ICON_SIZE = 20;
export const STAT_ICON_SIZE = 16;
export const COMPLETE_ICON_SIZE = 28;
export const ERROR_ICON_SIZE = 48;
export const EMPTY_ICON_SIZE = 64;
export const ADD_ICON_SIZE = 20;
export const FILTER_ICON_SIZE = 20;
export const ICON_CONTAINER_SIZE = 48;
export const ICON_CONTAINER_BORDER_RADIUS = 24;
export const COMPLETE_BUTTON_SIZE = 48;
export const COMPLETE_BUTTON_BORDER_RADIUS = 24;
export const ACTION_BUTTON_WIDTH = 60;
export const ACTION_BUTTON_BORDER_RADIUS = 16;
export const ACTION_BUTTON_PADDING_HORIZONTAL = 8;
export const ACTION_BUTTON_PADDING_VERTICAL = 12;
export const ACTION_BUTTON_GAP = 4;
export const ACTION_BUTTON_MARGIN_HORIZONTAL = 2;
export const ACTION_BUTTON_PADDING_RIGHT = 8;
export const PROGRESS_INDICATOR_RIGHT = 20;
export const PROGRESS_INDICATOR_PADDING_HORIZONTAL = 16;
export const PROGRESS_INDICATOR_PADDING_VERTICAL = 12;
export const PROGRESS_INDICATOR_BORDER_RADIUS = 16;
export const PROGRESS_INDICATOR_BORDER_WIDTH = 1;
export const PROGRESS_TEXT_MARGIN_TOP = 6;
export const ARCHIVE_BUTTON_MARGIN_LEFT = 20;
export const CARD_PADDING = 16;
export const CARD_BORDER_RADIUS = 16;
export const CARD_GAP = 12;
export const CARD_BORDER_WIDTH = 1;
export const CARD_FOOTER_MARGIN_TOP = 8;
export const STAT_GAP = 16;
export const STAT_ITEM_GAP = 4;
export const ERROR_CONTAINER_PADDING = 32;
export const ERROR_CONTAINER_GAP = 16;
export const RETRY_BUTTON_PADDING_HORIZONTAL = 24;
export const RETRY_BUTTON_PADDING_VERTICAL = 12;
export const RETRY_BUTTON_BORDER_RADIUS = 12;
export const EMPTY_CONTAINER_PADDING = 32;
export const EMPTY_CONTAINER_GAP = 16;
export const ADD_FIRST_BUTTON_PADDING_HORIZONTAL = 20;
export const ADD_FIRST_BUTTON_PADDING_VERTICAL = 12;
export const ADD_FIRST_BUTTON_BORDER_RADIUS = 12;
export const ADD_FIRST_BUTTON_GAP = 8;
export const ADD_FIRST_BUTTON_BORDER_WIDTH = 1;
export const SESSION_EXPIRED_DELAY = 100;

export const COLORS = {
  PRIMARY: colors.primary,
  WHITE: colors.white,
  BACKGROUND: colors.background,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  SUCCESS: '#4CAF50',
  WARNING: '#FFD93D',
  INFO: '#6BCB77',
  ARCHIVE: 'rgba(255, 152, 0, 0.9)',
  DELETE: 'rgba(244, 67, 54, 0.9)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.85)',
  CARD_ARCHIVED_BACKGROUND: 'rgba(29, 43, 95, 0.4)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.15)',
  CARD_ARCHIVED_BORDER: 'rgba(163, 184, 232, 0.1)',
  ICON_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  ICON_ARCHIVED_BACKGROUND: 'rgba(163, 184, 232, 0.1)',
  COMPLETE_BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  COMPLETE_BUTTON_COMPLETED_BACKGROUND: 'rgba(76, 175, 80, 0.1)',
  PROGRESS_INDICATOR_BACKGROUND: 'rgba(26, 221, 219, 0.15)',
  PROGRESS_INDICATOR_BORDER: 'rgba(26, 221, 219, 0.3)',
  FILTER_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  HEADER_BACKGROUND: 'rgba(29, 43, 95, 0.1)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  ADD_FIRST_BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  ADD_FIRST_BUTTON_BORDER: 'rgba(26, 221, 219, 0.2)',
  REFRESH_COLOR: colors.primary,
};

export const HABIT_ICONS = {
  exercise: 'run',
  meditation: 'meditation',
  reading: 'book-open-variant',
  water: 'water',
  sleep: 'sleep',
  study: 'book-education',
  diet: 'food-apple',
  coding: 'code-tags',
};

export const getDefaultFormData = () => ({
  title: '',
  description: '',
  icon: 'exercise',
  frequency: FREQUENCY_TYPES.DAILY,
  reminder: new Date().toISOString(),
});
