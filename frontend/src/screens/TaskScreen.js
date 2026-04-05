/**
 * Pantalla de gestión de tareas
 * 
 * Permite a los usuarios ver, crear, completar y eliminar tareas y recordatorios.
 * Incluye filtros por tipo (tareas/recordatorios), pull-to-refresh y notificaciones.
 * 
 * @author AntoApp Team
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  Text, 
  RefreshControl 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import FloatingNavBar from '../components/FloatingNavBar';
import TaskHeader from '../components/tasks/TaskHeader';
import TaskItem from '../components/tasks/TaskItem';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { SkeletonCard } from '../components/Skeleton';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { scheduleTaskNotification, cancelTaskNotifications } from '../utils/notifications';
import { useToast } from '../context/ToastContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorMessage, isAuthError } from '../utils/apiErrorHandler';
import { colors } from '../styles/globalStyles';

// Constantes de prioridad
const PRIORITY_VALUES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Constantes de tipos de items
const ITEM_TYPES = {
  TASK: 'task',
  REMINDER: 'reminder',
  ALL: 'all'
};

// Constantes de filtros
const FILTER_TYPES = {
  ALL: 'all',
  TASK: 'task',
  REMINDER: 'reminder'
};

// Constantes de textos
const TEXTS = {
  NO_TOKEN: 'No se encontró token de autenticación',
  ERROR_LOAD: 'Error al obtener las tareas',
  SESSION_EXPIRED: 'Sesión expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesión nuevamente',
  ERROR_LOAD_ITEMS: 'No se pudieron cargar los items',
  SUCCESS: 'Éxito',
  TASK_CREATED: 'Tarea creada correctamente',
  REMINDER_CREATED: 'Recordatorio creado correctamente',
  ERROR_CREATE: 'Error',
  ERROR_UPDATE: 'Error',
  ERROR_UPDATE_MESSAGE: 'No se pudo actualizar el item',
  ERROR_DELETE: 'Error',
  ERROR_DELETE_MESSAGE: 'No se pudo eliminar el item completado',
  CONFIRM_DELETE_TITLE: 'Confirmar eliminación',
  CONFIRM_DELETE_MESSAGE: '¿Estás seguro de que deseas eliminar este item?',
  CANCEL: 'Cancelar',
  DELETE: 'Eliminar',
  ERROR_DELETE_TASK: 'No se pudo eliminar la tarea',
  EMPTY_ALL: 'No tienes tareas ni recordatorios',
  EMPTY_TASK: 'No tienes tareas pendientes',
  EMPTY_REMINDER: 'No tienes recordatorios pendientes',
  EMPTY_SUBTITLE: 'Agrega tu primera tarea y organízate mejor',
  ADD_TASK: 'Agregar tarea',
  ADD_REMINDER: 'Agregar recordatorio',
  ADD_ITEM: 'Agregar item',
  INVALID_DATA: 'Datos inválidos:',
  ERROR_CREATE_TASK: 'Error al crear la tarea',
  TASK_COMPLETED: 'Tarea completada',
};

// Constantes de estilos
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = colors.background;
const DELETE_DELAY = 3500; // ms
const LIST_PADDING = 16;
const LIST_GAP = 12;
const LIST_PADDING_BOTTOM = 100;
const FAB_SIZE = 56;
const FAB_BORDER_RADIUS = 28;
const FAB_RIGHT = 16;
const FAB_BOTTOM = 100;
const FAB_ELEVATION = 8;
const FAB_SHADOW_OFFSET_Y = 4;
const FAB_SHADOW_OPACITY = 0.3;
const FAB_SHADOW_RADIUS = 8;
const FAB_Z_INDEX = 3;
const FAB_ACTIVE_OPACITY = 0.8;
const EMPTY_CONTAINER_MARGIN_TOP = 64;
const EMPTY_CONTAINER_OPACITY = 0.7;
const EMPTY_ICON_SIZE = 64;
const EMPTY_TEXT_MARGIN_TOP = 12;
const EMPTY_TEXT_MARGIN_BOTTOM = 24;
const ADD_FIRST_BUTTON_GAP = 8;
const ADD_FIRST_BUTTON_PADDING_VERTICAL = 12;
const ADD_FIRST_BUTTON_PADDING_HORIZONTAL = 16;
const ADD_FIRST_BUTTON_BORDER_RADIUS = 12;
const ADD_FIRST_BUTTON_BORDER_WIDTH = 1;
const ADD_FIRST_ICON_SIZE = 20;
const FAB_ICON_SIZE = 24;
const FLATLIST_MAX_TO_RENDER = 10;
const FLATLIST_WINDOW_SIZE = 10;
const FLATLIST_INITIAL_NUM_TO_RENDER = 10;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ADD_FIRST_BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  ADD_FIRST_BUTTON_BORDER: 'rgba(26, 221, 219, 0.2)',
  REFRESH_COLOR: colors.primary,
};

// Constantes de valores por defecto
const DEFAULT_FORM_DATA = {
  title: '',
  description: '',
  dueDate: new Date(),
  itemType: ITEM_TYPES.TASK,
  priority: PRIORITY_VALUES.MEDIUM,
  completed: false,
  notifications: []
};

// Constantes de estado inicial
const INITIAL_STATE = {
  items: [],
  loading: true,
  refreshing: false,
  filterType: FILTER_TYPES.ALL,
  modalVisible: false,
  selectedItem: null,
  detailModalVisible: false,
  error: null
};

const TaskScreen = ({ route }) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;
  const [state, setState] = useState(INITIAL_STATE);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const { showToast } = useToast();

  // Cargar items desde la API
  const loadItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setState(prev => ({ ...prev, refreshing: true }));
      } else {
        setState(prev => ({ ...prev, loading: true }));
      }
      setState(prev => ({ ...prev, error: null }));

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error(TEXTS.NO_TOKEN);
      }

      const response = await api.get(ENDPOINTS.TASKS);
      const itemsArray = response.data?.data || response.data || [];
      
      // Ordenar items: recordatorios primero, luego por fecha
      const sortedItems = itemsArray.sort((a, b) => {
        if (a.itemType !== b.itemType) {
          return a.itemType === ITEM_TYPES.REMINDER ? -1 : 1;
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      setState(prev => ({
        ...prev,
        items: sortedItems,
        loading: false,
        refreshing: false
      }));
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_LOAD
      }));
      if (isAuthError(error)) {
        Alert.alert(TEXTS.SESSION_EXPIRED, TEXTS.SESSION_EXPIRED_MESSAGE);
        await AsyncStorage.removeItem('userToken');
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.SIGN_IN }],
        });
      } else {
        Alert.alert(TEXTS.ERROR_CREATE, getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_LOAD_ITEMS);
      }
    }
  }, [navigation, isOffline]);

  // Recargar cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  useEffect(() => {
    const { mode, task, taskId } = route.params || {};
    if (mode === 'view' && taskId) {
      setState(prev => ({ ...prev, selectedItem: task, detailModalVisible: true }));
    } else if (mode === 'create') {
      setState(prev => ({ ...prev, modalVisible: true }));
    }
  }, [route.params]);

  // Crear tarea o recordatorio
  const handleSubmit = async (data) => {
    try {
      const requestData = {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority,
        itemType: data.itemType,
        repeat: data.repeat,
        notifications: data.notifications
      };

      const response = await api.post(ENDPOINTS.TASKS, requestData);
      setState(prev => ({ ...prev, modalVisible: false }));
      
      // Programar notificación
      await scheduleTaskNotification(response.data);
      
      // Recargar lista
      await loadItems();
      
      // Feedback háptico
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      showToast({
        message: data.itemType === ITEM_TYPES.TASK ? TEXTS.TASK_CREATED : TEXTS.REMINDER_CREATED,
        type: 'success',
      });
    } catch (error) {
      console.error('Error creando tarea:', error);
      const errorMessage = error.errors?.length > 0
        ? `${TEXTS.INVALID_DATA} ${error.errors.join(', ')}`
        : getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_CREATE_TASK;
      Alert.alert(TEXTS.ERROR_CREATE, errorMessage);
    }
  };

  // Marcar como completado
  const handleToggleComplete = async (id) => {
    if (!id) return;

    try {
      const response = await api.patch(`${ENDPOINTS.TASK_BY_ID(id)}/complete`);
      
      // Actualizar estado para mostrar item completado
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item._id === id ? response.data : item
        )
      }));

      // Feedback háptico de completado
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await cancelTaskNotifications(id);

      showToast({ message: TEXTS.TASK_COMPLETED, type: 'success' });

      // Esperar antes de eliminar
      setTimeout(async () => {
        try {
          await api.delete(ENDPOINTS.TASK_BY_ID(id));

          // Actualizar estado para remover el item
          setState(prev => ({
            ...prev,
            items: prev.items.filter(item => item._id !== id)
          }));

          // Feedback háptico de eliminación
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error('Error al eliminar item completado:', error);
          Alert.alert(TEXTS.ERROR_DELETE, getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_DELETE_MESSAGE);
        }
      }, DELETE_DELAY);

    } catch (error) {
      console.error('Error al completar item:', error);
      Alert.alert(TEXTS.ERROR_UPDATE, getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_UPDATE_MESSAGE);
    }
  };

  // Eliminar tarea o recordatorio
  const handleDeleteItem = async (id) => {
    Alert.alert(
      TEXTS.CONFIRM_DELETE_TITLE,
      TEXTS.CONFIRM_DELETE_MESSAGE,
      [
        { text: TEXTS.CANCEL, style: 'cancel' },
        {
          text: TEXTS.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(ENDPOINTS.TASK_BY_ID(id));

              setState(prev => ({
                ...prev,
                items: prev.items.filter(item => item._id !== id)
              }));
              
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await cancelTaskNotifications(id);
            } catch (error) {
              console.error('Error eliminando tarea:', error);
              Alert.alert(TEXTS.ERROR_DELETE, getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_DELETE_TASK);
            }
          }
        }
      ]
    );
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    loadItems(true);
  }, [loadItems]);

  // Filtrado de items
  const filteredItems = Array.isArray(state.items)
    ? state.items.filter(item =>
        state.filterType === FILTER_TYPES.ALL ? true : item.itemType === state.filterType
      )
    : [];
  const showSkeleton = state.loading && filteredItems.length === 0;

  // Renderizar item individual
  const renderItem = useCallback(({ item }) => {
    if (showSkeleton) {
      return <SkeletonCard />;
    }

    return (
      <TaskItem
        key={item._id}
        item={item}
        onPress={item => setState(prev => ({ ...prev, selectedItem: item, detailModalVisible: true }))}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteItem}
      />
    );
  }, [handleToggleComplete, handleDeleteItem, showSkeleton]);

  // Mensaje si no hay tareas
  const renderEmpty = useCallback(() => {
    const getEmptyText = () => {
      if (state.filterType === FILTER_TYPES.ALL) return TEXTS.EMPTY_ALL;
      if (state.filterType === FILTER_TYPES.TASK) return TEXTS.EMPTY_TASK;
      return TEXTS.EMPTY_REMINDER;
    };

    const getAddText = () => {
      if (state.filterType === FILTER_TYPES.TASK) return TEXTS.ADD_TASK;
      if (state.filterType === FILTER_TYPES.REMINDER) return TEXTS.ADD_REMINDER;
      return TEXTS.ADD_ITEM;
    };

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="checkmark-done-circle-outline"
          size={EMPTY_ICON_SIZE}
          color={COLORS.ACCENT}
        />
        <Text style={styles.emptyText}>
          {getEmptyText()}
        </Text>
        <Text style={styles.emptySubtext}>{TEXTS.EMPTY_SUBTITLE}</Text>
        <TouchableOpacity
          style={styles.addFirstButton}
          onPress={() => setState(prev => ({ ...prev, modalVisible: true }))}
        >
          <Ionicons 
            name="add" 
            size={ADD_FIRST_ICON_SIZE} 
            color={COLORS.PRIMARY} 
          />
          <Text style={styles.addFirstButtonText}>
            {getAddText()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [state.filterType]);

  // Key extractor optimizado
  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContent} edges={['top', 'left', 'right']}>
      <TaskHeader 
        filterType={state.filterType}
        onFilterChange={type => setState(prev => ({ ...prev, filterType: type }))}
      />
      <FlatList
        ref={flatListRef}
        style={styles.listFlex}
        data={showSkeleton ? Array.from({ length: 6 }, (_, i) => ({ _id: `skeleton-${i}` })) : filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.REFRESH_COLOR]}
            tintColor={COLORS.REFRESH_COLOR}
          />
        }
        ListEmptyComponent={showSkeleton ? null : renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={FLATLIST_MAX_TO_RENDER}
        windowSize={FLATLIST_WINDOW_SIZE}
        initialNumToRender={FLATLIST_INITIAL_NUM_TO_RENDER}
      />
      </SafeAreaView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setState(prev => ({ ...prev, modalVisible: true }))}
        activeOpacity={FAB_ACTIVE_OPACITY}
      >
        <Ionicons 
          name="add" 
          size={FAB_ICON_SIZE} 
          color={COLORS.WHITE} 
        />
      </TouchableOpacity>
      <CreateTaskModal
        visible={state.modalVisible}
        onClose={() => setState(prev => ({ ...prev, modalVisible: false }))}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
      />
      <FloatingNavBar activeTab="calendar" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.BACKGROUND 
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listFlex: {
    flex: 1,
  },
  listContainer: { 
    padding: LIST_PADDING, 
    gap: LIST_GAP, 
    paddingBottom: LIST_PADDING_BOTTOM,
    flexGrow: 1
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
    elevation: FAB_ELEVATION,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: FAB_SHADOW_OFFSET_Y },
    shadowOpacity: FAB_SHADOW_OPACITY,
    shadowRadius: FAB_SHADOW_RADIUS,
    zIndex: FAB_Z_INDEX,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: EMPTY_CONTAINER_MARGIN_TOP,
    opacity: EMPTY_CONTAINER_OPACITY,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    marginTop: EMPTY_TEXT_MARGIN_TOP,
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.ACCENT,
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: EMPTY_TEXT_MARGIN_BOTTOM,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ADD_FIRST_BUTTON_GAP,
    paddingVertical: ADD_FIRST_BUTTON_PADDING_VERTICAL,
    paddingHorizontal: ADD_FIRST_BUTTON_PADDING_HORIZONTAL,
    borderRadius: ADD_FIRST_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.ADD_FIRST_BUTTON_BACKGROUND,
    borderWidth: ADD_FIRST_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.ADD_FIRST_BUTTON_BORDER,
  },
  addFirstButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TaskScreen; 