/**
 * Hook con la lógica de la pantalla Pomodoro (timer, modos, tareas, modal personalizado).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Vibration } from 'react-native';
import { getModes } from '../screens/pomodoro/pomodoroScreenConstants';
import {
  ANIMATION_DURATION,
  BUTTONS_OPACITY_ACTIVE,
  BUTTONS_OPACITY_INACTIVE,
  BUTTONS_SCALE_ACTIVE,
  BUTTONS_SCALE_INACTIVE,
  DEFAULT_CUSTOM_MINUTES,
  DEFAULT_PREP_MINUTES,
  INTERVAL_DURATION,
  MOTIVATIONAL_MESSAGES,
  NAVBAR_TRANSLATE_Y,
  PROGRESS_ANIMATION_DURATION,
  STORAGE_KEY,
  TEXTS,
  VIBRATION_PATTERN,
  WARNING_TIME,
} from '../screens/pomodoro/pomodoroScreenConstants';
import { sendImmediateNotification } from '../utils/notifications';

export function usePomodoroScreen() {
  const modesRef = useRef(getModes());
  const modes = modesRef.current;

  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(modes.work.time);
  const [mode, setMode] = useState('work');
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState([]);

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
  const [navBarAnim] = useState(() => ({
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }));
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => {
      const willBeActive = !prev;
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
      return willBeActive;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [buttonsOpacity, buttonsScale, mainControlsPosition]);

  const getCurrentModeTime = useCallback(() => {
    if (mode === 'custom') {
      return isPreparationPhase ? customPrepSecondsRef.current : customWorkSecondsRef.current;
    }
    return modes[mode].time;
  }, [mode, isPreparationPhase]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    const baseTime = mode === 'custom'
      ? (isPreparationPhase ? customPrepSecondsRef.current : customWorkSecondsRef.current)
      : modes[mode].time;
    setTimeLeft(baseTime);
    progressAnimation.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [mode, isPreparationPhase, progressAnimation]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
    progressAnimation.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [mode, progressAnimation]);

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
    [progressAnimation]
  );

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        const message =
          MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
        Alert.alert(TEXTS.SESSION_COMPLETED, message);
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

  const handleAddTask = useCallback(() => {
    if (inputText.trim()) {
      setTasks((prev) => [
        ...prev,
        { id: Date.now(), text: inputText.trim(), completed: false },
      ]);
      setInputText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [inputText]);

  const toggleTask = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const completed = !task.completed;
          if (completed) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return { ...task, completed };
        }
        return task;
      })
    );
  }, []);

  const deleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {
        console.error('Error guardando tareas:', e);
      }
    };
    saveTasks();
  }, [tasks]);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando tareas:', e);
      }
    };
    load();
  }, []);

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

  const completedTasksCount = tasks.filter((t) => t.completed).length;

  return {
    modes,
    isActive,
    timeLeft,
    mode,
    progressAnimation,
    inputText,
    setInputText,
    tasks,
    customTimeModalVisible,
    setCustomTimeModalVisible,
    customMinutes,
    setCustomMinutes,
    prepTimeEnabled,
    setPrepTimeEnabled,
    prepTime,
    setPrepTime,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime,
    handleAddTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    completedTasksCount,
    buttonsOpacity,
    buttonsScale,
    mainControlsPosition,
    isMeditating,
    navBarAnim,
    fadeAnim,
    handleCustomTimerConfirm,
  };
}
