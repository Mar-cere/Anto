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
import { isAuthError } from '../utils/apiErrorHandler';
import { isValidClientRequestId } from '../utils/clientRequestId';
import { postProductActionTelemetry } from '../utils/productActionTelemetry';
import BrandGradientFab from '../components/tasksAndHabits/BrandGradientFab';
import TasksSummaryStrip from '../components/tasksAndHabits/TasksSummaryStrip';
import { buildTaskSections } from '../utils/taskDateSections';
import { resolveCreatedTaskFromApi } from '../utils/taskApiPayload';
import { SOFT_ATTENTION_PALETTE } from '../utils/taskPriorityPalette';
import {
  buildUnifiedTaskSections,
  computeTasksSummaryCounts,
} from '../utils/tasksAndHabitsUtils';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

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
const DEFAULT_TEXTS = {
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
  SUBTASKS_GENERATED_TOAST: 'Listo — Anto sugirió pasos para esta tarea.',
  TASK_COMPLETED: 'Tarea completada',
  UNDO: 'Deshacer',
  RETRY: 'Reintentar',
  LOAD_ERROR_HINT: 'Revisa tu conexión e intenta de nuevo.',
  SEARCH_NO_RESULTS: 'No hay resultados para tu búsqueda',
  SEARCH_EMPTY_HINT: 'Prueba con otras palabras o borra el filtro de búsqueda.',
  SEARCH_CLEAR: 'Limpiar búsqueda',
  DATA_OFFLINE_TITLE: 'Sin conexión a los datos',
  ERROR_CONNECTION: 'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
  ERROR_TOO_MANY_REQUESTS:
    'Demasiados intentos. Espera un momento y vuelve a intentar.',
  COUNT_PENDING_SINGULAR: 'pendiente',
  COUNT_PENDING_PLURAL: 'pendientes',
};

const resolveTaskScreenErrorMessage = (error, texts, fallbackKey, isOffline) => {
  const status = error?.response?.status;
  const rawMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();

  const isNetworkIssue =
    isOffline ||
    !error?.response ||
    rawMessage.includes('network') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('timed out');
  if (isNetworkIssue) {
    return texts.ERROR_CONNECTION || texts[fallbackKey];
  }

  if (
    status === 429 ||
    rawMessage.includes('too many') ||
    rawMessage.includes('demasiados intentos')
  ) {
    return texts.ERROR_TOO_MANY_REQUESTS || texts[fallbackKey];
  }

  return texts[fallbackKey];
};

