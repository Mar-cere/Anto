import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const JournalScreen = ({ navigation }) => {
  const [entries, setEntries] = useState([
    {
      id: '1',
      title: 'Día de reflexión',
      content: 'Hoy pensé mucho sobre mi futuro y mis metas...',
      date: '25/11/2024',
      category: 'Reflexión',
    },
    {
      id: '2',
      title: 'Logro importante',
      content: 'Hoy logré completar un gran proyecto en el trabajo.',
      date: '24/11/2024',
      category: 'Meta',
    },
  ]);

  const [searchText, setSearchText] = useState('');
  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: '',
  });

  const categories = ['Reflexión', 'Meta', 'Día Duro', 'Otro'];

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

  const handleAddEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim() || !newEntry.category.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    const newId = (entries.length + 1).toString();
    const date = new Date().toLocaleDateString();
    setEntries([
      ...entries,
      { id: newId, ...newEntry, date },
    ]);
    setNewEntry({ title: '', content: '', category: '' });
    setFilteredEntries([
      ...entries,
      { id: newId, ...newEntry, date },
    ]);
    setModalVisible(false);
  };

  const handleDeleteEntry = (id) => {
    Alert.alert(
      'Eliminar Entrada',
      '¿Estás seguro de que deseas eliminar esta entrada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedEntries = entries.filter((entry) => entry.id !== id);
            setEntries(updatedEntries);
            setFilteredEntries(updatedEntries);
            if (selectedEntry?.id === id) setSelectedEntry(null);
          },
        },
      ]
    );
  };

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
        visible={modalVisible || !!selectedEntry}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedEntry(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedEntry ? 'Detalles de Entrada' : 'Nueva Entrada'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor="#A3ADDB"
              value={selectedEntry ? selectedEntry.title : newEntry.title}
              onChangeText={(text) =>
                selectedEntry
                  ? setSelectedEntry({ ...selectedEntry, title: text })
                  : setNewEntry({ ...newEntry, title: text })
              }
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contenido"
              placeholderTextColor="#A3ADDB"
              value={selectedEntry ? selectedEntry.content : newEntry.content}
              onChangeText={(text) =>
                selectedEntry
                  ? setSelectedEntry({ ...selectedEntry, content: text })
                  : setNewEntry({ ...newEntry, content: text })
              }
              multiline
            />
            <Text style={styles.modalSubtitle}>Categoría</Text>
            <View style={styles.categoryList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    (selectedEntry?.category === category ||
                      newEntry.category === category) && styles.selectedCategory,
                  ]}
                  onPress={() =>
                    selectedEntry
                      ? setSelectedEntry({ ...selectedEntry, category })
                      : setNewEntry({ ...newEntry, category })
                  }
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      (selectedEntry?.category === category ||
                        newEntry.category === category) && styles.selectedCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              {selectedEntry && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteEntry(selectedEntry.id)}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={selectedEntry ? () => setSelectedEntry(null) : handleAddEntry}
              >
                <Text style={styles.saveButtonText}>
                  {selectedEntry ? 'Cerrar' : 'Guardar'}
                </Text>
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
});

export default JournalScreen;

