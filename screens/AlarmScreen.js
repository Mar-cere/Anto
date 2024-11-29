import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const AlarmScreen = () => {
  const [alarms, setAlarms] = useState([
    {
      id: '1',
      time: '08:00 AM',
      label: 'Tomar Medicamento',
      category: 'Medicamentos',
      active: true,
    },
    {
      id: '2',
      time: '05:00 PM',
      label: 'Ejercicio Diario',
      category: 'Hábitos',
      active: false,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newAlarm, setNewAlarm] = useState({
    time: '',
    label: '',
    category: 'General',
  });

  const categories = ['Medicamentos', 'Pausas', 'Hábitos', 'Citas', 'General'];

  const handleAddAlarm = () => {
    if (!newAlarm.time || !newAlarm.label || !newAlarm.category) {
      Alert.alert('Error', 'Por favor, completa todos los campos antes de agregar una alarma.');
      return;
    }

    const newId = (alarms.length + 1).toString();
    setAlarms([
      ...alarms,
      { id: newId, ...newAlarm, active: true },
    ]);
    setNewAlarm({ time: '', label: '', category: 'General' });
    setModalVisible(false);
  };

  const handleDeleteAlarm = (id) => {
    Alert.alert(
      'Eliminar Alarma',
      '¿Estás seguro de que quieres eliminar esta alarma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setAlarms(alarms.filter((alarm) => alarm.id !== id)),
        },
      ]
    );
  };

  const toggleAlarm = (id) => {
    setAlarms(
      alarms.map((alarm) =>
        alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
      )
    );
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
          onValueChange={() => toggleAlarm(item.id)}
        />
        <TouchableOpacity onPress={() => handleDeleteAlarm(item.id)}>
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.alarmList}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
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
            <Text style={styles.modalTitle}>Agregar Nueva Alarma</Text>
            <TextInput
              style={styles.input}
              placeholder="Hora (ej: 08:00 AM)"
              placeholderTextColor="#A3ADDB"
              value={newAlarm.time}
              onChangeText={(text) => setNewAlarm((prev) => ({ ...prev, time: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Etiqueta"
              placeholderTextColor="#A3ADDB"
              value={newAlarm.label}
              onChangeText={(text) => setNewAlarm((prev) => ({ ...prev, label: text }))}
            />
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newAlarm.category === category && styles.selectedCategory,
                  ]}
                  onPress={() => setNewAlarm((prev) => ({ ...prev, category }))}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddAlarm}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
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
});

export default AlarmScreen;

