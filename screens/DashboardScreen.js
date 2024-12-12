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
  Switch,
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

  const [tasks, setTasks] = useState([]);

  const emotions = [
    { id: 1, emoji: '😊', label: 'Feliz' },
    { id: 2, emoji: '😢', label: 'Triste' },
    { id: 3, emoji: '😠', label: 'Enojado' },
    { id: 4, emoji: '😨', label: 'Ansioso' },
    { id: 5, emoji: '😌', label: 'Relajado' },
  ];

  const [notifications, setNotifications] = useState([]);


  const [habits, setHabits] = useState([]);

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

  const toggleTaskCompletion = async (taskId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const task = tasks.find(t => t._id === taskId);
      
      // Animación al marcar/desmarcar
      Animated.sequence([
        Animated.timing(emotionScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(emotionScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
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
  
      // Actualizar el estado local
      setTasks(prev => 
        prev.map(t => t._id === taskId ? { ...t, completed: !t.completed } : t)
      );

      // Vibración sutil al completar
      Vibration.vibrate(50);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
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
        console.error('Error al cargar los hábitos:', error);
      }
    };
  
    fetchHabits();
  }, []);

  const formatTime = (time) => {
    return time.toUpperCase();
  };

  const getDaysText = (repeatDays) => {
    if (!repeatDays) return '';
    
    const days = {
      monday: 'L',
      tuesday: 'M',
      wednesday: 'X',
      thursday: 'J',
      friday: 'V',
      saturday: 'S',
      sunday: 'D'
    };

    const selectedDays = Object.entries(repeatDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day, _]) => days[day]);

    if (selectedDays.length === 0) return 'Una vez';
    if (selectedDays.length === 7) return 'Todos los días';
    return selectedDays.join(' · ');
  };

  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch('http://localhost:5001/api/alarms', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar las alarmas');
        }

        const data = await response.json();
        setAlarms(data);
      } catch (error) {
        console.error('Error al cargar las alarmas:', error);
      }
    };

    fetchAlarms();
  }, []);

  const toggleAlarm = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const alarm = alarms.find(a => a._id === id);
      
      const response = await fetch(`http://localhost:5001/api/alarms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...alarm,
          active: !alarm.active
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la alarma');
      }

      const updatedAlarm = await response.json();
      setAlarms(prev => prev.map(a => a._id === id ? updatedAlarm : a));
    } catch (error) {
      console.error('Error al actualizar la alarma:', error);
    }
  };

  useEffect(() => {
    const pickRandomPhrase = () => {
      const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
      setMotivationalPhrase(motivationalPhrases[randomIndex]);
    };
  
    pickRandomPhrase();
  }, []);

  const getAverageProgress = (habit, period = 'weekly') => {
    const progress = period === 'weekly' ? habit.weeklyProgress : habit.monthlyProgress;
    if (!progress || progress.length === 0) return 0;
    
    const sum = progress.reduce((acc, curr) => acc + curr.value, 0);
    return Math.round(sum / progress.length);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch('http://localhost:5001/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
  
        if (!response.ok) {
          throw new Error('Error al cargar las tareas');
        }
  
        const data = await response.json();
        // Ordenar tareas por fecha de vencimiento
        const sortedTasks = data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setTasks(sortedTasks);
      } catch (error) {
        console.error('Error al cargar las tareas:', error);
      }
    };
  
    fetchTasks();
  }, []);

  const markNotificationAsRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        throw new Error('Error al marcar la notificación');
      }
  
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch('http://localhost:5001/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
  
        if (!response.ok) {
          throw new Error('Error al cargar las notificaciones');
        }
  
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error al cargar las notificaciones:', error);
      }
    };
  
    fetchNotifications();
  }, []);
  
  // Función para obtener el icono según el tipo de notificación
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alarm': return 'alarm';
      case 'task': return 'checkbox-marked-circle-outline';
      case 'habit': return 'star-circle-outline';
      default: return 'bell-outline';
    }
  };
  

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short'
    });
  };
  

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
        <Card title="Próximas Alarmas" onPress={() => navigation.navigate('Alarms')}>
          {alarms.length > 0 ? (
            alarms.slice(0, 2).map((alarm) => (
              <View key={alarm._id} style={styles.alarmItem}>
                <View style={styles.alarmTimeContainer}>
                  <Text style={styles.alarmTime}>{formatTime(alarm.time)}</Text>
                </View>
                <View style={styles.alarmInfoContainer}>
                  <View>
                    <Text style={styles.alarmLabel}>{alarm.label}</Text>
                  </View>
                  <Switch
                    value={alarm.active}
                    onValueChange={() => toggleAlarm(alarm._id)}
                    trackColor={{ false: '#767577', true: '#5127DB' }}
                    thumbColor={alarm.active ? '#FFFFFF' : '#f4f3f4'}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noAlarmsText}>No hay alarmas configuradas</Text>
          )}
          {alarms.length > 2 && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate('Alarms')}
            >
              <Text style={styles.viewMoreText}>Ver más alarmas</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Lista de Tareas */}
        <Card title="Tareas Pendientes" onPress={() => navigation.navigate('Tasks')}>
  {tasks.filter(task => !task.completed).length > 0 ? (
    tasks
      .filter(task => !task.completed)
      .slice(0, 3)
      .map((task) => (
        <View key={task._id} style={styles.taskItem}>
          <TouchableOpacity 
            style={styles.taskCheckbox}
            onPress={() => toggleTaskCompletion(task._id)}
          >
            <Icon 
              name={task.completed ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={24} 
              color="#5127DB" 
            />
          </TouchableOpacity>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
      ))
  ) : (
    <View style={styles.emptyStateContainer}>
      <Icon name="check-circle-outline" size={24} color="#A3ADDB" />
      <Text style={styles.noTasksText}>¡Todo al día! No hay tareas pendientes</Text>
    </View>
  )}
  {tasks.filter(task => !task.completed).length > 3 && (
    <TouchableOpacity 
      style={styles.viewMoreButton}
      onPress={() => navigation.navigate('Tasks')}
    >
      <Text style={styles.viewMoreText}>
        Ver más tareas ({tasks.filter(task => !task.completed).length - 3})
      </Text>
    </TouchableOpacity>
  )}
</Card>

        {/* Progreso de Hábitos */}
        <Card title="Progreso de Hábitos" onPress={() => navigation.navigate('Habits')}>
  {habits.length > 0 ? (
    habits.slice(0, 2).map((habit) => (
      <View key={habit._id} style={styles.habitProgress}>
        <View style={styles.habitHeader}>
          <Text style={styles.cardSubtitle}>{habit.name}</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${getAverageProgress(habit, 'weekly')}%`,
                backgroundColor: "#5127DB",
              }
            ]} 
          />
        </View>
      </View>
    ))
  ) : (
    <Text style={styles.noHabitsText}>No hay hábitos registrados</Text>
  )}
  {habits.length > 2 && (
    <TouchableOpacity 
      style={styles.viewMoreButton}
      onPress={() => navigation.navigate('Habits')}
    >
      <Text style={styles.viewMoreText}>Ver más hábitos</Text>
    </TouchableOpacity>
  )}
