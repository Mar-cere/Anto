/**
 * Pantalla principal del dashboard
 * 
 * Muestra el panel principal con saludo, avatar, citas motivacionales,
 * tareas, hábitos y temporizador Pomodoro. Incluye funcionalidad de
 * actualización pull-to-refresh y manejo de errores.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DashboardScroll from '../components/DashboardScroll';
import EmergencyContactsModal from '../components/EmergencyContactsModal';
import FloatingNavBar from '../components/FloatingNavBar';
import OnboardingTutorial, { isTutorialCompleted } from '../components/OnboardingTutorial';
import TutorialHighlight from '../components/TutorialHighlight';
import HabitCard from '../components/HabitCard';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import PomodoroCard from '../components/PomodoroCard';
import QuoteSection from '../components/QuoteSection';
import TaskCard from '../components/TaskCard';
import { api, ENDPOINTS } from '../config/api';
import { ANIMATION_DURATIONS, ANIMATION_OPACITIES, ANIMATION_SCALES } from '../constants/animations';
import { DASH } from '../constants/translations';
import { BORDERS, OPACITIES, SPACING, STATUS_BAR } from '../constants/ui';
import { colors } from '../styles/globalStyles';
import { getGreetingByHourAndDayAndName } from '../utils/greetings';
import { registerForPushNotifications } from '../services/pushNotificationService';

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  EMERGENCY_CONTACTS_SKIPPED: 'emergencyContactsSkipped',
};

// Componente para mostrar errores con opciones de recuperación
const ErrorMessage = ({ message, onRetry, onDismiss }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{DASH.ERROR_PREFIX}{message}</Text>
    <View style={styles.errorButtonsContainer}>
      {onRetry && (
        <TouchableOpacity style={styles.errorButton} onPress={onRetry}>
          <Text style={styles.errorButtonText}>{DASH.RETRY}</Text>
        </TouchableOpacity>
      )}
      {onDismiss && (
        <TouchableOpacity style={styles.errorButton} onPress={onDismiss}>
          <Text style={styles.errorButtonText}>{DASH.DISMISS}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Helper: obtener URL del avatar
const fetchAvatarUrl = async (publicId) => {
  if (!publicId) return null;
  try {
    const response = await api.get(`/api/users/avatar-url/${publicId}`);
    return response.url || null;
  } catch (error) {
    console.error('Error obteniendo avatar:', error);
    return null;
  }
};

const DashScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [refreshAnim] = useState(new Animated.Value(0));
  const [showEmergencyContactsModal, setShowEmergencyContactsModal] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [hasCheckedEmergencyContacts, setHasCheckedEmergencyContacts] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);
  const [highlightElement, setHighlightElement] = useState(null);

  // Log cuando showTutorial cambia
  React.useEffect(() => {
    console.log('🎬 showTutorial cambió a:', showTutorial);
  }, [showTutorial]);

  // Función para cargar datos
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && refreshing) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('SignIn');
        return;
      }

      // Cargar datos en paralelo usando api helper
      const [userData, tasks, habits] = await Promise.all([
        api.get(ENDPOINTS.ME).catch(() => {
          setError(DASH.ERROR_USER);
          return {};
        }),
        api.get(ENDPOINTS.TASKS).catch(() => {
          setError(DASH.ERROR_TASKS);
          return [];
        }),
        api.get(ENDPOINTS.HABITS).catch(() => {
          setError(DASH.ERROR_HABITS);
          return [];
        })
      ]);

      // Obtener URL del avatar si existe
      let avatarUrl = null;
      if (userData?.avatar) {
        avatarUrl = await fetchAvatarUrl(userData.avatar);
      }

      // Actualizar estados
      setAvatarUrl(avatarUrl);
      setUserData(userData || {});
      setTasks(Array.isArray(tasks) ? tasks : []);
      setHabits(Array.isArray(habits) ? habits : []);

      // Generar saludo
      const now = new Date();
      setGreeting(getGreetingByHourAndDayAndName({
        hour: now.getHours(),
        dayIndex: now.getDay(),
        userName: userData?.username || ""
      }));

      // Verificar si debe mostrarse el tutorial (solo una vez)
      if (!hasCheckedTutorial) {
        // Obtener userId para hacer el tutorial específico por usuario
        const userId = userData?._id || userData?.id || null;
        
        // Verificar AsyncStorage con userId específico
        const tutorialCompleted = await isTutorialCompleted(userId);
        console.log('📚 Tutorial completado en AsyncStorage?', tutorialCompleted);
        console.log('👤 UserId:', userId);
        
        // Verificar si es un usuario nuevo (creado en las últimas 24 horas)
        const userCreatedAt = userData?.createdAt ? new Date(userData.createdAt) : null;
        const now = Date.now();
        const createdAtTime = userCreatedAt ? userCreatedAt.getTime() : 0;
        const timeDiff = now - createdAtTime;
        const hoursSinceCreation = timeDiff / (1000 * 60 * 60);
        const isNewUser = userCreatedAt && timeDiff >= 0 && timeDiff < 24 * 60 * 60 * 1000;
        
        console.log('👤 Usuario nuevo?', isNewUser);
        console.log('👤 Fecha creación:', userCreatedAt);
        console.log('👤 Tiempo desde creación (horas):', hoursSinceCreation);
        console.log('👤 Diferencia en ms:', timeDiff);
        
        // Solo mostrar tutorial si NO está completado (independientemente de si es usuario nuevo o no)
        // Una vez completado, nunca se vuelve a mostrar para este usuario
        if (!tutorialCompleted) {
          if (isNewUser) {
            setIsFirstTimeUser(true);
            console.log('✅ Mostrando tutorial para usuario nuevo...');
          } else {
            console.log('✅ Mostrando tutorial para usuario existente...');
          }
          setTimeout(() => {
            console.log('🎬 Activando tutorial...');
            setShowTutorial(true);
          }, 1000);
        } else {
          console.log('✅ Tutorial ya completado para este usuario, no se mostrará');
        }
        setHasCheckedTutorial(true);
      }

      // Verificar contactos de emergencia solo una vez al cargar inicialmente
      if (!hasCheckedEmergencyContacts) {
        checkEmergencyContacts(userData);
      }

      // Registrar token push para notificaciones
      try {
        await registerForPushNotifications();
      } catch (error) {
        console.error('Error registrando notificaciones push:', error);
        // No bloquear la carga si falla
      }

      setLoading(false);
      setRefreshing(false);
      setError(null);
    } catch (error) {
      console.error('Error en loadData:', error);
      setError(DASH.ERROR_GENERIC);
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, refreshing, hasCheckedEmergencyContacts, hasCheckedTutorial, checkEmergencyContacts]);

  // Verificar contactos de emergencia
  const checkEmergencyContacts = useCallback(async (currentUserData = null) => {
    try {
      // Verificar si el usuario ya omitió el modal anteriormente
      const skipped = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS_SKIPPED);
      if (skipped === 'true') {
        // Si ya lo omitió, no mostrar el modal automáticamente
        setHasCheckedEmergencyContacts(true);
        return;
      }

      const response = await api.get(ENDPOINTS.EMERGENCY_CONTACTS);
      const contacts = response.contacts || [];
      setEmergencyContacts(contacts);
      setHasCheckedEmergencyContacts(true);
      
      // Si no hay contactos, mostrar el modal con un pequeño delay
      // para que el usuario pueda ver el Dashboard primero (mejor UX)
      if (contacts.length === 0) {
        // Verificar si es un usuario nuevo (creado recientemente)
        // Si el usuario fue creado en las últimas 24 horas, considerarlo primer ingreso
        const userDataToCheck = currentUserData || userData;
        const userCreatedAt = userDataToCheck?.createdAt ? new Date(userDataToCheck.createdAt) : null;
        const isNewUser = userCreatedAt && (Date.now() - userCreatedAt.getTime()) < 24 * 60 * 60 * 1000;
        setIsFirstTimeUser(isNewUser || false);
        
        // Delay de 1.5 segundos para que el Dashboard se renderice completamente
        setTimeout(() => {
          setShowEmergencyContactsModal(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error verificando contactos de emergencia:', error);
      // Si hay error, verificar si ya se omitió antes
      const skipped = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS_SKIPPED);
      if (skipped !== 'true') {
        setEmergencyContacts([]);
        setHasCheckedEmergencyContacts(true);
        // Delay también en caso de error
        setTimeout(() => {
          setShowEmergencyContactsModal(true);
        }, 1500);
      } else {
        setHasCheckedEmergencyContacts(true);
      }
    }
  }, [userData]);

  // Manejar guardado de contactos de emergencia
  const handleEmergencyContactsSaved = useCallback(async () => {
    // Limpiar el flag de "omitido" si se guardaron contactos
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EMERGENCY_CONTACTS_SKIPPED);
    } catch (error) {
      console.error('Error limpiando estado de omisión:', error);
    }
    
    // Recargar contactos después de guardar
    await checkEmergencyContacts();
  }, [checkEmergencyContacts]);

  // Manejar finalización del tutorial
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    // Después del tutorial, mostrar el modal de contactos si es necesario
    if (!hasCheckedEmergencyContacts) {
      setTimeout(() => {
        checkEmergencyContacts(userData);
      }, 500);
    }
  }, [hasCheckedEmergencyContacts, checkEmergencyContacts, userData]);

  // Efecto para carga inicial
  useEffect(() => {
    if (loading) {
      loadData();
    }
  }, [loadData, loading]);

  // Animación al refrescar
  const triggerRefreshAnim = useCallback(() => {
    Animated.sequence([
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: ANIMATION_DURATIONS.FAST,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(refreshAnim, {
        toValue: 0,
        duration: ANIMATION_DURATIONS.FAST,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start();
  }, [refreshAnim]);

  // Estilos de animación para refresh (debe estar antes de cualquier return condicional)
  const refreshAnimationStyle = useMemo(() => ({
    transform: [{ 
      scale: refreshAnim.interpolate({ 
        inputRange: [0, 1], 
        outputRange: [ANIMATION_SCALES.REFRESH_MIN, ANIMATION_SCALES.REFRESH_MAX] 
      }) 
    }],
    opacity: refreshAnim.interpolate({ 
      inputRange: [0, 1], 
      outputRange: [ANIMATION_OPACITIES.REFRESH_MIN, ANIMATION_OPACITIES.REFRESH_MAX] 
    })
  }), [refreshAnim]);

  // Avatar por defecto
  const avatarToShow = avatarUrl || require('../images/avatar.png');

  // Componente de carga
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{DASH.LOADING}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={STATUS_BAR.STYLE} backgroundColor={colors.background} />
      <ImageBackground
        source={require('../images/back.png')}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />
        <View style={styles.headerFixed}>
          <Header 
            greeting={greeting}
            userAvatar={avatarToShow}
          />
        </View>
        <DashboardScroll 
          refreshing={refreshing}
          onRefresh={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRefreshing(true);
            triggerRefreshAnim();
            loadData(true);
          }}
          contentContainerStyle={{ paddingBottom: SPACING.CONTENT_PADDING_BOTTOM }}
        >
          <QuoteSection />
          {error && (
            <ErrorMessage 
              message={error}
              onRetry={() => loadData(true)}
              onDismiss={() => setError(null)}
            />
          )}
          <Animated.View style={refreshAnimationStyle}>
            <TaskCard 
              tasks={tasks}
              onComplete={async (taskId) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                loadData(true);
              }}
              accessibilityLabel={DASH.TASKS_LABEL}
            />
          </Animated.View>
          <Animated.View style={refreshAnimationStyle}>
            <HabitCard 
              habits={habits}
              onUpdate={async (habitId) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                loadData(true);
              }}
              accessibilityLabel={DASH.HABITS_LABEL}
            />
          </Animated.View>
          <PomodoroCard accessibilityLabel={DASH.POMODORO_LABEL} />
        </DashboardScroll>
        <FloatingNavBar activeTab="home" accessibilityLabel={DASH.NAVBAR_LABEL} />
      </ImageBackground>
      
      {/* Overlay de resaltado para el tutorial */}
      <TutorialHighlight
        highlightElement={highlightElement}
        visible={showTutorial}
      />

      {/* Tutorial de onboarding */}
      <OnboardingTutorial
        visible={showTutorial}
        onComplete={handleTutorialComplete}
        onHighlightChange={setHighlightElement}
        userId={userData?._id || userData?.id || null}
      />

      {/* Modal de contactos de emergencia */}
      <EmergencyContactsModal
        visible={showEmergencyContactsModal}
        onClose={() => setShowEmergencyContactsModal(false)}
        onSave={handleEmergencyContactsSaved}
        existingContacts={emergencyContacts}
        isFirstTime={isFirstTimeUser}
      />
    </View>
  );
};

