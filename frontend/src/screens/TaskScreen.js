/**
 * Pantalla de gestión de tareas
 * 
 * Permite a los usuarios ver, crear, completar y eliminar tareas y recordatorios.
 * Incluye filtros por tipo (tareas/recordatorios), pull-to-refresh y notificaciones.
 * 
 * @author AntoApp Team
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  SectionList, 
  Alert, 
  Text, 
  RefreshControl 
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import FloatingNavBar from '../components/FloatingNavBar';
import TaskHeader from '../components/tasks/TaskHeader';
import SwipeableTaskItem from '../components/tasks/SwipeableTaskItem';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import { SkeletonCard } from '../components/Skeleton';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { scheduleTaskNotification, cancelTaskNotifications } from '../utils/notifications';
import { useToast } from '../context/ToastContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiErrorMessage, isAuthError } from '../utils/apiErrorHandler';
import { isValidClientRequestId } from '../utils/clientRequestId';
import { postProductActionTelemetry } from '../utils/productActionTelemetry';
import { buildTaskSections } from '../utils/taskDateSections';
import { colors } from '../styles/globalStyles';
import { FOCUS_KICKER_COLOR, FOCUS_META, FOCUS_ACCENT_BORDER } from '../styles/focusCardTheme';

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
  UNDO: 'Deshacer',
  RETRY: 'Reintentar',
  LOAD_ERROR_HINT: 'Revisa tu conexión e intenta de nuevo.',
  SEARCH_NO_RESULTS: 'No hay resultados para tu búsqueda',
};

// Constantes de estilos
const DELETE_DELAY = 3500; // ms
const LIST_PADDING = 16;
/** Espacio bajo la lista: barra flotante (~88) + botón central + FAB + margen (alineado con Dash ~132 + safe area). */
const LIST_PADDING_BOTTOM_EXTRA = 132;
const FAB_SIZE = 56;
const FAB_BORDER_RADIUS = 28;
const FAB_RIGHT = 16;
const FAB_BOTTOM_OFFSET = 86;
const FAB_ELEVATION = 8;
const FAB_SHADOW_OFFSET_Y = 4;
const FAB_SHADOW_OPACITY = 0.22;
const FAB_SHADOW_RADIUS = 8;
const FAB_Z_INDEX = 3;
const FAB_ACTIVE_OPACITY = 0.8;
const EMPTY_CONTAINER_MARGIN_TOP = 64;
const EMPTY_ICON_SIZE = 64;
const EMPTY_TEXT_MARGIN_TOP = 12;
const EMPTY_TEXT_MARGIN_BOTTOM = 24;
const ADD_FIRST_BUTTON_GAP = 8;
const ADD_FIRST_BUTTON_PADDING_VERTICAL = 12;
const ADD_FIRST_BUTTON_PADDING_HORIZONTAL = 16;
const ADD_FIRST_ICON_SIZE = 20;
const FAB_ICON_SIZE = 24;
const FLATLIST_MAX_TO_RENDER = 10;
const FLATLIST_WINDOW_SIZE = 10;
const FLATLIST_INITIAL_NUM_TO_RENDER = 10;
const DENSITY_STORAGE_KEY = 'tasksDensityPreference';

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  REFRESH_COLOR: colors.primary,
};

