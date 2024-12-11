import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Switch,
  Dimensions,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const { width, height } = Dimensions.get('window');

const AlarmScreen = () => {
  const [token, setToken] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAlarm, setNewAlarm] = useState({
    time: new Date(),
    label: '',
    category: 'General',
    active: true,
    repeatDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    }
    });

  const [showTimePicker, setShowTimePicker] = useState(false);

  const categories = ['Medicamentos', 'Pausas', 'Hábitos', 'Citas', 'General'];

  const daysOfWeek = [
    { key: 'monday', label: 'L' },
    { key: 'tuesday', label: 'M' },
    { key: 'wednesday', label: 'X' },
    { key: 'thursday', label: 'J' },
    { key: 'friday', label: 'V' },
    { key: 'saturday', label: 'S' },
    { key: 'sunday', label: 'D' },
  ];

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setNewAlarm(prev => ({ ...prev, time: selectedDate }));
    }
  };

  const toggleDay = (day) => {
    setNewAlarm(prev => ({
      ...prev,
      repeatDays: {
        ...prev.repeatDays,
        [day]: !prev.repeatDays[day]
      }
    }));
  };

  const validateTimeFormat = (time) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time);
  };

  useEffect(() => {
    const getToken = async () => {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        setToken(userToken);
      }
    };

    getToken();
  }, []);

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/alarms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las alarmas');
      }

      const data = await response.json();
      setAlarms(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las alarmas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAlarms();
    }
  }, [token]);

  const handleAddAlarm = async () => {
    try {
      if (!newAlarm.time || !newAlarm.label) {
        Alert.alert('Error', 'Por favor, completa todos los campos obligatorios');
        return;
      }

      const formattedTime = formatTime(newAlarm.time);
      console.log('Tiempo formateado:', formattedTime); // Para debugging

      const alarmToSend = {
        ...newAlarm,
        time: formattedTime,
      };

      console.log('Datos a enviar:', alarmToSend); // Para debugging

      const response = await fetch('http://localhost:5001/api/alarms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(alarmToSend),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al crear la alarma');
      }

      setAlarms(prev => [...prev, responseData]);
      setModalVisible(false);
      setNewAlarm({
        time: new Date(),
        label: '',
        category: 'General',
        active: true,
        repeatDays: {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        }
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la alarma');
      console.error('Error completo:', error);
    }
  };


  const formatTime = (date) => {
    if (!(date instanceof Date)) {
      return '';
    }
    // Formatear la hora en el formato correcto "HH:MM AM/PM"
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleDeleteAlarm = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta alarma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:5001/api/alarms/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
              });

              if (!response.ok) {
                throw new Error('Error al eliminar la alarma');
              }

              setAlarms(prev => prev.filter(alarm => alarm._id !== id));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la alarma');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const toggleAlarm = async (id) => {
    try {
      const alarm = alarms.find(a => a._id === id);
      if (!alarm) return;

      const response = await fetch(`http://localhost:5001/api/alarms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...alarm,
          active: !alarm.active
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la alarma');
      }

      const updatedAlarm = await response.json();
      setAlarms(prev => prev.map(a => a._id === id ? updatedAlarm : a));
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la alarma');
      console.error(error);
    }
  };

  const renderAlarmItem = ({ item }) => (
    <View style={styles.alarmItem}>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTime}>{item.time}</Text>
        <Text style={styles.alarmLabel}>{item.label}</Text>
        <Text style={styles.alarmCategory}>{item.category}</Text>
      </View>
      <View style={styles.alarmActions}>
        <Switch
          value={item.active}
          onValueChange={() => toggleAlarm(item._id)}
          trackColor={{ false: '#767577', true: '#5127DB' }}
        />
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteAlarm(item._id)}
        >
          <Icon name="trash-can-outline" size={24} color="#E63946" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Alarmas</Text>
      <FlatList
        data={alarms}
        renderItem={renderAlarmItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.alarmList}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Nueva Alarma</Text>

            {/* Selector de Hora */}
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeText}>
                {formatTime(newAlarm.time)}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={newAlarm.time}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
              />
            )}

            {/* Selector de Días */}
            <View style={styles.daysContainer}>
              <Text style={styles.sectionTitle}>Repetir</Text>
              <View style={styles.daysRow}>
                {daysOfWeek.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.dayButton,
                      newAlarm.repeatDays[key] && styles.dayButtonSelected
                    ]}
                    onPress={() => toggleDay(key)}
                  >
                    <Text style={[
                      styles.dayText,
                      newAlarm.repeatDays[key] && styles.dayTextSelected
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Etiqueta */}
            <TextInput
              style={styles.input}
              placeholder="Nombre de la alarma"
              placeholderTextColor="#A3ADDB"
              value={newAlarm.label}
              onChangeText={(text) => setNewAlarm(prev => ({ ...prev, label: text }))}
            />

            {/* Categorías */}
            <Text style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newAlarm.category === category && styles.selectedCategory,
                  ]}
                  onPress={() => setNewAlarm(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.categoryText,
                    newAlarm.category === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botones */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleAddAlarm}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
    padding: width / 20,
  },
  title: {
    fontSize: width / 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: height / 30,
  },
  alarmList: {
    paddingBottom: height / 10,
  },
  alarmItem: {
    backgroundColor: '#CECFDB',
    borderRadius: 10,
    marginBottom: height / 40,
    padding: width / 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: width / 20,
    color: '#1D1B70',
  },
  alarmLabel: {
    fontSize: width / 28,
    color: '#5127DB',
    marginVertical: 4,
  },
  alarmCategory: {
    fontSize: width / 30,
    color: '#A3ADDB',
    fontStyle: 'italic',
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: height / 20,
    right: width / 20,
    backgroundColor: '#5127DB',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#CECFDB',
    borderRadius: 10,
    padding: width / 15,
    width: '80%',
  },
  modalTitle: {
    fontSize: width / 20,
    color: '#1D1B70',
    fontWeight: 'bold',
    marginBottom: height / 40,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: height / 50,
    color: '#1D1B70',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: height / 50,
  },
  categoryButton: {
    backgroundColor: '#A3ADDB',
    borderRadius: 10,
    padding: 10,
    margin: 5,
  },
  selectedCategory: {
    backgroundColor: '#5127DB',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: width / 30,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#5127DB',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: width / 28,
  },
  cancelButton: {
    backgroundColor: '#A3ADDB',
  },
  deleteButton: {
    marginLeft: 10,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSelector: {
    backgroundColor: '#5127DB',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: width / 12,
    fontWeight: 'bold',
  },
  daysContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: width / 25,
    color: '#1D1B70',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    width: width / 12,
    height: width / 12,
    borderRadius: width / 24,
    borderWidth: 1,
    borderColor: '#5127DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dayButtonSelected: {
    backgroundColor: '#5127DB',
  },
  dayText: {
    color: '#5127DB',
    fontSize: width / 32,
    fontWeight: 'bold',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: width / 15,
    width: '90%',
    maxHeight: '80%',
  },
  saveButton: {
    backgroundColor: '#5127DB',
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#A3ADDB',
    flex: 1,
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default AlarmScreen;

