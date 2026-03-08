/**
 * Hook para ProfileScreen: datos de usuario, estadísticas, contactos, suscripción y logout.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated, Easing } from 'react-native';
import { api, ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../constants/routes';
import paymentService from '../../services/paymentService';
import {
  DEFAULT_USER_DATA,
  DEFAULT_DETAILED_STATS,
  STORAGE_KEYS,
  TEXTS,
  REFRESH_ANIMATION_DURATION,
} from './profileScreenConstants';

export function useProfileScreen(navigation) {
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
      Alert.alert(TEXTS.ERROR_LOAD, TEXTS.ERROR_LOAD_MESSAGE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadEmergencyContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const response = await api.get(ENDPOINTS.EMERGENCY_CONTACTS);
      setEmergencyContacts(response.contacts || []);
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

  useEffect(() => {
    loadUserData();
    loadEmergencyContacts();
    loadSubscriptionStatus();
  }, [loadUserData, loadEmergencyContacts, loadSubscriptionStatus]);

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
  }, [loadUserData, loadEmergencyContacts, loadSubscriptionStatus, triggerRefreshAnim]);

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
              Alert.alert(TEXTS.SUCCESS, TEXTS.CONTACT_DELETED);
              await loadEmergencyContacts();
            } catch (error) {
              console.error('Error eliminando contacto:', error);
              Alert.alert(TEXTS.ERROR, TEXTS.CONTACT_DELETE_ERROR);
            }
          },
        },
      ]);
    },
    [loadEmergencyContacts]
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
            Alert.alert(TEXTS.ERROR_LOGOUT, TEXTS.ERROR_LOGOUT_MESSAGE);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [navigation]);

  const openEditContact = useCallback((contact) => {
    setSelectedContact(contact);
    setShowEditContactModal(true);
  }, []);

  const closeEditContact = useCallback(() => {
    setShowEditContactModal(false);
    setSelectedContact(null);
  }, []);

  return {
    loading,
    refreshing,
    userData,
    detailedStats,
    emergencyContacts,
    loadingContacts,
    subscriptionStatus,
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
