/**
 * Pantalla de Pomodoro
 * 
 * Permite a los usuarios gestionar sesiones de trabajo usando la técnica Pomodoro,
 * con diferentes modos (trabajo, descanso, meditación) y gestión de tareas.
 * Incluye timer personalizado, notificaciones y animaciones.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import FloatingNavBar from '../components/FloatingNavBar';
import MeditationView from '../components/MeditationView';
import { colors } from '../styles/globalStyles';
import { sendImmediateNotification } from '../utils/notifications';

// Constantes de tiempo (en segundos)
const WORK_TIME = 25 * 60; // 25 minutos
const BREAK_TIME = 5 * 60; // 5 minutos
const LONG_BREAK_TIME = 15 * 60; // 15 minutos
const MEDITATION_TIME = 10 * 60; // 10 minutos
const DEFAULT_CUSTOM_TIME = 25 * 60; // 25 minutos por defecto
const DEFAULT_PREP_TIME = 3 * 60; // 3 minutos por defecto
const INTERVAL_DURATION = 1000; // 1 segundo
const WARNING_TIME = 10; // 10 segundos antes de finalizar

// Constantes de animación
const ANIMATION_DURATION = 300; // ms
const FADE_ANIMATION_DURATION = 150; // ms
const MODE_TRANSITION_DURATION = 300; // ms
const PROGRESS_ANIMATION_DURATION = 1000; // ms
const NAVBAR_TRANSLATE_Y = 100;
const BUTTONS_SCALE_ACTIVE = 0.5;
const BUTTONS_OPACITY_ACTIVE = 0;
const BUTTONS_OPACITY_INACTIVE = 1;
const BUTTONS_SCALE_INACTIVE = 1;
const FADE_OPACITY_MIN = 0.5;
const FADE_OPACITY_MAX = 1;
const MAIN_CONTROLS_TRANSLATE_X = 80;
const MODE_TRANSITION_DELAY = 150; // ms

// Constantes de colores
const COLORS = {
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

// Constantes de textos
const TEXTS = {
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

// Constantes de mensajes motivacionales
const MOTIVATIONAL_MESSAGES = [
  "¡Excelente trabajo! 💪",
  "¡Sigue así! 🌟",
  "¡Una sesión más completada! 🎯",
  "¡Tu concentración mejora cada día! 🧠",
  "¡Vas por buen camino! ✨"
];

// Constantes de estilos
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = colors.background;
const STORAGE_KEY = 'pomodoroTasks';
const DEFAULT_CUSTOM_MINUTES = '25';
const DEFAULT_PREP_MINUTES = '3';
const MAX_CUSTOM_MINUTES_LENGTH = 3;
const MAX_PREP_MINUTES_LENGTH = 2;
const BREATH_CYCLE = 4; // 4 segundos inhalar, 4 segundos exhalar

// Constantes de vibración
const VIBRATION_PATTERN = [0, 500, 200, 500];

// Constantes de tamaños
const ICON_SIZE = 24;
const HEADER_ICON_SIZE = 28;
const CHECKBOX_ICON_SIZE = 24;
const DELETE_ICON_SIZE = 20;
const EMPTY_ICON_SIZE = 48;
const TIMER_FONT_SIZE = 72;
const MODE_LABEL_FONT_SIZE = 20;
const TITLE_FONT_SIZE = 18;
const MODAL_TITLE_FONT_SIZE = 20;
const INPUT_FONT_SIZE = 16;
const TIME_INPUT_FONT_SIZE = 24;
const BUTTON_SIZE = 48;
const BUTTON_BORDER_RADIUS = 24;
const PROGRESS_BAR_HEIGHT = 4;
const PROGRESS_BAR_BORDER_RADIUS = 2;
const MODAL_MAX_WIDTH = 400;
const MODAL_WIDTH_PERCENT = '90%';
const MEDITATION_BUTTON_WIDTH_PERCENT = '80%';
const CONTAINER_PADDING_BOTTOM = 85;
const HEADER_PADDING = 16;
const CONTENT_PADDING = 16;
const TIMER_SECTION_MARGIN_VERTICAL = 24;
const MODE_LABEL_MARGIN_BOTTOM = 16;
const PROGRESS_BAR_MARGIN_TOP = 24;
const CONTROLS_MARGIN_BOTTOM = 24;
const CONTROLS_GAP = 8;
const ADDITIONAL_CONTROLS_MARGIN_LEFT = 8;
const TASKS_SECTION_PADDING = 16;
const TASKS_SECTION_BORDER_RADIUS = 16;
const TITLE_MARGIN_BOTTOM = 16;
const INPUT_CONTAINER_MARGIN_BOTTOM = 16;
const INPUT_HEIGHT = 48;
const INPUT_BORDER_RADIUS = 12;
const INPUT_PADDING_HORIZONTAL = 16;
const TASK_LIST_GAP = 8;
const TASK_ITEM_PADDING = 12;
const TASK_ITEM_BORDER_RADIUS = 12;
const CHECKBOX_MARGIN_RIGHT = 12;
const DELETE_BUTTON_MARGIN_LEFT = 12;
const TASK_HEADER_MARGIN_BOTTOM = 16;
const CLEAR_BUTTON_PADDING = 8;
const CLEAR_BUTTON_BORDER_RADIUS = 8;
const CLEAR_BUTTON_MARGIN_TOP = 8;
const EMPTY_STATE_PADDING = 24;
const EMPTY_STATE_TEXT_MARGIN_TOP = 8;
const MODAL_OVERLAY_PADDING = 24;
const MODAL_CONTENT_PADDING = 24;
const MODAL_TITLE_MARGIN_BOTTOM = 24;
const INPUT_GROUP_MARGIN_BOTTOM = 24;
const INPUT_LABEL_MARGIN_BOTTOM = 8;
const TIME_INPUT_CONTAINER_GAP = 8;
const TIME_INPUT_WIDTH = 100;
const TIME_INPUT_PADDING = 16;
const TIME_INPUT_BORDER_RADIUS = 12;
const PREP_TIME_CONTAINER_MARGIN_BOTTOM = 24;
const PREP_TIME_HEADER_MARGIN_BOTTOM = 16;
const MODAL_BUTTONS_GAP = 16;
const MODAL_BUTTON_PADDING = 16;
const MODAL_BUTTON_BORDER_RADIUS = 12;
const MEDITATION_BUTTON_CONTAINER_PADDING_HORIZONTAL = 16;
const MEDITATION_BUTTON_PADDING_VERTICAL = 12;
const MEDITATION_BUTTON_PADDING_HORIZONTAL = 24;
const MEDITATION_BUTTON_GAP = 8;
const MEDITATION_BUTTON_BORDER_RADIUS = 24;
const MEDITATION_BUTTON_BORDER_WIDTH = 1;
const HEADER_GAP = 12;
const HEADER_BORDER_WIDTH = 1;

const PomodoroScreen = () => {
  const navigation = useNavigation();
  
  // Estados del timer
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [mode, setMode] = useState('work');
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Estados de las tareas
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState([]);

  // Estados del modal de timer personalizado
  const [customTimeModalVisible, setCustomTimeModalVisible] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_CUSTOM_MINUTES);
  const [prepTimeEnabled, setPrepTimeEnabled] = useState(false);
  const [prepTime, setPrepTime] = useState(DEFAULT_PREP_MINUTES);
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);

  // Agregar estos nuevos estados para la animación
  const [buttonsOpacity] = useState(new Animated.Value(1));
  const [buttonsScale] = useState(new Animated.Value(1));
  const [mainControlsPosition] = useState(new Animated.Value(0));

  // Agregar estados para la animación de respiración
  const [isMeditating, setIsMeditating] = useState(false);

  // Agregar estado para la animación del navbar
  const [navBarAnim] = useState({
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1)
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Modos del timer
  const modes = {
    work: {
      time: WORK_TIME,
      color: COLORS.WORK,
      icon: 'brain',
      label: TEXTS.WORK
    },
    break: {
      time: BREAK_TIME,
      color: COLORS.BREAK,
      icon: 'coffee',
      label: TEXTS.BREAK
    },
    longBreak: {
      time: LONG_BREAK_TIME,
      color: COLORS.LONG_BREAK,
      icon: 'beach',
      label: TEXTS.LONG_BREAK
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
      label: TEXTS.CUSTOM
    }
  };

  // Funciones del timer
  const toggleTimer = useCallback(() => {
    setIsActive(prev => {
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
        })
      ]).start();

      return willBeActive;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [buttonsOpacity, buttonsScale, mainControlsPosition]);

  // Resetear timer
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(modes[mode].time);
    progressAnimation.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [mode, progressAnimation]);

  // Cambiar modo
  const toggleMode = useCallback(() => {
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
    progressAnimation.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [mode, progressAnimation]);

  // Cambiar a modo específico
  const changeMode = useCallback((newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
    progressAnimation.setValue(0);
  }, [progressAnimation]);

  // Efecto del timer
  useEffect(() => {
    let interval = null;
    
    setIsMeditating(mode === 'meditation' && isActive);

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          const newTime = time - 1;
          const progress = 1 - (newTime / modes[mode].time);
          Animated.timing(progressAnimation, {
            toValue: progress,
            duration: PROGRESS_ANIMATION_DURATION,
            useNativeDriver: false
          }).start();
          return newTime;
        });
      }, INTERVAL_DURATION);
    } else if (timeLeft === 0) {
      sendImmediateNotification(
        TEXTS.POMODORO_COMPLETED,
        TEXTS.POMODORO_COMPLETED_MESSAGE
      );
      if (mode === 'meditation') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate(VIBRATION_PATTERN);
      }
      const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      Alert.alert(TEXTS.SESSION_COMPLETED, message);
      toggleMode();
    }

    return () => {
      clearInterval(interval);
      setIsMeditating(false);
    };
  }, [isActive, timeLeft, mode, progressAnimation, toggleMode]);

  // Efecto para animación de advertencia
  useEffect(() => {
    if (timeLeft <= WARNING_TIME && timeLeft > 0 && isActive) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: FADE_OPACITY_MIN,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: FADE_OPACITY_MAX,
          duration: 500,
          useNativeDriver: true
        })
      ]).start(() => {
        if (timeLeft > 1) {
          toggleTimer();
        }
      });
    }
  }, [timeLeft, isActive, fadeAnim, toggleTimer]);

  // Funciones de tareas
  const handleAddTask = () => {
    if (inputText.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: inputText.trim(),
        completed: false
      }]);
      setInputText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const completed = !task.completed;
        if (completed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return { ...task, completed };
      }
      return task;
    }));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Efecto para guardar tareas
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('Error guardando tareas:', error);
      }
    };
    saveTasks();
  }, [tasks]);

  // Efecto para cargar tareas guardadas
  useEffect(() => {
    const loadSavedTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.error('Error cargando tareas:', error);
      }
    };
    loadSavedTasks();
  }, []);

  const completedTasks = tasks.filter(task => task.completed).length;

  const clearCompletedTasks = () => {
    setTasks(tasks.filter(task => !task.completed));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Componente para el modal de timer personalizado
  const CustomTimerModal = () => (
    <Modal
      visible={customTimeModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setCustomTimeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{TEXTS.MODAL_TITLE}</Text>
          
          {/* Tiempo principal */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{TEXTS.WORK_LABEL}</Text>
            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                value={customMinutes}
                onChangeText={text => {
                  const numbers = text.replace(/[^0-9]/g, '');
                  setCustomMinutes(numbers);
                }}
                keyboardType="number-pad"
                maxLength={MAX_CUSTOM_MINUTES_LENGTH}
                placeholder={DEFAULT_CUSTOM_MINUTES}
                placeholderTextColor={COLORS.ACCENT}
              />
              <Text style={styles.timeUnit}>{TEXTS.MINUTES}</Text>
            </View>
          </View>

          {/* Opción de tiempo de preparación */}
          <View style={styles.prepTimeContainer}>
            <View style={styles.prepTimeHeader}>
              <Text style={styles.prepTimeLabel}>{TEXTS.PREP_TIME_LABEL}</Text>
              <Switch
                value={prepTimeEnabled}
                onValueChange={setPrepTimeEnabled}
                trackColor={{ false: COLORS.SWITCH_TRACK_FALSE, true: COLORS.SWITCH_TRACK_TRUE }}
                thumbColor={prepTimeEnabled ? COLORS.SWITCH_THUMB_TRUE : COLORS.SWITCH_THUMB_FALSE}
              />
            </View>
            
            {prepTimeEnabled && (
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  value={prepTime}
                  onChangeText={text => {
                    const numbers = text.replace(/[^0-9]/g, '');
                    setPrepTime(numbers);
                  }}
                  keyboardType="number-pad"
                  maxLength={MAX_PREP_MINUTES_LENGTH}
                  placeholder={DEFAULT_PREP_MINUTES}
                  placeholderTextColor={COLORS.ACCENT}
                />
                <Text style={styles.timeUnit}>{TEXTS.MINUTES}</Text>
              </View>
            )}
          </View>

          {/* Botones */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setCustomTimeModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>{TEXTS.CANCEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => {
                const workMinutes = parseInt(customMinutes) || parseInt(DEFAULT_CUSTOM_MINUTES);
                const preparationMinutes = prepTimeEnabled ? (parseInt(prepTime) || parseInt(DEFAULT_PREP_MINUTES)) : 0;
                
                if (prepTimeEnabled) {
                  setIsPreparationPhase(true);
                  setTimeLeft(preparationMinutes * 60);
                  modes.custom.prepTime = preparationMinutes * 60;
                } else {
                  setTimeLeft(workMinutes * 60);
                }
                
                modes.custom.time = workMinutes * 60;
                setMode('custom');
                setCustomTimeModalVisible(false);
                setIsActive(false);
                progressAnimation.setValue(0);
              }}
            >
              <Text style={styles.modalButtonText}>{TEXTS.START}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Efecto para ocultar/mostrar el navbar cuando se activa el timer
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
      })
    ]).start();
  }, [isActive, navBarAnim]);

  // Programar notificación del siguiente Pomodoro
  const scheduleNextPomodoroNotification = async (minutes) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: TEXTS.NOTIFICATION_TITLE,
        body: TEXTS.NOTIFICATION_BODY,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: minutes * 60,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
      <View style={styles.headerContainer}>
        <StatusBar barStyle={STATUS_BAR_STYLE} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons 
              name="timer-outline" 
              size={HEADER_ICON_SIZE} 
              color={COLORS.PRIMARY} 
            />
            <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
          </View>
        </View>
      </View>
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          {/* Timer Section */}
          <View style={styles.timerSection}>
            {mode === 'meditation' && isMeditating ? (
              <MeditationView />
            ) : (
              <>
                <Animated.Text style={[styles.modeLabel, { color: modes[mode].color, opacity: fadeAnim }]}>
                  {modes[mode].label}
                </Animated.Text>
                <Animated.Text style={[styles.timerText, { color: modes[mode].color, opacity: fadeAnim }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </>
            )}
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }),
                    backgroundColor: modes[mode].color
                  }
                ]} 
              />
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {/* Primera fila de controles */}
            <Animated.View style={[
              styles.allControls,
              {
                transform: [{
                  translateX: mainControlsPosition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, MAIN_CONTROLS_TRANSLATE_X]
                  })
                }]
              }
            ]}>
              {/* Botones principales */}
              <View style={styles.mainControls}>
                <TouchableOpacity 
                  style={[
                    styles.controlButton, 
                    { backgroundColor: isActive ? COLORS.PAUSE : modes[mode].color }
                  ]}
                  onPress={toggleTimer}
                >
                  <MaterialCommunityIcons 
                    name={isActive ? 'pause' : 'play'} 
                    size={ICON_SIZE} 
                    color={COLORS.WHITE} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.controlButton, styles.resetButton]}
                  onPress={resetTimer}
                >
                  <MaterialCommunityIcons 
                    name="restart" 
                    size={ICON_SIZE} 
                    color={COLORS.WHITE} 
                  />
                </TouchableOpacity>
              </View>

              {/* Botones adicionales */}
              <Animated.View 
                style={[
                  styles.additionalControls,
                  {
                    opacity: buttonsOpacity,
                    transform: [{ scale: buttonsScale }],
                    pointerEvents: isActive ? 'none' : 'auto'
                  }
                ]}
              >
                <TouchableOpacity 
                  style={[
                    styles.controlButton, 
                    mode === 'break' && { backgroundColor: modes.break.color }
                  ]}
                  onPress={() => changeMode('break')}
                >
                  <MaterialCommunityIcons 
                    name="coffee" 
                    size={ICON_SIZE} 
                    color={mode === 'break' ? COLORS.WHITE : COLORS.BREAK} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.controlButton, 
                    mode === 'longBreak' && { backgroundColor: modes.longBreak.color }
                  ]}
                  onPress={() => changeMode('longBreak')}
                >
                  <MaterialCommunityIcons 
                    name="beach" 
                    size={ICON_SIZE} 
                    color={mode === 'longBreak' ? COLORS.WHITE : COLORS.LONG_BREAK} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.controlButton, 
                    mode === 'custom' && { backgroundColor: modes.custom.color }
                  ]}
                  onPress={() => setCustomTimeModalVisible(true)}
                >
                  <MaterialCommunityIcons 
                    name="clock-edit" 
                    size={ICON_SIZE} 
                    color={mode === 'custom' ? COLORS.WHITE : COLORS.CUSTOM} 
                  />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Segunda fila - Botón de meditación */}
            <Animated.View style={[
              styles.meditationButtonContainer,
              {
                opacity: buttonsOpacity,
                transform: [{ scale: buttonsScale }],
                pointerEvents: isActive ? 'none' : 'auto'
              }
            ]}>
              <TouchableOpacity 
                style={[
                  styles.meditationButton,
                  mode === 'meditation' && { backgroundColor: modes.meditation.color }
                ]}
                onPress={() => changeMode('meditation')}
              >
                <MaterialCommunityIcons 
                  name="meditation" 
                  size={ICON_SIZE} 
                  color={mode === 'meditation' ? COLORS.WHITE : COLORS.MEDITATION} 
                />
                <Text style={[
                  styles.meditationButtonText,
                  mode === 'meditation' && { color: COLORS.WHITE }
                ]}>
                  {TEXTS.MEDITATION}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Tasks Section */}
          <View style={styles.tasksSection}>
            <View style={styles.taskHeader}>
              <Text style={styles.title}>{TEXTS.TASKS_TITLE}</Text>
              <Text style={styles.taskCount}>
                {completedTasks}/{tasks.length}
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={TEXTS.NEW_TASK_PLACEHOLDER}
                placeholderTextColor={COLORS.ACCENT}
                autoCapitalize="sentences"
                onSubmitEditing={handleAddTask}
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddTask}
              >
                <MaterialCommunityIcons 
                  name="plus" 
                  size={ICON_SIZE} 
                  color={COLORS.WHITE} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.taskList}>
              {[...tasks]
                .sort((a, b) => {
                  if (a.completed === b.completed) return 0;
                  return a.completed ? 1 : -1;
                })
                .map(task => (
                  <View key={task.id} style={styles.taskItem}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => toggleTask(task.id)}
                    >
                      <MaterialCommunityIcons
                        name={task.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={CHECKBOX_ICON_SIZE}
                        color={task.completed ? COLORS.SUCCESS : COLORS.ACCENT}
                      />
                    </TouchableOpacity>
                    <Text style={[
                      styles.taskText,
                      task.completed && styles.completedText
                    ]}>
                      {task.text}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={DELETE_ICON_SIZE}
                        color={COLORS.ERROR}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>

            {tasks.some(task => task.completed) && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearCompletedTasks}
              >
                <Text style={styles.clearButtonText}>{TEXTS.CLEAR_COMPLETED}</Text>
              </TouchableOpacity>
            )}

            {tasks.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="clipboard-text-outline" 
                  size={EMPTY_ICON_SIZE} 
                  color={COLORS.ACCENT} 
                />
                <Text style={styles.emptyStateText}>
                  {TEXTS.EMPTY_TASKS}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Agregar el modal al final del componente */}
        <CustomTimerModal />
      </View>
      <FloatingNavBar 
        activeTab="home"
        animValues={navBarAnim}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingBottom: CONTAINER_PADDING_BOTTOM,
  },
  headerContainer: {
    borderBottomWidth: HEADER_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: HEADER_PADDING,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_GAP,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: TIMER_SECTION_MARGIN_VERTICAL,
  },
  modeLabel: {
    fontSize: MODE_LABEL_FONT_SIZE,
    fontWeight: '600',
    marginBottom: MODE_LABEL_MARGIN_BOTTOM,
  },
  timerText: {
    fontSize: TIMER_FONT_SIZE,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    width: '100%',
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: COLORS.PROGRESS_BACKGROUND,
    borderRadius: PROGRESS_BAR_BORDER_RADIUS,
    marginTop: PROGRESS_BAR_MARGIN_TOP,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: PROGRESS_BAR_BORDER_RADIUS,
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: CONTROLS_MARGIN_BOTTOM,
  },
  allControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: CONTROLS_GAP,
    marginBottom: 16,
  },
  mainControls: {
    flexDirection: 'row',
    gap: CONTROLS_GAP,
  },
  additionalControls: {
    flexDirection: 'row',
    gap: CONTROLS_GAP,
    marginLeft: ADDITIONAL_CONTROLS_MARGIN_LEFT,
  },
  controlButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BUTTON_BACKGROUND,
  },
  resetButton: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
  },
  tasksSection: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: TASKS_SECTION_BORDER_RADIUS,
    padding: TASKS_SECTION_PADDING,
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: TITLE_MARGIN_BOTTOM,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: INPUT_CONTAINER_MARGIN_BOTTOM,
    gap: CONTROLS_GAP,
  },
  input: {
    flex: 1,
    height: INPUT_HEIGHT,
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
  },
  addButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: INPUT_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskList: {
    gap: TASK_LIST_GAP,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: TASK_ITEM_BORDER_RADIUS,
    padding: TASK_ITEM_PADDING,
  },
  checkbox: {
    marginRight: CHECKBOX_MARGIN_RIGHT,
  },
  taskText: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
  },
  completedText: {
    color: COLORS.ACCENT,
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    marginLeft: DELETE_BUTTON_MARGIN_LEFT,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASK_HEADER_MARGIN_BOTTOM,
  },
  taskCount: {
    color: COLORS.ACCENT,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: COLORS.CLEAR_BUTTON_BACKGROUND,
    padding: CLEAR_BUTTON_PADDING,
    borderRadius: CLEAR_BUTTON_BORDER_RADIUS,
    alignSelf: 'flex-end',
    marginTop: CLEAR_BUTTON_MARGIN_TOP,
  },
  clearButtonText: {
    color: COLORS.ERROR,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: EMPTY_STATE_PADDING,
  },
  emptyStateText: {
    color: COLORS.ACCENT,
    fontSize: INPUT_FONT_SIZE,
    marginTop: EMPTY_STATE_TEXT_MARGIN_TOP,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.MODAL_BACKGROUND,
    borderRadius: TASKS_SECTION_BORDER_RADIUS,
    padding: MODAL_CONTENT_PADDING,
    width: MODAL_WIDTH_PERCENT,
    maxWidth: MODAL_MAX_WIDTH,
  },
  modalTitle: {
    fontSize: MODAL_TITLE_FONT_SIZE,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: MODAL_TITLE_MARGIN_BOTTOM,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: INPUT_GROUP_MARGIN_BOTTOM,
  },
  inputLabel: {
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
    marginBottom: INPUT_LABEL_MARGIN_BOTTOM,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TIME_INPUT_CONTAINER_GAP,
  },
  timeInput: {
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: TIME_INPUT_BORDER_RADIUS,
    padding: TIME_INPUT_PADDING,
    fontSize: TIME_INPUT_FONT_SIZE,
    color: COLORS.WHITE,
    width: TIME_INPUT_WIDTH,
    textAlign: 'center',
  },
  timeUnit: {
    color: COLORS.ACCENT,
    fontSize: INPUT_FONT_SIZE,
  },
  prepTimeContainer: {
    marginBottom: PREP_TIME_CONTAINER_MARGIN_BOTTOM,
  },
  prepTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PREP_TIME_HEADER_MARGIN_BOTTOM,
  },
  prepTimeLabel: {
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: MODAL_BUTTONS_GAP,
  },
  modalButton: {
    flex: 1,
    padding: MODAL_BUTTON_PADDING,
    borderRadius: MODAL_BUTTON_BORDER_RADIUS,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
  },
  confirmButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: INPUT_FONT_SIZE,
    fontWeight: '500',
  },
  meditationButtonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: MEDITATION_BUTTON_CONTAINER_PADDING_HORIZONTAL,
  },
  meditationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.MEDITATION_BUTTON_BACKGROUND,
    borderRadius: MEDITATION_BUTTON_BORDER_RADIUS,
    paddingVertical: MEDITATION_BUTTON_PADDING_VERTICAL,
    paddingHorizontal: MEDITATION_BUTTON_PADDING_HORIZONTAL,
    gap: MEDITATION_BUTTON_GAP,
    width: MEDITATION_BUTTON_WIDTH_PERCENT,
    borderWidth: MEDITATION_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.MEDITATION_BUTTON_BORDER,
  },
  meditationButtonText: {
    color: COLORS.MEDITATION,
    fontSize: INPUT_FONT_SIZE,
    fontWeight: '500',
  },
});

export default PomodoroScreen;
