/**
 * Sección del timer (etiqueta de modo, tiempo, barra de progreso) y vista de meditación.
 * @author AntoApp Team
 */

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MeditationView from '../MeditationView';
import {
  COLORS,
  MODE_LABEL_FONT_SIZE,
  MODE_LABEL_MARGIN_BOTTOM,
  PROGRESS_BAR_BORDER_RADIUS,
  PROGRESS_BAR_HEIGHT,
  PROGRESS_BAR_MARGIN_TOP,
  TIMER_FONT_SIZE,
  TIMER_SECTION_MARGIN_VERTICAL,
} from '../../screens/pomodoro/pomodoroScreenConstants';

export default function PomodoroTimerSection({
  mode,
  modes,
  timeLeft,
  formatTime,
  progressAnimation,
  fadeAnim,
  isMeditating,
}) {
  if (mode === 'meditation' && isMeditating) {
    return (
      <View style={styles.timerSection}>
        <MeditationView />
      </View>
    );
  }

  return (
    <View style={styles.timerSection}>
      <Animated.Text
        style={[styles.modeLabel, { color: modes[mode].color, opacity: fadeAnim }]}
      >
        {modes[mode].label}
      </Animated.Text>
      <Animated.Text
        style={[styles.timerText, { color: modes[mode].color, opacity: fadeAnim }]}
      >
        {formatTime(timeLeft)}
      </Animated.Text>
      <View style={styles.progressBar}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
