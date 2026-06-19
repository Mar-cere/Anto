/**
 * Hook para ProfileScreen: datos de usuario, estadísticas, suscripción y logout.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated, Easing } from 'react-native';
import { api, ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../context/ToastContext';
import paymentService from '../../services/paymentService';
import {
  DEFAULT_USER_DATA,
  DEFAULT_DETAILED_STATS,
  STORAGE_KEYS,
  REFRESH_ANIMATION_DURATION,
  useProfileTexts,
} from './profileScreenConstants';
import { STORAGE_KEYS as CHAT_STORAGE_KEYS } from '../chat/chatScreenConstants';
import { isValidMongoObjectId24 } from '../../utils/mongoId';

function resolveSubscriptionStatusErrorMessage(errorCode, texts) {
  const code = String(errorCode || '').toUpperCase();
  if (code === 'NETWORK_ERROR') {
    return (
      texts.SUBSCRIPTION_STATUS_NETWORK_ERROR ||
      texts.SUBSCRIPTION_STATUS_ERROR ||
      texts.ERROR_LOAD_MESSAGE
    );
  }
  if (code === 'TIMEOUT' || code === 'ETIMEDOUT') {
    return (
      texts.SUBSCRIPTION_STATUS_TIMEOUT_ERROR ||
      texts.SUBSCRIPTION_STATUS_ERROR ||
      texts.ERROR_LOAD_MESSAGE
    );
  }
  if (code === 'RATE_LIMIT') {
    return (
      texts.SUBSCRIPTION_STATUS_RATE_LIMIT_ERROR ||
      texts.SUBSCRIPTION_STATUS_ERROR ||
      texts.ERROR_LOAD_MESSAGE
    );
  }
  return texts.SUBSCRIPTION_STATUS_ERROR || texts.ERROR_LOAD_MESSAGE;
}

export function useProfileScreen(navigation) {
  const TEXTS = useProfileTexts();
  const {
    ERROR_LOAD_MESSAGE,
    SUBSCRIPTION_STATUS_ERROR,
    SUBSCRIPTION_STATUS_NETWORK_ERROR,
    SUBSCRIPTION_STATUS_TIMEOUT_ERROR,
    SUBSCRIPTION_STATUS_RATE_LIMIT_ERROR,
  } = TEXTS;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [detailedStats, setDetailedStats] = useState(DEFAULT_DETAILED_STATS);
  const [refreshAnim] = useState(new Animated.Value(0));
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [lastSessionSummary, setLastSessionSummary] = useState(null);

  const loadUserData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserData((prev) => ({
          ...prev,
          ...parsed,
          stats: { ...parsed.stats, lastActive: new Date() },
        }));
        setDetailedStats((prev) => ({
          ...prev,
          currentStreak: parsed.stats?.habitsStreak ?? 0,
          bestStreak: parsed.stats?.bestStreak ?? 0,
          lastActive: parsed.stats?.lastActive ?? null,
          tasksCompleted: parsed.stats?.tasksCompleted ?? 0,
          habitsActive: parsed.stats?.habitsActive ?? 0,
          habitsCompleted: parsed.stats?.habitsCompleted ?? 0,
          tasksThisWeek: parsed.stats?.tasksThisWeek ?? 0,
          totalTasks: parsed.stats?.totalTasks ?? 0,
          totalHabits: parsed.stats?.totalHabits ?? 0,
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
      showToast({
        message: TEXTS.ERROR_LOAD_MESSAGE,
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, TEXTS.ERROR_LOAD_MESSAGE]);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const response = await paymentService.getSubscriptionStatus();
      if (response?.success) {
        setSubscriptionStatus(response);
      } else {
        setSubscriptionStatus(null);
        showToast({
          message: resolveSubscriptionStatusErrorMessage(response?.errorCode, {
            ERROR_LOAD_MESSAGE,
            SUBSCRIPTION_STATUS_ERROR,
            SUBSCRIPTION_STATUS_NETWORK_ERROR,
            SUBSCRIPTION_STATUS_TIMEOUT_ERROR,
            SUBSCRIPTION_STATUS_RATE_LIMIT_ERROR,
          }),
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('[ProfileScreen] Error cargando suscripción:', error);
      setSubscriptionStatus(null);
      showToast({
        message: resolveSubscriptionStatusErrorMessage(error?.code, {
          ERROR_LOAD_MESSAGE,
          SUBSCRIPTION_STATUS_ERROR,
          SUBSCRIPTION_STATUS_NETWORK_ERROR,
          SUBSCRIPTION_STATUS_TIMEOUT_ERROR,
          SUBSCRIPTION_STATUS_RATE_LIMIT_ERROR,
        }),
        type: 'warning',
      });
    }
  }, [
    showToast,
    ERROR_LOAD_MESSAGE,
    SUBSCRIPTION_STATUS_ERROR,
    SUBSCRIPTION_STATUS_NETWORK_ERROR,
    SUBSCRIPTION_STATUS_TIMEOUT_ERROR,
    SUBSCRIPTION_STATUS_RATE_LIMIT_ERROR,
  ]);

  const loadLastSessionSummary = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        setLastSessionSummary(null);
        return;
      }
      const res = await api.get(ENDPOINTS.SUMMARY_LAST_SESSION);
      if (res && typeof res === 'object' && res.success === true && 'data' in res) {
        setLastSessionSummary(res.data ?? null);
      } else {
        setLastSessionSummary(null);
      }
    } catch (error) {
      console.warn('[ProfileScreen] continuidad-chat:', error?.message || error);
      setLastSessionSummary(null);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadSubscriptionStatus();
    loadLastSessionSummary();
  }, [loadUserData, loadSubscriptionStatus, loadLastSessionSummary]);

  const triggerRefreshAnim = useCallback(() => {
    Animated.sequence([
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: REFRESH_ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(refreshAnim, {
        toValue: 0,
        duration: REFRESH_ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  }, [refreshAnim]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    triggerRefreshAnim();
    loadUserData();
    loadSubscriptionStatus();
    loadLastSessionSummary();
  }, [loadUserData, loadSubscriptionStatus, loadLastSessionSummary, triggerRefreshAnim]);

  const handleLogout = useCallback(() => {
    Alert.alert(TEXTS.LOGOUT_TITLE, TEXTS.LOGOUT_MESSAGE, [
      { text: TEXTS.CANCEL, style: 'cancel' },
      {
        text: TEXTS.LOGOUT,
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await Promise.all(
              [STORAGE_KEYS.USER_TOKEN, STORAGE_KEYS.USER_DATA, STORAGE_KEYS.USER_PREFERENCES].map((k) =>
                AsyncStorage.removeItem(k)
              )
            );
            setUserData(DEFAULT_USER_DATA);
            setDetailedStats(DEFAULT_DETAILED_STATS);
            navigation.reset({ index: 0, routes: [{ name: ROUTES.SIGN_IN }] });
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            showToast({
              message: TEXTS.ERROR_LOGOUT_MESSAGE,
              type: 'error',
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [
    navigation,
    showToast,
    TEXTS.LOGOUT_TITLE,
    TEXTS.LOGOUT_MESSAGE,
    TEXTS.CANCEL,
    TEXTS.LOGOUT,
    TEXTS.ERROR_LOGOUT_MESSAGE,
  ]);

  const openChatFromLastSession = useCallback(
    async (conversationId) => {
      try {
        const cid = conversationId && isValidMongoObjectId24(String(conversationId)) ? String(conversationId) : null;
        if (cid) {
          await AsyncStorage.setItem(CHAT_STORAGE_KEYS.CONVERSATION_ID, cid);
        }
        const state = navigation.getState?.();
        if (state?.type === 'tab') {
          if (cid) navigation.navigate('Chat', { openConversationId: cid });
          else navigation.navigate('Chat');
          return;
        }
        if (cid) {
          navigation.navigate('MainTabs', { screen: 'Chat', params: { openConversationId: cid } });
        } else {
          navigation.navigate('MainTabs', { screen: 'Chat' });
        }
      } catch (e) {
        console.warn('[ProfileScreen] navigate Chat:', e?.message);
        try {
          navigation.navigate('Chat');
        } catch (_) {}
      }
    },
    [navigation]
  );

  return {
    loading,
    refreshing,
    userData,
    detailedStats,
    subscriptionStatus,
    lastSessionSummary,
    openChatFromLastSession,
    handleRefresh,
    handleLogout,
  };
}
