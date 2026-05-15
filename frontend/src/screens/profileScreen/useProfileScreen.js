/**
 * Hook para ProfileScreen: datos de usuario, estadísticas, contactos, suscripción y logout.
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
  TEXTS,
  REFRESH_ANIMATION_DURATION,
} from './profileScreenConstants';
import { STORAGE_KEYS as CHAT_STORAGE_KEYS } from '../chat/chatScreenConstants';
import { isValidMongoObjectId24 } from '../../utils/mongoId';
import { normalizeEmergencyContactsList } from '../../utils/emergencyContactUtils';

export function useProfileScreen(navigation) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [detailedStats, setDetailedStats] = useState(DEFAULT_DETAILED_STATS);
  const [refreshAnim] = useState(new Animated.Value(0));
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showEmergencyContactsModal, setShowEmergencyContactsModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  /** Continuidad del último chat (#4 + #47); null si no hay o error. */
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
  }, [showToast]);

  const loadEmergencyContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const response = await api.get(ENDPOINTS.EMERGENCY_CONTACTS);
      setEmergencyContacts(normalizeEmergencyContactsList(response.contacts || []));
    } catch (error) {
      console.error('[ProfileScreen] Error cargando contactos:', error);
      setEmergencyContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const response = await paymentService.getSubscriptionStatus();
      if (response?.success) setSubscriptionStatus(response);
    } catch (error) {
      console.error('[ProfileScreen] Error cargando suscripción:', error);
    }
  }, []);

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
    loadEmergencyContacts();
    loadSubscriptionStatus();
    loadLastSessionSummary();
  }, [loadUserData, loadEmergencyContacts, loadSubscriptionStatus, loadLastSessionSummary]);

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
    loadEmergencyContacts();
    loadSubscriptionStatus();
    loadLastSessionSummary();
  }, [loadUserData, loadEmergencyContacts, loadSubscriptionStatus, loadLastSessionSummary, triggerRefreshAnim]);

  const handleDeleteContact = useCallback(
    async (contactId) => {
      Alert.alert(TEXTS.DELETE_CONTACT, TEXTS.DELETE_CONTACT_CONFIRM, [
        { text: TEXTS.CANCEL, style: 'cancel' },
        {
          text: TEXTS.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(ENDPOINTS.EMERGENCY_CONTACT_BY_ID(contactId));
              showToast({
                message: TEXTS.CONTACT_DELETED,
                type: 'success',
              });
              await loadEmergencyContacts();
            } catch (error) {
              console.error('Error eliminando contacto:', error);
              showToast({
                message: TEXTS.CONTACT_DELETE_ERROR,
                type: 'error',
              });
            }
          },
        },
      ]);
    },
    [loadEmergencyContacts, showToast]
  );

  const handleEmergencyContactsSaved = useCallback(() => {
    loadEmergencyContacts();
  }, [loadEmergencyContacts]);

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
  }, [navigation, showToast]);

  const openEditContact = useCallback((contact) => {
    setSelectedContact(contact);
    setShowEditContactModal(true);
  }, []);

  const closeEditContact = useCallback(() => {
    setShowEditContactModal(false);
    setSelectedContact(null);
  }, []);

  /** Abre el chat; si hay conversación del resumen, la activa (misma lógica que el foco del dashboard). */
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
    emergencyContacts,
    loadingContacts,
    subscriptionStatus,
    lastSessionSummary,
    openChatFromLastSession,
    showEmergencyContactsModal,
    setShowEmergencyContactsModal,
    showEditContactModal,
    setShowEditContactModal,
    selectedContact,
    loadUserData,
    handleRefresh,
    handleDeleteContact,
    handleEmergencyContactsSaved,
    handleLogout,
    openEditContact,
    closeEditContact,
  };
}