// Constantes de estilos
const DELETE_DELAY = 2200; // ms
const FAB_SIZE = 56;
const FAB_BORDER_RADIUS = 28;
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
const FILTER_META = {
  all: { icon: 'layers-outline' },
  task: { icon: 'checkbox-outline' },
  reminder: { icon: 'alarm-outline' },
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

const TaskScreen = ({
  route,
  embedded = false,
  unifiedView = false,
  externalSearchQuery,
  contentBottomInset,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;
  const [state, setState] = useState(INITIAL_STATE);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const navigation = useNavigation();
  const sectionListRef = useRef(null);
  const pendingChatOriginRef = useRef(null);
  const pendingClientRequestIdRef = useRef(null);
  const { showToast } = useToast();
  const translated = useSectionTranslations('TASKS');
  const unifiedTexts = useSectionTranslations('TASKS_AND_HABITS');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(translated || {}) }),
    [translated]
  );
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = embedded && externalSearchQuery !== undefined
    ? externalSearchQuery
    : internalSearchQuery;
  const setSearchQuery = embedded && externalSearchQuery !== undefined
    ? () => {}
    : setInternalSearchQuery;
  const itemsRef = useRef([]);
  const pendingCompleteRef = useRef({ timeoutId: null, itemId: null });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        gestureRoot: {
          flex: 1,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeAreaContent: {
          flex: 1,
          backgroundColor: colors.background,
        },
        listFlex: {
          flex: 1,
        },
        listContainer: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 4,
          paddingBottom: SPACING.SCREEN_EDGE_INSET,
          flexGrow: 1,
        },
        countRow: {
          marginBottom: 10,
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          alignSelf: 'flex-start',
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassOutline,
        },
        countText: {
          fontSize: 13,
          fontWeight: '500',
          color: colors.textSecondary,
          letterSpacing: 0.2,
        },
        sectionHeader: {
          backgroundColor: colors.chromeHeader,
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
          borderColor: colors.chromeHeaderBorder,
        },
        sectionHeaderText: {
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
          color: colors.text,
        },
        sectionHeaderAttention: {
          borderColor: SOFT_ATTENTION_PALETTE.border,
          backgroundColor: SOFT_ATTENTION_PALETTE.bg,
        },
        sectionHeaderTextAttention: {
          color: SOFT_ATTENTION_PALETTE.color,
        },
        sectionCountPill: {
          minWidth: 24,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.glassFillStrong,
        },
        sectionCountText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.text,
        },
        fab: {
          position: 'absolute',
          right: SPACING.SCREEN_EDGE_INSET,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_BORDER_RADIUS,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: FAB_ELEVATION,
          shadowColor: colors.primary,
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
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        emptyText: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '500',
          marginTop: EMPTY_TEXT_MARGIN_TOP,
          textAlign: 'center',
          lineHeight: 24,
        },
        emptySubtext: {
          color: colors.textSecondary,
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
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentLine,
        },
        addFirstButtonText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '500',
        },
        errorBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 2,
        },
        errorBannerMeta: {
          color: colors.textSecondary,
          fontSize: 12,
          lineHeight: 16,
        },
        errorBannerRetry: {
          flexShrink: 0,
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
        },
        errorBannerRetryText: {
          color: colors.primary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const clearPendingComplete = useCallback(() => {
    const { timeoutId } = pendingCompleteRef.current;
    if (timeoutId) clearTimeout(timeoutId);
    pendingCompleteRef.current = { timeoutId: null, itemId: null };
  }, []);

  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  useEffect(() => () => clearPendingComplete(), [clearPendingComplete]);

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
        error: resolveTaskScreenErrorMessage(error, TEXTS, 'ERROR_LOAD', isOffline)
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
  }, [navigation, isOffline, TEXTS]);

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
      const found = state.items.find((item) => item._id === taskId);
      setState((prev) => ({
        ...prev,
        selectedItem: found || task,
        detailModalVisible: true,
      }));
      navigation.setParams({
        mode: undefined,
        task: undefined,
        taskId: undefined,
        focusOpenToken: undefined,
      });
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
  }, [route.params, navigation, state.items]);

  useEffect(() => {
    setState((prev) => {
      if (!prev.detailModalVisible || !prev.selectedItem?._id) return prev;
      const found = state.items.find((item) => item._id === prev.selectedItem._id);
      if (!found) return prev;
      if (found === prev.selectedItem) return prev;
      return { ...prev, selectedItem: found };
    });
  }, [state.items]);

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
      const createdTask = resolveCreatedTaskFromApi(response);
      setState(prev => ({ ...prev, modalVisible: false }));
      pendingChatOriginRef.current = null;
      pendingClientRequestIdRef.current = null;

      let stepsGenerated = false;
      if (
        data.suggestStepsOnCreate &&
        data.itemType === ITEM_TYPES.TASK &&
        createdTask?._id &&
        !response.idempotentReplay
      ) {
        try {
          await api.post(ENDPOINTS.TASK_SUBTASKS_GENERATE(createdTask._id), {});
          stepsGenerated = true;
        } catch (subtaskError) {
          console.warn('No se pudieron generar pasos sugeridos:', subtaskError);
        }
      }

      // Programar notificación (omitir en replay idempotente: ya programada en el primer 201)
      if (!response.idempotentReplay && createdTask) {
        await scheduleTaskNotification(createdTask);
      }
      
      // Recargar lista
      await loadItems();
      
      // Feedback háptico
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const creationMessage =
        stepsGenerated && data.itemType === ITEM_TYPES.TASK
          ? TEXTS.SUBTASKS_GENERATED_TOAST
          : data.itemType === ITEM_TYPES.TASK
            ? TEXTS.TASK_CREATED
            : TEXTS.REMINDER_CREATED;

      showToast({
        message: creationMessage,
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
        : resolveTaskScreenErrorMessage(error, TEXTS, 'ERROR_CREATE_TASK', isOffline);
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
                message: resolveTaskScreenErrorMessage(error, TEXTS, 'ERROR_DELETE_MESSAGE', isOffline),
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
                    message: resolveTaskScreenErrorMessage(err, TEXTS, 'ERROR_UPDATE_MESSAGE', isOffline),
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
          message: resolveTaskScreenErrorMessage(error, TEXTS, 'ERROR_UPDATE_MESSAGE', isOffline),
          type: 'error',
        });
      }
    },
    [clearPendingComplete, isOffline, showToast, loadItems, TEXTS]
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
                message: resolveTaskScreenErrorMessage(error, TEXTS, 'ERROR_DELETE_TASK', isOffline),
                type: 'error',
              });
            }
          }
        }
      ]
    );
  }, [isOffline, showToast, TEXTS]);

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
    if (unifiedView) {
      return buildUnifiedTaskSections(displayItems, {
        today: unifiedTexts.SECTION_TODAY,
        upcoming: unifiedTexts.SECTION_UPCOMING,
        attention: unifiedTexts.SECTION_ATTENTION,
      });
    }
    return buildTaskSections(displayItems, {
      overdue: unifiedTexts.SECTION_ATTENTION,
      today: unifiedTexts.SECTION_TODAY,
      tomorrow: unifiedTexts.SECTION_TOMORROW,
      this_week: unifiedTexts.SECTION_THIS_WEEK,
      later: unifiedTexts.SECTION_LATER,
      completed: unifiedTexts.SECTION_COMPLETED,
    });
  }, [showSkeleton, skeletonData, displayItems, unifiedView, unifiedTexts]);

  const tasksSummaryCounts = useMemo(
    () => computeTasksSummaryCounts(displayItems),
    [displayItems],
  );

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
    navigation.setParams({ mode: undefined, task: undefined, taskId: undefined });
  }, [navigation]);

  const handleTaskUpdatedFromDetail = useCallback((updated) => {
    if (!updated?._id) return;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)),
      selectedItem:
        prev.detailModalVisible && prev.selectedItem?._id === updated._id
          ? { ...prev.selectedItem, ...updated }
          : prev.selectedItem,
    }));
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
          density="compact"
        />
      );
    },
    [handleToggleComplete, handleDeleteItem]
  );

  const renderSectionHeader = useCallback(({ section }) => {
    if (!section.title) return null;
    const attention = section.tone === 'attention' || section.key === 'overdue';
    return (
      <View style={[styles.sectionHeader, attention && styles.sectionHeaderAttention]}>
        <Text
          style={[
            styles.sectionHeaderText,
            attention && styles.sectionHeaderTextAttention,
          ]}
        >
          {section.title}
        </Text>
        <View style={styles.sectionCountPill}>
          <Text style={styles.sectionCountText}>{section.data.length}</Text>
        </View>
      </View>
    );
  }, [styles]);

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
          color={colors.primary}
        />
        <Text style={styles.emptyText}>{getEmptyText()}</Text>
        <Text style={styles.emptySubtext}>{TEXTS.EMPTY_SUBTITLE}</Text>
        <TouchableOpacity
          style={styles.addFirstButton}
          onPress={() => setState((prev) => ({ ...prev, modalVisible: true }))}
        >
          <Ionicons name="add" size={ADD_FIRST_ICON_SIZE} color={colors.primary} />
          <Text style={styles.addFirstButtonText}>{getAddText()}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [state.filterType, TEXTS, styles, colors.primary]);

  const renderListEmpty = useCallback(() => {
    if (state.loading) return null;
    if (state.error && state.items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={EMPTY_ICON_SIZE} color={colors.primary} />
          <Text style={styles.emptyText}>{state.error}</Text>
          <Text style={styles.emptySubtext}>{TEXTS.LOAD_ERROR_HINT}</Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={() => loadItems()}>
            <Ionicons name="refresh" size={ADD_FIRST_ICON_SIZE} color={colors.primary} />
            <Text style={styles.addFirstButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (searchQuery.trim() && displayItems.length === 0 && typeFilteredItems.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={EMPTY_ICON_SIZE} color={colors.primary} />
          <Text style={styles.emptyText}>{TEXTS.SEARCH_NO_RESULTS}</Text>
          <Text style={styles.emptySubtext}>
            {TEXTS.SEARCH_EMPTY_HINT}
          </Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle-outline" size={ADD_FIRST_ICON_SIZE} color={colors.primary} />
            <Text style={styles.addFirstButtonText}>{TEXTS.SEARCH_CLEAR}</Text>
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
    TEXTS,
    styles,
    colors.primary,
  ]);

  const renderErrorBanner = useCallback(() => {
    if (!state.error || state.items.length === 0) return null;
    return (
      <View style={styles.errorBanner}>
        <Ionicons name="warning-outline" size={22} color={colors.warning} style={styles.errorBannerIcon} />
        <View style={styles.errorBannerTextWrap}>
          <Text style={styles.errorBannerTitle}>{TEXTS.DATA_OFFLINE_TITLE}</Text>
          <Text style={styles.errorBannerMeta} numberOfLines={2}>
            {state.error}
          </Text>
        </View>
        <TouchableOpacity style={styles.errorBannerRetry} onPress={() => loadItems(true)}>
          <Text style={styles.errorBannerRetryText}>{TEXTS.RETRY}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [state.error, state.items.length, loadItems, TEXTS, styles, colors.warning]);

  const renderListHeader = useCallback(() => {
    return (
      <View>
        {unifiedView && !showSkeleton ? (
          <TasksSummaryStrip
            todayCount={tasksSummaryCounts.todayCount}
            upcomingCount={tasksSummaryCounts.upcomingCount}
            attentionCount={tasksSummaryCounts.attentionCount}
          />
        ) : null}
        {!unifiedView && !showSkeleton && pendingCount > 0 ? (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {pendingCount}{' '}
              {pendingCount === 1 ? TEXTS.COUNT_PENDING_SINGULAR : TEXTS.COUNT_PENDING_PLURAL}
            </Text>
          </View>
        ) : null}
        {renderErrorBanner()}
      </View>
    );
  }, [
    unifiedView,
    showSkeleton,
    tasksSummaryCounts,
    pendingCount,
    renderErrorBanner,
    TEXTS,
    styles,
  ]);

  // Key extractor optimizado
  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
    <View style={styles.container}>
      <SafeAreaView
        style={styles.safeAreaContent}
        edges={embedded ? ['left', 'right'] : ['top', 'left', 'right']}
      >
      {!embedded ? (
        <TaskHeader
          filterType={state.filterType}
          onFilterChange={(type) => setState((prev) => ({ ...prev, filterType: type }))}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          counts={filterCounts}
        />
      ) : null}
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
          {
            paddingBottom:
              contentBottomInset ??
              insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
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
      <BrandGradientFab
        bottom={insets.bottom + FAB_BOTTOM_OFFSET}
        onPress={() => setState((prev) => ({ ...prev, modalVisible: true }))}
        accessibilityLabel={
          state.filterType === FILTER_TYPES.REMINDER
            ? TEXTS.ADD_REMINDER
            : state.filterType === FILTER_TYPES.TASK
              ? TEXTS.ADD_TASK
              : TEXTS.ADD_ITEM
        }
      />
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
        onTaskUpdated={handleTaskUpdatedFromDetail}
        isOffline={isOffline}
      />
      {!embedded ? <FloatingNavBar activeTab="calendar" /> : null}
    </View>
    </GestureHandlerRootView>
  );
};

export default TaskScreen; 