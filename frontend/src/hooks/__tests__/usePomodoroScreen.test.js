/**
 * Tests unitarios para el hook usePomodoroScreen.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Animated: {
    Value: jest.fn(() => ({ setValue: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn() })),
    parallel: jest.fn(() => ({ start: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
  },
  Easing: { inOut: jest.fn(), ease: 0 },
  Vibration: { vibrate: jest.fn() },
}));
jest.mock('../../styles/globalStyles', () => ({ colors: {} }));

jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    put: jest.fn().mockResolvedValue({ success: true, data: {} }),
    patch: jest.fn().mockResolvedValue({ success: true, data: { _id: 't1' } }),
  },
  ENDPOINTS: {
    TASKS_PENDING: '/api/tasks/pending',
    TASK_BY_ID: (id) => `/api/tasks/${id}`,
  },
}));
jest.mock('../../utils/apiErrorHandler', () => ({
  getApiErrorMessage: (e) => e?.message || 'Error',
}));

const mockModes = {
  work: { time: 25 * 60, label: 'Trabajo' },
  break: { time: 5 * 60, label: 'Descanso' },
  longBreak: { time: 15 * 60, label: 'Descanso Largo' },
  custom: { time: 25 * 60, label: 'Personalizado' },
};
jest.mock('../../screens/pomodoro/pomodoroScreenConstants', () => ({
  getModes: () => mockModes,
  ANIMATION_DURATION: 300,
  BUTTONS_OPACITY_ACTIVE: 0,
  BUTTONS_OPACITY_INACTIVE: 1,
  BUTTONS_SCALE_ACTIVE: 0.5,
  BUTTONS_SCALE_INACTIVE: 1,
  DAILY_POMODORO_GOAL: 6,
  DEFAULT_CUSTOM_MINUTES: '25',
  DEFAULT_PREP_MINUTES: '3',
  INTERVAL_DURATION: 1000,
  MOTIVATIONAL_MESSAGES: ['Well done!'],
  NAVBAR_TRANSLATE_Y: 100,
  POMODORO_DEFAULT_TASK_MINUTES: 25,
  POMODORO_PENDING_TASKS_LIMIT: 15,
  POMODORO_STATS_STORAGE_KEY: 'pomodoroStats',
  POMODORO_TASK_FOCUS_MAX_MINUTES: 120,
  POMODORO_TASK_FOCUS_MIN_MINUTES: 5,
  POMODORO_DISPLAY_BLOCK_MINUTES: 25,
  PROGRESS_ANIMATION_DURATION: 1000,
  QUICK_PRESETS: [],
  TEXTS: {
    PAUSE: 'Pause',
    TAKE_BREAK: 'Take break',
    CONTINUE: 'Continue',
    START: 'Start',
    POMODORO_COMPLETED: 'Done',
    POMODORO_COMPLETED_MESSAGE: 'Message',
    SESSION_COMPLETED: 'Session',
    PENDING_LOAD_ERROR: 'pending error',
    ERROR_FOCUS_TITLE: 'Error',
    ERROR_FOCUS_MESSAGE: 'Focus error',
    ERROR_COMPLETE_TASK_TITLE: 'Complete error',
    ERROR_COMPLETE_TASK_MESSAGE: 'Complete failed',
  },
  usePomodoroTexts: () => ({
    PAUSE: 'Pause',
    TAKE_BREAK: 'Take break',
    CONTINUE: 'Continue',
    START: 'Start',
    POMODORO_COMPLETED: 'Done',
    POMODORO_COMPLETED_MESSAGE: 'Message',
    SESSION_COMPLETED: 'Session',
    PENDING_LOAD_ERROR: 'pending error',
    ERROR_FOCUS_TITLE: 'Error',
    ERROR_FOCUS_MESSAGE: 'Focus error',
    ERROR_COMPLETE_TASK_TITLE: 'Complete error',
    ERROR_COMPLETE_TASK_MESSAGE: 'Complete failed',
  }),
  VIBRATION_PATTERN: [0, 500],
  WARNING_TIME: 10,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 0, Medium: 1 },
  NotificationFeedbackType: { Success: 1 },
}));
jest.mock('../../utils/notifications', () => ({
  sendImmediateNotification: jest.fn(),
  cancelTaskNotifications: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { api } from '../../config/api';
import { sortPomodoroPendingTasks, usePomodoroScreen } from '../usePomodoroScreen';

describe('sortPomodoroPendingTasks', () => {
  it('ordena por en curso, luego prioridad, luego fecha de vencimiento', () => {
    const dEarly = new Date('2026-05-01').toISOString();
    const dLate = new Date('2026-05-20').toISOString();
    const input = [
      { _id: 'low_late', status: 'pending', priority: 'low', dueDate: dLate },
      { _id: 'prog', status: 'in_progress', priority: 'medium', dueDate: dLate },
      { _id: 'urgent', status: 'pending', priority: 'urgent', dueDate: dLate },
      { _id: 'high_early', status: 'pending', priority: 'high', dueDate: dEarly },
    ];
    expect(sortPomodoroPendingTasks(input).map((t) => t._id)).toEqual([
      'prog',
      'urgent',
      'high_early',
      'low_late',
    ]);
  });

  it('misma prioridad: vencimiento más cercano primero', () => {
    const d1 = new Date('2026-05-10').toISOString();
    const d2 = new Date('2026-05-15').toISOString();
    const input = [
      { _id: 'later', status: 'pending', priority: 'medium', dueDate: d2 },
      { _id: 'sooner', status: 'pending', priority: 'medium', dueDate: d1 },
    ];
    expect(sortPomodoroPendingTasks(input).map((t) => t._id)).toEqual(['sooner', 'later']);
  });

  it('excluye filas sin _id y ordena fechas inválidas al final', () => {
    const d = new Date('2026-05-10').toISOString();
    const input = [
      { _id: 'invalidDate', status: 'pending', priority: 'medium', dueDate: 'not-a-date' },
      { _id: 'ok', status: 'pending', priority: 'medium', dueDate: d },
      { title: 'sin id' },
    ];
    expect(sortPomodoroPendingTasks(input).map((t) => t._id)).toEqual(['ok', 'invalidDate']);
  });
});

describe('usePomodoroScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar las claves esperadas', () => {
    const { result } = renderHook(() => usePomodoroScreen());
    expect(result.current).toMatchObject({
      modes: expect.any(Object),
      isActive: false,
      mode: 'work',
      pendingTasks: expect.any(Array),
      focusingTaskId: null,
      customTimeModalVisible: false,
    });
    expect(typeof result.current.formatTime).toBe('function');
    expect(typeof result.current.toggleTimer).toBe('function');
    expect(typeof result.current.resetTimer).toBe('function');
    expect(typeof result.current.changeMode).toBe('function');
    expect(typeof result.current.loadPendingTasks).toBe('function');
    expect(typeof result.current.startFocusFromPendingTask).toBe('function');
    expect(typeof result.current.completeLinkedTask).toBe('function');
  });

  it('formatTime debe formatear segundos como MM:SS', () => {
    const { result } = renderHook(() => usePomodoroScreen());
    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(65)).toBe('01:05');
    expect(result.current.formatTime(25 * 60)).toBe('25:00');
  });

  it('changeMode debe actualizar mode y timeLeft', () => {
    const { result } = renderHook(() => usePomodoroScreen());
    expect(result.current.mode).toBe('work');
    expect(result.current.timeLeft).toBe(25 * 60);
    act(() => {
      result.current.changeMode('break');
    });
    expect(result.current.mode).toBe('break');
    expect(result.current.timeLeft).toBe(5 * 60);
  });

  it('startFocusFromPendingTask enlaza tarea e inicia el temporizador', async () => {
    const { result } = renderHook(() => usePomodoroScreen());
    await act(async () => {
      await result.current.startFocusFromPendingTask({ _id: 't1', title: 'estudiar' });
    });
    expect(api.put).toHaveBeenCalledWith('/api/tasks/t1', { status: 'in_progress' });
    expect(result.current.focusTask).toEqual(
      expect.objectContaining({ _id: 't1', title: 'estudiar', minutesPlanned: 25 }),
    );
    expect(result.current.isActive).toBe(true);
    expect(result.current.timeLeft).toBe(25 * 60);
  });

  it('startFocusFromPendingTask reanuda si la tarea ya estaba enfocada', async () => {
    const { result } = renderHook(() => usePomodoroScreen());
    await act(async () => {
      await result.current.startFocusFromPendingTask({ _id: 't1', title: 'estudiar' });
    });
    act(() => {
      result.current.toggleTimer();
    });
    expect(result.current.isActive).toBe(false);
    await act(async () => {
      await result.current.startFocusFromPendingTask({ _id: 't1', title: 'estudiar' });
    });
    expect(result.current.isActive).toBe(true);
  });
});
