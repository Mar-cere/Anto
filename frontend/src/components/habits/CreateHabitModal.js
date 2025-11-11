import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  setFormData
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Hábito</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={24} color="#A3B8E8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'rgba(29, 43, 95, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  iconSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  timeSelectorText: {
    flex: 1,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(29, 43, 95, 0.98)',
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
    backgroundColor: '#1ADDDB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateHabitModal;
