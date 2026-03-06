/**
 * Constantes de la pantalla Pomodoro (PomodoroScreen y subcomponentes).
 * @author AntoApp Team
 */

import { colors } from '../../styles/globalStyles';

// Tiempo (segundos)
export const WORK_TIME = 25 * 60;
export const BREAK_TIME = 5 * 60;
export const LONG_BREAK_TIME = 15 * 60;
export const MEDITATION_TIME = 10 * 60;
export const DEFAULT_CUSTOM_TIME = 25 * 60;
export const DEFAULT_PREP_TIME = 3 * 60;
export const INTERVAL_DURATION = 1000;
export const WARNING_TIME = 10;

// Animación
export const ANIMATION_DURATION = 300;
export const FADE_ANIMATION_DURATION = 150;
export const MODE_TRANSITION_DURATION = 300;
export const PROGRESS_ANIMATION_DURATION = 1000;
export const NAVBAR_TRANSLATE_Y = 100;
export const BUTTONS_SCALE_ACTIVE = 0.5;
export const BUTTONS_OPACITY_ACTIVE = 0;
export const BUTTONS_OPACITY_INACTIVE = 1;
export const BUTTONS_SCALE_INACTIVE = 1;
export const FADE_OPACITY_MIN = 0.5;
export const FADE_OPACITY_MAX = 1;
export const MAIN_CONTROLS_TRANSLATE_X = 80;
export const MODE_TRANSITION_DELAY = 150;

export const COLORS = {
  WORK: '#FF6B6B',
  BREAK: '#4CAF50',
  LONG_BREAK: '#2196F3',
  MEDITATION: '#9C27B0',
  CUSTOM: '#FF9800',
  PAUSE: '#FF5252',
  BACKGROUND: colors.background,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  SUCCESS: '#4CAF50',
  ERROR: '#FF5252',
  PRIMARY: colors.primary,
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  INPUT_BACKGROUND: 'rgba(255, 255, 255, 0.05)',
  BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  MODAL_OVERLAY: 'rgba(0, 0, 0, 0.5)',
  MODAL_BACKGROUND: '#1D2B5F',
  SWITCH_TRACK_FALSE: '#1D2B5F',
  SWITCH_TRACK_TRUE: colors.primary,
  SWITCH_THUMB_FALSE: '#A3B8E8',
  SWITCH_THUMB_TRUE: colors.white,
  PROGRESS_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  MEDITATION_BUTTON_BACKGROUND: 'rgba(156, 39, 176, 0.1)',
  MEDITATION_BUTTON_BORDER: 'rgba(156, 39, 176, 0.3)',
  CLEAR_BUTTON_BACKGROUND: 'rgba(255, 82, 82, 0.1)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
};

export const TEXTS = {
  TITLE: 'Pomodoro',
  MODAL_TITLE: 'Timer Personalizado',
  WORK_LABEL: 'Tiempo de trabajo',
  PREP_TIME_LABEL: 'Tiempo de preparación',
  MINUTES: 'minutos',
  CANCEL: 'Cancelar',
  START: 'Iniciar',
  TASKS_TITLE: 'Tareas para esta sesión',
  NEW_TASK_PLACEHOLDER: 'Nueva tarea...',
  CLEAR_COMPLETED: 'Limpiar completadas',
  EMPTY_TASKS: 'No hay tareas para esta sesión',
  SESSION_COMPLETED: '¡Sesión Completada!',
  POMODORO_COMPLETED: '¡Pomodoro completado! ⏲️',
  POMODORO_COMPLETED_MESSAGE: '¡Tómate un descanso o inicia una nueva sesión!',
  NOTIFICATION_TITLE: '¡Hora de volver a concentrarte! 🍅',
  NOTIFICATION_BODY: 'Inicia una nueva sesión Pomodoro en AntoApp.',
  MEDITATION: 'Meditación',
  WORK: 'Trabajo',
  BREAK: 'Descanso',
  LONG_BREAK: 'Descanso Largo',
  CUSTOM: 'Personalizado',
};

export const MOTIVATIONAL_MESSAGES = [
  '¡Excelente trabajo! 💪',
  '¡Sigue así! 🌟',
  '¡Una sesión más completada! 🎯',
  '¡Tu concentración mejora cada día! 🧠',
  '¡Vas por buen camino! ✨',
];

export const STATUS_BAR_STYLE = 'light-content';
export const STATUS_BAR_BACKGROUND = colors.background;
export const STORAGE_KEY = 'pomodoroTasks';
export const DEFAULT_CUSTOM_MINUTES = '25';
export const DEFAULT_PREP_MINUTES = '3';
export const MAX_CUSTOM_MINUTES_LENGTH = 3;
export const MAX_PREP_MINUTES_LENGTH = 2;
export const BREATH_CYCLE = 4;
export const VIBRATION_PATTERN = [0, 500, 200, 500];

