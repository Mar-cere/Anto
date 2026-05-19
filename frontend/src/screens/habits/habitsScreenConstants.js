/**
 * Constantes de la pantalla de hábitos (HabitsScreen y subcomponentes).
 * @author AntoApp Team
 */

import { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { SPACING } from '../../constants/ui';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { lightColors } from '../../styles/themePalettes';

// Animación
export const SWIPE_THRESHOLD = -14;
export const SWIPE_ANIMATION_DURATION = 200;
export const DELETE_ANIMATION_DURATION = 300;
export const SWIPE_DISTANCE = -130;
export const DELETE_DISTANCE = -400;
export const PROGRESS_MAX_DISTANCE = 100;
export const ANIMATION_FINAL_OPACITY = 1;
export const ANIMATION_INITIAL_OPACITY = 0;

// Gestos
export const ACTIVE_OFFSET_X = [-12, 12];
export const ACTIVE_OFFSET_Y = [-100, 100];
export const DELAY_PRESS_IN = 120;
export const DELAY_COMPLETE_PRESS_IN = 180;
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
  HABIT_COMPLETED: 'Hábito completado',
  HABIT_MARKED_PENDING: 'Hábito marcado pendiente',
  HABIT_ARCHIVED: 'Hábito archivado',
  HABIT_UNARCHIVED: 'Hábito desarchivado',
  HABIT_DELETED: 'Hábito eliminado',
  TOAST_UNDO: 'Deshacer',
  SEARCH_PLACEHOLDER: 'Buscar hábito…',
  ARCHIVE_CONFIRM_MESSAGE_TEMPLATE:
    '¿Estás seguro de que deseas {action} este hábito?',
};

export function useHabitsTexts() {
  const translated = useSectionTranslations('HABITS');
  return useMemo(
    () => ({
      ...TEXTS,
      ...(translated || {}),
      SEARCH_PLACEHOLDER:
        translated?.SEARCH_PLACEHOLDER || TEXTS.SEARCH_PLACEHOLDER,
      ARCHIVE_CONFIRM_MESSAGE_TEMPLATE:
        translated?.ARCHIVE_CONFIRM_MESSAGE_TEMPLATE ||
        TEXTS.ARCHIVE_CONFIRM_MESSAGE_TEMPLATE,
    }),
    [translated],
  );
}

export const STATUS_BAR_STYLE = 'dark-content';
export const STATUS_BAR_BACKGROUND = lightColors.background;
export const DEFAULT_IOS_PADDING_TOP = 50;
export const DEFAULT_ANDROID_PADDING_TOP = StatusBar.currentHeight ?? 0;

export const HEADER_PADDING = SPACING.SCREEN_EDGE_INSET;
export const HEADER_TITLE_MARGIN_BOTTOM = 16;
export const FILTER_GAP = 12;
export const FILTER_PADDING_VERTICAL = 8;
export const FILTER_PADDING_HORIZONTAL = SPACING.SCREEN_EDGE_INSET;
export const FILTER_BORDER_RADIUS = 20;
export const LIST_GAP = 12;
export const LIST_PADDING_BOTTOM = SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA;
export const FAB_SIZE = 56;
export const FAB_BORDER_RADIUS = 28;
export const FAB_BOTTOM = 100;
export const FAB_RIGHT = SPACING.SCREEN_EDGE_INSET;
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

export function createHabitsColors(colors) {
  return {
    PRIMARY: colors.primary,
    WHITE: colors.white,
    BACKGROUND: colors.background,
    ACCENT: colors.primaryBright ?? colors.primary,
    ERROR: colors.error,
    SUCCESS: colors.success,
    WARNING: colors.warning,
    INFO: colors.info,
    ARCHIVE: 'rgba(255, 152, 0, 0.9)',
    DELETE: 'rgba(244, 67, 54, 0.9)',
    CARD_BACKGROUND: colors.cardBackground ?? colors.surface,
    CARD_ARCHIVED_BACKGROUND: 'rgba(36, 35, 79, 0.04)',
    CARD_BORDER: colors.border,
    CARD_ARCHIVED_BORDER: 'rgba(36, 35, 79, 0.06)',
    ICON_BACKGROUND: colors.accentLineSoft,
    ICON_ARCHIVED_BACKGROUND: 'rgba(36, 35, 79, 0.06)',
    COMPLETE_BUTTON_BACKGROUND: colors.accentLineSoft,
    COMPLETE_BUTTON_COMPLETED_BACKGROUND: 'rgba(76, 175, 80, 0.12)',
    PROGRESS_INDICATOR_BACKGROUND: colors.accentLineSoft,
    PROGRESS_INDICATOR_BORDER: colors.accentLine ?? colors.border,
    FILTER_BACKGROUND: colors.glassFill ?? colors.accentLineSoft,
    HEADER_BACKGROUND: colors.chromeHeader ?? colors.background,
    HEADER_BORDER: colors.chromeHeaderBorder ?? colors.border,
    ADD_FIRST_BUTTON_BACKGROUND: colors.accentLineSoft,
    ADD_FIRST_BUTTON_BORDER: colors.accentLine ?? colors.border,
    REFRESH_COLOR: colors.primary,
    /** Sombra iOS coherente con tema (evita #000 fijo en tarjetas) */
    CARD_SHADOW: colors.glassShadow ?? colors.shadowAmbient,
  };
}

/** Compatibilidad legacy (tests/archivos no migrados) */
export const COLORS = createHabitsColors(lightColors);

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
