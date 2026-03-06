/**
 * Controles del Pomodoro: play/pause, reset, modos (break, long break, custom), meditación.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ADDITIONAL_CONTROLS_MARGIN_LEFT,
  BUTTON_SIZE,
  BUTTON_BORDER_RADIUS,
  COLORS,
  CONTROLS_GAP,
  CONTROLS_MARGIN_BOTTOM,
  ICON_SIZE,
  MAIN_CONTROLS_TRANSLATE_X,
  MEDITATION_BUTTON_BORDER_RADIUS,
  MEDITATION_BUTTON_BORDER_WIDTH,
  MEDITATION_BUTTON_CONTAINER_PADDING_HORIZONTAL,
  MEDITATION_BUTTON_GAP,
  MEDITATION_BUTTON_PADDING_HORIZONTAL,
  MEDITATION_BUTTON_PADDING_VERTICAL,
  MEDITATION_BUTTON_WIDTH_PERCENT,
  TEXTS,
} from '../../screens/pomodoro/pomodoroScreenConstants';

export default function PomodoroControls({
  mode,
  modes,
  isActive,
  toggleTimer,
  resetTimer,
  changeMode,
  onOpenCustomModal,
  buttonsOpacity,
  buttonsScale,
  mainControlsPosition,
}) {
  return (
    <View style={styles.controlsContainer}>
      <Animated.View
        style={[
          styles.allControls,
          {
            transform: [
              {
                translateX: mainControlsPosition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, MAIN_CONTROLS_TRANSLATE_X],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: isActive ? COLORS.PAUSE : modes[mode].color },
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
            <MaterialCommunityIcons name="restart" size={ICON_SIZE} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.additionalControls,
            {
              opacity: buttonsOpacity,
              transform: [{ scale: buttonsScale }],
              pointerEvents: isActive ? 'none' : 'auto',
            }]}
        >
          <TouchableOpacity
            style={[styles.controlButton, mode === 'break' && { backgroundColor: modes.break.color }]}
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
              mode === 'longBreak' && { backgroundColor: modes.longBreak.color },
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
              mode === 'custom' && { backgroundColor: modes.custom.color },
            ]}
            onPress={onOpenCustomModal}
          >
            <MaterialCommunityIcons
              name="clock-edit"
              size={ICON_SIZE}
              color={mode === 'custom' ? COLORS.WHITE : COLORS.CUSTOM}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          styles.meditationButtonContainer,
          {
            opacity: buttonsOpacity,
            transform: [{ scale: buttonsScale }],
            pointerEvents: isActive ? 'none' : 'auto',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.meditationButton,
            mode === 'meditation' && { backgroundColor: modes.meditation.color },
          ]}
          onPress={() => changeMode('meditation')}
        >
          <MaterialCommunityIcons
            name="meditation"
            size={ICON_SIZE}
            color={mode === 'meditation' ? COLORS.WHITE : COLORS.MEDITATION}
          />
          <Text
            style={[
              styles.meditationButtonText,
              mode === 'meditation' && { color: COLORS.WHITE },
            ]}
          >
            {TEXTS.MEDITATION}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 16,
    fontWeight: '500',
  },
});
