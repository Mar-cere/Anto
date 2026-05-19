/**
 * Controles del Pomodoro: play/pause, reset, modos (break, long break, custom), meditación.
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  ADDITIONAL_CONTROLS_MARGIN_LEFT,
  BUTTON_SIZE,
  BUTTON_BORDER_RADIUS,
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
  createPomodoroColors,
  usePomodoroTexts,
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
  quickPresets = [],
  applyQuickPreset,
  primaryActionLabel,
  currentWorkSeconds,
  currentBreakSeconds,
  density = 'comfortable',
}) {
  const TEXTS = usePomodoroTexts();
  const { colors } = useTheme();
  const PC = useMemo(() => createPomodoroColors(colors), [colors]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        controlsContainer: {
          width: '100%',
          alignItems: 'center',
          marginBottom: CONTROLS_MARGIN_BOTTOM,
        },
        presetsRow: {
          width: '100%',
          marginBottom: 12,
        },
        presetsLabel: {
          color: PC.ACCENT,
          fontSize: 12,
          marginBottom: 6,
          fontWeight: '500',
        },
        presetsChips: {
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          alignItems: 'center',
        },
        presetChip: {
          paddingHorizontal: 10,
          paddingVertical: 8,
          minHeight: 34,
          borderRadius: 999,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassOutline,
          justifyContent: 'center',
          alignItems: 'center',
        },
        presetChipActive: {
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.accentLine,
        },
        presetChipText: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          textAlign: 'center',
          includeFontPadding: false,
        },
        presetChipTextActive: {
          color: colors.primaryBright ?? colors.primary,
          fontWeight: '600',
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
          alignItems: 'center',
        },
        primaryCtaText: {
          color: PC.ACCENT,
          fontSize: 12,
          fontWeight: '600',
          marginHorizontal: 4,
          minWidth: 78,
          textAlign: 'center',
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
          backgroundColor: PC.BUTTON_BACKGROUND,
        },
        controlButtonCompact: {
          width: 42,
          height: 42,
          borderRadius: 21,
        },
        resetButton: {
          backgroundColor: PC.BUTTON_BACKGROUND,
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
          backgroundColor: PC.MEDITATION_BUTTON_BACKGROUND,
          borderRadius: MEDITATION_BUTTON_BORDER_RADIUS,
          paddingVertical: MEDITATION_BUTTON_PADDING_VERTICAL,
          paddingHorizontal: MEDITATION_BUTTON_PADDING_HORIZONTAL,
          gap: MEDITATION_BUTTON_GAP,
          width: MEDITATION_BUTTON_WIDTH_PERCENT,
          borderWidth: MEDITATION_BUTTON_BORDER_WIDTH,
          borderColor: PC.MEDITATION_BUTTON_BORDER,
        },
        meditationButtonText: {
          color: PC.MEDITATION,
          fontSize: 16,
          fontWeight: '500',
        },
      }),
    [colors, PC],
  );

  return (
    <View style={styles.controlsContainer}>
      <View style={styles.presetsRow}>
        <Text style={styles.presetsLabel}>{TEXTS.PRESET_LABEL}</Text>
        <View style={styles.presetsChips}>
          {quickPresets.map((preset) => {
            const isPresetActive =
              currentWorkSeconds === preset.workMinutes * 60 &&
              currentBreakSeconds === preset.breakMinutes * 60;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, isPresetActive && styles.presetChipActive]}
                onPress={() => applyQuickPreset?.(preset)}
                disabled={isActive}
              >
                <Text style={[styles.presetChipText, isPresetActive && styles.presetChipTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
              density === 'compact' && styles.controlButtonCompact,
              { backgroundColor: isActive ? PC.PAUSE : modes[mode].color },
            ]}
            onPress={toggleTimer}
          >
            <MaterialCommunityIcons
              name={isActive ? 'pause' : 'play'}
              size={ICON_SIZE}
              color={PC.WHITE}
            />
          </TouchableOpacity>
          <Text style={styles.primaryCtaText}>{primaryActionLabel}</Text>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton, density === 'compact' && styles.controlButtonCompact]}
            onPress={resetTimer}
          >
            <MaterialCommunityIcons name="restart" size={ICON_SIZE} color={PC.WHITE} />
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
            style={[
              styles.controlButton,
              density === 'compact' && styles.controlButtonCompact,
              mode === 'break' && { backgroundColor: modes.break.color },
            ]}
            onPress={() => changeMode('break')}
          >
            <MaterialCommunityIcons
              name="coffee"
              size={ICON_SIZE}
              color={mode === 'break' ? PC.WHITE : PC.BREAK}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.controlButton,
              density === 'compact' && styles.controlButtonCompact,
              mode === 'longBreak' && { backgroundColor: modes.longBreak.color },
            ]}
            onPress={() => changeMode('longBreak')}
          >
            <MaterialCommunityIcons
              name="beach"
              size={ICON_SIZE}
              color={mode === 'longBreak' ? PC.WHITE : PC.LONG_BREAK}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.controlButton,
              density === 'compact' && styles.controlButtonCompact,
              mode === 'custom' && { backgroundColor: modes.custom.color },
            ]}
            onPress={onOpenCustomModal}
          >
            <MaterialCommunityIcons
              name="clock-edit"
              size={ICON_SIZE}
              color={mode === 'custom' ? PC.WHITE : PC.CUSTOM}
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
            color={mode === 'meditation' ? PC.WHITE : PC.MEDITATION}
          />
          <Text
            style={[
              styles.meditationButtonText,
              mode === 'meditation' && { color: PC.WHITE },
            ]}
          >
            {TEXTS.MEDITATION}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