// Tamaños y layout
export const ICON_SIZE = 24;
export const HEADER_ICON_SIZE = 28;
export const CHECKBOX_ICON_SIZE = 24;
export const DELETE_ICON_SIZE = 20;
export const EMPTY_ICON_SIZE = 48;
export const TIMER_FONT_SIZE = 72;
export const MODE_LABEL_FONT_SIZE = 20;
export const TITLE_FONT_SIZE = 18;
export const MODAL_TITLE_FONT_SIZE = 20;
export const INPUT_FONT_SIZE = 16;
export const TIME_INPUT_FONT_SIZE = 24;
export const BUTTON_SIZE = 48;
export const BUTTON_BORDER_RADIUS = 24;
export const PROGRESS_BAR_HEIGHT = 4;
export const PROGRESS_BAR_BORDER_RADIUS = 2;
export const MODAL_MAX_WIDTH = 400;
export const MODAL_WIDTH_PERCENT = '90%';
export const MEDITATION_BUTTON_WIDTH_PERCENT = '80%';
export const CONTAINER_PADDING_BOTTOM = 85;
export const HEADER_PADDING = 16;
export const CONTENT_PADDING = 16;
export const TIMER_SECTION_MARGIN_VERTICAL = 24;
export const MODE_LABEL_MARGIN_BOTTOM = 16;
export const PROGRESS_BAR_MARGIN_TOP = 24;
export const CONTROLS_MARGIN_BOTTOM = 24;
export const CONTROLS_GAP = 8;
export const ADDITIONAL_CONTROLS_MARGIN_LEFT = 8;
export const TASKS_SECTION_PADDING = 16;
export const TASKS_SECTION_BORDER_RADIUS = 16;
export const TITLE_MARGIN_BOTTOM = 16;
export const INPUT_CONTAINER_MARGIN_BOTTOM = 16;
export const INPUT_HEIGHT = 48;
export const INPUT_BORDER_RADIUS = 12;
export const INPUT_PADDING_HORIZONTAL = 16;
export const TASK_LIST_GAP = 8;
export const TASK_ITEM_PADDING = 12;
export const TASK_ITEM_BORDER_RADIUS = 12;
export const CHECKBOX_MARGIN_RIGHT = 12;
export const DELETE_BUTTON_MARGIN_LEFT = 12;
export const TASK_HEADER_MARGIN_BOTTOM = 16;
export const CLEAR_BUTTON_PADDING = 8;
export const CLEAR_BUTTON_BORDER_RADIUS = 8;
export const CLEAR_BUTTON_MARGIN_TOP = 8;
export const EMPTY_STATE_PADDING = 24;
export const EMPTY_STATE_TEXT_MARGIN_TOP = 8;
export const MODAL_OVERLAY_PADDING = 24;
export const MODAL_CONTENT_PADDING = 24;
export const MODAL_TITLE_MARGIN_BOTTOM = 24;
export const INPUT_GROUP_MARGIN_BOTTOM = 24;
export const INPUT_LABEL_MARGIN_BOTTOM = 8;
export const TIME_INPUT_CONTAINER_GAP = 8;
export const TIME_INPUT_WIDTH = 100;
export const TIME_INPUT_PADDING = 16;
export const TIME_INPUT_BORDER_RADIUS = 12;
export const PREP_TIME_CONTAINER_MARGIN_BOTTOM = 24;
export const PREP_TIME_HEADER_MARGIN_BOTTOM = 16;
export const MODAL_BUTTONS_GAP = 16;
export const MODAL_BUTTON_PADDING = 16;
export const MODAL_BUTTON_BORDER_RADIUS = 12;
export const MEDITATION_BUTTON_CONTAINER_PADDING_HORIZONTAL = 16;
export const MEDITATION_BUTTON_PADDING_VERTICAL = 12;
export const MEDITATION_BUTTON_PADDING_HORIZONTAL = 24;
export const MEDITATION_BUTTON_GAP = 8;
export const MEDITATION_BUTTON_BORDER_RADIUS = 24;
export const MEDITATION_BUTTON_BORDER_WIDTH = 1;
export const HEADER_GAP = 12;
export const HEADER_BORDER_WIDTH = 1;

export function getModes() {
  return {
    work: {
      time: WORK_TIME,
      color: COLORS.WORK,
      icon: 'brain',
      label: TEXTS.WORK,
    },
    break: {
      time: BREAK_TIME,
      color: COLORS.BREAK,
      icon: 'coffee',
      label: TEXTS.BREAK,
    },
    longBreak: {
      time: LONG_BREAK_TIME,
      color: COLORS.LONG_BREAK,
      icon: 'beach',
      label: TEXTS.LONG_BREAK,
    },
    meditation: {
      time: MEDITATION_TIME,
      color: COLORS.MEDITATION,
      icon: 'meditation',
      label: TEXTS.MEDITATION,
      breathCycle: BREATH_CYCLE,
    },
    custom: {
      time: DEFAULT_CUSTOM_TIME,
      color: COLORS.CUSTOM,
      icon: 'clock-edit',
      label: TEXTS.CUSTOM,
    },
  };
}
