import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  InteractionManager,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ModalKeyboardScroll from '../common/ModalKeyboardScroll';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useModalKeyboardVisible } from '../../hooks/useModalKeyboardVisible';
import { SPACING } from '../../constants/ui';
import { HABIT_ICON_PICKER_OPTIONS } from '../../screens/habits/habitsScreenConstants';
import {
  focusModalTextInput,
  MODAL_SHEET_MAX_HEIGHT,
  runModalScrollHint,
  syncModalKeyboardWithVisibility,
} from '../../utils/modalKeyboardUtils';

const HABIT_ICONS = HABIT_ICON_PICKER_OPTIONS;

const DEFAULT_TEXTS = {
  TITLE: 'Nuevo hábito',
  DONE: 'Listo',
  TITLE_LABEL: '¿Qué hábito quieres cultivar?',
  TITLE_PLACEHOLDER: 'Por ejemplo: caminar 10 minutos',
  DESCRIPTION_LABEL: '¿Algún detalle? (opcional)',
  DESCRIPTION_PLACEHOLDER: 'Lo que te ayude a recordar por qué importa…',
  ERROR_TITLE: 'Error',
  ERROR_MISSING_TITLE: 'Por favor ingresa un título',
  ERROR_SHORT_TITLE: 'El título debe tener al menos 3 caracteres',
  CREATE_BUTTON: 'Crear Hábito',
  TIME_PICKER_TITLE: 'Seleccionar hora',
  ICON_SECTION: 'Elige un icono',
  FREQUENCY_SECTION: '¿Con qué frecuencia?',
  REMINDER_SECTION: '¿Te recordamos?',
  FREQUENCY_DAILY: 'Diario',
  FREQUENCY_WEEKLY: 'Semanal',
};

