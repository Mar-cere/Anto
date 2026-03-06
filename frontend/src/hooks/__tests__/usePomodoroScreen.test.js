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
  DEFAULT_CUSTOM_MINUTES: '25',
  DEFAULT_PREP_MINUTES: '3',
  INTERVAL_DURATION: 1000,
  MOTIVATIONAL_MESSAGES: ['Well done!'],
  NAVBAR_TRANSLATE_Y: 100,
  PROGRESS_ANIMATION_DURATION: 1000,
  STORAGE_KEY: 'pomodoroTasks',
  TEXTS: {
    POMODORO_COMPLETED: 'Done',
    POMODORO_COMPLETED_MESSAGE: 'Message',
    SESSION_COMPLETED: 'Session',
  },
  VIBRATION_PATTERN: [0, 500],
  WARNING_TIME: 10,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 0, Medium: 1 },
  NotificationFeedbackType: { Success: 1 },
}));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));
jest.mock('../../utils/notifications', () => ({ sendImmediateNotification: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(JSON.stringify([])),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { usePomodoroScreen } from '../usePomodoroScreen';

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
      inputText: '',
      tasks: expect.any(Array),
      customTimeModalVisible: false,
    });
    expect(typeof result.current.formatTime).toBe('function');
    expect(typeof result.current.toggleTimer).toBe('function');
    expect(typeof result.current.resetTimer).toBe('function');
    expect(typeof result.current.changeMode).toBe('function');
    expect(typeof result.current.handleAddTask).toBe('function');
    expect(typeof result.current.setInputText).toBe('function');
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

  it('setInputText debe actualizar inputText', () => {
    const { result } = renderHook(() => usePomodoroScreen());
    expect(result.current.inputText).toBe('');
    act(() => {
      result.current.setInputText('Nueva tarea');
    });
    expect(result.current.inputText).toBe('Nueva tarea');
  });
});
