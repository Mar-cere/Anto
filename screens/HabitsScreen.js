import React, { useState, useEffect} from 'react';
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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HabitScreen = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', category: '', benefit: '' });

  const categories = [
    { id: 'salud', name: 'Salud', icon: 'heart-pulse', color: '#4CAF50' },
    { id: 'relajacion', name: 'Relajación', icon: 'meditation', color: '#FFC107' },
    { id: 'educacion', name: 'Educación', icon: 'book-open-outline', color: '#2196F3' },
    { id: 'ejercicio', name: 'Ejercicio', icon: 'run', color: '#E91E63' },
    { id: 'otros', name: 'Otros', icon: 'dots-horizontal', color: '#9C27B0' },
  ];

  const categoryColors = {
    Salud: '#4CAF50',
    Relajación: '#FFC107',
    Educación: '#2196F3',
    Ejercicio: '#E91E63',
    Otros: '#9C27B0',
  };

  // Cargar hábitos al inicio
  useEffect(() => {
    fetchHabits();
  }, []);

  const toggleExpansion = (id) => {
    setExpandedHabitId(expandedHabitId === id ? null : id);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'weekly' ? 'monthly' : 'weekly'));
  };

  const CategorySelector = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.inputLabel}>Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              newHabit.category === cat.name && [
                styles.categoryButtonSelected,
                { backgroundColor: cat.color }
              ]
            ]}
            onPress={() => setNewHabit(prev => ({ ...prev, category: cat.name }))}
          >
            <Icon 
              name={cat.icon} 
              size={24} 
              color={newHabit.category === cat.name ? '#FFFFFF' : cat.color} 
            />
            <Text style={[
              styles.categoryButtonText,
              newHabit.category === cat.name && styles.categoryButtonTextSelected
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const fetchHabits = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/habits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los hábitos');
      }

      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los hábitos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabit.name.trim() || !newHabit.category.trim() || !newHabit.benefit.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/habits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHabit),
      });

      if (!response.ok) {
        throw new Error('Error al crear el hábito');
      }

      const savedHabit = await response.json();
      setHabits(prevHabits => [...prevHabits, savedHabit]);
      setNewHabit({ name: '', category: '', benefit: '' });
      setModalVisible(false);
      Alert.alert('¡Éxito!', 'Hábito creado correctamente');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo crear el hábito');
    }
  };

  const handleDeleteHabit = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5001/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar el hábito');
      }
  
      setHabits(prevHabits => prevHabits.filter(habit => habit._id !== id));
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo eliminar el hábito');
    }
  };

  const markHabitAsDone = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5001/api/habits/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        throw new Error('Error al completar el hábito');
      }
  
      const updatedHabit = await response.json();
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit._id === id ? updatedHabit : habit
        )
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo completar el hábito');
    }
  };

  const calculateAverageProgress = (progress) => {
    if (!progress || progress.length === 0) return 0;
    return progress.reduce((acc, val) => acc + val.value, 0) / progress.length;
  };
  const renderHabitItem = ({ item }) => {
    const isExpanded = expandedHabitId === item._id;
    const progressData = viewMode === 'weekly' ? item.weeklyProgress : item.monthlyProgress;
    const averageProgress = calculateAverageProgress(progressData);
    const progressColor = categoryColors[item.category] || categoryColors['Otros'];
  
    return (
      <View style={[styles.habitItem, { borderLeftWidth: 4, borderLeftColor: progressColor }]}>
        <TouchableOpacity style={styles.habitHeader} onPress={() => toggleExpansion(item._id)}>
          <View style={styles.habitHeaderLeft}>
            <Icon 
              name={getCategoryIcon(item.category)} 
              size={24} 
              color={progressColor} 
              style={styles.categoryIcon}
            />
            <Text style={styles.habitName}>{item.name}</Text>
          </View>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#1D1B70" />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.habitDetails}>
            <Text style={styles.habitBenefit}>{item.benefit}</Text>
            <Text style={styles.progressLabel}>
              {viewMode === 'weekly' ? 'Progreso Semanal' : 'Progreso Mensual'}: {averageProgress.toFixed(1)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${averageProgress}%`, backgroundColor: progressColor },
                ]}
              />
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => markHabitAsDone(item._id)}
              >
                <Icon name="check" size={20} color="#FFFFFF" />
                <Text style={styles.doneButtonText}>Marcar como Realizado</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteHabit(item._id)}
              >
                <Icon name="trash-can-outline" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleViewMode}
            >
              <Text style={styles.toggleButtonText}>
                {viewMode === 'weekly' ? 'Cambiar a Mensual' : 'Cambiar a Semanal'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
  );
};

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Salud':
        return 'heart-pulse';
      case 'Relajación':
        return 'meditation';
      case 'Educación':
        return 'book-open-outline';
      case 'Ejercicio':
        return 'run';
      default:
        return 'dots-horizontal';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5127DB" />
      </View>
    );
  }


return (
  <View style={styles.container}>
    <Text style={styles.title}>Mis Hábitos</Text>
    <FlatList
      data={habits}
      renderItem={renderHabitItem}
      keyExtractor={(item) => item._id} // Cambiar item.id por item._id
      contentContainerStyle={styles.habitList}
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
          <Text style={styles.modalTitle}>Nuevo Hábito</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del hábito"
            placeholderTextColor="#A3ADDB"
            value={newHabit.name}
            onChangeText={(text) => setNewHabit((prev) => ({ ...prev, name: text }))}
          />
          <CategorySelector />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="¿Qué beneficios te traerá este hábito?"
            placeholderTextColor="#A3ADDB"
            value={newHabit.benefit}
            onChangeText={(text) => setNewHabit((prev) => ({ ...prev, benefit: text }))}
            multiline
            numberOfLines={3}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleAddHabit}
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
  progressBar: {
    height: 10,
    backgroundColor: '#A3ADDB',
    borderRadius: 5,
    marginBottom: height / 50,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: width / 30,
    color: '#1D1B70',
    marginBottom: height / 80,
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
  toggleButton: {
    backgroundColor: '#5127DB',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: height / 50,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: width / 28,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginBottom: height / 50,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#5127DB',
  },
  categoryButtonText: {
    marginLeft: 8,
    color: '#1D1B70',
    fontSize: width / 32,
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputLabel: {
    color: '#1D1B70',
    fontSize: width / 30,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#5127DB',
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#A3ADDB',
    flex: 1,
    marginLeft: 8,
  },
  habitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D1B70',
  },
});

export default HabitScreen;