const CreateHabitModal = ({
  visible,
  onClose,
  onSubmit,
  formData,
  setFormData,
  initialReminderIso = null,
}) => {
  const { language } = useLanguage();
  const translated = useSectionTranslations('HABITS');
  const T = useMemo(
    () => ({
      TITLE: translated?.CREATE_MODAL_TITLE || DEFAULT_TEXTS.TITLE,
      DONE: translated?.CREATE_MODAL_DONE || DEFAULT_TEXTS.DONE,
      TITLE_LABEL:
        translated?.CREATE_MODAL_TITLE_LABEL || DEFAULT_TEXTS.TITLE_LABEL,
      TITLE_PLACEHOLDER:
        translated?.CREATE_MODAL_TITLE_PLACEHOLDER || DEFAULT_TEXTS.TITLE_PLACEHOLDER,
      DESCRIPTION_LABEL:
        translated?.CREATE_MODAL_DESCRIPTION_LABEL || DEFAULT_TEXTS.DESCRIPTION_LABEL,
      DESCRIPTION_PLACEHOLDER:
        translated?.CREATE_MODAL_DESCRIPTION_PLACEHOLDER ||
        DEFAULT_TEXTS.DESCRIPTION_PLACEHOLDER,
      ERROR_TITLE: translated?.CREATE_MODAL_ERROR_TITLE || DEFAULT_TEXTS.ERROR_TITLE,
      ERROR_MISSING_TITLE:
        translated?.CREATE_MODAL_ERROR_MISSING_TITLE ||
        DEFAULT_TEXTS.ERROR_MISSING_TITLE,
      ERROR_SHORT_TITLE:
        translated?.CREATE_MODAL_ERROR_SHORT_TITLE ||
        DEFAULT_TEXTS.ERROR_SHORT_TITLE,
      CREATE_BUTTON:
        translated?.CREATE_MODAL_CREATE_BUTTON || DEFAULT_TEXTS.CREATE_BUTTON,
      TIME_PICKER_TITLE:
        translated?.CREATE_MODAL_TIME_PICKER_TITLE || DEFAULT_TEXTS.TIME_PICKER_TITLE,
      ICON_SECTION:
        translated?.CREATE_MODAL_ICON_SECTION || DEFAULT_TEXTS.ICON_SECTION,
      FREQUENCY_SECTION:
        translated?.CREATE_MODAL_FREQUENCY_SECTION || DEFAULT_TEXTS.FREQUENCY_SECTION,
      REMINDER_SECTION:
        translated?.CREATE_MODAL_REMINDER_SECTION || DEFAULT_TEXTS.REMINDER_SECTION,
      FREQUENCY_DAILY:
        translated?.CREATE_MODAL_FREQUENCY_DAILY || DEFAULT_TEXTS.FREQUENCY_DAILY,
      FREQUENCY_WEEKLY:
        translated?.CREATE_MODAL_FREQUENCY_WEEKLY || DEFAULT_TEXTS.FREQUENCY_WEEKLY,
    }),
    [translated]
  );
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        },
        modalContent: {
          backgroundColor: colors.background,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          maxHeight: MODAL_SHEET_MAX_HEIGHT,
          minHeight: '48%',
          flexShrink: 1,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        sheetGrabber: {
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.glassFill,
          marginTop: 10,
          marginBottom: 6,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          marginTop: 6,
        },
        modalTitle: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: -0.2,
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        keyboardDismissBtn: {
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.CHIP_INSET,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        keyboardDismissText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
        closeButton: {
          padding: SPACING.sm,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        keyboardContainer: {
          flex: 1,
        },
        input: {
          backgroundColor: colors.chromeInput,
          borderRadius: 14,
          padding: SPACING.INPUT_INSET,
          color: colors.text,
          fontSize: 16,
          marginBottom: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        textArea: {
          height: 80,
          textAlignVertical: 'top',
        },
        sectionContainer: {
          marginBottom: 16,
        },
        inputLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: -0.1,
          marginBottom: 8,
        },
        sectionTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 8,
          letterSpacing: -0.1,
        },
        iconSelector: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        iconButton: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.glassFill,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        iconButtonSelected: {
          backgroundColor: colors.accentLineSoft,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        frequencySelector: {
          flexDirection: 'row',
          gap: SPACING.CHIP_INSET,
        },
        frequencyButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          padding: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        frequencyButtonSelected: {
          backgroundColor: colors.accentLineSoft,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        frequencyButtonText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '500',
        },
        frequencyButtonTextSelected: {
          color: colors.primary,
          fontWeight: '700',
        },
        timeSelector: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING.CARD_INNER_INSET,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          gap: SPACING.CHIP_INSET,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        timeSelectorText: {
          flex: 1,
          color: colors.text,
          fontSize: 16,
          textAlign: 'center',
        },
        timePickerOverlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        timePickerContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: SPACING.xxl,
          borderTopWidth: 1,
          borderTopColor: t.FOCUS_ACCENT_BORDER,
        },
        timePickerHeader: {
          alignItems: 'center',
          marginBottom: 16,
        },
        timePickerTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '600',
        },
        timePickerDoneButton: {
          backgroundColor: colors.primary,
          padding: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 16,
        },
        timePickerDoneText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        submitButton: {
          backgroundColor: colors.primary,
          paddingVertical: SPACING.CHIP_INSET,
          paddingHorizontal: SPACING.CHIP_INSET,
          borderRadius: 999,
          alignItems: 'center',
          marginTop: 8,
          marginBottom: 20,
        },
        submitButtonText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }),
    [colors, t],
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const keyboardVisible = useModalKeyboardVisible();
  const scrollRef = useRef(null);
  const scrollHintTimeouts = useRef([]);

  useEffect(() => {
    if (visible && initialReminderIso) {
      const d = new Date(initialReminderIso);
      if (!Number.isNaN(d.getTime())) {
        setReminderTime(d);
      }
    }
  }, [visible, initialReminderIso]);

  useEffect(() => {
    syncModalKeyboardWithVisibility(visible);
    if (!visible) {
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
      return undefined;
    }
    const interaction = InteractionManager.runAfterInteractions(() => {
      AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
        if (reduce) return;
        const clearHint = runModalScrollHint(scrollRef, { peekY: 18, delayMs: 420 });
        if (clearHint) scrollHintTimeouts.current.push(clearHint);
      });
    });
    return () => {
      interaction.cancel?.();
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
    };
  }, [visible]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert(T.ERROR_TITLE, T.ERROR_MISSING_TITLE);
      return;
    }

    if (formData.title.trim().length < 3) {
      Alert.alert(T.ERROR_TITLE, T.ERROR_SHORT_TITLE);
      return;
    }

    const dataToSubmit = {
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      icon: formData.icon || 'exercise',
      frequency: formData.frequency || 'daily',
      reminder: {
        time: reminderTime.toISOString(),
        enabled: true
      },
      priority: formData.priority || 'medium',
    };

    onSubmit(dataToSubmit);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.sheetGrabber} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{T.TITLE}</Text>
            <View style={styles.headerActions}>
              {keyboardVisible ? (
                <TouchableOpacity style={styles.keyboardDismissBtn} onPress={() => Keyboard.dismiss()}>
                  <Text style={styles.keyboardDismissText}>{T.DONE}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={22} color={t.FOCUS_CHEVRON_MUTED} />
              </TouchableOpacity>
            </View>
          </View>

          <ModalKeyboardScroll ref={scrollRef}>
            <Text style={styles.inputLabel}>{T.TITLE_LABEL}</Text>
            <TextInput
              style={styles.input}
              placeholder={T.TITLE_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              maxLength={50}
              onFocus={(event) => focusModalTextInput(scrollRef, event)}
            />

            <Text style={styles.inputLabel}>{T.DESCRIPTION_LABEL}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={T.DESCRIPTION_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              multiline
              numberOfLines={3}
              maxLength={200}
              onFocus={(event) => focusModalTextInput(scrollRef, event)}
            />

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{T.ICON_SECTION}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.iconSelector}
              >
                {HABIT_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.iconButton,
                      formData.icon === item.key && styles.iconButtonSelected
                    ]}
                    onPress={() => setFormData({...formData, icon: item.key})}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={24}
                      color={formData.icon === item.key ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{T.FREQUENCY_SECTION}</Text>
              <View style={styles.frequencySelector}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    formData.frequency === 'daily' && styles.frequencyButtonSelected
                  ]}
                  onPress={() => setFormData({...formData, frequency: 'daily'})}
                >
                  <MaterialCommunityIcons 
                    name="repeat" 
                    size={20} 
                    color={formData.frequency === 'daily' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.frequencyButtonText,
                    formData.frequency === 'daily' && styles.frequencyButtonTextSelected
                  ]}>{T.FREQUENCY_DAILY}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    formData.frequency === 'weekly' && styles.frequencyButtonSelected
                  ]}
                  onPress={() => setFormData({...formData, frequency: 'weekly'})}
                >
                  <MaterialCommunityIcons 
                    name="calendar-week" 
                    size={20} 
                    color={formData.frequency === 'weekly' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.frequencyButtonText,
                    formData.frequency === 'weekly' && styles.frequencyButtonTextSelected
                  ]}>{T.FREQUENCY_WEEKLY}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{T.REMINDER_SECTION}</Text>
              <TouchableOpacity
                style={styles.timeSelector}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.timeSelectorText}>
                  {reminderTime.toLocaleTimeString(language === 'en' ? 'en-US' : 'es-ES', {
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>{T.CREATE_BUTTON}</Text>
            </TouchableOpacity>
          </ModalKeyboardScroll>
        </View>
      </View>

      {showTimePicker && (
        <>
          <TouchableOpacity
            style={styles.timePickerOverlay}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          />
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerTitle}>{T.TIME_PICKER_TITLE}</Text>
            </View>
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              textColor={colors.text}
            />
            <TouchableOpacity
              style={styles.timePickerDoneButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.timePickerDoneText}>{T.DONE}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Modal>
  );
};

export default CreateHabitModal;
