/**
 * Constantes de la pantalla Pomodoro (PomodoroScreen y subcomponentes).
 * @author AntoApp Team
 */

import { SPACING } from '../../constants/ui';
import { lightColors as legacyColors } from '../../styles/themePalettes';

// Tiempo (segundos)
export const WORK_TIME = 25 * 60;
export const BREAK_TIME = 5 * 60;
export const LONG_BREAK_TIME = 15 * 60;
export const MEDITATION_TIME = 10 * 60;
export const DEFAULT_CUSTOM_TIME = 25 * 60;
export const DEFAULT_PREP_TIME = 3 * 60;
export const INTERVAL_DURATION = 1000;
export const WARNING_TIME = 10;
export const DAILY_POMODORO_GOAL = 6;
/** Duración de trabajo al elegir una tarea sin tiempo estimado (minutos). */
export const POMODORO_DEFAULT_TASK_MINUTES = 25;
export const POMODORO_TASK_FOCUS_MIN_MINUTES = 5;
export const POMODORO_TASK_FOCUS_MAX_MINUTES = 120;
export const POMODORO_PENDING_TASKS_LIMIT = 15;
/** Tamaño de bloque usado solo para textos orientativos (p. ej. “≈ N bloques”). */
export const POMODORO_DISPLAY_BLOCK_MINUTES = 25;

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

export function createPomodoroColors(colors) {
  return {
    WORK: colors.error,
    BREAK: colors.success,
    LONG_BREAK: colors.info ?? colors.primary,
    MEDITATION: colors.accentWarm,
    CUSTOM: colors.warning,
    PAUSE: colors.error,
    BACKGROUND: colors.background,
    WHITE: colors.white,
    ACCENT: colors.primaryBright ?? colors.primary,
    SUCCESS: colors.success,
    ERROR: colors.error,
    PRIMARY: colors.primary,
    CARD_BACKGROUND: colors.cardBackground ?? colors.surface,
    INPUT_BACKGROUND: colors.chromeInput,
    BUTTON_BACKGROUND: colors.accentLineSoft,
    MODAL_OVERLAY: colors.overlay,
    MODAL_BACKGROUND: colors.modalSurface,
    SWITCH_TRACK_FALSE: colors.border,
    SWITCH_TRACK_TRUE: colors.primary,
    SWITCH_THUMB_FALSE: colors.textSecondary,
    SWITCH_THUMB_TRUE: colors.white,
    PROGRESS_BACKGROUND: colors.accentLineSoft ?? 'rgba(36, 35, 79, 0.08)',
    MEDITATION_BUTTON_BACKGROUND: colors.accentLineSoft,
    MEDITATION_BUTTON_BORDER: colors.accentLine,
    CLEAR_BUTTON_BACKGROUND: colors.dangerSoft ?? 'rgba(255, 82, 82, 0.1)',
    HEADER_BORDER: colors.border,
  };
}

/** Compatibilidad legacy (tests/archivos no migrados) */
export const COLORS = createPomodoroColors(legacyColors);

export const TEXTS = {
  TITLE: 'Pomodoro',
  MODAL_TITLE: 'Timer Personalizado',
  WORK_LABEL: 'Tiempo de trabajo',
  PREP_TIME_LABEL: 'Tiempo de preparación',
  MINUTES: 'minutos',
  CANCEL: 'Cancelar',
  START: 'Iniciar',
  PENDING_SECTION_KICKER: 'Enlace con tareas',
  PENDING_TASKS_TITLE: 'Siguiente foco',
  PENDING_TASKS_HINT: 'Elige una tarea: sincronizamos estado, tiempo estimado y el temporizador.',
  SEE_ALL_TASKS: 'Ver todas',
  ESTIMATED_MINUTES: '{n} min estimados',
  ESTIMATE_DEFAULT_SHORT: '25 min (por defecto)',
  MULTI_BLOCK_HINT: '≈ {n} bloques de ~25 min',
  TASK_STATUS_IN_PROGRESS: 'En curso',
  TASK_FOCUS_ACTIVE: 'En temporizador',
  DUE_DATE_SHORT: 'Vence {date}',
  SUMMARY_SUBTITLE: 'Sesión de foco completada',
  SUMMARY_DISMISS_HINT: 'Toca fuera para cerrar',
  ERROR_FOCUS_TITLE: 'No se pudo enlazar',
  ERROR_FOCUS_MESSAGE: 'La tarea no se marcó como en curso. Revisa la conexión e inténtalo de nuevo.',
  FOCUS_THIS_TASK: 'Enfocar',
  PENDING_TASKS_EMPTY: 'No hay tareas pendientes',
  PENDING_TASKS_EMPTY_HINT: 'Crea tareas en la pestaña Tareas para enlazarlas aquí.',
  PENDING_LOAD_ERROR: 'No se pudieron cargar las tareas',
  RETRY: 'Reintentar',
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
  EXIT_GUARD_TITLE: 'Temporizador en curso',
  EXIT_GUARD_MESSAGE: 'Hay una sesión activa. ¿Deseas salir y detenerla?',
  EXIT_GUARD_STAY: 'Quedarme',
  EXIT_GUARD_LEAVE: 'Salir',
  DAILY_GOAL: 'Hoy',
  PRESET_LABEL: 'Atajos',
  SUMMARY_TITLE: 'Resumen del bloque',
  SUMMARY_FOCUS_TIME: 'Tiempo enfocado',
  SUMMARY_LINKED_TASK: 'Tarea en foco',
  SUMMARY_STREAK: 'Racha de hoy',
  SUMMARY_TIME_LOGGED: 'Se sumaron {n} min al tiempo real de la tarea.',
  SUMMARY_OPEN_TASK: 'Abrir tarea',
  SUMMARY_MARK_TASK_DONE: 'Marcar tarea lista',
  SUMMARY_CLOSE: 'Continuar',
  ERROR_COMPLETE_TASK_TITLE: 'No se completó la tarea',
  ERROR_COMPLETE_TASK_MESSAGE: 'Inténtalo de nuevo cuando tengas conexión.',
  CONTINUE: 'Continuar',
  TAKE_BREAK: 'Tomar descanso',
};

