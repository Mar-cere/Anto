/**
 * Pantalla de gestión de hábitos
 * 
 * Permite a los usuarios ver, crear, completar, archivar y eliminar hábitos.
 * Incluye funcionalidad de swipe para acciones rápidas, filtros por estado
 * (activos/archivados) y notificaciones programadas.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import FloatingNavBar from '../components/FloatingNavBar';
import CreateHabitModal from '../components/habits/CreateHabitModal';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { colors } from '../styles/globalStyles';
import { cancelHabitNotifications, scheduleHabitNotification } from '../utils/notifications';

// Constantes de animación
const SWIPE_THRESHOLD = -3;
const SWIPE_ANIMATION_DURATION = 200; // ms
const DELETE_ANIMATION_DURATION = 300; // ms
const SWIPE_DISTANCE = -130;
const DELETE_DISTANCE = -400;
const PROGRESS_MAX_DISTANCE = 100;
const ANIMATION_FINAL_OPACITY = 1;
const ANIMATION_INITIAL_OPACITY = 0;

// Constantes de gestos
const ACTIVE_OFFSET_X = [-3, 0];
const ACTIVE_OFFSET_Y = [-100, 100];
const DELAY_PRESS_IN = 300; // ms
const DELAY_COMPLETE_PRESS_IN = 500; // ms
const HIT_SLOP_SIZE = 10;
const ACTIVE_OPACITY = 0.7;

// Constantes de filtros
const FILTER_TYPES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

// Constantes de frecuencia
const FREQUENCY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly'
};

// Constantes de textos
const TEXTS = {
  TITLE: 'Mis Hábitos',
  ACTIVE: 'Activos',
  ARCHIVED: 'Archivados',
  DELETE_CONFIRM_TITLE: 'Confirmar eliminación',
  DELETE_CONFIRM_MESSAGE: '¿Estás seguro de que deseas eliminar este hábito? Esta acción no se puede deshacer.',
  CANCEL: 'Cancelar',
  DELETE: 'Eliminar',
  ARCHIVE: 'archivar',
  UNARCHIVE: 'desarchivar',
  ARCHIVE_CONFIRM: 'Confirmar archivar',
  UNARCHIVE_CONFIRM: 'Confirmar desarchivar',
  PROGRESS_HINT: 'Desliza para acciones',
  STREAK: 'Racha:',
  BEST_STREAK: 'Mejor:',
  DAYS: 'días',
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  ERROR_LOAD: 'Error al cargar hábitos',
  RETRY: 'Reintentar',
  EMPTY_ACTIVE: 'No hay hábitos activos',
  EMPTY_ARCHIVED: 'No hay hábitos archivados',
  CREATE_FIRST: 'Crear primer hábito',
  SESSION_EXPIRED: 'Sesión expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesión nuevamente',
  ERROR_CREATE: 'Error',
  ERROR_UPDATE: 'Error',
  ERROR_DELETE: 'Error',
  ERROR_ARCHIVE: 'Error',
  ERROR_CREATE_MESSAGE: 'No se pudo crear el hábito',
  ERROR_UPDATE_MESSAGE: 'No se pudo actualizar el hábito',
  ERROR_DELETE_MESSAGE: 'No se pudo eliminar el hábito',
  ERROR_ARCHIVE_MESSAGE: 'No se pudo archivar el hábito',
  NO_TOKEN: 'No se encontró token de autenticación'
};

// Constantes de estilos
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = colors.background;
const DEFAULT_IOS_PADDING_TOP = 50;
const DEFAULT_ANDROID_PADDING_TOP = StatusBar.currentHeight || 0;
const HEADER_PADDING = 16;
const HEADER_TITLE_MARGIN_BOTTOM = 16;
const FILTER_GAP = 12;
const FILTER_PADDING_VERTICAL = 8;
const FILTER_PADDING_HORIZONTAL = 16;
const FILTER_BORDER_RADIUS = 20;
const LIST_PADDING = 16;
const LIST_GAP = 12;
const LIST_PADDING_BOTTOM = 100;
const FAB_SIZE = 56;
const FAB_BORDER_RADIUS = 28;
const FAB_BOTTOM = 100;
const FAB_RIGHT = 16;
const ICON_SIZE = 24;
const ACTION_ICON_SIZE = 32;
const PROGRESS_ICON_SIZE = 20;
const STAT_ICON_SIZE = 16;
const COMPLETE_ICON_SIZE = 28;
const ERROR_ICON_SIZE = 48;
const EMPTY_ICON_SIZE = 64;
const ADD_ICON_SIZE = 20;
const FILTER_ICON_SIZE = 20;
const ICON_CONTAINER_SIZE = 48;
const ICON_CONTAINER_BORDER_RADIUS = 24;
const COMPLETE_BUTTON_SIZE = 48;
const COMPLETE_BUTTON_BORDER_RADIUS = 24;
const ACTION_BUTTON_WIDTH = 60;
const ACTION_BUTTON_BORDER_RADIUS = 16;
const ACTION_BUTTON_PADDING_HORIZONTAL = 8;
const ACTION_BUTTON_PADDING_VERTICAL = 12;
const ACTION_BUTTON_GAP = 4;
const ACTION_BUTTON_MARGIN_HORIZONTAL = 2;
const ACTION_BUTTON_PADDING_RIGHT = 8;
const PROGRESS_INDICATOR_RIGHT = 20;
const PROGRESS_INDICATOR_PADDING_HORIZONTAL = 16;
const PROGRESS_INDICATOR_PADDING_VERTICAL = 12;
const PROGRESS_INDICATOR_BORDER_RADIUS = 16;
const PROGRESS_INDICATOR_BORDER_WIDTH = 1;
const PROGRESS_TEXT_MARGIN_TOP = 6;
const ARCHIVE_BUTTON_MARGIN_LEFT = 20;
const CARD_PADDING = 16;
const CARD_BORDER_RADIUS = 16;
const CARD_GAP = 12;
const CARD_BORDER_WIDTH = 1;
const CARD_FOOTER_MARGIN_TOP = 8;
const STAT_GAP = 16;
const STAT_ITEM_GAP = 4;
const ERROR_CONTAINER_PADDING = 32;
const ERROR_CONTAINER_GAP = 16;
const RETRY_BUTTON_PADDING_HORIZONTAL = 24;
const RETRY_BUTTON_PADDING_VERTICAL = 12;
const RETRY_BUTTON_BORDER_RADIUS = 12;
const EMPTY_CONTAINER_PADDING = 32;
const EMPTY_CONTAINER_GAP = 16;
const ADD_FIRST_BUTTON_PADDING_HORIZONTAL = 20;
const ADD_FIRST_BUTTON_PADDING_VERTICAL = 12;
const ADD_FIRST_BUTTON_BORDER_RADIUS = 12;
const ADD_FIRST_BUTTON_GAP = 8;
const ADD_FIRST_BUTTON_BORDER_WIDTH = 1;
const SESSION_EXPIRED_DELAY = 100; // ms

// Constantes de valores por defecto
const DEFAULT_FORM_DATA = {
  title: '',
  description: '',
  icon: 'exercise',
  frequency: FREQUENCY_TYPES.DAILY,
  reminder: new Date().toISOString(),
};

// Constantes de colores
const COLORS = {
  PRIMARY: colors.primary,
  WHITE: colors.white,
  BACKGROUND: colors.background,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  SUCCESS: '#4CAF50',
  WARNING: '#FFD93D',
  INFO: '#6BCB77',
  ARCHIVE: 'rgba(255, 152, 0, 0.9)',
  DELETE: 'rgba(244, 67, 54, 0.9)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.85)',
  CARD_ARCHIVED_BACKGROUND: 'rgba(29, 43, 95, 0.4)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.15)',
  CARD_ARCHIVED_BORDER: 'rgba(163, 184, 232, 0.1)',
  ICON_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  ICON_ARCHIVED_BACKGROUND: 'rgba(163, 184, 232, 0.1)',
  COMPLETE_BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  COMPLETE_BUTTON_COMPLETED_BACKGROUND: 'rgba(76, 175, 80, 0.1)',
  PROGRESS_INDICATOR_BACKGROUND: 'rgba(26, 221, 219, 0.15)',
  PROGRESS_INDICATOR_BORDER: 'rgba(26, 221, 219, 0.3)',
  FILTER_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  HEADER_BACKGROUND: 'rgba(29, 43, 95, 0.1)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  ADD_FIRST_BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  ADD_FIRST_BUTTON_BORDER: 'rgba(26, 221, 219, 0.2)',
  REFRESH_COLOR: colors.primary,
};

// Constantes de íconos de hábitos
const HABIT_ICONS = {
  exercise: 'run',
  meditation: 'meditation',
  reading: 'book-open-variant',
  water: 'water',
  sleep: 'sleep',
  study: 'book-education',
  diet: 'food-apple',
  coding: 'code-tags',
};

// Componente para hábito con animación de swipe
const SwipeableHabitItem = ({ item, onPress, onComplete, onDelete, onArchive }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(ANIMATION_INITIAL_OPACITY)).current;
  const archiveOpacity = useRef(new Animated.Value(ANIMATION_INITIAL_OPACITY)).current;
  const progressOpacity = useRef(new Animated.Value(ANIMATION_INITIAL_OPACITY)).current;

  // Evento de gesto
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        const { translationX } = event.nativeEvent;
        
        // Mostrar progreso visual solo para swipe hacia la izquierda
        if (translationX < SWIPE_THRESHOLD) {
          const progress = Math.min(1, Math.abs(translationX) / PROGRESS_MAX_DISTANCE);
          progressOpacity.setValue(progress);
        } else {
          progressOpacity.setValue(ANIMATION_INITIAL_OPACITY);
        }
      }
    }
  );

  // Cambio de estado del gesto
  const onHandlerStateChange = (event) => {
    const { oldState, translationX } = event.nativeEvent;
    
    if (oldState === State.ACTIVE) {
      if (translationX < SWIPE_THRESHOLD) {
        // Swipe hacia la izquierda - mostrar botones de acción
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: SWIPE_DISTANCE,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(deleteOpacity, {
            toValue: ANIMATION_FINAL_OPACITY,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(archiveOpacity, {
            toValue: ANIMATION_FINAL_OPACITY,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(progressOpacity, {
            toValue: ANIMATION_INITIAL_OPACITY,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Swipe insuficiente - resetear posición
        resetPosition();
      }
    }
  };

  // Resetear posición
  const resetPosition = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacity, {
        toValue: ANIMATION_INITIAL_OPACITY,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(archiveOpacity, {
        toValue: ANIMATION_INITIAL_OPACITY,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(progressOpacity, {
        toValue: ANIMATION_INITIAL_OPACITY,
        duration: SWIPE_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Manejar eliminación
  const handleDelete = () => {
    Alert.alert(
      TEXTS.DELETE_CONFIRM_TITLE,
      TEXTS.DELETE_CONFIRM_MESSAGE,
      [
        { text: TEXTS.CANCEL, style: 'cancel', onPress: resetPosition },
        {
          text: TEXTS.DELETE,
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Animated.timing(translateX, {
              toValue: DELETE_DISTANCE,
              duration: DELETE_ANIMATION_DURATION,
              useNativeDriver: true,
            }).start(() => {
              onDelete(item._id);
            });
          }
        }
      ]
    );
  };

  // Manejar archivo/desarchivo
  const handleArchive = () => {
    const isArchived = item.status?.archived;
    const action = isArchived ? TEXTS.UNARCHIVE : TEXTS.ARCHIVE;
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
    const confirmTitle = isArchived ? TEXTS.UNARCHIVE_CONFIRM : TEXTS.ARCHIVE_CONFIRM;
    
    Alert.alert(
      confirmTitle,
      `¿Estás seguro de que deseas ${action} este hábito?`,
      [
        { text: TEXTS.CANCEL, style: 'cancel', onPress: resetPosition },
        {
          text: actionCapitalized,
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Animated.timing(translateX, {
              toValue: DELETE_DISTANCE,
              duration: DELETE_ANIMATION_DURATION,
              useNativeDriver: true,
            }).start(() => {
              onArchive(item._id);
              resetPosition();
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Indicador de progreso */}
      <Animated.View style={[styles.progressIndicator, { opacity: progressOpacity }]}>
        <MaterialCommunityIcons 
          name="chevron-left" 
          size={PROGRESS_ICON_SIZE} 
          color={COLORS.PRIMARY} 
        />
        <Text style={styles.progressText}>{TEXTS.PROGRESS_HINT}</Text>
      </Animated.View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <Animated.View style={[styles.actionButton, { opacity: archiveOpacity }]}>
          <TouchableOpacity
            style={[styles.actionButtonContent, styles.archiveButton]}
            onPress={handleArchive}
            disabled={item.status?.archived}
          >
            <MaterialCommunityIcons 
              name="archive" 
              size={ACTION_ICON_SIZE} 
              color={COLORS.WHITE} 
            />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[styles.actionButton, { opacity: deleteOpacity }]}>
          <TouchableOpacity
            style={[styles.actionButtonContent, styles.deleteButton]}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons 
              name="delete" 
              size={ACTION_ICON_SIZE} 
              color={COLORS.WHITE} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Contenido del hábito */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={ACTIVE_OFFSET_X}
        activeOffsetY={ACTIVE_OFFSET_Y}
        shouldCancelWhenOutside={false}
        simultaneousHandlers={[]}
        waitFor={[]}
      >
        <Animated.View
          style={[
            styles.habitCard,
            item.status?.archived && styles.archivedHabitCard,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.habitContent}
            onPress={onPress}
            activeOpacity={ACTIVE_OPACITY}
            delayPressIn={DELAY_PRESS_IN}
          >
            <View style={styles.habitHeader}>
              <View style={styles.habitTitleContainer}>
                <View style={[
                  styles.iconContainer,
                  item.status?.archived && styles.archivedIconContainer
                ]}>
                  <MaterialCommunityIcons 
                    name={HABIT_ICONS[item.icon]} 
                    size={ICON_SIZE} 
                    color={item.status?.archived ? COLORS.ACCENT : COLORS.PRIMARY} 
                  />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.habitDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                onPress={onComplete}
                style={[
                  styles.completeButton,
                  item.status?.completedToday && styles.completedButton
                ]}
                disabled={item.status?.archived}
                delayPressIn={DELAY_COMPLETE_PRESS_IN}
                hitSlop={{ 
                  top: HIT_SLOP_SIZE, 
                  bottom: HIT_SLOP_SIZE, 
                  left: HIT_SLOP_SIZE, 
                  right: HIT_SLOP_SIZE 
                }}
              >
                <MaterialCommunityIcons
                  name={item.status?.completedToday ? "check-circle" : "circle-outline"}
                  size={COMPLETE_ICON_SIZE}
                  color={item.status?.completedToday ? COLORS.SUCCESS : COLORS.ACCENT}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.habitFooter}>
              <View style={styles.habitStats}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons 
                    name="fire" 
                    size={STAT_ICON_SIZE} 
                    color={COLORS.WARNING} 
                  />
                  <Text style={styles.statText}>
                    {TEXTS.STREAK} {item.progress?.streak || 0}
                    {item.progress?.bestStreak > 0 && ` (${TEXTS.BEST_STREAK} ${item.progress.bestStreak})`}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons 
                    name="calendar-check" 
                    size={STAT_ICON_SIZE} 
                    color={COLORS.INFO} 
                  />
                  <Text style={styles.statText}>
                    {item.progress?.completedDays || 0}/{item.progress?.totalDays || 0} {TEXTS.DAYS}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons 
                    name={item.frequency === FREQUENCY_TYPES.DAILY ? "repeat" : "calendar-week"} 
                    size={STAT_ICON_SIZE} 
                    color={COLORS.PRIMARY} 
                  />
                  <Text style={styles.statText}>
                    {item.frequency === FREQUENCY_TYPES.DAILY ? TEXTS.DAILY : TEXTS.WEEKLY}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const HabitsScreen = ({ route, navigation }) => {
  // Estados
  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(FILTER_TYPES.ACTIVE);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Cargar hábitos
  const loadHabits = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error(TEXTS.NO_TOKEN);
      }
      
      const response = await api.get(`${ENDPOINTS.HABITS}?status=${filterType}`);
      setHabits(response.data?.data?.habits || response.data?.habits || []);
    } catch (error) {
      console.error('Error al cargar hábitos:', error);
      setError(error.message || TEXTS.ERROR_LOAD);
      
      if (error.message?.includes('401') || error.message?.includes('403')) {
        Alert.alert(TEXTS.SESSION_EXPIRED, TEXTS.SESSION_EXPIRED_MESSAGE);
        await AsyncStorage.removeItem('userToken');
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: ROUTES.SIGN_IN }],
          });
        }, SESSION_EXPIRED_DELAY);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    loadHabits(true);
  };

  // Cargar hábitos al montar y cuando cambia el filtro
  useEffect(() => {
    loadHabits();
  }, [filterType]);

  // Manejar apertura automática del modal
  useEffect(() => {
    if (route.params?.openModal) {
      setModalVisible(true);
      navigation.setParams({ openModal: undefined });
    }
  }, [route.params?.openModal]);

  // Navegar a detalles del hábito
  const handleHabitPress = (habit) => {
    navigation.navigate('Habits', { 
      screen: 'HabitDetails',
      params: {
        habitId: habit._id,
        habit: habit
      }
    });
  };

  // Agregar nuevo hábito
  const handleAddHabit = async (data) => {
    try {
      const newHabit = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        icon: data.icon,
        frequency: data.frequency,
        reminder: data.reminder,
      };

      const result = await api.post(ENDPOINTS.HABITS, newHabit);
      const createdHabit = result.data;
      
      setHabits(prevHabits => [createdHabit, ...prevHabits]);
      setModalVisible(false);
      resetForm();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await scheduleHabitNotification(createdHabit);
    } catch (error) {
      console.error('Error al crear hábito:', error);
      Alert.alert(TEXTS.ERROR_CREATE, error.message || TEXTS.ERROR_CREATE_MESSAGE);
    }
  };

  // Marcar hábito como completado
  const toggleHabitComplete = async (habitId) => {
    try {
      const result = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/toggle`);
      
      if (!result.success) {
        throw new Error(result.message || TEXTS.ERROR_UPDATE_MESSAGE);
      }

      const updatedHabit = result.data;
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit._id === habitId ? updatedHabit : habit
        )
      );
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error al actualizar hábito:', error);
      Alert.alert(TEXTS.ERROR_UPDATE, error.message || TEXTS.ERROR_UPDATE_MESSAGE);
    }
  };

  // Archivar hábito
  const toggleArchiveHabit = async (habitId) => {
    try {
      const result = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/archive`);
      const updatedHabit = result.data || result;
      
      // Si estamos en la vista activa y el hábito se archivó, removerlo de la lista
      if (filterType === FILTER_TYPES.ACTIVE && updatedHabit.status?.archived) {
        setHabits(prevHabits => prevHabits.filter(habit => habit._id !== habitId));
      } else if (filterType === FILTER_TYPES.ARCHIVED && !updatedHabit.status?.archived) {
        // Si estamos en la vista archivada y se desarchivó, removerlo de la lista
        setHabits(prevHabits => prevHabits.filter(habit => habit._id !== habitId));
      } else {
        // Actualizar el hábito en la lista
        setHabits(prevHabits =>
          prevHabits.map(habit =>
            habit._id === habitId ? updatedHabit : habit
          )
        );
      }
    } catch (error) {
      console.error('Error al archivar hábito:', error);
      Alert.alert(TEXTS.ERROR_ARCHIVE, error.message || TEXTS.ERROR_ARCHIVE_MESSAGE);
    }
  };

  // Eliminar hábito
  const handleDeleteHabit = async (habitId) => {
    try {
      await api.delete(ENDPOINTS.HABIT_BY_ID(habitId));
      setHabits(prevHabits => prevHabits.filter(habit => habit._id !== habitId));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await cancelHabitNotifications(habitId);
    } catch (error) {
      console.error('Error al eliminar hábito:', error);
      Alert.alert(TEXTS.ERROR_DELETE, error.message || TEXTS.ERROR_DELETE_MESSAGE);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
  };

  // Header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === FILTER_TYPES.ACTIVE && styles.filterButtonActive
            ]}
            onPress={() => setFilterType(FILTER_TYPES.ACTIVE)}
          >
            <MaterialCommunityIcons 
              name="checkbox-marked-circle-outline" 
              size={FILTER_ICON_SIZE} 
              color={filterType === FILTER_TYPES.ACTIVE ? COLORS.WHITE : COLORS.ACCENT} 
            />
            <Text style={[
              styles.filterButtonText,
              filterType === FILTER_TYPES.ACTIVE && styles.filterButtonTextActive
            ]}>{TEXTS.ACTIVE}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === FILTER_TYPES.ARCHIVED && styles.filterButtonActive
            ]}
            onPress={() => setFilterType(FILTER_TYPES.ARCHIVED)}
          >
            <MaterialCommunityIcons 
              name="archive-outline" 
              size={FILTER_ICON_SIZE} 
              color={filterType === FILTER_TYPES.ARCHIVED ? COLORS.WHITE : COLORS.ACCENT} 
            />
            <Text style={[
              styles.filterButtonText,
              filterType === FILTER_TYPES.ARCHIVED && styles.filterButtonTextActive
            ]}>{TEXTS.ARCHIVED}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Renderizar item de hábito
  const renderHabitItem = ({ item }) => (
    <SwipeableHabitItem
      item={item}
      onPress={() => handleHabitPress(item)}
      onComplete={() => toggleHabitComplete(item._id)}
      onDelete={handleDeleteHabit}
      onArchive={toggleArchiveHabit}
    />
  );

  // Renderizar contenido
  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={ERROR_ICON_SIZE} 
            color={COLORS.ERROR} 
          />
          <Text style={styles.errorText}>{TEXTS.ERROR_LOAD}</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadHabits()}
          >
            <Text style={styles.retryText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={habits}
        renderItem={renderHabitItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.REFRESH_COLOR]}
            tintColor={COLORS.REFRESH_COLOR}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={EMPTY_ICON_SIZE} 
                color={COLORS.ACCENT} 
              />
              <Text style={styles.emptyText}>
                {filterType === FILTER_TYPES.ACTIVE 
                  ? TEXTS.EMPTY_ACTIVE 
                  : TEXTS.EMPTY_ARCHIVED
                }
              </Text>
              {filterType === FILTER_TYPES.ACTIVE && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={() => {
                    resetForm();
                    setModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="plus" 
                    size={ADD_ICON_SIZE} 
                    color={COLORS.PRIMARY} 
                  />
                  <Text style={styles.addFirstText}>{TEXTS.CREATE_FIRST}</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <MaterialCommunityIcons 
          name="plus" 
          size={ICON_SIZE} 
          color={COLORS.WHITE} 
        />
      </TouchableOpacity>

      <CreateHabitModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        onSubmit={handleAddHabit}
        formData={formData}
        setFormData={setFormData}
      />
      
      <FloatingNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerContainer: {
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.HEADER_BORDER,
    paddingTop: Platform.OS === 'ios' ? DEFAULT_IOS_PADDING_TOP : DEFAULT_ANDROID_PADDING_TOP,
  },
  header: {
    padding: HEADER_PADDING,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: HEADER_TITLE_MARGIN_BOTTOM,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: FILTER_GAP,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: FILTER_PADDING_VERTICAL,
    paddingHorizontal: FILTER_PADDING_HORIZONTAL,
    borderRadius: FILTER_BORDER_RADIUS,
    backgroundColor: COLORS.FILTER_BACKGROUND,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    color: COLORS.ACCENT,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.WHITE,
  },
  listContainer: {
    padding: LIST_PADDING,
    gap: LIST_GAP,
    paddingBottom: LIST_PADDING_BOTTOM,
  },
  swipeableContainer: {
    position: 'relative',
    marginBottom: 12,
    width: '100%', // Asegurar que ocupe todo el ancho disponible
  },
  progressIndicator: {
    position: 'absolute',
    right: PROGRESS_INDICATOR_RIGHT,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: COLORS.PROGRESS_INDICATOR_BACKGROUND,
    borderRadius: PROGRESS_INDICATOR_BORDER_RADIUS,
    paddingHorizontal: PROGRESS_INDICATOR_PADDING_HORIZONTAL,
    paddingVertical: PROGRESS_INDICATOR_PADDING_VERTICAL,
    borderWidth: PROGRESS_INDICATOR_BORDER_WIDTH,
    borderColor: COLORS.PROGRESS_INDICATOR_BORDER,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: '600',
    marginTop: PROGRESS_TEXT_MARGIN_TOP,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  actionButtons: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    paddingRight: ACTION_BUTTON_PADDING_RIGHT,
    gap: ACTION_BUTTON_GAP,
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: ACTION_BUTTON_MARGIN_HORIZONTAL,
    borderRadius: ACTION_BUTTON_BORDER_RADIUS,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ACTION_BUTTON_BORDER_RADIUS,
    marginHorizontal: ACTION_BUTTON_MARGIN_HORIZONTAL,
    paddingVertical: ACTION_BUTTON_PADDING_VERTICAL,
    paddingHorizontal: ACTION_BUTTON_PADDING_HORIZONTAL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  archiveButton: {
    backgroundColor: COLORS.ARCHIVE,
    marginLeft: ARCHIVE_BUTTON_MARGIN_LEFT,
  },
  deleteButton: {
    backgroundColor: COLORS.DELETE,
  },
  habitCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
    gap: CARD_GAP,
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
    width: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  habitContent: {
    flex: 1,
  },
  archivedHabitCard: {
    backgroundColor: COLORS.CARD_ARCHIVED_BACKGROUND,
    borderColor: COLORS.CARD_ARCHIVED_BORDER,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_BORDER_RADIUS,
    backgroundColor: COLORS.ICON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archivedIconContainer: {
    backgroundColor: COLORS.ICON_ARCHIVED_BACKGROUND,
  },
  habitInfo: {
    flex: 1,
    gap: 4,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  habitDescription: {
    fontSize: 14,
    color: COLORS.ACCENT,
  },
  habitFooter: {
    marginTop: CARD_FOOTER_MARGIN_TOP,
  },
  habitStats: {
    flexDirection: 'row',
    gap: STAT_GAP,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: STAT_ITEM_GAP,
  },
  statText: {
    fontSize: 12,
    color: COLORS.ACCENT,
  },
  completeButton: {
    width: COMPLETE_BUTTON_SIZE,
    height: COMPLETE_BUTTON_SIZE,
    borderRadius: COMPLETE_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.COMPLETE_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: COLORS.COMPLETE_BUTTON_COMPLETED_BACKGROUND,
  },
  fab: {
    position: 'absolute',
    right: FAB_RIGHT,
    bottom: FAB_BOTTOM,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_BORDER_RADIUS,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ERROR_CONTAINER_PADDING,
    gap: ERROR_CONTAINER_GAP,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: COLORS.ACCENT,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: RETRY_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: RETRY_BUTTON_PADDING_VERTICAL,
    borderRadius: RETRY_BUTTON_BORDER_RADIUS,
  },
  retryText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: EMPTY_CONTAINER_PADDING,
    gap: EMPTY_CONTAINER_GAP,
  },
  emptyText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ADD_FIRST_BUTTON_GAP,
    paddingHorizontal: ADD_FIRST_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: ADD_FIRST_BUTTON_PADDING_VERTICAL,
    borderRadius: ADD_FIRST_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.ADD_FIRST_BUTTON_BACKGROUND,
    borderWidth: ADD_FIRST_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.ADD_FIRST_BUTTON_BORDER,
  },
  addFirstText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HabitsScreen; 