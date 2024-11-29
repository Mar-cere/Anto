import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const TaskScreen = () => {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Completar ejercicio diario',
      category: 'Salud',
      priority: 'Alta',
      dueDate: '2024-11-30',
      completed: false,
      subtasks: ['Hacer estiramientos', 'Correr 2km'],
    },
    {
      id: '2',
      title: 'Leer un capítulo del libro',
      category: 'Educación',
      priority: 'Media',
      dueDate: '2024-12-01',
      completed: false,
      subtasks: ['Seleccionar el libro', 'Leer por 30 minutos'],
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    category: '',
    priority: 'Media',
    dueDate: '',
    subtasks: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [sortMode, setSortMode] = useState('priority');
  const [animationValue] = useState(new Animated.Value(1));

  const categoryIcons = {
    Salud: 'heart-pulse',
    Educación: 'book-open-outline',
    Relajación: 'meditation',
    Trabajo: 'briefcase-outline',
    Otros: 'dots-horizontal',
  };

  const sortTasks = (mode) => {
    const sortedTasks = [...tasks].sort((a, b) => {
      if (mode === 'priority') return a.priority.localeCompare(b.priority);
      if (mode === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
      return 0;
    });
    setTasks(sortedTasks);
    setSortMode(mode);
  };

  const handleAddTask = () => {
    if (!newTask.title.trim() || !newTask.category.trim() || !newTask.dueDate.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    setTasks((prev) => [
      ...prev,
      {
        ...newTask,
        id: (prev.length + 1).toString(),
        completed: false,
      },
    ]);
    setNewTask({ title: '', category: '', priority: 'Media', dueDate: '', subtasks: [] });
    setModalVisible(false);
  };

  const toggleTaskCompletion = (id) => {
    Animated.sequence([
      Animated.timing(animationValue, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(animationValue, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const renderSubtasks = (subtasks) =>
    subtasks.map((subtask, index) => (
      <Text key={index} style={styles.subtask}>
        - {subtask}
      </Text>
    ));

  const renderTaskItem = ({ item }) => {
    const icon = categoryIcons[item.category] || categoryIcons['Otros'];
    return (
      <View style={[styles.taskItem, item.completed && styles.taskCompleted]}>
        <TouchableOpacity
          style={styles.taskHeader}
          onPress={() => toggleTaskCompletion(item.id)}
        >
          <Animated.View style={{ transform: [{ scale: animationValue }] }}>
            <Icon
              name={icon}
              size={24}
              color={item.completed ? '#A3ADDB' : '#1D1B70'}
            />
          </Animated.View>
          <Text
            style={[
              styles.taskTitle,
              item.completed && styles.taskTitleCompleted,
            ]}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
        <Text style={styles.taskDetails}>
          {item.category} | Prioridad: {item.priority} | Fecha: {item.dueDate}
        </Text>
        {item.subtasks.length > 0 && (
          <View style={styles.subtasksContainer}>
            <Text style={styles.subtasksTitle}>Subtareas:</Text>
            {renderSubtasks(item.subtasks)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Tareas</Text>

      {/* Botones de Ordenamiento */}
      <View style={styles.sortButtons}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => sortTasks('priority')}
        >
          <Text style={styles.sortButtonText}>Ordenar por Prioridad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => sortTasks('dueDate')}
        >
          <Text style={styles.sortButtonText}>Ordenar por Fecha</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Tareas */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.taskList}
      />

      {/* Botón para Agregar Tarea */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para Agregar Tarea */}
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
              placeholder="Título"
              placeholderTextColor="#A3ADDB"
              value={newTask.title}
              onChangeText={(text) =>
                setNewTask((prev) => ({ ...prev, title: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Categoría"
              placeholderTextColor="#A3ADDB"
              value={newTask.category}
              onChangeText={(text) =>
                setNewTask((prev) => ({ ...prev, category: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Prioridad (Alta, Media, Baja)"
              placeholderTextColor="#A3ADDB"
              value={newTask.priority}
              onChangeText={(text) =>
                setNewTask((prev) => ({ ...prev, priority: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de Vencimiento (YYYY-MM-DD)"
              placeholderTextColor="#A3ADDB"
              value={newTask.dueDate}
              onChangeText={(text) =>
                setNewTask((prev) => ({ ...prev, dueDate: text }))
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
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
    backgroundColor: '#CECFDB',
    borderRadius: 10,
    padding: width / 25,
    marginBottom: height / 50,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: width / 22,
    color: '#1D1B70',
    marginLeft: width / 30,
  },
  taskDetails: {
    fontSize: width / 30,
    color: '#5127DB',
    marginTop: height / 80,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A3ADDB',
  },
  taskCompleted: {
    backgroundColor: '#A3ADDB',
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
  subtasksContainer: {
    marginTop: height / 80,
  },
  subtasksTitle: {
    fontSize: width / 28,
    color: '#1D1B70',
    fontWeight: 'bold',
  },
  subtask: {
    fontSize: width / 30,
    color: '#5127DB',
  },
});

export default TaskScreen;

