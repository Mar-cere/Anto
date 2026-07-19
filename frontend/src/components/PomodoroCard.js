import React, { useMemo, useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Animated, Easing, Vibration,
  Dimensions, StyleSheet
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardHeader, useCardStylesDynamic } from './common/CardStyles';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { getFocusTheme } from '../styles/focusCardTheme';
import { useSectionTranslations } from '../hooks/useTranslations';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.4;

const WORK_DURATION_SEC = 25 * 60;
const BREAK_DURATION_SEC = 5 * 60;
const DEFAULT_TEXTS = {
  CARD_MODE_WORK_LABEL: 'Tiempo de Trabajo',
  CARD_MODE_WORK_DESCRIPTION: 'Mantén el foco',
  CARD_MODE_BREAK_LABEL: 'Descanso',
  CARD_MODE_BREAK_DESCRIPTION: 'Toma un respiro',
  STATUS_IN_PROGRESS: 'En progreso',
  STATUS_PAUSED: 'Pausado',
  CARD_OPEN_A11Y: 'Abrir Pomodoro',
  CARD_COLLAPSE_A11Y: 'Contraer Pomodoro',
  CARD_PAUSE_A11Y: 'Pausar Pomodoro',
  CARD_START_A11Y: 'Iniciar Pomodoro',
  CARD_COLLAPSE_TEXT: 'Contraer',
  CARD_SESSIONS_LABEL: 'Sesiones',
  CARD_MINUTES_LABEL: 'Minutos',
};

function buildPomodoroModes(colors, texts) {
  return {
    work: {
      time: WORK_DURATION_SEC,
      color: colors.error,
      icon: 'brain',
      label: texts.CARD_MODE_WORK_LABEL,
      description: texts.CARD_MODE_WORK_DESCRIPTION,
    },
    break: {
      time: BREAK_DURATION_SEC,
      color: colors.success,
      icon: 'coffee',
      label: texts.CARD_MODE_BREAK_LABEL,
      description: texts.CARD_MODE_BREAK_DESCRIPTION,
    },
  };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TimerDisplay = memo(({ timeLeft, totalTime, isActive, color, styles, trackColor }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const progress = 1 - (timeLeft / totalTime);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false
    }).start();

    if (isActive) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 500,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [timeLeft, isActive, totalTime, progressAnim, scaleAnim]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * (TIMER_SIZE / 2);
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View style={[
      styles.timerContainer,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
        {/* Círculo de fondo */}
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={(TIMER_SIZE / 2) - 10}
          stroke={trackColor}
          strokeWidth="10"
          fill="transparent"
        />
        {/* Círculo de progreso */}
        <AnimatedCircle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={(TIMER_SIZE / 2) - 10}
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.timerContent}>
        <Text style={[styles.timerText, { color }]}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={styles.timerLabel}>
          {isActive ? 'En progreso' : 'Pausado'}
        </Text>
      </View>
    </Animated.View>
  );
});
TimerDisplay.displayName = 'TimerDisplay';

const ControlButton = memo(({ icon, onPress, color, size = 50, styles, iconColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: color, width: size, height: size }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <MaterialCommunityIcons name={icon} size={size * 0.5} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
});
ControlButton.displayName = 'ControlButton';

