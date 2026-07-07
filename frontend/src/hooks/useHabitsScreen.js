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
import { isAuthError } from '../utils/apiErrorHandler';
import { cancelHabitNotifications, scheduleHabitNotification } from '../utils/notifications';
import {
  FILTER_TYPES,
  getDefaultFormData,
  SESSION_EXPIRED_DELAY,
  useHabitsTexts,
} from '../screens/habits/habitsScreenConstants';
import { isValidClientRequestId } from '../utils/clientRequestId';
import { postProductActionTelemetry } from '../utils/productActionTelemetry';
import { postCommitmentTelemetry } from '../utils/commitmentTelemetry';
import { createSessionCommitment } from '../services/sessionCommitmentsService';
import { buildCommitmentLabelFromProductTitle } from '../utils/commitmentBridgeUtils';
import { useToast } from '../context/ToastContext';

const DELETE_DELAY = 2200;

const resolveHabitsErrorMessage = (texts, fallbackKey) =>
  texts?.[fallbackKey] || texts?.ERROR_LOAD;

export function useHabitsScreen({ route, navigation }) {
  const TEXTS = useHabitsTexts();
  const textsRef = useRef(TEXTS);
  const habitChatOriginRef = useRef(null);
  const habitClientRequestIdRef = useRef(null);
  const pendingDeleteRef = useRef({ timeoutId: null, habit: null });
  // Blindaje contra respuestas fuera de orden (toques rápidos / red lenta).
  const habitToggleReqIdRef = useRef({});
  const { showToast } = useToast();
  const [habitModalReminderIso, setHabitModalReminderIso] = useState(null);
  const [commitmentBridgeOffer, setCommitmentBridgeOffer] = useState(null);
  const [commitmentBridgeSaving, setCommitmentBridgeSaving] = useState(false);

  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(FILTER_TYPES.ACTIVE);
  const [formData, setFormData] = useState(getDefaultFormData);

  useEffect(() => {
    textsRef.current = TEXTS;
  }, [TEXTS]);

  const clearPendingDelete = useCallback(() => {
    const { timeoutId } = pendingDeleteRef.current;
    if (timeoutId) clearTimeout(timeoutId);
    pendingDeleteRef.current = { timeoutId: null, habit: null };
  }, []);

  useEffect(() => () => clearPendingDelete(), [clearPendingDelete]);

  const loadHabits = useCallback(
    async (isRefresh = false) => {
      const texts = textsRef.current;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error(texts.NO_TOKEN);

        const response = await api.get(`${ENDPOINTS.HABITS}?status=${filterType}`);
        setHabits(response.data?.data?.habits || response.data?.habits || []);
      } catch (err) {
        console.error('Error al cargar hábitos:', err);
        setError(resolveHabitsErrorMessage(texts, 'ERROR_LOAD'));
        if (isAuthError(err)) {
          Alert.alert(texts.SESSION_EXPIRED, texts.SESSION_EXPIRED_MESSAGE);
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
    [filterType, navigation]
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
      navigation.navigate('Tasks', {
        tab: 'habits',
        habitId: habit._id,
        habit,
      });
    },
    [navigation]
  );

  const handleAddHabit = useCallback(
    async (data) => {
      const texts = textsRef.current;
      const chatOriginSnapshot = habitChatOriginRef.current;
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
        if (chatOriginSnapshot && createdHabit?._id && !result.idempotentReplay) {
          const label = buildCommitmentLabelFromProductTitle(data.title);
          if (label) {
            setCommitmentBridgeOffer({
              label,
              habitId: String(createdHabit._id),
              interventionId: chatOriginSnapshot?.interventionId || null,
              conversationId: chatOriginSnapshot?.conversationId || null,
            });
          }
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
          texts.ERROR_CREATE,
          resolveHabitsErrorMessage(texts, 'ERROR_CREATE_MESSAGE')
        );
      }
    },
    []
  );

  const handleCommitmentBridgeSave = useCallback(async () => {
    if (!commitmentBridgeOffer?.label || commitmentBridgeSaving) return;
    setCommitmentBridgeSaving(true);
    try {
      const sourceMeta = { habitId: commitmentBridgeOffer.habitId };
      if (commitmentBridgeOffer.interventionId) {
        sourceMeta.interventionId = commitmentBridgeOffer.interventionId;
      }
      await createSessionCommitment({
        label: commitmentBridgeOffer.label,
        conversationId: commitmentBridgeOffer.conversationId || undefined,
        source: 'chat_action',
        sourceMeta,
      });
      showToast({
        message: textsRef.current.COMMITMENT_BRIDGE_SAVED || 'Compromiso guardado',
        type: 'success',
      });
      setCommitmentBridgeOffer(null);
    } catch (err) {
      console.warn('[useHabitsScreen] commitment bridge:', err?.message || err);
    } finally {
      setCommitmentBridgeSaving(false);
    }
  }, [commitmentBridgeOffer, commitmentBridgeSaving, showToast]);

  const handleCommitmentBridgeDismiss = useCallback(() => {
    void postCommitmentTelemetry({ event: 'bridge_dismissed', surface: 'habit_modal' });
    setCommitmentBridgeOffer(null);
  }, []);

  const toggleHabitComplete = useCallback(
    async (habitId) => {
      const texts = textsRef.current;
      const reqId = `${habitId}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
      habitToggleReqIdRef.current[habitId] = reqId;

      let previousHabit = null;
      try {
        // Actualización optimista: cambia el estado en UI sin esperar a la red.
        setHabits((prev) =>
          prev.map((h) => {
            if (h._id !== habitId) return h;
            previousHabit = h;
            return {
              ...h,
              status: {
                ...(h.status || {}),
                completedToday: !h.status?.completedToday,
              },
            };
          })
        );

        const result = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/toggle`, {});
        // Si hubo otro toggle más reciente, ignorar esta respuesta.
        if (habitToggleReqIdRef.current[habitId] !== reqId) return;
        if (result && typeof result === 'object' && result.success === false) {
          throw new Error(result.message || texts.ERROR_UPDATE_MESSAGE);
        }
        const updatedHabit = result?.data ?? result;
        if (!updatedHabit?._id) {
          throw new Error(texts.ERROR_UPDATE_MESSAGE);
        }
        setHabits((prev) =>
          prev.map((h) => (h._id === habitId ? updatedHabit : h))
        );
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        showToast({
          message: updatedHabit.status?.completedToday
            ? texts.HABIT_COMPLETED
            : texts.HABIT_MARKED_PENDING,
          type: 'success',
          duration: DELETE_DELAY,
          action: {
            label: texts.TOAST_UNDO,
            onPress: async () => {
              try {
                const undo = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/toggle`, {});
                const undoHabit = undo?.data ?? undo;
                if (!undoHabit?._id) {
                  throw new Error(texts.ERROR_UPDATE_MESSAGE);
                }
                setHabits((prev) => prev.map((h) => (h._id === habitId ? undoHabit : h)));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (_undoErr) {
                Alert.alert(
                  texts.ERROR_UPDATE,
                  resolveHabitsErrorMessage(texts, 'ERROR_UPDATE_MESSAGE')
                );
              }
            },
          },
        });
      } catch (err) {
        console.error('Error al actualizar hábito:', err);
        // Revertir UI si la actualización falló.
        if (habitToggleReqIdRef.current[habitId] === reqId && previousHabit?._id) {
          setHabits((prev) => prev.map((h) => (h._id === habitId ? previousHabit : h)));
        }
        Alert.alert(
          texts.ERROR_UPDATE,
          resolveHabitsErrorMessage(texts, 'ERROR_UPDATE_MESSAGE')
        );
      }
    },
    [showToast]
  );

  const toggleArchiveHabit = useCallback(
    async (habitId) => {
      const texts = textsRef.current;
      try {
        const result = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/archive`, {});
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
          message: updatedHabit.status?.archived
            ? texts.HABIT_ARCHIVED
            : texts.HABIT_UNARCHIVED,
          type: 'success',
          duration: DELETE_DELAY,
          action: {
            label: texts.TOAST_UNDO,
            onPress: async () => {
              try {
                const undo = await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/archive`, {});
                const undoHabit = undo.data || undo;
                if (filterType === FILTER_TYPES.ACTIVE && undoHabit.status?.archived) {
                  setHabits((prev) => prev.filter((h) => h._id !== habitId));
                } else if (filterType === FILTER_TYPES.ARCHIVED && !undoHabit.status?.archived) {
                  setHabits((prev) => prev.filter((h) => h._id !== habitId));
                } else {
                  setHabits((prev) => prev.map((h) => (h._id === habitId ? undoHabit : h)));
                }
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (_undoErr) {
                Alert.alert(
                  texts.ERROR_ARCHIVE,
                  resolveHabitsErrorMessage(texts, 'ERROR_ARCHIVE_MESSAGE')
                );
              }
            },
          },
        });
      } catch (err) {
        console.error('Error al archivar hábito:', err);
        Alert.alert(
          texts.ERROR_ARCHIVE,
          resolveHabitsErrorMessage(texts, 'ERROR_ARCHIVE_MESSAGE')
        );
      }
    },
    [filterType, showToast]
  );

  const handleDeleteHabit = useCallback(
    async (habitId) => {
      const texts = textsRef.current;
      clearPendingDelete();
      const habitToDelete = habits.find((h) => h._id === habitId);
      if (!habitToDelete) return;
      setHabits((prev) => prev.filter((h) => h._id !== habitId));
      showToast({
        message: texts.HABIT_DELETED,
        type: 'warning',
        duration: DELETE_DELAY,
        action: {
          label: texts.TOAST_UNDO,
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
            texts.ERROR_DELETE,
            resolveHabitsErrorMessage(texts, 'ERROR_DELETE_MESSAGE')
          );
        }
      }, DELETE_DELAY);
      pendingDeleteRef.current = { timeoutId, habit: habitToDelete };
    },
    [clearPendingDelete, habits, showToast]
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
    commitmentBridgeOffer,
    commitmentBridgeSaving,
    handleCommitmentBridgeSave,
    handleCommitmentBridgeDismiss,
  };
}
