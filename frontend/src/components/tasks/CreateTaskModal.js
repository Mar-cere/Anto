import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  Switch,
  ScrollView,
  Animated,
  InteractionManager,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { getApiErrorMessage } from '../../utils/apiErrorHandler';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../styles/globalStyles';
import {
  FOCUS_BORDER_SUBTLE,
  FOCUS_CHEVRON_MUTED,
  FOCUS_META,
  FOCUS_ACCENT_BORDER,
} from '../../styles/focusCardTheme';

const CreateTaskModal = ({
  visible,
  onClose,
  onSubmit,
  formData,
  setFormData
}) => {
  const { showToast } = useToast();
  const [pickerMode, setPickerMode] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = new Animated.Value(0);
  const scrollRef = useRef(null);
  const scrollHintTimeouts = useRef([]);

  const isTask = formData.itemType === 'task';

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  /** Pequeño desplazamiento y vuelta al abrir: sugiere que hay más contenido al hacer scroll. */
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
      const tOpen = setTimeout(() => {
        AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
          if (reduce) return;
          scrollRef.current?.scrollTo({ y: 20, animated: true });
          const tBack = setTimeout(() => {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }, 360);
          scrollHintTimeouts.current.push(tBack);
        });
      }, 480);
      scrollHintTimeouts.current.push(tOpen);
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
  }, [visible]);

  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDate = useCallback((date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    }

    if (formData.dueDate < new Date()) {
      newErrors.dueDate = 'La fecha no puede ser anterior a la actual';
    }

    if (isTask && formData.description && formData.description.trim().length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isTask]);

  const handleDateChange = useCallback((event, selectedDate) => {
    setPickerMode(null);
    if (selectedDate) {
      const currentDate = new Date(formData.dueDate);
      selectedDate.setHours(currentDate.getHours());
      selectedDate.setMinutes(currentDate.getMinutes());
      
      // Validar que la fecha no sea anterior a la actual
      if (selectedDate < new Date()) {
        setErrors(prev => ({ ...prev, dueDate: 'La fecha no puede ser anterior a la actual' }));
        return;
      }
      
      setFormData({...formData, dueDate: selectedDate});
      setErrors(prev => ({ ...prev, dueDate: null }));
    }
  }, [formData, setFormData]);

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
        setErrors(prev => ({ ...prev, dueDate: 'La hora no puede ser anterior a la actual' }));
        return;
      }
      
      setFormData({...formData, dueDate: selectedTime});
      setErrors(prev => ({ ...prev, dueDate: null }));
    }
  }, [formData, setFormData]);

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
          priority: formData.priority || 'medium'
        }),
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      showToast({
        message: getApiErrorMessage(error) || 'Error al crear la tarea.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, notificationEnabled, isTask, onSubmit, showToast]);

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
              {isTask ? 'Nueva Tarea' : 'Nuevo Recordatorio'}
            </Text>
            <View style={styles.headerActions}>
              {keyboardVisible ? (
                <TouchableOpacity
                  style={styles.keyboardDismissBtn}
                  onPress={() => Keyboard.dismiss()}
                  activeOpacity={0.7}
                  hitSlop={10}
                >
                  <Text style={styles.keyboardDismissText}>Listo</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={FOCUS_CHEVRON_MUTED} />
              </TouchableOpacity>
            </View>
          </View>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={Platform.OS === 'ios'}
              overScrollMode={Platform.OS === 'android' ? 'auto' : 'never'}
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
                  color={isTask ? colors.primary : FOCUS_META} 
                />
                <Text style={[
                  styles.typeButtonText,
                  isTask && styles.typeButtonTextActive
                ]}>Tarea</Text>
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
                  color={!isTask ? colors.error : FOCUS_META} 
                />
                <Text style={[
                  styles.typeButtonText,
                  !isTask && styles.reminderTypeButtonTextActive
                ]}>Recordatorio</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título *</Text>
              <TextInput
                style={[
                  styles.input, 
                  !isTask && styles.reminderInput,
                  errors.title && styles.inputError
                ]}
                placeholder="Ingresa el título"
                placeholderTextColor={FOCUS_META}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData({...formData, title: text});
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                maxLength={100}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {isTask && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    errors.description && styles.inputError
                  ]}
                  placeholder="Describe tu tarea..."
                  placeholderTextColor={FOCUS_META}
                  value={formData.description}
                  onChangeText={(text) => {
                    setFormData({...formData, description: text});
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
                <Text style={styles.charCount}>
                  {formData.description?.length || 0}/500
                </Text>
              </View>
            )}

            <View style={styles.dateTimeContainer}>
              <Text style={styles.inputLabel}>Fecha y Hora *</Text>
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
                  textColor="#FFFFFF"
                  style={styles.picker}
                />
              </View>
            )}

            {isTask && (
              <View style={styles.prioritySelector}>
                <Text style={styles.sectionTitle}>Prioridad</Text>
                <View style={styles.priorityButtons}>
                  {[
                    { value: 'high', label: 'Alta', color: '#FF6B6B', icon: 'alert-circle' },
                    { value: 'medium', label: 'Media', color: '#FFD93D', icon: 'alert' },
                    { value: 'low', label: 'Baja', color: '#6BCB77', icon: 'checkmark-circle' }
                  ].map((priority) => (
                    <TouchableOpacity
                      key={priority.value}
                      style={[
                        styles.priorityButton,
                        formData.priority === priority.value && styles.priorityButtonActive,
                        { backgroundColor: priority.color + '20' }
                      ]}
                      onPress={() => handlePriorityChange(priority.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={priority.icon} 
                        size={16} 
                        color={priority.color} 
                      />
                      <Text style={[
                        styles.priorityButtonText,
                        { color: priority.color }
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.notificationContainer}>
              <View style={styles.notificationHeader}>
                <Ionicons name="notifications-outline" size={20} color={FOCUS_META} />
                <Text style={styles.notificationLabel}>Notificación</Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                thumbColor={notificationEnabled ? colors.primary : 'rgba(255,255,255,0.45)'}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(26, 221, 219, 0.45)' }}
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
                    <Ionicons name="hourglass-outline" size={20} color={colors.background} />
                    <Text style={styles.submitButtonText}>Creando...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isTask ? 'Crear Tarea' : 'Crear Recordatorio'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderColor: FOCUS_BORDER_SUBTLE,
    maxHeight: '90%',
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
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 221, 219, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
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
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    borderColor: FOCUS_ACCENT_BORDER,
  },
  reminderTypeButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  typeButtonText: {
    color: FOCUS_META,
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
    color: 'rgba(163, 184, 232, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    color: colors.white,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
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
    color: FOCUS_META,
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
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
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
    borderColor: FOCUS_BORDER_SUBTLE,
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
    color: 'rgba(163, 184, 232, 0.85)',
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
    borderColor: FOCUS_ACCENT_BORDER,
    backgroundColor: 'rgba(26, 221, 219, 0.12)',
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
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationLabel: {
    color: FOCUS_META,
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
    paddingHorizontal: 20,
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
});

export default CreateTaskModal; 