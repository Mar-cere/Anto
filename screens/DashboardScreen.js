import React, { useEffect, useState } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import motivationalPhrases from '../resources/motivationalPhrases';

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
  const [drawerVisible, setDrawerVisible] = useState(false); // Estado para la barra lateral
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

  const [drawerAnimation] = useState(new Animated.Value(width)); 

  const handleGesture = Animated.event(
    [{ nativeEvent: { translationX: drawerAnimation } }],
    { useNativeDriver: true }
  );

  const handleGestureEnd = ({ nativeEvent }) => {
    if (nativeEvent.translationX > 100) {
      // Si el deslizamiento es suficiente, cierra el drawer
      Animated.timing(drawerAnimation, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setDrawerVisible(false));
    } else {
      // Si no, vuelve a su posición original
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleDrawer = () => {
    const toValue = drawerVisible ? width : 0; // Posición fuera o dentro de la pantalla
    Animated.timing(drawerAnimation, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(!drawerVisible));
  };

  const handleEmotionSelect = async (emotion) => {
    console.log('[handleEmotionSelect] Emoji seleccionado:', emotion);
  
    Vibration.vibrate(50);
  
    // Animación al seleccionar un emoji
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
    ]).start(() => console.log('[handleEmotionSelect] Animación completada'));
  
    setSelectedEmotion(emotion);
  
    // Crear el objeto de estado emocional
    const emotionData = {
      emotion: emotion.label,
      emoji: emotion.emoji,
      timestamp: new Date().toISOString(),
    };
  
    console.log('[handleEmotionSelect] Datos a enviar:', emotionData);
  
    try {
      // Obtener authToken de AsyncStorage
      const authToken = await AsyncStorage.getItem('userToken');
  
      if (!authToken) {
        throw new Error('Token de autenticación no disponible');
      }
  
      const response = await fetch('http://localhost:5001/api/emotions/emotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(emotionData),
      });
  
      console.log('[handleEmotionSelect] Respuesta del servidor:', response);
  
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log('[handleEmotionSelect] Estado emocional registrado con éxito:', result);
    } catch (error) {
      console.error('[handleEmotionSelect] Error al registrar el estado emocional:', error.message);
    }
  };
  
  
  
  useEffect(() => {
    const fetchUserNameFromServer = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await fetch('http://localhost:5001/api/users/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (response.ok) {
            const data = await response.json();
            setUserName(data.name || 'Usuario');
          } else {
            console.error('Error al obtener datos del usuario:', response.status);
          }
        }
      } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
      }
    };
  
    fetchUserNameFromServer();
  }, []);
  
  useEffect(() => {
    const pickRandomPhrase = () => {
      const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
      setMotivationalPhrase(motivationalPhrases[randomIndex]);
    };
  
    pickRandomPhrase();
  }, []);
  

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Barra lateral */}
          {drawerVisible && (
            <PanGestureHandler
              onGestureEvent={handleGesture}
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.END) {
                  handleGestureEnd({ nativeEvent });
                }
              }}
            >
              <Animated.View
                style={[
                  styles.drawer,
                  { transform: [{ translateX: drawerAnimation }] },
                ]}
              >
                <Text style={styles.drawerTitle}>Opciones</Text>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Profile');
                    toggleDrawer();
                  }}
                  style={styles.drawerItem}
                >
                  <Icon name="cog" size={24} color="#1D1B70" />
                  <Text style={styles.drawerText}>Mi perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Settings');
                    toggleDrawer();
                  }}
                  style={styles.drawerItem}
                >
                  <Icon name="cog" size={24} color="#1D1B70" />
                  <Text style={styles.drawerText}>Configuración</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleDrawer} style={styles.drawerItem}>
                  <Icon name="logout" size={24} color="#1D1B70" />
                  <Text style={styles.drawerText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          )}
      {/* Contenido Principal */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Saludo Personalizado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>¡Hola, {userName}!</Text>
            <Text style={styles.motivationalText}>{motivationalPhrase}</Text>
          </View>
          <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
            <Icon name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Contenido restante */}
        <Card title="¿Cómo te sientes hoy?" onPress={() => {}}>
  <View style={styles.emotionContainer}>
    {emotions.map((emotion) => (
      <TouchableOpacity
        key={emotion.id}
        onPress={() => handleEmotionSelect(emotion)} // Llamar a la función
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
        <Card title="Lista de Tareas" onPress={() => navigation.navigate('Tasks')}>
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
          onPress={() => navigation.navigate('Journal')}
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
          onPress={() => navigation.navigate('Timer')}
        >
          <Icon name="account-circle" size={width / 12} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      </View>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B70',
  },
  scrollContainer: {
    paddingBottom: height / 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height / 16,
    paddingHorizontal: width / 15,
  },
  greetingText: {
    fontSize: width / 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  drawerButton: {
    backgroundColor: '#5127DB',
    padding: 8,
    borderRadius: 8,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: width / 2,
    height: '100%',
    backgroundColor: '#CECFDB',
    padding: width / 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Para Android
  },
  drawerTitle: {
    fontSize: width / 18,
    fontWeight: 'bold',
    color: '#1D1B70',
    marginBottom: height / 40,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height / 40,
  },
  drawerText: {
    fontSize: width / 25,
    color: '#1D1B70',
    marginLeft: width / 30,
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
    marginBottom: height / 100,
  },
  emotionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    backgroundColor: '#5127DB',
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
