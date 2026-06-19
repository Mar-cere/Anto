/**
 * Hook con la lógica de la pantalla Pomodoro (timer, modos, tareas pendientes API, modal personalizado).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Vibration } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import {
  getModes,
  ANIMATION_DURATION,
  BUTTONS_OPACITY_ACTIVE,
  BUTTONS_OPACITY_INACTIVE,
  BUTTONS_SCALE_ACTIVE,
  BUTTONS_SCALE_INACTIVE,
  DAILY_POMODORO_GOAL,
  DEFAULT_CUSTOM_MINUTES,
  DEFAULT_PREP_MINUTES,
  INTERVAL_DURATION,
  NAVBAR_TRANSLATE_Y,
  POMODORO_DEFAULT_TASK_MINUTES,
  POMODORO_PENDING_TASKS_LIMIT,
  POMODORO_STATS_STORAGE_KEY,
  POMODORO_TASK_FOCUS_MAX_MINUTES,
  POMODORO_TASK_FOCUS_MIN_MINUTES,
  PROGRESS_ANIMATION_DURATION,
  QUICK_PRESETS,
  VIBRATION_PATTERN,
  WARNING_TIME,
  usePomodoroTexts,
} from '../screens/pomodoro/pomodoroScreenConstants';
import { cancelTaskNotifications, sendImmediateNotification } from '../utils/notifications';

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const toMinutes = (seconds) => Math.floor(seconds / 60);
const isYesterday = (previous, current) => {
  const prev = new Date(`${previous}T00:00:00`);
  const curr = new Date(`${current}T00:00:00`);
  const diff = (curr - prev) / (1000 * 60 * 60 * 24);
  return diff === 1;
};

const clampInt = (n, min, max) => Math.min(max, Math.max(min, Math.round(n)));

/** Orden fijo de prioridad para la lista de foco (urgente primero). */
const POMODORO_PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

const pomodoroPendingPriorityRank = (task) =>
  POMODORO_PRIORITY_RANK[task?.priority] ?? 2;

