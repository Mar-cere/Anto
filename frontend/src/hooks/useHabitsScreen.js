/**
 * Hook con la lógica de la pantalla de hábitos (estado, carga, CRUD, filtros).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
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

export function useHabitsScreen({ route, navigation }) {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(FILTER_TYPES.ACTIVE);
  const [formData, setFormData] = useState(getDefaultFormData);

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
        const result = await api.post(ENDPOINTS.HABITS, newHabit);
        const createdHabit = result.data;
        setHabits((prev) => [createdHabit, ...prev]);
        setModalVisible(false);
        setFormData(getDefaultFormData());
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await scheduleHabitNotification(createdHabit);
      } catch (err) {
        console.error('Error al crear hábito:', err);
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
      } catch (err) {
        console.error('Error al actualizar hábito:', err);
        Alert.alert(
          TEXTS.ERROR_UPDATE,
          getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_UPDATE_MESSAGE
        );
      }
    },
    [isOffline]
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
      } catch (err) {
        console.error('Error al archivar hábito:', err);
        Alert.alert(
          TEXTS.ERROR_ARCHIVE,
          getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_ARCHIVE_MESSAGE
        );
      }
    },
    [filterType, isOffline]
  );

  const handleDeleteHabit = useCallback(
    async (habitId) => {
      try {
        await api.delete(ENDPOINTS.HABIT_BY_ID(habitId));
        setHabits((prev) => prev.filter((h) => h._id !== habitId));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await cancelHabitNotifications(habitId);
      } catch (err) {
        console.error('Error al eliminar hábito:', err);
        Alert.alert(
          TEXTS.ERROR_DELETE,
          getApiErrorMessage(err, { isOffline }) || TEXTS.ERROR_DELETE_MESSAGE
        );
      }
    },
    [isOffline]
  );

  const resetForm = useCallback(() => {
    setFormData(getDefaultFormData());
  }, []);

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
  };
}
