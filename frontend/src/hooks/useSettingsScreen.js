/**
 * Hook con la lógica de la pantalla Configuración (preferencias, push, estilo de respuesta, logout, eliminar cuenta).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  registerForPushNotifications,
  areNotificationsEnabled,
  requestNotificationPermissions,
  getStoredPushToken,
} from '../services/pushNotificationService';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { NAVIGATION_ROUTES, TEXTS } from '../screens/settings/settingsScreenConstants';

export function useSettingsScreen({ navigation }) {
  const { user, updateUser: updateUserContext, logout: authLogout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);

  const savePreference = useCallback(async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log('Error guardando preferencia:', e);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setShowLogoutModal(false);
    try {
      await authLogout();
      navigation.replace(NAVIGATION_ROUTES.SIGN_IN);
    } catch (e) {
      Alert.alert(TEXTS.ERROR, TEXTS.LOGOUT_ERROR);
    }
  }, [navigation, authLogout]);

  const handleDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    try {
      await api.delete(ENDPOINTS.ME);
      await AsyncStorage.clear();
      await authLogout();
      navigation.replace(NAVIGATION_ROUTES.SIGN_IN);
      Alert.alert(
        'Cuenta eliminada',
        'Tu cuenta ha sido eliminada correctamente. Todas tus suscripciones activas han sido canceladas.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.error('Error eliminando cuenta:', e);
      Alert.alert(TEXTS.ERROR, e.message || TEXTS.DELETE_ERROR);
    }
  }, [navigation, authLogout]);

  const checkPushNotificationStatus = useCallback(async () => {
    try {
      const hasPermissions = await areNotificationsEnabled();
      const token = await getStoredPushToken();
      setPushNotificationsEnabled(hasPermissions && !!token);
    } catch (error) {
      console.error('Error verificando estado de push notifications:', error);
    }
  }, []);

  const handleTogglePushNotifications = useCallback(async (value) => {
    try {
      if (value) {
        const hasPermissions = await requestNotificationPermissions();
        if (hasPermissions) {
          const token = await registerForPushNotifications();
          if (token) {
            setPushNotificationsEnabled(true);
            Alert.alert(TEXTS.SUCCESS, 'Notificaciones push habilitadas. Recibirás alertas sobre crisis y seguimientos.', [{ text: TEXTS.OK }]);
          } else {
            setPushNotificationsEnabled(false);
            Alert.alert(TEXTS.ERROR, 'No se pudo registrar el dispositivo para notificaciones push.');
          }
        } else {
          setPushNotificationsEnabled(false);
          Alert.alert(TEXTS.PERMISSIONS_NEEDED, TEXTS.PERMISSIONS_MESSAGE, [{ text: TEXTS.OK }]);
        }
      } else {
        setPushNotificationsEnabled(false);
        Alert.alert('Notificaciones deshabilitadas', 'No recibirás alertas sobre crisis.', [{ text: TEXTS.OK }]);
      }
    } catch (error) {
      Alert.alert(TEXTS.ERROR, getApiErrorMessage(error) || 'Error configurando notificaciones push');
    }
  }, []);

  const configureNotifications = useCallback(async () => {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  useEffect(() => {
    configureNotifications();
    checkPushNotificationStatus();
  }, [configureNotifications, checkPushNotificationStatus]);

  const handleTestNotification = useCallback(
    async (endpointKey) => {
      try {
        await api.post(ENDPOINTS[endpointKey]);
        const messages = {
          TEST_NOTIFICATION_WARNING: 'Notificación WARNING de prueba enviada',
          TEST_NOTIFICATION_MEDIUM: 'Notificación MEDIUM de prueba enviada',
          TEST_NOTIFICATION_FOLLOWUP: 'Notificación de seguimiento de prueba enviada',
        };
        Alert.alert('Éxito', messages[endpointKey] || 'Notificación de prueba enviada');
      } catch (error) {
        Alert.alert('Error', getApiErrorMessage(error) || 'Error enviando notificación de prueba');
      }
    },
    []
  );

  const DEFAULT_CHAT_PREFS = {
    reduceStockEmpathy: false,
    avoidApologyOpenings: false,
    preferQuestions: false,
  };

  const handleChatPreferenceChange = useCallback(
    async (key, nextValue) => {
      const current = user?.preferences?.chatPreferences || DEFAULT_CHAT_PREFS;
      const next = { ...current, [key]: nextValue };
      const currentPreferences = user?.preferences || {};
      try {
        await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, chatPreferences: next },
        });
        updateUserContext({
          ...user,
          preferences: { ...currentPreferences, chatPreferences: next },
        });
      } catch (error) {
        Alert.alert(TEXTS.ERROR, getApiErrorMessage(error) || TEXTS.PREFERENCES_ERROR);
      }
    },
    [user, updateUserContext]
  );

  const handleCycleResponseStyle = useCallback(async () => {
    const { RESPONSE_STYLES, RESPONSE_STYLE_LABELS } = require('../screens/settings/settingsScreenConstants');
    const currentStyle = user?.preferences?.responseStyle || 'balanced';
    const currentIndex = RESPONSE_STYLES.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % RESPONSE_STYLES.length;
    const nextStyle = RESPONSE_STYLES[nextIndex];
    const currentPreferences = user?.preferences || {};
    try {
      await api.put(ENDPOINTS.UPDATE_PROFILE, {
        preferences: { ...currentPreferences, responseStyle: nextStyle },
      });
      updateUserContext({
        ...user,
        preferences: { ...currentPreferences, responseStyle: nextStyle },
      });
      Alert.alert('Éxito', `Estilo de respuesta cambiado a: ${RESPONSE_STYLE_LABELS[nextStyle]}`);
    } catch (error) {
      Alert.alert(TEXTS.ERROR, getApiErrorMessage(error) || 'No se pudo actualizar el estilo de respuesta');
    }
  }, [user, updateUserContext]);

  return {
    user,
    showLogoutModal,
    setShowLogoutModal,
    showDeleteModal,
    setShowDeleteModal,
    pushNotificationsEnabled,
    handleLogout,
    handleDeleteAccount,
    handleTogglePushNotifications,
    handleCycleResponseStyle,
    handleChatPreferenceChange,
    checkPushNotificationStatus,
    handleTestNotification,
  };
}
