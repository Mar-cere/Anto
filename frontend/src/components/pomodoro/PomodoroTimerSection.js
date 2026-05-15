/**
 * Sección del timer (etiqueta de modo, tiempo, barra de progreso) y vista de meditación.
 * @author AntoApp Team
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MeditationView from '../MeditationView';
import { useTheme } from '../../context/ThemeContext';
import {
  MODE_LABEL_FONT_SIZE,
  MODE_LABEL_MARGIN_BOTTOM,
  POMODORO_INNER_INSET,
  PROGRESS_BAR_BORDER_RADIUS,
  PROGRESS_BAR_HEIGHT,
  PROGRESS_BAR_MARGIN_TOP,
  TIMER_FONT_SIZE,
  TIMER_SECTION_MARGIN_VERTICAL,
  createPomodoroColors,
} from '../../screens/pomodoro/pomodoroScreenConstants';
import { getFocusTheme } from '../../styles/focusCardTheme';

export default function PomodoroTimerSection({
  mode,
  modes,
  timeLeft,
  formatTime,
  progressAnimation,
  fadeAnim,
  isMeditating,
  density = 'comfortable',
}) {
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const PC = useMemo(() => createPomodoroColors(colors), [colors]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        timerSection: {
          alignItems: 'center',
          marginVertical: TIMER_SECTION_MARGIN_VERTICAL,
        },
        modeLabel: {
          fontSize: MODE_LABEL_FONT_SIZE,
          fontWeight: '500',
          letterSpacing: -0.2,
          lineHeight: 24,
          textAlign: 'center',
          includeFontPadding: false,
        },
        modePill: {
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 999,
          paddingHorizontal: POMODORO_INNER_INSET,
          paddingVertical: 8,
          minHeight: 42,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: MODE_LABEL_MARGIN_BOTTOM,
        },
        modeLabelCompact: {
          fontSize: 18,
          lineHeight: 22,
        },
        timerText: {
          fontSize: TIMER_FONT_SIZE,
          fontWeight: 'bold',
          fontVariant: ['tabular-nums'],
        },
        timerTextCompact: {
          fontSize: 60,
        },
        progressBar: {
          width: '100%',
          height: PROGRESS_BAR_HEIGHT,
          backgroundColor: PC.PROGRESS_BACKGROUND,
          borderRadius: PROGRESS_BAR_BORDER_RADIUS,
          marginTop: PROGRESS_BAR_MARGIN_TOP,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        progressBarCompact: {
          marginTop: 16,
        },
        progressFill: {
          height: '100%',
          borderRadius: PROGRESS_BAR_BORDER_RADIUS,
        },
        milestone: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: StyleSheet.hairlineWidth,
          left: '25%',
          backgroundColor: colors.border,
        },
        milestone50: {
          left: '50%',
        },
        milestone75: {
          left: '75%',
        },
      }),
    [colors, t, PC],
  );

  const modeTone = `${modes[mode].color}22`;
  const modeTransition = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    modeTransition.setValue(0);
    Animated.timing(modeTransition, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [mode, modeTransition]);

  if (mode === 'meditation' && isMeditating) {
    return (
      <View style={styles.timerSection}>
        <MeditationView />
      </View>
    );
  }

  return (
    <View style={styles.timerSection}>
      <Animated.View
        style={[
          styles.modePill,
          { backgroundColor: modeTone, borderColor: `${modes[mode].color}44` },
          {
            opacity: Animated.multiply(fadeAnim, modeTransition),
            transform: [
              {
                translateY: modeTransition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.modeLabel,
            density === 'compact' && styles.modeLabelCompact,
            { color: modes[mode].color },
          ]}
        >
          {modes[mode].label}
        </Animated.Text>
      </Animated.View>
      <Animated.Text
        style={[
          styles.timerText,
          density === 'compact' && styles.timerTextCompact,
          {
            color: modes[mode].color,
            opacity: Animated.multiply(fadeAnim, modeTransition),
            transform: [
              {
                translateY: modeTransition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        {formatTime(timeLeft)}
      </Animated.Text>
      <View style={[styles.progressBar, density === 'compact' && styles.progressBarCompact]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: modes[mode].color,
            },
          ]}
        />
        <View style={styles.milestone} />
        <View style={[styles.milestone, styles.milestone50]} />
        <View style={[styles.milestone, styles.milestone75]} />
      </View>
    </View>
  );
}
