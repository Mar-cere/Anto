/**
 * Hook con la lógica de la pantalla de hábitos (estado, carga, CRUD, filtros).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { useNetworkStatus } from './useNetworkStatus';
import { getApiErrorMessage, isAuthError } from '../utils/apiErrorHandler';
import { cancelHabitNotifications, scheduleHabitNotification } from '../utils/notifications';
import {
  FILTER_TYPES,
  getDefaultFormData,
  SESSION_EXPIRED_DELAY,
  TEXTS,
} from '../screens/habits/habitsScreenConstants';
import { isValidClientRequestId } from '../utils/clientRequestId';
import { postProductActionTelemetry } from '../utils/productActionTelemetry';
import { useToast } from '../context/ToastContext';

const DELETE_DELAY = 2200;

export function useHabitsScreen({ route, navigation }) {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;
  const habitChatOriginRef = useRef(null);
  const habitClientRequestIdRef = useRef(null);
  const pendingDeleteRef = useRef({ timeoutId: null, habit: null });
  const { showToast } = useToast();
  const [habitModalReminderIso, setHabitModalReminderIso] = useState(null);

  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(FILTER_TYPES.ACTIVE);
  const [formData, setFormData] = useState(getDefaultFormData);

  const clearPendingDelete = useCallback(() => {
    const { timeoutId } = pendingDeleteRef.current;
    if (timeoutId) clearTimeout(timeoutId);
    pendingDeleteRef.current = { timeoutId: null, habit: null };
  }, []);

  useEffect(() => () => clearPendingDelete(), [clearPendingDelete]);

  const loadHabits = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error(TEXTS.NO_TOKEN);

        const response = await api.get(`${ENDPOINTS.HABITS}?status=${filterType}`);
        setHabits(response.data?.data?.habits || response.data?.habits || []);
      } catch (err) {
        console.error('Error al cargar hábitos:', err);
        setError(getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_LOAD);
        if (isAuthError(err)) {
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
    },
    [filterType, isOffline, navigation]
  );

  useEffect(() => {
    loadHabits();
  }, [filterType, loadHabits]);

  useEffect(() => {
    if (route.params?.openModal) {
      setModalVisible(true);
      navigation.setParams({ openModal: undefined });
    }
  }, [route.params?.openModal, navigation]);

  useEffect(() => {
    const d = route.params?.chatHabitDraft;
    const origin = route.params?.habitChatOrigin;
    const idem = route.params?.habitClientRequestId;
    if (d && typeof d === 'object') {
      habitChatOriginRef.current = origin || null;
      habitClientRequestIdRef.current =
        typeof idem === 'string' && isValidClientRequestId(idem.trim()) ? idem.trim() : null;
      setFormData((prev) => ({
        ...prev,
        title: d.title || '',
        description: d.description || '',
        icon: d.icon || 'meditation',
        frequency: d.frequency || 'daily',
        reminder: d.reminder?.time || prev.reminder,
      }));
      setHabitModalReminderIso(d.reminder?.time || null);
      setModalVisible(true);
      navigation.setParams({
        chatHabitDraft: undefined,
        habitChatOrigin: undefined,
        habitClientRequestId: undefined,
      });
    }
  }, [
    route.params?.chatHabitDraft,
    route.params?.habitChatOrigin,
    route.params?.habitClientRequestId,
    navigation,
  ]);

  const onRefresh = useCallback(() => loadHabits(true), [loadHabits]);

  const handleHabitPress = useCallback(
    (habit) => {
      navigation.navigate('Habits', {
        screen: 'HabitDetails',
        params: { habitId: habit._id, habit },
      });
    },
    [navigation]
  );

  const handleAddHabit = useCallback(
    async (data) => {
      try {
        const newHabit = {
          title: data.title.trim(),
          description: data.description?.trim() || '',
          icon: data.icon,
          frequency: data.frequency,
          reminder: data.reminder,
        };
        if (habitChatOriginRef.current) {
          newHabit.chatOrigin = habitChatOriginRef.current;
        }
        if (habitClientRequestIdRef.current) {
          newHabit.clientRequestId = habitClientRequestIdRef.current;
        }
        const result = await api.post(ENDPOINTS.HABITS, newHabit);
        const createdHabit = result.data;
        setHabits((prev) => {
          if (result.idempotentReplay && prev.some((h) => h._id === createdHabit._id)) {
            return prev;
          }
          return [createdHabit, ...prev];
        });
        setModalVisible(false);
        setFormData(getDefaultFormData());
        habitChatOriginRef.current = null;
        habitClientRequestIdRef.current = null;
        setHabitModalReminderIso(null);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (!result.idempotentReplay) {
          await scheduleHabitNotification(createdHabit);
        }
      } catch (err) {
        console.error('Error al crear hábito:', err);
        if (habitChatOriginRef.current || habitClientRequestIdRef.current) {
          void postProductActionTelemetry({
            event: 'create_failed',
            surface: 'habit_modal',
            resource: 'habit',
          });
        }
        Alert.alert(
          TEXTS.ERROR_CREATE,
          getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_CREATE_MESSAGE
        );
      }
    },
    [isOffline]
  );

  const toggleHabitComplete = useCallback(
    async (habitId) => {
      try {
        const result = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/toggle`);
        if (!result.success) throw new Error(result.message || TEXTS.ERROR_UPDATE_MESSAGE);
        const updatedHabit = result.data;
        setHabits((prev) =>
          prev.map((h) => (h._id === habitId ? updatedHabit : h))
        );
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        showToast({
          message: updatedHabit.status?.completedToday ? 'Hábito completado' : 'Hábito marcado pendiente',
          type: 'success',
          duration: DELETE_DELAY,
          action: {
            label: 'Deshacer',
            onPress: async () => {
              try {
                const undo = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/toggle`);
                const undoHabit = undo.data;
                setHabits((prev) => prev.map((h) => (h._id === habitId ? undoHabit : h)));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (undoErr) {
                Alert.alert(
                  TEXTS.ERROR_UPDATE,
                  getApiErrorMessage(undoErr, { isOffline }) || TEXTS.ERROR_UPDATE_MESSAGE
                );
              }
            },
          },
        });
      } catch (err) {
        console.error('Error al actualizar hábito:', err);
        Alert.alert(
          TEXTS.ERROR_UPDATE,
          getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_UPDATE_MESSAGE
        );
      }
    },
    [isOffline, showToast]
  );

  const toggleArchiveHabit = useCallback(
    async (habitId) => {
      try {
        const result = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/archive`);
        const updatedHabit = result.data || result;
        if (filterType === FILTER_TYPES.ACTIVE && updatedHabit.status?.archived) {
          setHabits((prev) => prev.filter((h) => h._id !== habitId));
        } else if (filterType === FILTER_TYPES.ARCHIVED && !updatedHabit.status?.archived) {
          setHabits((prev) => prev.filter((h) => h._id !== habitId));
        } else {
          setHabits((prev) =>
            prev.map((h) => (h._id === habitId ? updatedHabit : h))
          );
        }
        showToast({
          message: updatedHabit.status?.archived ? 'Hábito archivado' : 'Hábito desarchivado',
          type: 'success',
          duration: DELETE_DELAY,
          action: {
            label: 'Deshacer',
            onPress: async () => {
              try {
                const undo = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/archive`);
                const undoHabit = undo.data || undo;
                if (filterType === FILTER_TYPES.ACTIVE && undoHabit.status?.archived) {
                  setHabits((prev) => prev.filter((h) => h._id !== habitId));
                } else if (filterType === FILTER_TYPES.ARCHIVED && !undoHabit.status?.archived) {
                  setHabits((prev) => prev.filter((h) => h._id !== habitId));
                } else {
                  setHabits((prev) => prev.map((h) => (h._id === habitId ? undoHabit : h)));
                }
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (undoErr) {
                Alert.alert(
                  TEXTS.ERROR_ARCHIVE,
                  getApiErrorMessage(undoErr, { isOffline }) || TEXTS.ERROR_ARCHIVE_MESSAGE
                );
              }
            },
          },
        });
      } catch (err) {
        console.error('Error al archivar hábito:', err);
        Alert.alert(
          TEXTS.ERROR_ARCHIVE,
          getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_ARCHIVE_MESSAGE
        );
      }
    },
    [filterType, isOffline, showToast]
  );

  const handleDeleteHabit = useCallback(
    async (habitId) => {
      clearPendingDelete();
      const habitToDelete = habits.find((h) => h._id === habitId);
      if (!habitToDelete) return;
      setHabits((prev) => prev.filter((h) => h._id !== habitId));
      showToast({
        message: 'Hábito eliminado',
        type: 'warning',
        duration: DELETE_DELAY,
        action: {
          label: 'Deshacer',
          onPress: () => {
            clearPendingDelete();
            setHabits((prev) => [habitToDelete, ...prev]);
          },
        },
      });
      const timeoutId = setTimeout(async () => {
        if (pendingDeleteRef.current.habit?._id !== habitId) return;
        pendingDeleteRef.current = { timeoutId: null, habit: null };
        try {
          await api.delete(ENDPOINTS.HABIT_BY_ID(habitId));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await cancelHabitNotifications(habitId);
        } catch (err) {
          console.error('Error al eliminar hábito:', err);
          setHabits((prev) => [habitToDelete, ...prev.filter((h) => h._id !== habitId)]);
          Alert.alert(
            TEXTS.ERROR_DELETE,
            getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_DELETE_MESSAGE
          );
        }
      }, DELETE_DELAY);
      pendingDeleteRef.current = { timeoutId, habit: habitToDelete };
    },
    [clearPendingDelete, habits, isOffline, showToast]
  );

  const resetForm = useCallback(() => {
    habitChatOriginRef.current = null;
    habitClientRequestIdRef.current = null;
    setHabitModalReminderIso(null);
    setFormData(getDefaultFormData());
  }, []);

  const handleHabitModalClose = useCallback(() => {
    const hadChatFlow = Boolean(
      habitChatOriginRef.current || habitClientRequestIdRef.current
    );
    setModalVisible(false);
    if (hadChatFlow) {
      void postProductActionTelemetry({
        event: 'confirm_dismissed',
        surface: 'habit_modal',
      });
    }
    resetForm();
  }, [resetForm]);

  const openModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  return {
    habits,
    modalVisible,
    setModalVisible,
    loading,
    refreshing,
    error,
    filterType,
    setFilterType,
    formData,
    setFormData,
    loadHabits,
    onRefresh,
    handleHabitPress,
    handleAddHabit,
    toggleHabitComplete,
    toggleArchiveHabit,
    handleDeleteHabit,
    resetForm,
    openModal,
    handleHabitModalClose,
    habitModalReminderIso,
  };
}
