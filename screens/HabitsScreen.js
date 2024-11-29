import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const HabitScreen = () => {
  const [habits, setHabits] = useState([
    {
      id: '1',
      name: 'Ejercicio Diario',
      weeklyProgress: [50, 70, 80, 90, 100, 60, 40],
      monthlyProgress: [50, 60, 70, 80, 90, 100, 80, 70, 60, 50],
      days: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      months: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      benefit: 'El ejercicio diario mejora tu salud física y mental.',
      category: 'Salud',
    },
    {
      id: '2',
      name: 'Meditación',
      weeklyProgress: [20, 40, 60, 80, 100, 90, 70],
      monthlyProgress: [20, 30, 40, 50, 60, 70, 80, 90, 100, 80],
      days: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      months: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      benefit: 'La meditación reduce el estrés y aumenta la concentración.',
      category: 'Relajación',
    },
  ]);

  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', category: '', benefit: '' });
  const [sortMode, setSortMode] = useState('alphabetical'); // Default sort mode
  const scale = useState(new Animated.Value(1))[0];

  const toggleExpansion = (id) => {
    setExpandedHabitId(expandedHabitId === id ? null : id);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'weekly' ? 'monthly' : 'weekly'));
  };

  const handleAddHabit = () => {
    if (!newHabit.name.trim() || !newHabit.category.trim() || !newHabit.benefit.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos antes de agregar un hábito.');
      return;
    }

    const newId = (habits.length + 1).toString();
    setHabits([
      ...habits,
      {
        id: newId,
        name: newHabit.name,
        weeklyProgress: Array(7).fill(0),
        monthlyProgress: Array(10).fill(0),
        days: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
        months: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        benefit: newHabit.benefit,
        category: newHabit.category,
      },
    ]);
    setNewHabit({ name: '', category: '', benefit: '' });
    setModalVisible(false);
  };

  const handleDeleteHabit = (id) => {
    Alert.alert(
      'Eliminar Hábito',
      '¿Estás seguro de que quieres eliminar este hábito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setHabits(habits.filter((habit) => habit.id !== id)),
        },
      ]
    );
  };

  const markHabitAsDone = (id) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.5, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const updatedHabits = habits.map((habit) =>
      habit.id === id
        ? {
            ...habit,
            weeklyProgress: habit.weeklyProgress.map((value, index) =>
              index === new Date().getDay() - 1 ? value + 10 : value
            ),
          }
        : habit
    );
    setHabits(updatedHabits);
    Alert.alert('¡Hábito Completado!', 'Has registrado este hábito como realizado hoy.');
  };

  const sortHabits = (mode) => {
    const sortedHabits = [...habits].sort((a, b) => {
      if (mode === 'alphabetical') return a.name.localeCompare(b.name);
      if (mode === 'progress') return b.weeklyProgress.reduce((x, y) => x + y) - a.weeklyProgress.reduce((x, y) => x + y);
    });
    setHabits(sortedHabits);
    setSortMode(mode);
  };

  const renderHabitItem = ({ item }) => {
    const isExpanded = expandedHabitId === item.id;

    const chartData = viewMode === 'weekly' ? item.weeklyProgress : item.monthlyProgress;
    const labels = viewMode === 'weekly' ? item.days : item.months;

    return (
      <View style={styles.habitItem}>
        <TouchableOpacity style={styles.habitHeader} onPress={() => toggleExpansion(item.id)}>
          <Text style={styles.habitName}>{item.name}</Text>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#1D1B70" />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.habitDetails}>
            <Text style={styles.habitBenefit}>{item.benefit}</Text>
            <View style={styles.chartContainer}>
             
              <View style={styles.xAxis}>
                {labels.map((label, index) => (
                  <Text key={index} style={styles.xAxisLabel}>
                    {label}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.actionButtons}>
              <Animated.View style={{ transform: [{ scale }] }}>
                <TouchableOpacity style={styles.doneButton} onPress={() => markHabitAsDone(item.id)}>
                  <Icon name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.doneButtonText}>Marcar como Hecho</Text>
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteHabit(item.id)}>
                <Icon name="trash-can-outline" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Hábitos</Text>
      <View style={styles.sortButtons}>
        <TouchableOpacity style={styles.sortButton} onPress={() => sortHabits('alphabetical')}>
          <Text style={styles.sortButtonText}>Ordenar por Nombre</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => sortHabits('progress')}>
          <Text style={styles.sortButtonText}>Ordenar por Progreso</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={habits}
        renderItem={renderHabitItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.habitList}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Nuevo Hábito</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del Hábito"
              placeholderTextColor="#A3ADDB"
              value={newHabit.name}
              onChangeText={(text) => setNewHabit((prev) => ({ ...prev, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Categoría"
              placeholderTextColor="#A3ADDB"
              value={newHabit.category}
              onChangeText={(text) => setNewHabit((prev) => ({ ...prev, category: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Beneficio"
              placeholderTextColor="#A3ADDB"
              value={newHabit.benefit}
              onChangeText={(text) => setNewHabit((prev) => ({ ...prev, benefit: text }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddHabit}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
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
  habitList: {
    paddingBottom: height / 10,
  },
  habitItem: {
    backgroundColor: '#CECFDB',
    borderRadius: 10,
    marginBottom: height / 40,
    padding: width / 25,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitName: {
    fontSize: width / 22,
    color: '#1D1B70',
  },
  habitDetails: {
    marginTop: height / 60,
  },
  habitBenefit: {
    fontSize: width / 28,
    color: '#5127DB',
    marginBottom: height / 50,
    fontStyle: 'italic',
  },
  chartContainer: {
    height: height / 4,
    marginBottom: height / 50,
  },
  chart: {
    flex: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: height / 60,
  },
  xAxisLabel: {
    fontSize: width / 30,
    color: '#1D1B70',
  },
  toggleButton: {
    backgroundColor: '#5127DB',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: width / 28,
    fontWeight: 'bold',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#37657F',
    padding: 10,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    padding: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sortButton: {
    backgroundColor: '#A3ADDB',
    borderRadius: 8,
    padding: 10,
  },
  sortButtonText: {
    color: '#1D1B70',
    fontSize: width / 30,
  },
});

export default HabitScreen;
