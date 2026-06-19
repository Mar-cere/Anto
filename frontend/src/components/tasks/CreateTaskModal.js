import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  StyleSheet,
  Switch,
  Animated,
  InteractionManager,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import ModalKeyboardScroll from '../common/ModalKeyboardScroll';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useModalKeyboardVisible } from '../../hooks/useModalKeyboardVisible';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { SPACING } from '../../constants/ui';
import { getSoftPriorityStyle } from '../../utils/taskPriorityPalette';
import {
  focusModalTextInput,
  MODAL_SHEET_MAX_HEIGHT,
  runModalScrollHint,
} from '../../utils/modalKeyboardUtils';

const DEFAULT_TEXTS = {
  NEW_TASK_TITLE: 'Nueva tarea',
  NEW_REMINDER_TITLE: 'Nuevo recordatorio',
  KEYBOARD_DONE: 'Listo',
  TYPE_TASK: 'Tarea',
  TYPE_REMINDER: 'Recordatorio',
  FIELD_TITLE: '¿Qué quieres hacer?',
  FIELD_TITLE_PLACEHOLDER: 'Algo pequeño que quieras avanzar…',
  FIELD_DESCRIPTION: '¿Algún detalle? (opcional)',
  FIELD_DESCRIPTION_PLACEHOLDER: 'Notas que te ayuden a empezar…',
  FIELD_DATE_TIME: '¿Cuándo te gustaría hacerlo?',
  FIELD_PRIORITY: '¿Qué tan urgente es?',
  SUBTASKS_CREATE_HINT: 'Anto puede dividir esta tarea en pasos pequeños',
  SUBTASKS_CREATE_SUBHINT: 'Al crearla, te proponemos hasta cinco pasos manejables.',
  SUBTASKS_SUGGEST_CTA: 'Dividir en pasos',
  SUBTASKS_GENERATE_A11Y: 'Pedir a Anto que sugiera pasos pequeños',
  PRIORITY_HIGH: 'Alta',
  PRIORITY_MEDIUM: 'Media',
  PRIORITY_LOW: 'Baja',
  NOTIFICATION_LABEL: 'Recordarme',
  CREATING: 'Creando...',
  CREATE_TASK_CTA: 'Crear tarea',
  CREATE_REMINDER_CTA: 'Crear recordatorio',
  VALIDATION_TITLE_REQUIRED: 'El titulo es requerido',
  VALIDATION_TITLE_MIN: 'El titulo debe tener al menos 3 caracteres',
  VALIDATION_DATE_PAST: 'La fecha no puede ser anterior a la actual',
  VALIDATION_TIME_PAST: 'La hora no puede ser anterior a la actual',
  VALIDATION_DESCRIPTION_MAX: 'La descripcion no puede exceder 500 caracteres',
  ERROR_CREATE_TASK_GENERIC: 'Error al crear la tarea.',
  ERROR_CONNECTION: 'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
  ERROR_TOO_MANY_REQUESTS:
    'Demasiados intentos. Espera un momento y vuelve a intentar.',
};

const resolveCreateTaskErrorMessage = (error, texts) => {
  const status = error?.response?.status;
  const rawMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();

  const isNetworkIssue =
    !error?.response ||
    rawMessage.includes('network') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('timed out');
  if (isNetworkIssue) {
    return texts.ERROR_CONNECTION || texts.ERROR_CREATE_TASK_GENERIC;
  }

  if (
    status === 429 ||
    rawMessage.includes('too many') ||
    rawMessage.includes('demasiados intentos')
  ) {
    return texts.ERROR_TOO_MANY_REQUESTS || texts.ERROR_CREATE_TASK_GENERIC;
  }

  return texts.ERROR_CREATE_TASK_GENERIC;
};