const PomodoroCard = memo(({ collapsible = false, defaultExpanded = false }) => {
  const translated = useSectionTranslations('POMODORO');
  const TEXTS = useMemo(
    () => ({
      CARD_MODE_WORK_LABEL:
        translated?.CARD_MODE_WORK_LABEL || DEFAULT_TEXTS.CARD_MODE_WORK_LABEL,
      CARD_MODE_WORK_DESCRIPTION:
        translated?.CARD_MODE_WORK_DESCRIPTION || DEFAULT_TEXTS.CARD_MODE_WORK_DESCRIPTION,
      CARD_MODE_BREAK_LABEL:
        translated?.CARD_MODE_BREAK_LABEL || DEFAULT_TEXTS.CARD_MODE_BREAK_LABEL,
      CARD_MODE_BREAK_DESCRIPTION:
        translated?.CARD_MODE_BREAK_DESCRIPTION || DEFAULT_TEXTS.CARD_MODE_BREAK_DESCRIPTION,
      STATUS_IN_PROGRESS:
        translated?.CARD_STATUS_IN_PROGRESS || DEFAULT_TEXTS.STATUS_IN_PROGRESS,
      STATUS_PAUSED: translated?.CARD_STATUS_PAUSED || DEFAULT_TEXTS.STATUS_PAUSED,
      CARD_OPEN_A11Y: translated?.CARD_OPEN_A11Y || DEFAULT_TEXTS.CARD_OPEN_A11Y,
      CARD_COLLAPSE_A11Y:
        translated?.CARD_COLLAPSE_A11Y || DEFAULT_TEXTS.CARD_COLLAPSE_A11Y,
      CARD_PAUSE_A11Y: translated?.CARD_PAUSE_A11Y || DEFAULT_TEXTS.CARD_PAUSE_A11Y,
      CARD_START_A11Y: translated?.CARD_START_A11Y || DEFAULT_TEXTS.CARD_START_A11Y,
      CARD_COLLAPSE_TEXT:
        translated?.CARD_COLLAPSE_TEXT || DEFAULT_TEXTS.CARD_COLLAPSE_TEXT,
      CARD_SESSIONS_LABEL:
        translated?.CARD_SESSIONS_LABEL || DEFAULT_TEXTS.CARD_SESSIONS_LABEL,
      CARD_MINUTES_LABEL:
        translated?.CARD_MINUTES_LABEL || DEFAULT_TEXTS.CARD_MINUTES_LABEL,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const { cardColors, commonStyles } = useCardStylesDynamic();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const modes = useMemo(() => buildPomodoroModes(colors, TEXTS), [colors, TEXTS]);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION_SEC);
  const [mode, setMode] = useState('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const entryAnim = useRef(new Animated.Value(0)).current;
  const zeroHandledRef = useRef(false);
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);

  // Cargar sesiones completadas al iniciar
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const saved = await AsyncStorage.getItem('pomodoroSessions');
        if (saved) {
          setSessionsCompleted(parseInt(saved));
        }
      } catch (error) {
        console.error('Error loading pomodoro sessions:', error);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entryAnim]);

  // Guardar sesiones completadas
  const saveSessions = async (count) => {
    try {
      await AsyncStorage.setItem('pomodoroSessions', count.toString());
    } catch (error) {
      console.error('Error saving pomodoro sessions:', error);
    }
  };

  // Notificación cuando termina el tiempo
  const notifyTimeUp = useCallback(() => {
    Vibration.vibrate([0, 500, 200, 500]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      zeroHandledRef.current = false;
    }
  }, [timeLeft]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((sec) => sec - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive && !zeroHandledRef.current) {
      zeroHandledRef.current = true;
      notifyTimeUp();
      if (mode === 'work') {
        setSessionsCompleted((c) => {
          const next = c + 1;
          saveSessions(next);
          return next;
        });
      }
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft(modes[nextMode].time);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, notifyTimeUp, modes]);

  useEffect(() => {
    // Si no es colapsable, siempre está expandido.
    if (!collapsible && !expanded) setExpanded(true);
  }, [collapsible, expanded]);

  const formatTimeShort = useCallback((seconds) => {
    const s = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleTogglePlay = useCallback(() => {
    const next = !isActive;
    setIsActive(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Requisito UX: en el dashboard, iniciar/pausar expande.
    if (collapsible && !expanded) setExpanded(true);
  }, [isActive, collapsible, expanded]);

  return (
    <View style={commonStyles.cardContainer}>
      <CardHeader 
        icon={modes[mode].icon}
        title={modes[mode].label}
        onViewAll={() => navigation.navigate('Techniques')}
      />

      {collapsible && !expanded ? (
        <TouchableOpacity
          style={styles.compactRow}
          onPress={() => setExpanded(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.CARD_OPEN_A11Y}
        >
          <View style={styles.compactLeft}>
            <View style={styles.compactChip}>
              <MaterialCommunityIcons
                name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                size={14}
                color={t.FOCUS_KICKER_COLOR}
              />
              <Text style={styles.compactChipText}>
                {isActive ? TEXTS.STATUS_IN_PROGRESS : TEXTS.STATUS_PAUSED}
              </Text>
            </View>
            <Text style={styles.compactTime}>{formatTimeShort(timeLeft)}</Text>
          </View>
          <View style={styles.compactRight}>
            <TouchableOpacity
              style={[styles.compactPlayBtn, { backgroundColor: modes[mode].color }]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleTogglePlay();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isActive ? TEXTS.CARD_PAUSE_A11Y : TEXTS.CARD_START_A11Y}
            >
              <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={18} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <MaterialCommunityIcons name="chevron-down" size={18} color={t.FOCUS_META} />
          </View>
        </TouchableOpacity>
      ) : (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: entryAnim,
              transform: [
                {
                  translateY: entryAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {collapsible ? (
            <TouchableOpacity
              style={styles.collapseHandle}
              onPress={() => setExpanded(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CARD_COLLAPSE_A11Y}
            >
              <Text style={styles.collapseHandleText}>{TEXTS.CARD_COLLAPSE_TEXT}</Text>
              <MaterialCommunityIcons name="chevron-up" size={18} color={t.FOCUS_META} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons
                name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                size={14}
                color={t.FOCUS_KICKER_COLOR}
              />
              <Text style={styles.metaChipText}>
                {isActive ? TEXTS.STATUS_IN_PROGRESS : TEXTS.STATUS_PAUSED}
              </Text>
            </View>
            <Text style={styles.descriptionText}>{modes[mode].description}</Text>
          </View>
          <TimerDisplay 
            timeLeft={timeLeft}
            totalTime={modes[mode].time}
            isActive={isActive}
            color={modes[mode].color}
            styles={styles}
            trackColor={colors.glassOutline}
          />

          <View style={styles.controlsContainer}>
            <ControlButton 
              icon={isActive ? 'pause' : 'play'}
              onPress={handleTogglePlay}
              color={modes[mode].color}
              size={60}
              styles={styles}
              iconColor={colors.textOnPrimary}
            />
            <ControlButton 
              icon="restart"
              onPress={() => {
                setTimeLeft(modes[mode].time);
                setIsActive(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              color={colors.accentLineSoft}
              size={46}
              styles={styles}
              iconColor={colors.text}
            />
            <ControlButton 
              icon={mode === 'work' ? 'coffee' : 'brain'}
              onPress={() => {
                setMode(mode === 'work' ? 'break' : 'work');
                setTimeLeft(modes[mode === 'work' ? 'break' : 'work'].time);
                setIsActive(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              color={colors.accentLineSoft}
              size={46}
              styles={styles}
              iconColor={colors.text}
            />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color={cardColors.success} 
              />
              <Text style={styles.statValue}>{sessionsCompleted}</Text>
              <Text style={styles.statLabel}>{TEXTS.CARD_SESSIONS_LABEL}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons 
                name="timer-outline" 
                size={20} 
                color={modes[mode].color} 
              />
              <Text style={styles.statValue}>
                {Math.floor((modes[mode].time - timeLeft) / 60)}
              </Text>
              <Text style={styles.statLabel}>{TEXTS.CARD_MINUTES_LABEL}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
});
PomodoroCard.displayName = 'PomodoroCard';

const createStyles = (colors, t) => ({
  contentContainer: {
    alignItems: 'center',
    gap: 22,
    paddingVertical: SPACING.CARD_INNER_INSET,
  },
  collapseHandle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: -4,
  },
  collapseHandleText: {
    color: t.FOCUS_META,
    fontSize: 13,
    fontWeight: '500',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.CARD_INNER_INSET,
    paddingHorizontal: SPACING.CARD_INNER_INSET,
    borderRadius: 14,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  compactLeft: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.sm,
  },
  compactChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  compactChipText: {
    color: t.FOCUS_KICKER_COLOR,
    fontSize: 12,
    fontWeight: '500',
  },
  compactTime: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.CARD_INNER_INSET,
  },
  compactPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  metaChipText: {
    color: t.FOCUS_KICKER_COLOR,
    fontSize: 12,
    fontWeight: '500',
  },
  descriptionText: {
    color: t.FOCUS_META,
    fontSize: 12,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 13,
    color: t.FOCUS_META,
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: SPACING.CARD_INNER_INSET,
    paddingTop: SPACING.CARD_INNER_INSET,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.FOCUS_BORDER_SUBTLE,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: t.FOCUS_META,
  },
});

export default PomodoroCard;