const FILTER_META = {
  all: { label: 'Todo', icon: 'layers-outline' },
  task: { label: 'Tareas', icon: 'checkbox-outline' },
  reminder: { label: 'Recordatorios', icon: 'alarm-outline' },
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
  const insets = useSafeAreaInsets();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;
  const [state, setState] = useState(INITIAL_STATE);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const navigation = useNavigation();
  const sectionListRef = useRef(null);
  const pendingChatOriginRef = useRef(null);
  const pendingClientRequestIdRef = useRef(null);
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [density, setDensity] = useState('comfortable');
  const itemsRef = useRef([]);
  const pendingCompleteRef = useRef({ timeoutId: null, itemId: null });

  const clearPendingComplete = useCallback(() => {
    const { timeoutId } = pendingCompleteRef.current;
    if (timeoutId) clearTimeout(timeoutId);
    pendingCompleteRef.current = { timeoutId: null, itemId: null };
  }, []);

  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  useEffect(() => () => clearPendingComplete(), [clearPendingComplete]);

  useEffect(() => {
    let mounted = true;
    const loadDensity = async () => {
      try {
        const saved = await AsyncStorage.getItem(DENSITY_STORAGE_KEY);
        if (mounted && (saved === 'compact' || saved === 'comfortable')) {
          setDensity(saved);
        }
      } catch (err) {
        console.warn('No se pudo cargar preferencia de densidad', err);
      }
    };
    loadDensity();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDensityChange = useCallback(async (nextDensity) => {
    setDensity(nextDensity);
    try {
      await AsyncStorage.setItem(DENSITY_STORAGE_KEY, nextDensity);
    } catch (err) {
      console.warn('No se pudo guardar preferencia de densidad', err);
    }
  }, []);

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
        refreshing: false,
        error: null,
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
    const { mode, task, taskId, initialTaskDraft, taskChatOrigin, taskClientRequestId } =
      route.params || {};
    if (mode === 'view' && taskId) {
      setState(prev => ({ ...prev, selectedItem: task, detailModalVisible: true }));
    } else if (mode === 'create' && initialTaskDraft) {
      const due = initialTaskDraft.dueDate ? new Date(initialTaskDraft.dueDate) : new Date();
      pendingChatOriginRef.current = taskChatOrigin || null;
      pendingClientRequestIdRef.current =
        taskClientRequestId && isValidClientRequestId(taskClientRequestId) ? taskClientRequestId : null;
      setFormData((prev) => ({
        ...prev,
        title: initialTaskDraft.title || '',
        description: initialTaskDraft.description || '',
        dueDate: due,
        priority: initialTaskDraft.priority || PRIORITY_VALUES.MEDIUM,
        itemType: initialTaskDraft.itemType || ITEM_TYPES.TASK,
      }));
      setState((prev) => ({ ...prev, modalVisible: true }));
      navigation.setParams({
        mode: undefined,
        initialTaskDraft: undefined,
        taskChatOrigin: undefined,
        taskClientRequestId: undefined,
      });
    } else if (mode === 'create') {
      setState(prev => ({ ...prev, modalVisible: true }));
    }
  }, [route.params, navigation]);

  const handleTaskModalClose = useCallback(() => {
    const hadChatFlow = Boolean(
      pendingChatOriginRef.current || pendingClientRequestIdRef.current
    );
    setState((prev) => ({ ...prev, modalVisible: false }));
    if (hadChatFlow) {
      void postProductActionTelemetry({
        event: 'confirm_dismissed',
        surface: 'task_modal',
      });
    }
    pendingChatOriginRef.current = null;
    pendingClientRequestIdRef.current = null;
  }, []);

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
      if (pendingChatOriginRef.current) {
        requestData.chatOrigin = pendingChatOriginRef.current;
      }
      if (pendingClientRequestIdRef.current) {
        requestData.clientRequestId = pendingClientRequestIdRef.current;
      }

      const response = await api.post(ENDPOINTS.TASKS, requestData);
      setState(prev => ({ ...prev, modalVisible: false }));
      pendingChatOriginRef.current = null;
      pendingClientRequestIdRef.current = null;

      // Programar notificación (omitir en replay idempotente: ya programada en el primer 201)
      if (!response.idempotentReplay) {
        await scheduleTaskNotification(response.data);
      }
      
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
      if (pendingChatOriginRef.current || pendingClientRequestIdRef.current) {
        void postProductActionTelemetry({
          event: 'create_failed',
          surface: 'task_modal',
          resource: 'task',
        });
      }
      const errorMessage = error.errors?.length > 0
        ? `${TEXTS.INVALID_DATA} ${error.errors.join(', ')}`
        : getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_CREATE_TASK;
      showToast({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const handleToggleComplete = useCallback(
    async (id) => {
      if (!id) return;
      clearPendingComplete();
      const previousItem = itemsRef.current.find((i) => i._id === id);
      const allowUndo = previousItem?.itemType !== ITEM_TYPES.REMINDER;

      try {
        const response = await api.patch(`${ENDPOINTS.TASK_BY_ID(id)}/complete`);
        const updated = response.data;

        setState((prev) => ({
          ...prev,
          items: prev.items.map((item) => (item._id === id ? updated : item)),
        }));

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await cancelTaskNotifications(id);

        const runDelayedDelete = () =>
          setTimeout(async () => {
            if (pendingCompleteRef.current.itemId !== id) return;
            pendingCompleteRef.current = { timeoutId: null, itemId: null };
            try {
              await api.delete(ENDPOINTS.TASK_BY_ID(id));
              setState((prev) => ({
                ...prev,
                items: prev.items.filter((item) => item._id !== id),
              }));
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error al eliminar item completado:', error);
              showToast({
                message: getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_DELETE_MESSAGE,
                type: 'error',
              });
            }
          }, DELETE_DELAY);

        const timeoutId = runDelayedDelete();
        pendingCompleteRef.current = { timeoutId, itemId: id };

        if (allowUndo) {
          showToast({
            message: TEXTS.TASK_COMPLETED,
            type: 'success',
            duration: DELETE_DELAY,
            action: {
              label: TEXTS.UNDO,
              onPress: async () => {
                clearPendingComplete();
                try {
                  const putBody = await api.put(ENDPOINTS.TASK_BY_ID(id), { status: 'pending' });
                  const task = putBody?.data ?? putBody;
                  setState((prev) => ({
                    ...prev,
                    items: prev.items.map((item) => (item._id === id ? task : item)),
                  }));
                  await scheduleTaskNotification(task).catch(() => {});
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (err) {
                  console.error('Error al deshacer completado:', err);
                  showToast({
                    message: getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_UPDATE_MESSAGE,
                    type: 'error',
                  });
                  loadItems(true);
                }
              },
            },
          });
        } else {
          showToast({ message: TEXTS.TASK_COMPLETED, type: 'success' });
        }
      } catch (error) {
        console.error('Error al completar item:', error);
        showToast({
          message: getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_UPDATE_MESSAGE,
          type: 'error',
        });
      }
    },
    [clearPendingComplete, isOffline, showToast, loadItems]
  );

  // Eliminar tarea o recordatorio
  const handleDeleteItem = useCallback((id) => {
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
              showToast({
                message: getApiErrorMessage(error, { isOffline }) || TEXTS.ERROR_DELETE_TASK,
                type: 'error',
              });
            }
          }
        }
      ]
    );
  }, [isOffline, showToast]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    loadItems(true);
  }, [loadItems]);

  const typeFilteredItems = useMemo(() => {
    if (!Array.isArray(state.items)) return [];
    return state.items.filter((item) =>
      state.filterType === FILTER_TYPES.ALL ? true : item.itemType === state.filterType
    );
  }, [state.items, state.filterType]);

  const displayItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return typeFilteredItems;
    return typeFilteredItems.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [typeFilteredItems, searchQuery]);

  const showSkeleton = state.loading && state.items.length === 0;
  const skeletonData = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ _id: `skeleton-${i}` })),
    []
  );

  const taskSections = useMemo(() => {
    if (showSkeleton) {
      return [{ key: 'skeleton', title: '', data: skeletonData, skeleton: true }];
    }
    return buildTaskSections(displayItems);
  }, [showSkeleton, skeletonData, displayItems]);

  const pendingCount = useMemo(
    () => displayItems.filter((i) => !i.completed).length,
    [displayItems]
  );

  const filterCounts = useMemo(() => {
    const all = state.items.length;
    const task = state.items.filter((item) => item.itemType === FILTER_TYPES.TASK).length;
    const reminder = state.items.filter((item) => item.itemType === FILTER_TYPES.REMINDER).length;
    return { all, task, reminder };
  }, [state.items]);

  // Renderizar item individual
  const closeDetailModal = useCallback(() => {
    setState((prev) => ({ ...prev, detailModalVisible: false, selectedItem: null }));
  }, []);

  const renderItem = useCallback(
    ({ item, section }) => {
      if (section.skeleton) {
        return <SkeletonCard />;
      }
      return (
        <SwipeableTaskItem
          item={item}
          onPress={(pressed) =>
            setState((prev) => ({ ...prev, selectedItem: pressed, detailModalVisible: true }))
          }
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteItem}
          density={density}
        />
      );
    },
    [handleToggleComplete, handleDeleteItem, density]
  );

  const renderSectionHeader = useCallback(({ section }) => {
    if (!section.title) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <View style={styles.sectionCountPill}>
          <Text style={styles.sectionCountText}>{section.data.length}</Text>
        </View>
      </View>
    );
  }, []);

  const renderDefaultEmpty = useCallback(() => {
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
          color={FOCUS_KICKER_COLOR}
        />
        <Text style={styles.emptyText}>{getEmptyText()}</Text>
        <Text style={styles.emptySubtext}>{TEXTS.EMPTY_SUBTITLE}</Text>
        <TouchableOpacity
          style={styles.addFirstButton}
          onPress={() => setState((prev) => ({ ...prev, modalVisible: true }))}
        >
          <Ionicons name="add" size={ADD_FIRST_ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.addFirstButtonText}>{getAddText()}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [state.filterType]);

  const renderListEmpty = useCallback(() => {
    if (state.loading) return null;
    if (state.error && state.items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={EMPTY_ICON_SIZE} color={FOCUS_KICKER_COLOR} />
          <Text style={styles.emptyText}>{state.error}</Text>
          <Text style={styles.emptySubtext}>{TEXTS.LOAD_ERROR_HINT}</Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={() => loadItems()}>
            <Ionicons name="refresh" size={ADD_FIRST_ICON_SIZE} color={COLORS.PRIMARY} />
            <Text style={styles.addFirstButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (searchQuery.trim() && displayItems.length === 0 && typeFilteredItems.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={EMPTY_ICON_SIZE} color={FOCUS_KICKER_COLOR} />
          <Text style={styles.emptyText}>{TEXTS.SEARCH_NO_RESULTS}</Text>
          <Text style={styles.emptySubtext}>
            Prueba con otras palabras o borra el filtro de búsqueda.
          </Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle-outline" size={ADD_FIRST_ICON_SIZE} color={COLORS.PRIMARY} />
            <Text style={styles.addFirstButtonText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return renderDefaultEmpty();
  }, [
    state.loading,
    state.error,
    state.items.length,
    searchQuery,
    displayItems.length,
    typeFilteredItems.length,
    loadItems,
    renderDefaultEmpty,
  ]);

  const renderErrorBanner = useCallback(() => {
    if (!state.error || state.items.length === 0) return null;
    return (
      <View style={styles.errorBanner}>
        <Ionicons name="warning-outline" size={22} color={colors.warning} style={styles.errorBannerIcon} />
        <View style={styles.errorBannerTextWrap}>
          <Text style={styles.errorBannerTitle}>Sin conexión a los datos</Text>
          <Text style={styles.errorBannerMeta} numberOfLines={2}>
            {state.error}
          </Text>
        </View>
        <TouchableOpacity style={styles.errorBannerRetry} onPress={() => loadItems(true)}>
          <Text style={styles.errorBannerRetryText}>{TEXTS.RETRY}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [state.error, state.items.length, loadItems]);

  const renderListHeader = useCallback(() => {
    return (
      <View>
        {!showSkeleton && pendingCount > 0 ? (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
            </Text>
          </View>
        ) : null}
        {renderErrorBanner()}
      </View>
    );
  }, [showSkeleton, pendingCount, renderErrorBanner]);

  // Key extractor optimizado
  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContent} edges={['top', 'left', 'right']}>
      <TaskHeader 
        filterType={state.filterType}
        onFilterChange={(type) => setState((prev) => ({ ...prev, filterType: type }))}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        counts={filterCounts}
        density={density}
        onDensityChange={handleDensityChange}
      />
      <SectionList
        ref={sectionListRef}
        style={styles.listFlex}
        sections={taskSections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        stickySectionHeadersEnabled
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + LIST_PADDING_BOTTOM_EXTRA },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.REFRESH_COLOR]}
            tintColor={COLORS.REFRESH_COLOR}
          />
        }
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={showSkeleton ? null : renderListEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={FLATLIST_MAX_TO_RENDER}
        windowSize={FLATLIST_WINDOW_SIZE}
        initialNumToRender={FLATLIST_INITIAL_NUM_TO_RENDER}
      />
      </SafeAreaView>
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + FAB_BOTTOM_OFFSET }]}
        onPress={() => setState(prev => ({ ...prev, modalVisible: true }))}
        activeOpacity={FAB_ACTIVE_OPACITY}
        accessibilityRole="button"
        accessibilityLabel={
          state.filterType === FILTER_TYPES.REMINDER
            ? TEXTS.ADD_REMINDER
            : state.filterType === FILTER_TYPES.TASK
              ? TEXTS.ADD_TASK
              : TEXTS.ADD_ITEM
        }
      >
        <Ionicons 
          name={FILTER_META[state.filterType]?.icon || 'add'} 
          size={FAB_ICON_SIZE} 
          color={COLORS.WHITE} 
        />
      </TouchableOpacity>
      <CreateTaskModal
        visible={state.modalVisible}
        onClose={handleTaskModalClose}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
      />
      <TaskDetailModal
        visible={state.detailModalVisible}
        item={state.selectedItem}
        onClose={closeDetailModal}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteItem}
      />
      <FloatingNavBar activeTab="calendar" />
    </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
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
    flexGrow: 1,
    paddingTop: 4,
  },
  countRow: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
    color: FOCUS_META,
    letterSpacing: 0.2,
  },
  sectionHeader: {
    backgroundColor: 'rgba(26, 33, 49, 0.72)',
    paddingVertical: 8,
    paddingBottom: 6,
    marginTop: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(191, 209, 247, 0.92)',
  },
  sectionCountPill: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  fab: {
    position: 'absolute',
    right: FAB_RIGHT,
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  emptyText: {
    color: FOCUS_META,
    fontSize: 17,
    fontWeight: '500',
    marginTop: EMPTY_TEXT_MARGIN_TOP,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtext: {
    color: FOCUS_META,
    fontSize: 14,
    lineHeight: 20,
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
    borderRadius: 14,
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  addFirstButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 217, 61, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 217, 61, 0.35)',
    gap: 10,
  },
  errorBannerIcon: {
    flexShrink: 0,
  },
  errorBannerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  errorBannerTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  errorBannerMeta: {
    color: FOCUS_META,
    fontSize: 12,
    lineHeight: 16,
  },
  errorBannerRetry: {
    flexShrink: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorBannerRetryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default TaskScreen; 