</Card>

      {/* Notificaciones */}
      <Card title="Notificaciones">
  {notifications.length > 0 ? (
    notifications
      .filter(notif => !notif.isRead)
      .slice(0, 3)
      .map((notification) => (
        <TouchableOpacity 
          key={notification._id}
          style={styles.notificationItem}
          onPress={() => markNotificationAsRead(notification._id)}
        >
          <View style={styles.notificationIcon}>
            <Icon 
              name={getNotificationIcon(notification.type)} 
              size={24} 
              color="#5127DB" 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={1}>
              {notification.message}
            </Text>
          </View>
        </TouchableOpacity>
      ))
  ) : (
    <View style={styles.emptyStateContainer}>
      <Icon name="bell-off-outline" size={24} color="#A3ADDB" />
      <Text style={styles.noNotificationsText}>No hay notificaciones pendientes</Text>
    </View>
  )}
  {notifications.filter(n => !n.isRead).length > 3 && (
    <TouchableOpacity 
      style={styles.viewMoreButton}
      onPress={() => navigation.navigate('Notifications')}
    >
      <Text style={styles.viewMoreText}>
        Ver más notificaciones ({notifications.filter(n => !n.isRead).length - 3})
      </Text>
    </TouchableOpacity>
  )}
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
    backgroundColor: '#F0EFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: width / 28,
    color: '#1D1B70',
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
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 8,
  },
  noTasksText: {
    color: '#A3ADDB',
    fontSize: width / 32,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
  },
  viewMoreText: {
    color: '#5127DB',
    fontSize: width / 30,
    fontWeight: '500',
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
  alarmItem: {
    backgroundColor: '#F0EFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  alarmTimeContainer: {
    marginBottom: 4,
  },
  alarmTime: {
    fontSize: width / 25,
    fontWeight: 'bold',
    color: '#1D1B70',
  },
  alarmRepeat: {
    fontSize: width / 35,
    color: '#5127DB',
    marginTop: 2,
  },
  alarmInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  alarmLabel: {
    fontSize: width / 30,
    color: '#1D1B70',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#5127DB',
    fontSize: width / 35,
  },
  noAlarmsText: {
    color: '#A3ADDB',
    textAlign: 'center',
    padding: 10,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
  },
  viewMoreText: {
    color: '#5127DB',
    fontSize: width / 30,
    fontWeight: '500',
  },
  habitProgress: {
    marginBottom: height / 50,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#A3ADDB',
    borderRadius: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  noHabitsText: {
    color: '#A3ADDB',
    textAlign: 'center',
    padding: 10,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
  },
  viewMoreText: {
    color: '#5127DB',
    fontSize: width / 30,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0EFFF',
    marginBottom: 8,
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: width / 28,
    color: '#1D1B70',
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: width / 32,
    color: '#5127DB',
  },
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 8,
  },
  noNotificationsText: {
    color: '#A3ADDB',
    fontSize: width / 32,
  },
});

export default DashboardScreen;