const dueTimestampOrInfinity = (task) => {
  if (!task?.dueDate) return Number.POSITIVE_INFINITY;
  const t = new Date(task.dueDate).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

export function sortPomodoroPendingTasks(list) {
  const safe = Array.isArray(list) ? list.filter((t) => t && t._id) : [];
  return safe.sort((a, b) => {
    const prog = (t) => (t.status === 'in_progress' ? 0 : 1);
    const pa = prog(a);
    const pb = prog(b);
    if (pa !== pb) return pa - pb;
    const pra = pomodoroPendingPriorityRank(a);
    const prb = pomodoroPendingPriorityRank(b);
    if (pra !== prb) return pra - prb;
    return dueTimestampOrInfinity(a) - dueTimestampOrInfinity(b);
  });
}

export function usePomodoroScreen() {
  const TEXTS = usePomodoroTexts();
  const modesRef = useRef(getModes(TEXTS));
  const modes = modesRef.current;

  useEffect(() => {
    const localizedModes = getModes(TEXTS);
    Object.keys(localizedModes).forEach((modeKey) => {
      if (modesRef.current[modeKey]) {
        modesRef.current[modeKey].label = localizedModes[modeKey].label;
      }
    });
  }, [TEXTS]);

  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(modes.work.time);
  const [mode, setMode] = useState('work');
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingTasksLoading, setPendingTasksLoading] = useState(false);
  const [pendingTasksError, setPendingTasksError] = useState(null);
  const [focusTask, setFocusTask] = useState(null);
  const [focusingTaskId, setFocusingTaskId] = useState(null);

  const [customTimeModalVisible, setCustomTimeModalVisible] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_CUSTOM_MINUTES);
  const [prepTimeEnabled, setPrepTimeEnabled] = useState(false);
  const [prepTime, setPrepTime] = useState(DEFAULT_PREP_MINUTES);
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);
  const customWorkSecondsRef = useRef(25 * 60);
  const customPrepSecondsRef = useRef(3 * 60);

  const [buttonsOpacity] = useState(() => new Animated.Value(1));
  const [buttonsScale] = useState(() => new Animated.Value(1));
  const [mainControlsPosition] = useState(() => new Animated.Value(0));
  const [isMeditating, setIsMeditating] = useState(false);
  const [exitGuardEnabled] = useState(true);
  const [dailyGoal] = useState(DAILY_POMODORO_GOAL);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryData, setSummaryData] = useState({
    focusedMinutes: 0,
    linkedTaskTitle: '',
    linkedTaskId: '',
    sessionBlockMinutes: 0,
    streakDays: 0,
  });
  const [summaryActionBusy, setSummaryActionBusy] = useState(false);
  const [stats, setStats] = useState({
    dateKey: getTodayKey(),
    sessionsToday: 0,
    focusedSecondsToday: 0,
    streakDays: 0,
    lastFocusDate: null,
  });
  const [navBarAnim] = useState(() => ({
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  /** Serializa GET+PUT de tiempo real para evitar condiciones de carrera entre bloques seguidos. */
  const logFocusTimeChainRef = useRef(Promise.resolve());
  /** Ignora aplicar estado de “Enfocar” si hubo un toque más reciente en otra tarea. */
  const focusFromTaskTokenRef = useRef(0);
  /** Solo aplica el último loadPendingTasks terminado (focus + pull simultáneos). */
  const pendingTasksLoadGenRef = useRef(0);
  /** Evita doble envío de “completar” antes de re-render. */
  const summaryActionBusyRef = useRef(false);

  const runTimerActivationAnimation = useCallback(
    (willBeActive) => {
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: willBeActive ? BUTTONS_OPACITY_ACTIVE : BUTTONS_OPACITY_INACTIVE,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsScale, {
          toValue: willBeActive ? BUTTONS_SCALE_ACTIVE : BUTTONS_SCALE_INACTIVE,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(mainControlsPosition, {
          toValue: willBeActive ? 1 : 0,
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [buttonsOpacity, buttonsScale, mainControlsPosition],
  );

  const activateTimer = useCallback(() => {
    setIsActive((prev) => {
      if (prev) return prev;
      runTimerActivationAnimation(true);
      return true;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [runTimerActivationAnimation]);

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => {
      const willBeActive = !prev;
      runTimerActivationAnimation(willBeActive);
      return willBeActive;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [runTimerActivationAnimation]);

  const getCurrentModeTime = useCallback(() => {
    if (mode === 'custom') {
      return isPreparationPhase ? customPrepSecondsRef.current : customWorkSecondsRef.current;
    }
    return modes[mode].time;
  }, [mode, isPreparationPhase, modes]);

  const primaryActionLabel = (() => {
    if (isActive) return TEXTS.PAUSE;
    if (mode === 'break' || mode === 'longBreak') return TEXTS.TAKE_BREAK;
    if (timeLeft < getCurrentModeTime()) return TEXTS.CONTINUE;
    return TEXTS.START;
  })();

  const resetTimer = useCallback(() => {
    setIsActive(false);
    const baseTime = mode === 'custom'
      ? (isPreparationPhase ? customPrepSecondsRef.current : customWorkSecondsRef.current)
      : modes[mode].time;
    setTimeLeft(baseTime);
    progressAnimation.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [mode, isPreparationPhase, progressAnimation, modes]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
    progressAnimation.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [mode, progressAnimation, modes]);

  const changeMode = useCallback(
    (newMode) => {
      setMode(newMode);
      setTimeLeft(modes[newMode].time);
      setIsActive(false);
      progressAnimation.setValue(0);
      if (newMode === 'custom') {
        setTimeLeft(customWorkSecondsRef.current);
      }
    },
    [progressAnimation, modes]
  );

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const applyQuickPreset = useCallback(
    (preset) => {
      modesRef.current.work.time = preset.workMinutes * 60;
      modesRef.current.break.time = preset.breakMinutes * 60;
      setFocusTask(null);
      setMode('work');
      setIsPreparationPhase(false);
      setIsActive(false);
      setTimeLeft(modesRef.current.work.time);
      progressAnimation.setValue(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [progressAnimation]
  );

  const logFocusTimeToTask = useCallback(async (taskId, sessionSeconds) => {
    if (!taskId || sessionSeconds < 1) return;
    const addMinutes = Math.max(1, toMinutes(sessionSeconds));
    logFocusTimeChainRef.current = logFocusTimeChainRef.current.then(async () => {
      try {
        const res = await api.get(ENDPOINTS.TASK_BY_ID(taskId));
        const task = res?.data ?? res;
        if (!task?._id) return;
        const prevActual =
          typeof task.actualTime === 'number' && task.actualTime >= 0 ? task.actualTime : 0;
        await api.put(ENDPOINTS.TASK_BY_ID(taskId), { actualTime: prevActual + addMinutes });
      } catch (e) {
        console.error('Pomodoro: registrar tiempo real en tarea:', e);
      }
    });
    await logFocusTimeChainRef.current;
  }, []);

  // Timer effect
  useEffect(() => {
    setIsMeditating(mode === 'meditation' && isActive);
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        const baseTime = getCurrentModeTime();
        setTimeLeft((t) => {
          const newTime = t - 1;
          const progress = 1 - newTime / baseTime;
          Animated.timing(progressAnimation, {
            toValue: progress,
            duration: PROGRESS_ANIMATION_DURATION,
            useNativeDriver: false,
          }).start();
          return newTime;
        });
      }, INTERVAL_DURATION);
    } else if (timeLeft === 0) {
      if (mode === 'custom' && isPreparationPhase) {
        setIsPreparationPhase(false);
        setTimeLeft(customWorkSecondsRef.current);
      } else {
        sendImmediateNotification(
          TEXTS.POMODORO_COMPLETED,
          TEXTS.POMODORO_COMPLETED_MESSAGE
        );
        if (mode === 'meditation') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Vibration.vibrate(VIBRATION_PATTERN);
        }
        if (mode === 'work' || mode === 'custom') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (mode === 'break' || mode === 'longBreak') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        const isFocusCycle = mode === 'work' || mode === 'custom';
        if (isFocusCycle) {
          const todayKey = getTodayKey();
          const linkedTaskTitle = focusTask?.title ? String(focusTask.title) : '';
          const linkedTaskId = focusTask?._id ? String(focusTask._id) : '';
          const focusedSeconds = getCurrentModeTime();
          const sessionBlockMinutes = Math.max(1, toMinutes(focusedSeconds));
          if (linkedTaskId) {
            void logFocusTimeToTask(linkedTaskId, focusedSeconds);
          }
          setStats((prev) => {
            const base =
              prev.dateKey === todayKey
                ? prev
                : { ...prev, dateKey: todayKey, sessionsToday: 0, focusedSecondsToday: 0 };
            let streakDays = base.streakDays;
            if (base.lastFocusDate !== todayKey) {
              streakDays =
                base.lastFocusDate && isYesterday(base.lastFocusDate, todayKey)
                  ? base.streakDays + 1
                  : 1;
            }
            const next = {
              ...base,
              sessionsToday: base.sessionsToday + 1,
              focusedSecondsToday: base.focusedSecondsToday + focusedSeconds,
              streakDays,
              lastFocusDate: todayKey,
            };
            setSummaryData({
              focusedMinutes: toMinutes(next.focusedSecondsToday),
              linkedTaskTitle,
              linkedTaskId,
              sessionBlockMinutes: linkedTaskId ? sessionBlockMinutes : 0,
              streakDays: next.streakDays,
            });
            return next;
          });
          setSummaryVisible(true);
        }
        toggleMode();
      }
    }

    return () => {
      clearInterval(interval);
      setIsMeditating(false);
    };
  }, [
    isActive,
    timeLeft,
    mode,
    isPreparationPhase,
    progressAnimation,
    getCurrentModeTime,
    toggleMode,
    focusTask,
    logFocusTimeToTask,
    TEXTS.POMODORO_COMPLETED,
    TEXTS.POMODORO_COMPLETED_MESSAGE,
  ]);

  // Warning blink effect
  useEffect(() => {
    if (timeLeft <= WARNING_TIME && timeLeft > 0 && isActive) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (timeLeft > 1) toggleTimer();
      });
    }
  }, [timeLeft, isActive, fadeAnim, toggleTimer]);

  const completeLinkedTask = useCallback(async (taskId) => {
    if (!taskId || summaryActionBusyRef.current) return;
    summaryActionBusyRef.current = true;
    setSummaryActionBusy(true);
    try {
      const res = await api.patch(`${ENDPOINTS.TASK_BY_ID(taskId)}/complete`, {});
      if (res && typeof res === 'object' && res.success === false) {
        throw new Error(res.message || TEXTS.ERROR_COMPLETE_TASK_MESSAGE);
      }
      await cancelTaskNotifications(taskId);
      setPendingTasks((prev) => prev.filter((t) => t._id !== taskId));
      setFocusTask((prev) => (prev?._id === taskId ? null : prev));
      setSummaryVisible(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Pomodoro: completar tarea desde resumen:', e);
      Alert.alert(
        TEXTS.ERROR_COMPLETE_TASK_TITLE,
        TEXTS.ERROR_COMPLETE_TASK_MESSAGE
      );
    } finally {
      summaryActionBusyRef.current = false;
      setSummaryActionBusy(false);
    }
  }, [TEXTS.ERROR_COMPLETE_TASK_TITLE, TEXTS.ERROR_COMPLETE_TASK_MESSAGE]);

  const loadPendingTasks = useCallback(async () => {
    const gen = ++pendingTasksLoadGenRef.current;
    try {
      setPendingTasksError(null);
      setPendingTasksLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        if (gen === pendingTasksLoadGenRef.current) {
          setPendingTasks([]);
        }
        return;
      }
      const res = await api.get(ENDPOINTS.TASKS_PENDING, {
        type: 'task',
        limit: String(POMODORO_PENDING_TASKS_LIMIT),
      });
      const raw = res?.data;
      const list = Array.isArray(raw) ? raw : [];
      if (gen === pendingTasksLoadGenRef.current) {
        setPendingTasks(sortPomodoroPendingTasks(list));
      }
    } catch (e) {
      console.error('Error cargando tareas pendientes (Pomodoro):', e);
      if (gen === pendingTasksLoadGenRef.current) {
        setPendingTasksError(TEXTS.PENDING_LOAD_ERROR);
      }
    } finally {
      if (gen === pendingTasksLoadGenRef.current) {
        setPendingTasksLoading(false);
      }
    }
  }, [TEXTS.PENDING_LOAD_ERROR]);

  const startFocusFromPendingTask = useCallback(
    async (task) => {
      if (!task?._id) return;

      if (focusTask?._id === task._id) {
        if (!isActive) {
          activateTimer();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        return;
      }

      const requestToken = ++focusFromTaskTokenRef.current;
      setFocusingTaskId(task._id);
      try {
        await api.put(ENDPOINTS.TASK_BY_ID(task._id), { status: 'in_progress' });
      } catch (e) {
        console.error('Error al marcar tarea en curso (Pomodoro):', e);
        Alert.alert(
          TEXTS.ERROR_FOCUS_TITLE,
          TEXTS.ERROR_FOCUS_MESSAGE
        );
        return;
      } finally {
        setFocusingTaskId(null);
      }

      if (requestToken !== focusFromTaskTokenRef.current) {
        return;
      }

      const raw =
        typeof task.estimatedTime === 'number' && task.estimatedTime > 0
          ? task.estimatedTime
          : POMODORO_DEFAULT_TASK_MINUTES;
      const minutes = clampInt(raw, POMODORO_TASK_FOCUS_MIN_MINUTES, POMODORO_TASK_FOCUS_MAX_MINUTES);
      const seconds = minutes * 60;
      modesRef.current.work.time = seconds;
      setPendingTasks((prev) =>
        sortPomodoroPendingTasks(
          prev.map((t) => (t._id === task._id ? { ...t, status: 'in_progress' } : t))
        )
      );
      setFocusTask({
        _id: task._id,
        title: task.title || '',
        minutesPlanned: minutes,
      });
      setMode('work');
      setIsPreparationPhase(false);
      setTimeLeft(seconds);
      progressAnimation.setValue(0);
      setCustomTimeModalVisible(false);
      activateTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [
      focusTask,
      isActive,
      activateTimer,
      progressAnimation,
      TEXTS.ERROR_FOCUS_TITLE,
      TEXTS.ERROR_FOCUS_MESSAGE,
    ]
  );

  useEffect(() => {
    const loadStats = async () => {
      try {
        const saved = await AsyncStorage.getItem(POMODORO_STATS_STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        const todayKey = getTodayKey();
        if (parsed.dateKey !== todayKey) {
          setStats((prev) => ({
            ...prev,
            ...parsed,
            dateKey: todayKey,
            sessionsToday: 0,
            focusedSecondsToday: 0,
          }));
          return;
        }
        setStats((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error cargando estadísticas pomodoro:', e);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const saveStats = async () => {
      try {
        await AsyncStorage.setItem(POMODORO_STATS_STORAGE_KEY, JSON.stringify(stats));
      } catch (e) {
        console.error('Error guardando estadísticas pomodoro:', e);
      }
    };
    saveStats();
  }, [stats]);

  // Navbar hide when active
  useEffect(() => {
    Animated.parallel([
      Animated.timing(navBarAnim.translateY, {
        toValue: isActive ? NAVBAR_TRANSLATE_Y : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(navBarAnim.opacity, {
        toValue: isActive ? BUTTONS_OPACITY_ACTIVE : BUTTONS_OPACITY_INACTIVE,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, navBarAnim]);

  const handleCustomTimerConfirm = useCallback(
    (workMinutes, prepMinutes) => {
      const workSec = (workMinutes || 25) * 60;
      const prepSec = prepMinutes ? prepMinutes * 60 : 0;
      customWorkSecondsRef.current = workSec;
      customPrepSecondsRef.current = prepSec;
      setFocusTask(null);
      if (prepSec > 0) {
        setIsPreparationPhase(true);
        setTimeLeft(prepSec);
      } else {
        setTimeLeft(workSec);
      }
      setMode('custom');
      setCustomTimeModalVisible(false);
      setIsActive(false);
      progressAnimation.setValue(0);
    },
    [progressAnimation]
  );

  return {
    modes,
    isActive,
    timeLeft,
    mode,
    progressAnimation,
    pendingTasks,
    pendingTasksLoading,
    pendingTasksError,
    loadPendingTasks,
    focusTask,
    focusingTaskId,
    startFocusFromPendingTask,
    customTimeModalVisible,
    setCustomTimeModalVisible,
    customMinutes,
    setCustomMinutes,
    prepTimeEnabled,
    setPrepTimeEnabled,
    prepTime,
    setPrepTime,
    quickPresets: QUICK_PRESETS,
    toggleTimer,
    applyQuickPreset,
    resetTimer,
    changeMode,
    primaryActionLabel,
    formatTime,
    buttonsOpacity,
    buttonsScale,
    mainControlsPosition,
    isMeditating,
    navBarAnim,
    fadeAnim,
    handleCustomTimerConfirm,
    dailyGoal,
    sessionsToday: stats.sessionsToday,
    summaryVisible,
    setSummaryVisible,
    summaryData,
    summaryActionBusy,
    completeLinkedTask,
    exitGuardEnabled,
  };
}
