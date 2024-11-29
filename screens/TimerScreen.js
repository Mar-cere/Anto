import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const TimerScreen = () => {
  const [time, setTime] = useState(25 * 60); // Temporizador inicial 25 minutos
  const [isRunning, setIsRunning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRunning, time]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(25 * 60); // Resetea a 25 minutos
  };

  const handleMeditationMode = () => {
    setIsRunning(false);
    setTime(10 * 60); // Temporizador para 10 minutos
    Alert.alert('Modo Meditación', 'El temporizador se configuró en 10 minutos.');
  };

  const handleCustomTimeSubmit = () => {
    const minutes = parseInt(customTime, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Error', 'Por favor ingresa un tiempo válido en minutos.');
      return;
    }
    setTime(minutes * 60);
    setIsRunning(false);
    setModalVisible(false);
    Alert.alert('Tiempo Personalizado', `El temporizador se configuró en ${minutes} minutos.`);
    setCustomTime('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temporizador</Text>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(time)}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleStartPause}>
          <Icon
            name={isRunning ? 'pause' : 'play'}
            size={30}
            color="#FFFFFF"
          />
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Pausar' : 'Iniciar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Icon name="restart" size={30} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Reiniciar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.additionalControls}>
        <TouchableOpacity style={styles.additionalButton} onPress={handleMeditationMode}>
          <Icon name="meditation" size={24} color="#FFFFFF" />
          <Text style={styles.additionalButtonText}>Meditación</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.additionalButton} onPress={() => setModalVisible(true)}>
          <Icon name="clock-edit-outline" size={24} color="#FFFFFF" />
          <Text style={styles.additionalButtonText}>Tiempo Personalizado</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para tiempo personalizado */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurar Tiempo Personalizado</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa minutos"
              placeholderTextColor="#A3ADDB"
              keyboardType="numeric"
              value={customTime}
              onChangeText={setCustomTime}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCustomTimeSubmit}>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: width / 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: height / 20,
  },
  timerContainer: {
    backgroundColor: '#CECFDB',
    borderRadius: 100,
    width: width / 2,
    height: width / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height / 20,
  },
  timerText: {
    fontSize: width / 10,
    color: '#1D1B70',
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%', // Reduce el ancho para que los botones estén centrados
    marginBottom: height / 30,
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  controlButtonText: {
    color: '#FFFFFF',
    marginTop: 5,
    fontSize: width / 28,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%', // Menor espacio para botones adicionales
    marginTop: 20,
  },
  additionalButton: {
    alignItems: 'center',
  },
  additionalButtonText: {
    color: '#FFFFFF',
    marginTop: 5,
    fontSize: width / 30,
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
    textAlign: 'center',
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

export default TimerScreen;