export const MOTIVATIONAL_MESSAGES = [
  '¡Excelente trabajo! 💪',
  '¡Sigue así! 🌟',
  '¡Una sesión más completada! 🎯',
  '¡Tu concentración mejora cada día! 🧠',
  '¡Vas por buen camino! ✨',
];

export const STATUS_BAR_STYLE = 'dark-content';
export const STATUS_BAR_BACKGROUND = legacyColors.background;
/** Clave legada; la lista de tareas locales del Pomodoro ya no se usa. */
export const STORAGE_KEY = 'pomodoroTasks';
export const POMODORO_STATS_STORAGE_KEY = 'pomodoroStats';
export const DEFAULT_CUSTOM_MINUTES = '25';
export const DEFAULT_PREP_MINUTES = '3';
export const MAX_CUSTOM_MINUTES_LENGTH = 3;
export const MAX_PREP_MINUTES_LENGTH = 2;
export const BREATH_CYCLE = 4;
export const VIBRATION_PATTERN = [0, 500, 200, 500];
export const QUICK_PRESETS = [
  { id: 'p25', label: '25/5', workMinutes: 25, breakMinutes: 5 },
  { id: 'p50', label: '50/10', workMinutes: 50, breakMinutes: 10 },
  { id: 'p90', label: '90/20', workMinutes: 90, breakMinutes: 20 },
];

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
export const CONTAINER_PADDING_BOTTOM = SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA;
/** Inset horizontal del contenido respecto al borde de pantalla (14, alineado con la app). */
export const POMODORO_SCREEN_INSET = SPACING.SCREEN_EDGE_INSET;
/** Padding interno unificado en tarjetas, modal del timer y bloques internos Pomodoro (12). */
export const POMODORO_INNER_INSET = 12;

export const HEADER_PADDING = POMODORO_SCREEN_INSET;
export const CONTENT_PADDING = POMODORO_SCREEN_INSET;
export const TIMER_SECTION_MARGIN_VERTICAL = 24;
export const MODE_LABEL_MARGIN_BOTTOM = 16;
export const PROGRESS_BAR_MARGIN_TOP = 24;
export const CONTROLS_MARGIN_BOTTOM = 24;
export const CONTROLS_GAP = 8;
export const ADDITIONAL_CONTROLS_MARGIN_LEFT = 8;
export const TASKS_SECTION_PADDING = POMODORO_INNER_INSET;
export const TASKS_SECTION_BORDER_RADIUS = 16;
export const TITLE_MARGIN_BOTTOM = 16;
export const INPUT_CONTAINER_MARGIN_BOTTOM = 16;
export const INPUT_HEIGHT = 48;
export const INPUT_BORDER_RADIUS = 12;
export const INPUT_PADDING_HORIZONTAL = POMODORO_INNER_INSET;
export const TASK_LIST_GAP = 8;
export const TASK_ITEM_PADDING = 12;
export const TASK_ITEM_BORDER_RADIUS = 12;
export const CHECKBOX_MARGIN_RIGHT = 12;
export const DELETE_BUTTON_MARGIN_LEFT = 12;
export const TASK_HEADER_MARGIN_BOTTOM = 16;
export const CLEAR_BUTTON_PADDING = 8;
export const CLEAR_BUTTON_BORDER_RADIUS = 8;
export const CLEAR_BUTTON_MARGIN_TOP = 8;
export const EMPTY_STATE_PADDING = POMODORO_INNER_INSET;
export const EMPTY_STATE_TEXT_MARGIN_TOP = 8;
export const MODAL_OVERLAY_PADDING = POMODORO_SCREEN_INSET;
export const MODAL_CONTENT_PADDING = POMODORO_INNER_INSET;
export const MODAL_TITLE_MARGIN_BOTTOM = POMODORO_INNER_INSET;
export const INPUT_GROUP_MARGIN_BOTTOM = POMODORO_INNER_INSET;
export const INPUT_LABEL_MARGIN_BOTTOM = 8;
export const TIME_INPUT_CONTAINER_GAP = 8;
export const TIME_INPUT_WIDTH = 100;
export const TIME_INPUT_PADDING = POMODORO_INNER_INSET;
export const TIME_INPUT_BORDER_RADIUS = 12;
export const PREP_TIME_CONTAINER_MARGIN_BOTTOM = POMODORO_INNER_INSET;
export const PREP_TIME_HEADER_MARGIN_BOTTOM = 16;
export const MODAL_BUTTONS_GAP = POMODORO_INNER_INSET;
export const MODAL_BUTTON_PADDING = POMODORO_INNER_INSET;
export const MODAL_BUTTON_BORDER_RADIUS = 12;
export const MEDITATION_BUTTON_CONTAINER_PADDING_HORIZONTAL = POMODORO_INNER_INSET;
export const MEDITATION_BUTTON_PADDING_VERTICAL = 12;
export const MEDITATION_BUTTON_PADDING_HORIZONTAL = POMODORO_INNER_INSET;
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
