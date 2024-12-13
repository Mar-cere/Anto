import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');


const JournalScreen = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: '',
    category: '',
    thoughts: '',
    gratitude: '',
    improvements: '',
    activities: [],
    tags: []
  });

  const moods = ['Excelente', 'Bien', 'Normal', 'Mal', 'Terrible'];
  const categories = ['Reflexión', 'Meta', 'Día Duro', 'Otro'];

  const [filteredEntries, setFilteredEntries] = useState([]);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/journals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las entradas');
      }

      const data = await response.json();
      setEntries(data);
      setFilteredEntries(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar las entradas del diario');
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredEntries(entries);
    } else {
      setFilteredEntries(
        entries.filter((entry) =>
          entry.title.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  const handleAddEntry = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5001/api/journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) {
        throw new Error('Error al crear la entrada');
      }

      const savedEntry = await response.json();
      setEntries(prevEntries => [savedEntry, ...prevEntries]);
      setNewEntry({
        title: '',
        content: '',
        mood: '',
        category: '',
        thoughts: '',
        gratitude: '',
        improvements: '',
        activities: [],
        tags: []
      });
      setModalVisible(false);
      Alert.alert('¡Éxito!', 'Entrada creada correctamente');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo crear la entrada');
    }
  };

  const handleDeleteEntry = async (id) => {
    Alert.alert(
      'Eliminar Entrada',
      '¿Estás seguro de que deseas eliminar esta entrada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`http://localhost:5001/api/journals/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              });

              if (!response.ok) {
                throw new Error('Error al eliminar la entrada');
              }

              setEntries(prevEntries => prevEntries.filter(entry => entry._id !== id));
              setSelectedEntry(null);
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo eliminar la entrada');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5127DB" />
      </View>
    );
  }

  const renderEntryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.entryItem}
      onPress={() => setSelectedEntry(item)}
    >
      <Text style={styles.entryTitle}>{item.title}</Text>
      <Text style={styles.entryDate}>{item.date}</Text>
      <Text style={styles.entryCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Diario</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          placeholderTextColor="#A3ADDB"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Lista de Entradas */}
      <FlatList
        data={filteredEntries}
        renderItem={renderEntryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.entryList}
        ListEmptyComponent={<Text style={styles.emptyListText}>No hay entradas.</Text>}
      />

      {/* Botón Flotante para Añadir Entrada */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para Añadir o Editar Entrada */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Entrada</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor="#A3ADDB"
              value={newEntry.title}
              onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
            />

            <Text style={styles.modalSubtitle}>Estado de ánimo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.moodContainer}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodButton,
                      newEntry.mood === mood && styles.selectedMood
                    ]}
                    onPress={() => setNewEntry({ ...newEntry, mood })}
                  >
                    <Text style={[
                      styles.moodText,
                      newEntry.mood === mood && styles.selectedMoodText
                    ]}>
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.modalSubtitle}>Categoría</Text>
            <View style={styles.categoryList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newEntry.category === category && styles.selectedCategory
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, category })}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    newEntry.category === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contenido"
              placeholderTextColor="#A3ADDB"
              value={newEntry.content}
              onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
              multiline
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="¿Por qué estás agradecido hoy?"
              placeholderTextColor="#A3ADDB"
              value={newEntry.gratitude}
              onChangeText={(text) => setNewEntry({ ...newEntry, gratitude: text })}
              multiline
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="¿Qué podrías mejorar?"
              placeholderTextColor="#A3ADDB"
              value={newEntry.improvements}
              onChangeText={(text) => setNewEntry({ ...newEntry, improvements: text })}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewEntry({
                    title: '',
                    content: '',
                    mood: '',
                    category: '',
                    thoughts: '',
                    gratitude: '',
                    improvements: '',
                    activities: [],
                    tags: []
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddEntry}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
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
    paddingHorizontal: width / 20,
  },
  header: {
    marginTop: height / 20,
    marginBottom: height / 40,
  },
  title: {
    fontSize: width / 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: height / 50,
  },
  searchInput: {
    backgroundColor: '#CECFDB',
    color: '#1D1B70',
    borderRadius: 10,
    padding: 10,
  },
  entryList: {
    paddingBottom: height / 10,
  },
  entryItem: {
    backgroundColor: '#CECFDB',
    borderRadius: 10,
    padding: width / 25,
    marginBottom: height / 50,
  },
  entryTitle: {
    fontSize: width / 22,
    color: '#1D1B70',
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: width / 28,
    color: '#37657F',
  },
  entryCategory: {
    fontSize: width / 30,
    color: '#5127DB',
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
    marginBottom: height / 50,
  },
  modalSubtitle: {
    fontSize: width / 28,
    color: '#1D1B70',
    fontWeight: 'bold',
    marginBottom: height / 80,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: height / 50,
    color: '#1D1B70',
  },
  textArea: {
    height: height / 6,
    textAlignVertical: 'top',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: height / 30,
  },
  categoryButton: {
    backgroundColor: '#A3ADDB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: height / 80,
  },
  selectedCategory: {
    backgroundColor: '#37657F',
  },
  categoryButtonText: {
    color: '#1D1B70',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#5127DB',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: width / 28,
  },
  deleteButton: {
    backgroundColor: '#E63946',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: width / 28,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#A3ADDB',
    fontSize: width / 30,
    marginTop: height / 50,
  },
  moodContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  moodButton: {
    backgroundColor: '#A3ADDB',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedMood: {
    backgroundColor: '#5127DB',
  },
  moodText: {
    color: '#1D1B70',
  },
  selectedMoodText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#A3ADDB',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#1D1B70',
    fontSize: width / 28,
  },
  saveButton: {
    backgroundColor: '#5127DB',
    borderRadius: 10,
    paddingVertical: height / 90,
    paddingHorizontal: width / 20,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
});

export default JournalScreen;

