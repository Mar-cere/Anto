import React, { useEffect, useState } from 'react';
import { Image,View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Animated, Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

// Reusable Card Component
const Card = ({ title, children, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('Usuario');
  const [motivationalPhrase, setMotivationalPhrase] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const emotionScale = useState(new Animated.Value(1))[0];
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Completar ejercicio diario', done: false },
    { id: 2, text: 'Escribir en el diario', done: false },
  ]);

  const phrases = [
    "Hoy es un gran día para brillar.",
    "Recuerda, eres más fuerte de lo que crees.",
    "Pequeños pasos llevan a grandes logros.",
    "Respira profundo, estás haciendo un buen trabajo.",
  ];

  const emotions = [
    { id: 1, emoji: '😊', label: 'Feliz' },
    { id: 2, emoji: '😢', label: 'Triste' },
    { id: 3, emoji: '😠', label: 'Enojado' },
    { id: 4, emoji: '😨', label: 'Ansioso' },
    { id: 5, emoji: '😌', label: 'Relajado' },
  ];

  const alarms = [
    { id: 1, time: '08:00 AM', label: 'Tomar Medicamento' },
    { id: 2, time: '05:00 PM', label: 'Ejercicio Diario' },
  ];

  const notifications = [
    { id: '1', text: '¡Nueva entrada en el diario disponible!' },
    { id: '2', text: 'Recuerda tu cita con el psicólogo mañana.' },
    { id: '3', text: 'Ejercicio diario completado, ¡sigue así!' },
  ];

  const habitProgress = [
    { habit: 'Ejercicio Diario', value: 70 },
    { habit: 'Relajación', value: 50 },
  ];

  const handleEmotionSelect = (emotion) => {
    Vibration.vibrate(50);
    Animated.sequence([
      Animated.timing(emotionScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(emotionScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setSelectedEmotion(emotion);
  };

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    setMotivationalPhrase(phrases[randomIndex]);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Saludo Personalizado */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>¡Hola, {userName}!</Text>
          <Text style={styles.motivationalText}>{motivationalPhrase}</Text>
        </View>

        {/* Detección de Emociones */}
        <Card title="¿Cómo te sientes hoy?" onPress={() => {}}>
          <View style={styles.emotionContainer}>
            {emotions.map((emotion) => (
              <TouchableOpacity
                key={emotion.id}
                onPress={() => handleEmotionSelect(emotion)}
              >
                <Animated.View
                  style={[
                    styles.emojiButton,
                    selectedEmotion?.id === emotion.id && styles.selectedEmojiButton,
                    selectedEmotion?.id === emotion.id && {
                      transform: [{ scale: emotionScale }],
                    },
                  ]}
                >
                  <Text style={styles.emoji}>{emotion.emoji}</Text>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Alarmas */}
        <Card title="Mis Alarmas" onPress={() => navigation.navigate('Alarms')}>
          {alarms.map((alarm) => (
            <Text key={alarm.id} style={styles.cardSubtitle}>
              {alarm.time} - {alarm.label}
            </Text>
          ))}
        </Card>

        {/* Lista de Tareas */}
        <Card title="Lista de Tareas" onPress={() => {}}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <TouchableOpacity
                onPress={() =>
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, done: !t.done } : t
                    )
                  )
                }
              >
                <Icon
                  name={task.done ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={task.done ? '#5127DB' : '#A3ADDB'}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.taskText,
                  task.done && styles.taskTextDone,
                ]}
              >
                {task.text}
              </Text>
            </View>
          ))}
        </Card>

        {/* Progreso de Hábitos */}
        <Card title="Progreso de Hábitos" onPress={() => navigation.navigate('Habits')}>
          {habitProgress.map((habit, index) => (
            <View key={index} style={styles.habitProgress}>
              <Text style={styles.cardSubtitle}>{habit.habit}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${habit.value}%` }]} />
              </View>
            </View>
          ))}
        </Card>

        {/* Notificaciones */}
        <Card
          title="Notificaciones Recientes"
          onPress={() => navigation.navigate('Notifications')}
        >
          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Icon name="bell" size={width / 20} color="#1D1B70" />
              <Text style={styles.notificationText}>{notification.text}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Barra Flotante */}
      <View style={styles.floatingBar}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="home" size={width / 12} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <Image
            style={styles.images}
            source={require('../resources/images/Anto.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="account-circle" size={width / 12} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70'
  },
  scrollContainer: {
    paddingBottom: height / 8
  },
  greetingContainer: {
    marginTop: height / 16,
    paddingHorizontal: width / 15
  },
  greetingText: {
    fontSize: width / 12,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  motivationalText: {
    fontSize: width / 25,
    color: '#A3ADDB',
    marginTop: 5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#CECFDB',
    borderRadius: 15,
    padding: width / 20,
    marginHorizontal: width / 25,
    marginBottom: height / 42,
  },
  cardTitle: {
    fontSize: width / 20,
    color: '#1D1B70',
    fontWeight: 'bold',
    marginBottom: height / 100
  },
  cardSubtitle: {
    fontSize: width / 30,
    color: '#1D1B70',
    marginBottom: height / 80
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height / 100
  },
  taskText: {
    fontSize: width / 30,
    color: '#1D1B70',
    marginLeft: 10
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#A3ADDB'
  },
  emotionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  emojiButton: {
    width: width / 7,
    height: width / 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: width / 14,
    backgroundColor: '#A3ADDB',
  },
  selectedEmojiButton: {
    backgroundColor: '#5127DB'
  },
  emoji: {
    fontSize: width / 12 
  },
  habitProgress: {
    marginBottom: height / 50 
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#A3ADDB',
    borderRadius: 5
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5127DB'
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height / 80
  },
  notificationText: {
    marginLeft: width / 30,
    fontSize: width / 30,
    color: '#1D1B70'
  },
  images: {
    width: width / 10, // Tamaño similar a los íconos
    height: width / 10, // Asegura proporción cuadrada
    resizeMode: 'contain', // Asegura que la imagen se ajuste sin distorsión
    marginVertical: height / 350, // Espaciado vertical
  },
  floatingBar: {
    position: 'absolute',
    bottom: height / 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#5473C2',
    borderRadius: 30,
    paddingVertical: height / 85,
    marginHorizontal: width / 32,
    zIndex: 0, // Asegurar que la imagen tenga prioridad
  },
  floatingButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
});

export default DashboardScreen;