export default memo(DashScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A3B8E8',
    fontSize: 18,
    marginTop: SPACING.LOADING_TEXT_MARGIN_TOP,
  },
  background: {
    flex: 1,
    width: '100%',
  },
  imageStyle: {
    opacity: OPACITIES.IMAGE_BACKGROUND,
  },
  headerFixed: {
    backgroundColor: colors.background,
    paddingTop: StatusBar.currentHeight || STATUS_BAR.DEFAULT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 184, 232, 0.1)',
    zIndex: 2,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    borderRadius: 10,
    padding: SPACING.ERROR_PADDING,
    marginBottom: SPACING.ERROR_MARGIN_BOTTOM,
    borderLeftWidth: BORDERS.ERROR_LEFT_WIDTH,
    borderLeftColor: '#FF6347',
  },
  errorText: {
    color: colors.white,
    fontSize: 16,
    marginBottom: SPACING.ERROR_TEXT_MARGIN_BOTTOM,
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  errorButtonText: {
    color: colors.white,
    fontSize: 14,
  },
  errorButton: {
    paddingHorizontal: SPACING.ERROR_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: SPACING.ERROR_BUTTON_PADDING_VERTICAL,
    borderRadius: BORDERS.ERROR_BUTTON_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: SPACING.ERROR_BUTTON_MARGIN_LEFT,
  },
});