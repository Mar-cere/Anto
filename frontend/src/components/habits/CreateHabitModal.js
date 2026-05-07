import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
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
import { colors } from '../../styles/globalStyles';
import { FOCUS_ACCENT_BORDER, FOCUS_BORDER_SUBTLE, FOCUS_CHEVRON_MUTED } from '../../styles/focusCardTheme';

const HABIT_ICONS = [
  { key: 'exercise', icon: 'run' },
  { key: 'meditation', icon: 'meditation' },
  { key: 'reading', icon: 'book-open-variant' },
  { key: 'water', icon: 'water' },
  { key: 'sleep', icon: 'sleep' },
  { key: 'study', icon: 'book-education' },
  { key: 'diet', icon: 'food-apple' },
  { key: 'coding', icon: 'code-tags' },
];

const CreateHabitModal = ({
  visible,
  onClose,
  onSubmit,
  formData,
  setFormData,
  initialReminderIso = null,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
      return undefined;
    }
    const interaction = InteractionManager.runAfterInteractions(() => {
      const tOpen = setTimeout(() => {
        AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
          if (reduce) return;
          scrollRef.current?.scrollTo({ y: 18, animated: true });
          const tBack = setTimeout(() => {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }, 340);
          scrollHintTimeouts.current.push(tBack);
        });
      }, 420);
      scrollHintTimeouts.current.push(tOpen);
    });
    return () => {
      interaction.cancel?.();
      scrollHintTimeouts.current.forEach(clearTimeout);
      scrollHintTimeouts.current = [];
    };
  }, [visible]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }

    if (formData.title.trim().length < 3) {
      Alert.alert('Error', 'El título debe tener al menos 3 caracteres');
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
            <Text style={styles.modalTitle}>Nuevo Hábito</Text>
            <View style={styles.headerActions}>
              {keyboardVisible ? (
                <TouchableOpacity style={styles.keyboardDismissBtn} onPress={() => Keyboard.dismiss()}>
                  <Text style={styles.keyboardDismissText}>Listo</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={22} color={FOCUS_CHEVRON_MUTED} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.input}
              placeholder="Título del hábito"
              placeholderTextColor="#A3B8E8"
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#A3B8E8"
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Icono</Text>
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
                      color={formData.icon === item.key ? "#1ADDDB" : "#A3B8E8"}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Frecuencia</Text>
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
                    color={formData.frequency === 'daily' ? "#1ADDDB" : "#A3B8E8"} 
                  />
                  <Text style={[
                    styles.frequencyButtonText,
                    formData.frequency === 'daily' && styles.frequencyButtonTextSelected
                  ]}>Diario</Text>
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
                    color={formData.frequency === 'weekly' ? "#1ADDDB" : "#A3B8E8"} 
                  />
                  <Text style={[
                    styles.frequencyButtonText,
                    formData.frequency === 'weekly' && styles.frequencyButtonTextSelected
                  ]}>Semanal</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recordatorio</Text>
              <TouchableOpacity
                style={styles.timeSelector}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={20} 
                  color="#1ADDDB" 
                />
                <Text style={styles.timeSelectorText}>
                  {reminderTime.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color="#A3B8E8" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Crear Hábito</Text>
            </TouchableOpacity>
          </ScrollView>
          </KeyboardAvoidingView>
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
              <Text style={styles.timePickerTitle}>Seleccionar hora</Text>
            </View>
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              textColor="#FFFFFF"
            />
            <TouchableOpacity
              style={styles.timePickerDoneButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.timePickerDoneText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderColor: FOCUS_BORDER_SUBTLE,
    maxHeight: '92%',
    minHeight: '48%',
    paddingHorizontal: 20,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.94)',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    color: colors.white,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(163, 184, 232, 0.85)',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  iconSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconButtonSelected: {
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    borderWidth: 1,
    borderColor: '#1ADDDB',
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  frequencyButtonSelected: {
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    borderWidth: 1,
    borderColor: '#1ADDDB',
  },
  frequencyButtonText: {
    color: '#A3B8E8',
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyButtonTextSelected: {
    color: '#1ADDDB',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_BORDER_SUBTLE,
  },
  timeSelectorText: {
    flex: 1,
    color: colors.white,
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
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 221, 219, 0.2)',
  },
  timePickerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timePickerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerDoneButton: {
    backgroundColor: '#1ADDDB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  timePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default CreateHabitModal;