const CreateTaskModal = ({
  visible,
  onClose,
  onSubmit,
  formData,
  setFormData
}) => {
  const { showToast } = useToast();
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('TASKS');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(translated || {}) }),
    [translated]
  );
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        overlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
        },
        sheetGrabber: {
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.glassFill,
          marginTop: 10,
          marginBottom: 4,
        },
        keyboardContainer: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: Platform.OS === 'ios' ? 36 : 28,
          gap: 16,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 14,
          paddingBottom: 12,
        },
        modalTitle: {
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.2,
          color: colors.text,
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        keyboardDismissBtn: {
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        keyboardDismissText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.primary,
        },
        closeButton: {
          padding: 8,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        typeSelector: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 4,
        },
        typeButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        typeButtonActive: {
          backgroundColor: colors.accentLineSoft,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        reminderTypeButtonActive: {
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.1)',
          borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.35)',
        },
        typeButtonText: {
          color: t.FOCUS_META,
          fontSize: 15,
          fontWeight: '500',
        },
        typeButtonTextActive: {
          color: colors.primary,
        },
        reminderTypeButtonTextActive: {
          color: colors.error,
        },
        inputContainer: {
          gap: 8,
        },
        inputLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        fieldHint: {
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
        },
        input: {
          backgroundColor: colors.chromeInput,
          borderRadius: 14,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        inputError: {
          borderColor: colors.error,
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.08)',
        },
        reminderInput: {
          borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.28)',
        },
        textArea: {
          height: 100,
          textAlignVertical: 'top',
        },
        errorText: {
          color: colors.error,
          fontSize: 13,
          marginTop: 4,
          lineHeight: 18,
        },
        charCount: {
          color: t.FOCUS_META,
          fontSize: 12,
          textAlign: 'right',
          marginTop: 4,
        },
        dateTimeContainer: {
          gap: 8,
        },
        dateTimeButtons: {
          flexDirection: 'row',
          gap: 12,
        },
        dateTimeButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        reminderDateTimeButton: {
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.08)',
        },
        dateButton: {
          flex: 3,
        },
        timeButton: {
          flex: 2,
        },
        dateTimeButtonText: {
          color: colors.primary,
          fontSize: 15,
          fontWeight: '500',
        },
        reminderDateTimeText: {
          color: colors.error,
          fontSize: 15,
          fontWeight: '500',
        },
        pickerContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Platform.OS === 'ios' ? colors.chromeInput : 'transparent',
          borderRadius: 14,
          marginVertical: 8,
          paddingVertical: Platform.OS === 'ios' ? 8 : 0,
          borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        picker: {
          width: '100%',
          backgroundColor: 'transparent',
          ...(Platform.OS === 'android' && {
            marginLeft: 'auto',
            marginRight: 'auto',
          }),
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginBottom: 8,
        },
        suggestStepsCard: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        suggestStepsCopy: {
          flex: 1,
          minWidth: 0,
          gap: 4,
        },
        suggestStepsTitle: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 19,
        },
        suggestStepsSub: {
          color: colors.textSecondary,
          fontSize: 12,
          lineHeight: 17,
        },
        prioritySelector: {
          gap: 0,
        },
        priorityButtons: {
          flexDirection: 'row',
          gap: 8,
        },
        priorityButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 12,
          paddingHorizontal: 6,
          borderRadius: 14,
          backgroundColor: colors.chromeInput,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        priorityButtonSelected: {
          borderWidth: 2,
          backgroundColor: colors.background,
        },
        priorityButtonText: {
          fontSize: 13,
          fontWeight: '600',
        },
        priorityButtonTextMuted: {
          color: colors.textSecondary,
          fontWeight: '500',
        },
        notificationRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        notificationContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 14,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        notificationHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        notificationLabel: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
        },
        notificationLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          flex: 1,
          minWidth: 0,
        },
        notificationTextBlock: {
          flex: 1,
          minWidth: 0,
        },
        notificationTitle: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        notificationHint: {
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 2,
        },
        submitButtonContainer: {
          paddingTop: 4,
        },
        submitButton: {
          backgroundColor: colors.primary,
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderRadius: 999,
          alignItems: 'center',
        },
        reminderSubmitButton: {
          backgroundColor: colors.error,
        },
        submitButtonDisabled: {
          opacity: 0.8,
        },
        loadingContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
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
  const [pickerMode, setPickerMode] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestStepsOnCreate, setSuggestStepsOnCreate] = useState(true);
  const keyboardVisible = useModalKeyboardVisible();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const scrollHintTimeouts = useRef([]);

  const isTask = formData.itemType === 'task';

  useEffect(() => {
    if (!visible) {
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
      return undefined;
    }
    const clearAll = () => {
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
    };
    const interaction = InteractionManager.runAfterInteractions(() => {
      AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
        if (reduce) return;
        const clearHint = runModalScrollHint(scrollRef, { peekY: 20, delayMs: 480 });
        if (clearHint) scrollHintTimeouts.current.push(clearHint);
      });
    });
    return () => {
      interaction.cancel?.();
      clearAll();
    };
  }, [visible, isTask]);

  useEffect(() => {
    if (visible) {
      setKeyboardVisible(false);
      setNotificationEnabled(true);
      setSuggestStepsOnCreate(true);
      setErrors({});
      setIsSubmitting(false);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      setKeyboardVisible(false);
      setIsSubmitting(false);
      setPickerMode(null);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const formatTime = useCallback((date) => {
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleTimeString(locale, {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, [language]);

  const formatDate = useCallback((date) => {
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [language]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = TEXTS.VALIDATION_TITLE_REQUIRED;
    } else if (formData.title.trim().length < 3) {
      newErrors.title = TEXTS.VALIDATION_TITLE_MIN;
    }

    if (formData.dueDate < new Date()) {
      newErrors.dueDate = TEXTS.VALIDATION_DATE_PAST;
    }

    if (isTask && formData.description && formData.description.trim().length > 500) {
      newErrors.description = TEXTS.VALIDATION_DESCRIPTION_MAX;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isTask, TEXTS]);

  const handleDateChange = useCallback((event, selectedDate) => {
    setPickerMode(null);
    if (selectedDate) {
      const currentDate = new Date(formData.dueDate);
      selectedDate.setHours(currentDate.getHours());
      selectedDate.setMinutes(currentDate.getMinutes());
      
      // Validar que la fecha no sea anterior a la actual
      if (selectedDate < new Date()) {
        setErrors(prev => ({ ...prev, dueDate: TEXTS.VALIDATION_DATE_PAST }));
        return;
      }
      
      setFormData({...formData, dueDate: selectedDate});
      setErrors(prev => ({ ...prev, dueDate: null }));
    }
  }, [formData, setFormData, TEXTS.VALIDATION_DATE_PAST]);

  const handleTimeChange = useCallback((event, selectedTime) => {
    setPickerMode(null);
    if (selectedTime) {
      const currentDate = new Date(formData.dueDate);
      selectedTime.setFullYear(currentDate.getFullYear());
      selectedTime.setMonth(currentDate.getMonth());
      selectedTime.setDate(currentDate.getDate());
      
      // Validar que la hora no sea anterior a la actual si es el mismo día
      const now = new Date();
      if (
        selectedTime.getDate() === now.getDate() &&
        selectedTime.getMonth() === now.getMonth() &&
        selectedTime.getFullYear() === now.getFullYear() &&
        selectedTime < now
      ) {
        setErrors(prev => ({ ...prev, dueDate: TEXTS.VALIDATION_TIME_PAST }));
        return;
      }
      
      setFormData({...formData, dueDate: selectedTime});
      setErrors(prev => ({ ...prev, dueDate: null }));
    }
  }, [formData, setFormData, TEXTS.VALIDATION_TIME_PAST]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const dataToSubmit = {
        title: formData.title.trim(),
        dueDate: formData.dueDate,
        itemType: formData.itemType,
        notifications: {
          enabled: notificationEnabled,
          reminderTime: formData.dueDate,
          repeatReminder: false,
          reminderInterval: 30
        },
        ...(isTask && {
          description: formData.description?.trim() || '',
          priority: formData.priority || 'medium',
          suggestStepsOnCreate: suggestStepsOnCreate && formData.title.trim().length >= 3,
        }),
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      showToast({
        message: resolveCreateTaskErrorMessage(error, TEXTS),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, notificationEnabled, isTask, onSubmit, showToast, TEXTS, suggestStepsOnCreate]);

  const handleTypeChange = useCallback((type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData({
      ...formData,
      itemType: type,
      // Reiniciar campos específicos según el tipo
      ...(type === 'task' ? {
        priority: 'medium',
        description: ''
      } : {
        // Campos por defecto para recordatorios
        priority: undefined,
        description: undefined
      })
    });
    setErrors({});
  }, [formData, setFormData]);

  const handlePriorityChange = useCallback((priority) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData({...formData, priority});
  }, [formData, setFormData]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.sheetGrabber} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isTask ? TEXTS.NEW_TASK_TITLE : TEXTS.NEW_REMINDER_TITLE}
            </Text>
            <View style={styles.headerActions}>
              {keyboardVisible ? (
                <TouchableOpacity
                  style={styles.keyboardDismissBtn}
                  onPress={() => Keyboard.dismiss()}
                  activeOpacity={0.7}
                  hitSlop={10}
                >
                  <Text style={styles.keyboardDismissText}>{TEXTS.KEYBOARD_DONE}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={t.FOCUS_CHEVRON_MUTED} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ModalKeyboardScroll
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  isTask && styles.typeButtonActive
                ]}
                onPress={() => handleTypeChange('task')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="checkbox-outline" 
                  size={20} 
                  color={isTask ? colors.primary : t.FOCUS_META} 
                />
                <Text style={[
                  styles.typeButtonText,
                  isTask && styles.typeButtonTextActive
                ]}>{TEXTS.TYPE_TASK}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  !isTask && styles.reminderTypeButtonActive
                ]}
                onPress={() => handleTypeChange('reminder')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="alarm-outline" 
                  size={20} 
                  color={!isTask ? colors.error : t.FOCUS_META} 
                />
                <Text style={[
                  styles.typeButtonText,
                  !isTask && styles.reminderTypeButtonTextActive
                ]}>{TEXTS.TYPE_REMINDER}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{TEXTS.FIELD_TITLE}</Text>
              <TextInput
                style={[
                  styles.input, 
                  !isTask && styles.reminderInput,
                  errors.title && styles.inputError
                ]}
                placeholder={TEXTS.FIELD_TITLE_PLACEHOLDER}
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData({...formData, title: text});
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                maxLength={100}
                onFocus={(event) => focusModalTextInput(scrollRef, event)}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {isTask && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{TEXTS.FIELD_DESCRIPTION}</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    errors.description && styles.inputError
                  ]}
                  placeholder={TEXTS.FIELD_DESCRIPTION_PLACEHOLDER}
                  placeholderTextColor={colors.textSecondary}
                  value={formData.description}
                  onChangeText={(text) => {
                    setFormData({...formData, description: text});
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  onFocus={(event) => focusModalTextInput(scrollRef, event)}
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
                <Text style={styles.charCount}>
                  {formData.description?.length || 0}/500
                </Text>
              </View>
            )}

            {isTask && formData.title.trim().length >= 3 && (
              <View style={styles.suggestStepsCard}>
                <View style={styles.suggestStepsCopy}>
                  <Text style={styles.suggestStepsTitle}>{TEXTS.SUBTASKS_CREATE_HINT}</Text>
                  <Text style={styles.suggestStepsSub}>{TEXTS.SUBTASKS_CREATE_SUBHINT}</Text>
                </View>
                <Switch
                  value={suggestStepsOnCreate}
                  onValueChange={setSuggestStepsOnCreate}
                  thumbColor={suggestStepsOnCreate ? colors.primary : colors.textSecondary}
                  trackColor={{
                    false: 'rgba(255,255,255,0.2)',
                    true: 'rgba(30, 131, 211, 0.45)',
                  }}
                  accessibilityLabel={TEXTS.SUBTASKS_GENERATE_A11Y}
                />
              </View>
            )}

            <View style={styles.dateTimeContainer}>
              <Text style={styles.inputLabel}>{TEXTS.FIELD_DATE_TIME}</Text>
              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    styles.dateButton,
                    !isTask && styles.reminderDateTimeButton,
                    errors.dueDate && styles.inputError
                  ]}
                  onPress={() => setPickerMode('date')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={!isTask ? colors.error : colors.primary} 
                  />
                  <Text style={[
                    styles.dateTimeButtonText,
                    !isTask && styles.reminderDateTimeText
                  ]}>
                    {formatDate(formData.dueDate)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    styles.timeButton,
                    !isTask && styles.reminderDateTimeButton,
                    errors.dueDate && styles.inputError
                  ]}
                  onPress={() => setPickerMode('time')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="time-outline" 
                    size={20} 
                    color={!isTask ? colors.error : colors.primary} 
                  />
                  <Text style={[
                    styles.dateTimeButtonText,
                    !isTask && styles.reminderDateTimeText
                  ]}>
                    {formatTime(formData.dueDate)}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.dueDate && (
                <Text style={styles.errorText}>{errors.dueDate}</Text>
              )}
            </View>

            {pickerMode && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={formData.dueDate}
                  mode={pickerMode}
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={pickerMode === 'date' ? handleDateChange : handleTimeChange}
                  minimumDate={pickerMode === 'date' ? new Date() : undefined}
                  textColor={colors.text}
                  style={styles.picker}
                />
              </View>
            )}

            {isTask && (
              <View style={styles.prioritySelector}>
                <Text style={styles.sectionTitle}>{TEXTS.FIELD_PRIORITY}</Text>
                <View style={styles.priorityButtons}>
                  {[
                    { value: 'high', label: TEXTS.PRIORITY_HIGH, icon: 'alert-circle' },
                    { value: 'medium', label: TEXTS.PRIORITY_MEDIUM, icon: 'alert' },
                    { value: 'low', label: TEXTS.PRIORITY_LOW, icon: 'checkmark-circle' },
                  ].map((priority) => {
                    const selected = formData.priority === priority.value;
                    const tone = getSoftPriorityStyle(priority.value);
                    return (
                    <TouchableOpacity
                      key={priority.value}
                      style={[
                        styles.priorityButton,
                        selected && styles.priorityButtonSelected,
                        selected && { borderColor: tone.border, backgroundColor: tone.bg },
                      ]}
                      onPress={() => handlePriorityChange(priority.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={priority.icon}
                        size={16}
                        color={selected ? tone.color : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.priorityButtonText,
                          !selected && styles.priorityButtonTextMuted,
                          selected && { color: tone.color },
                        ]}
                      >
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.notificationContainer}>
              <View style={styles.notificationHeader}>
                <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.notificationLabel}>{TEXTS.NOTIFICATION_LABEL}</Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                thumbColor={notificationEnabled ? colors.primary : colors.textSecondary}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(30, 131, 211, 0.45)' }}
              />
            </View>

            <View style={styles.submitButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !isTask && styles.reminderSubmitButton,
                  isSubmitting && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="hourglass-outline" size={20} color={colors.textOnPrimary} />
                    <Text style={styles.submitButtonText}>{TEXTS.CREATING}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isTask ? TEXTS.CREATE_TASK_CTA : TEXTS.CREATE_REMINDER_CTA}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ModalKeyboardScroll>
        </View>
      </View>
    </Modal>
  );
};

/* const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
    maxHeight: '92%',
    minHeight: '48%',
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 10,
    marginBottom: 4,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingTop: 14,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.94)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyboardDismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 131, 211, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_ACCENT_BORDER,
  },
  keyboardDismissText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(30, 131, 211, 0.1)',
    borderColor: t.FOCUS_ACCENT_BORDER,
  },
  reminderTypeButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  typeButtonText: {
    color: t.FOCUS_META,
    fontSize: 15,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  reminderTypeButtonTextActive: {
    color: colors.error,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: 'rgba(92, 90, 120, 0.88)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  reminderInput: {
    borderColor: 'rgba(255, 107, 107, 0.28)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  charCount: {
    color: t.FOCUS_META,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  dateTimeContainer: {
    gap: 8,
  },
  dateTimeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 131, 211, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  reminderDateTimeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  dateButton: {
    flex: 3,
  },
  timeButton: {
    flex: 2,
  },
  dateTimeButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  reminderDateTimeText: {
    color: colors.error,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
    borderRadius: 14,
    marginVertical: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 0,
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  picker: {
    width: '100%',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'android' && {
      marginLeft: 'auto',
      marginRight: 'auto',
    }),
  },
  sectionTitle: {
    color: 'rgba(92, 90, 120, 0.88)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  priorityButtonActive: {
    borderColor: t.FOCUS_ACCENT_BORDER,
    backgroundColor: 'rgba(30, 131, 211, 0.12)',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.FOCUS_BORDER_SUBTLE,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationLabel: {
    color: t.FOCUS_META,
    fontSize: 15,
    fontWeight: '500',
  },
  submitButtonContainer: {
    marginTop: 8,
    paddingBottom: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    borderRadius: 999,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  reminderSubmitButton: {
    backgroundColor: colors.error,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
}); */

export default CreateTaskModal; 