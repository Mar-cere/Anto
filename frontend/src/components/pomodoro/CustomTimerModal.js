/**
 * Modal para configurar timer personalizado (minutos de trabajo y opcional preparación).
 * @author AntoApp Team
 */

import React, { useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  createPomodoroColors,
  DEFAULT_CUSTOM_MINUTES,
  DEFAULT_PREP_MINUTES,
  INPUT_FONT_SIZE,
  INPUT_GROUP_MARGIN_BOTTOM,
  INPUT_LABEL_MARGIN_BOTTOM,
  MAX_CUSTOM_MINUTES_LENGTH,
  MAX_PREP_MINUTES_LENGTH,
  MODAL_BUTTON_BORDER_RADIUS,
  MODAL_BUTTON_PADDING,
  MODAL_BUTTONS_GAP,
  MODAL_CONTENT_PADDING,
  MODAL_MAX_WIDTH,
  MODAL_TITLE_FONT_SIZE,
  MODAL_TITLE_MARGIN_BOTTOM,
  MODAL_WIDTH_PERCENT,
  PREP_TIME_CONTAINER_MARGIN_BOTTOM,
  PREP_TIME_HEADER_MARGIN_BOTTOM,
  TASKS_SECTION_BORDER_RADIUS,
  TIME_INPUT_BORDER_RADIUS,
  TIME_INPUT_CONTAINER_GAP,
  TIME_INPUT_FONT_SIZE,
  TIME_INPUT_PADDING,
  TIME_INPUT_WIDTH,
  usePomodoroTexts,
} from '../../screens/pomodoro/pomodoroScreenConstants';

export default function CustomTimerModal({
  visible,
  onClose,
  customMinutes,
  setCustomMinutes,
  prepTimeEnabled,
  setPrepTimeEnabled,
  prepTime,
  setPrepTime,
  onConfirm,
}) {
  const TEXTS = usePomodoroTexts();
  const { colors } = useTheme();
  const { PC, styles } = useMemo(() => {
    const pomodoro = createPomodoroColors(colors);
    return {
      PC: pomodoro,
      styles: StyleSheet.create({
        modalOverlay: {
          flex: 1,
          backgroundColor: pomodoro.MODAL_OVERLAY,
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          backgroundColor: pomodoro.MODAL_BACKGROUND,
          borderRadius: TASKS_SECTION_BORDER_RADIUS,
          padding: MODAL_CONTENT_PADDING,
          width: MODAL_WIDTH_PERCENT,
          maxWidth: MODAL_MAX_WIDTH,
        },
        modalTitle: {
          fontSize: MODAL_TITLE_FONT_SIZE,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: MODAL_TITLE_MARGIN_BOTTOM,
          textAlign: 'center',
        },
        inputGroup: {
          marginBottom: INPUT_GROUP_MARGIN_BOTTOM,
        },
        inputLabel: {
          color: colors.text,
          fontSize: INPUT_FONT_SIZE,
          marginBottom: INPUT_LABEL_MARGIN_BOTTOM,
        },
        timeInputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: TIME_INPUT_CONTAINER_GAP,
        },
        timeInput: {
          backgroundColor: pomodoro.INPUT_BACKGROUND,
          borderRadius: TIME_INPUT_BORDER_RADIUS,
          padding: TIME_INPUT_PADDING,
          fontSize: TIME_INPUT_FONT_SIZE,
          color: colors.text,
          width: TIME_INPUT_WIDTH,
          textAlign: 'center',
        },
        timeUnit: {
          color: colors.primary,
          fontSize: INPUT_FONT_SIZE,
          fontWeight: '500',
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
          color: colors.text,
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
          backgroundColor: pomodoro.BUTTON_BACKGROUND,
        },
        confirmButton: {
          backgroundColor: pomodoro.PRIMARY,
        },
        cancelButtonText: {
          color: colors.text,
          fontSize: INPUT_FONT_SIZE,
          fontWeight: '600',
        },
        confirmButtonText: {
          color: colors.textOnPrimary,
          fontSize: INPUT_FONT_SIZE,
          fontWeight: '600',
        },
      }),
    };
  }, [colors]);

  const handleConfirm = () => {
    const workMinutes =
      parseInt(customMinutes, 10) || parseInt(DEFAULT_CUSTOM_MINUTES, 10);
    const preparationMinutes = prepTimeEnabled
      ? parseInt(prepTime, 10) || parseInt(DEFAULT_PREP_MINUTES, 10)
      : 0;
    onConfirm(workMinutes, preparationMinutes);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{TEXTS.MODAL_TITLE}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{TEXTS.WORK_LABEL}</Text>
            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                value={customMinutes}
                onChangeText={(text) => {
                  const numbers = text.replace(/[^0-9]/g, '');
                  setCustomMinutes(numbers);
                }}
                keyboardType="number-pad"
                maxLength={MAX_CUSTOM_MINUTES_LENGTH}
                placeholder={DEFAULT_CUSTOM_MINUTES}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.timeUnit}>{TEXTS.MINUTES}</Text>
            </View>
          </View>
          <View style={styles.prepTimeContainer}>
            <View style={styles.prepTimeHeader}>
              <Text style={styles.prepTimeLabel}>{TEXTS.PREP_TIME_LABEL}</Text>
              <Switch
                value={prepTimeEnabled}
                onValueChange={setPrepTimeEnabled}
                trackColor={{
                  false: PC.SWITCH_TRACK_FALSE,
                  true: PC.SWITCH_TRACK_TRUE,
                }}
                thumbColor={
                  prepTimeEnabled ? PC.SWITCH_THUMB_TRUE : PC.SWITCH_THUMB_FALSE
                }
              />
            </View>
            {prepTimeEnabled && (
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  value={prepTime}
                  onChangeText={(text) => {
                    const numbers = text.replace(/[^0-9]/g, '');
                    setPrepTime(numbers);
                  }}
                  keyboardType="number-pad"
                  maxLength={MAX_PREP_MINUTES_LENGTH}
                  placeholder={DEFAULT_PREP_MINUTES}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.timeUnit}>{TEXTS.MINUTES}</Text>
              </View>
            )}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{TEXTS.CANCEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{TEXTS.START}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
