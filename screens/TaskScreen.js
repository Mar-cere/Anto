import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const TaskScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    category: '',
    priority: 'Media',
    dueDate: new Date(),
    subtasks: [],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [sortMode, setSortMode] = useState('priority');
  const [animationValue] = useState(new Animated.Value(1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = [
    { id: 'salud', name: 'Salud', icon: 'heart-pulse' },
    { id: 'educacion', name: 'Educación', icon: 'book-open-outline' },
    { id: 'relajacion', name: 'Relajación', icon: 'meditation' },
    { id: 'trabajo', name: 'Trabajo', icon: 'briefcase-outline' },
    { id: 'otros', name: 'Otros', icon: 'dots-horizontal' },
  ];

  const priorities = [
    { id: 'alta', name: 'Alta', color: '#E63946' },
    { id: 'media', name: 'Media', color: '#FFB703' },
    { id: 'baja', name: 'Baja', color: '#2A9D8F' },
  ];

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        setToken(storedToken);
        if (storedToken) {
          await fetchTasks(storedToken);
        }
      } catch (error) {
        console.error('Error al inicializar:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const fetchTasks = async (userToken) => {
    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las tareas');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const sortTasks = (mode) => {
    const sortedTasks = [...tasks].sort((a, b) => {
      if (mode === 'priority') {
        const priorityOrder = { Alta: 1, Media: 2, Baja: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (mode === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
      return 0;
    });
    setTasks(sortedTasks);
    setSortMode(mode);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.category) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTask,
          dueDate: formatDate(newTask.dueDate)
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la tarea');
      }

      const savedTask = await response.json();
      setTasks(prev => [...prev, savedTask]);
      setModalVisible(false);
      setNewTask({
        title: '',
        category: '',
        priority: 'Media',
        dueDate: new Date(),
        subtasks: [],
      });
    } catch (error) {
      console.error('Error al crear tarea:', error);
      Alert.alert('Error', 'No se pudo crear la tarea');
    }
  };

  const toggleTaskCompletion = async (id) => {
    try {
      const task = tasks.find(t => t._id === id);
      const response = await fetch(`http://localhost:5001/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...task,
          completed: !task.completed
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la tarea');
      }

      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }),
      ]).start();

      const updatedTask = await response.json();
      setTasks(prev =>
        prev.map(task => task._id === id ? updatedTask : task)
      );
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
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
              newTask.category === cat.name && styles.categoryButtonSelected
            ]}
            onPress={() => setNewTask(prev => ({ ...prev, category: cat.name }))}
          >
            <Icon 
              name={cat.icon} 
              size={24} 
              color={newTask.category === cat.name ? '#FFFFFF' : '#1D1B70'} 
            />
            <Text style={[
              styles.categoryButtonText,
              newTask.category === cat.name && styles.categoryButtonTextSelected
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const PrioritySelector = () => (
    <View style={styles.priorityContainer}>
      <Text style={styles.inputLabel}>Prioridad</Text>
      <View style={styles.priorityButtons}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority.id}
            style={[
              styles.priorityButton,
              newTask.priority === priority.name && { backgroundColor: priority.color }
            ]}
            onPress={() => setNewTask(prev => ({ ...prev, priority: priority.name }))}
          >
            <Text style={[
              styles.priorityButtonText,
              newTask.priority === priority.name && styles.priorityButtonTextSelected
            ]}>
              {priority.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTaskItem = ({ item }) => {
    const priorityColor = priorities.find(p => p.name === item.priority)?.color || '#1D1B70';
    const icon = categories.find(c => c.name === item.category)?.icon || 'dots-horizontal';
    
    return (
      <Animated.View style={[
        styles.taskItem, 
        item.completed && styles.taskCompleted,
        { transform: [{ scale: animationValue }] }
      ]}>
        <TouchableOpacity
          style={styles.taskHeader}
          onPress={() => toggleTaskCompletion(item._id)}
        >
          <Icon
            name={icon}
            size={24}
            color={item.completed ? '#A3ADDB' : '#1D1B70'}
          />
          <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.taskDetailsContainer}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityBadgeText}>{item.priority}</Text>
          </View>
          <Text style={styles.taskDate}>Fecha: {formatDate(item.dueDate)}</Text>
        </View>

        {item.subtasks && item.subtasks.length > 0 && (
          <View style={styles.subtasksContainer}>
            {item.subtasks.map((subtask, index) => (
              <Text key={index} style={styles.subtask}>
                • {subtask.description}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>
    );
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
      <Text style={styles.title}>Mis Tareas</Text>

      <View style={styles.sortButtons}>
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'priority' && styles.sortButtonActive]}
          onPress={() => sortTasks('priority')}
        >
          <Icon name="sort" size={20} color={sortMode === 'priority' ? '#FFFFFF' : '#1D1B70'} />
          <Text style={[
            styles.sortButtonText,
            sortMode === 'priority' && styles.sortButtonTextActive
          ]}>
            Por Prioridad
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'dueDate' && styles.sortButtonActive]}
          onPress={() => sortTasks('dueDate')}
        >
          <Icon name="calendar" size={20} color={sortMode === 'dueDate' ? '#FFFFFF' : '#1D1B70'} />
          <Text style={[
            styles.sortButtonText,
            sortMode === 'dueDate' && styles.sortButtonTextActive
          ]}>
            Por Fecha
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.taskList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-text-off" size={50} color="#A3ADDB" />
            <Text style={styles.emptyText}>No hay tareas pendientes</Text>
          </View>
        }
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
            <Text style={styles.modalTitle}>Nueva Tarea</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Título de la tarea"
              placeholderTextColor="#A3ADDB"
              value={newTask.title}
              onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
            />

            <CategorySelector />
            <PrioritySelector />

            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={24} color="#1D1B70" />
              <Text style={styles.dateButtonText}>
                {formatDate(newTask.dueDate)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(newTask.dueDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNewTask(prev => ({ ...prev, dueDate: selectedDate }));
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddTask}
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

// Los estilos se mantienen igual que en tu código original
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
  taskList: {
    paddingBottom: height / 10,
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: width / 25,
    marginBottom: height / 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: width / 22,
    color: '#1D1B70',
    marginLeft: width / 30,
    flex: 1,
  },
  taskDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height / 80,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  priorityBadgeText: {
    color: '#FFFFFF',
    fontSize: width / 32,
    fontWeight: '500',
  },
  taskDate: {
    fontSize: width / 30,
    color: '#5127DB',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A3ADDB',
  },
  taskCompleted: {
    backgroundColor: '#F0EFFF',
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height / 40,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFFF',
    borderRadius: 8,
    padding: 10,
    flex: 0.48,
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#5127DB',
  },
  sortButtonText: {
    color: '#1D1B70',
    fontSize: width / 30,
    marginLeft: 8,
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
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
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: width / 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: width / 20,
    color: '#1D1B70',
    fontWeight: 'bold',
    marginBottom: height / 40,
  },
  input: {
    backgroundColor: '#F0EFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: height / 50,
    color: '#1D1B70',
    fontSize: width / 28,
  },
  categoryContainer: {
    marginBottom: height / 50,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFFF',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
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
  priorityContainer: {
    marginBottom: height / 50,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#F0EFFF',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  priorityButtonText: {
    color: '#1D1B70',
    fontSize: width / 32,
  },
  priorityButtonTextSelected: {
    color: '#FFFFFF',
  },
  inputLabel: {
    color: '#1D1B70',
    fontSize: width / 30,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: height / 50,
  },
  dateButtonText: {
    marginLeft: 10,
    color: '#1D1B70',
    fontSize: width / 28,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height / 40,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#5127DB',
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#A3ADDB',
    marginLeft: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: width / 28,
    fontWeight: '500',
  },
  subtasksContainer: {
    marginTop: height / 80,
    borderTopWidth: 1,
    borderTopColor: '#F0EFFF',
    paddingTop: height / 80,
  },
  subtask: {
    fontSize: width / 30,
    color: '#5127DB',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#A3ADDB',
    fontSize: width / 25,
    marginTop: 10,
  },
});

export default TaskScreen;