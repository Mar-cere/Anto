/**
 * Hook con la lógica de la pantalla Configuración (preferencias, push, estilo de respuesta, logout, eliminar cuenta).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { api, ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/** Misma clave que AuthContext: sesión persistida tras PUT /api/users/me */
const STORAGE_USER_DATA = 'userData';
import {
  registerForPushNotifications,
  areNotificationsEnabled,
  requestNotificationPermissions,
  getStoredPushToken,
} from '../services/pushNotificationService';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { NAVIGATION_ROUTES, TEXTS } from '../screens/settings/settingsScreenConstants';

export function useSettingsScreen({ navigation }) {
  const { user, logout: authLogout, refreshSession } = useAuth();
  const { showToast } = useToast();
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
      showToast({ message: TEXTS.LOGOUT_ERROR, type: 'error' });
    }
  }, [navigation, authLogout, showToast]);

  const handleDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    try {
      await api.delete(ENDPOINTS.ME);
      await AsyncStorage.clear();
      await authLogout();
      navigation.replace(NAVIGATION_ROUTES.SIGN_IN);
      showToast({
        message:
          'Tu cuenta ha sido eliminada. Las suscripciones activas quedaron canceladas.',
        type: 'success',
        duration: 5000,
      });
    } catch (e) {
      console.error('Error eliminando cuenta:', e);
      showToast({ message: e.message || TEXTS.DELETE_ERROR, type: 'error' });
    }
  }, [navigation, authLogout, showToast]);

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
            showToast({
              message: 'Notificaciones push habilitadas. Recibirás alertas sobre crisis y seguimientos.',
              type: 'success',
            });
          } else {
            setPushNotificationsEnabled(false);
            showToast({
              message: 'No se pudo registrar el dispositivo para notificaciones push.',
              type: 'error',
            });
          }
        } else {
          setPushNotificationsEnabled(false);
          showToast({
            message: `${TEXTS.PERMISSIONS_NEEDED}: ${TEXTS.PERMISSIONS_MESSAGE}`,
            type: 'info',
            duration: 5000,
          });
        }
      } else {
        setPushNotificationsEnabled(false);
        showToast({
          message: 'Notificaciones deshabilitadas. No recibirás alertas sobre crisis.',
          type: 'warning',
        });
      }
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error) || 'Error configurando notificaciones push.',
        type: 'error',
      });
    }
  }, [showToast]);

  useEffect(() => {
    checkPushNotificationStatus();
  }, [checkPushNotificationStatus]);

  const handleTestNotification = useCallback(
    async (endpointKey) => {
      try {
        await api.post(ENDPOINTS[endpointKey]);
        const byKey = {
          TEST_NOTIFICATION_WARNING: {
            message: 'Notificación WARNING de prueba enviada al dispositivo.',
            type: 'success',
          },
          TEST_NOTIFICATION_MEDIUM: {
            message: 'Notificación MEDIUM de prueba enviada al dispositivo.',
            type: 'info',
          },
          TEST_NOTIFICATION_FOLLOWUP: {
            message: 'Notificación de seguimiento de prueba enviada al dispositivo.',
            type: 'default',
          },
        };
        const payload = byKey[endpointKey] || {
          message: 'Notificación de prueba enviada.',
          type: 'success',
        };
        showToast(payload);
      } catch (error) {
        showToast({
          message: getApiErrorMessage(error) || 'Error enviando notificación de prueba.',
          type: 'error',
        });
      }
    },
    [showToast]
  );

  const DEFAULT_CHAT_PREFS = {
    reduceStockEmpathy: false,
    avoidApologyOpenings: false,
    preferQuestions: false,
  };

  const persistUserFromMeResponse = useCallback(
    async (putResult) => {
      if (putResult?.user) {
        await AsyncStorage.setItem(STORAGE_USER_DATA, JSON.stringify(putResult.user));
        await refreshSession();
        return true;
      }
      return false;
    },
    [refreshSession]
  );

  const handleChatPreferenceChange = useCallback(
    async (key, nextValue) => {
      const current = user?.preferences?.chatPreferences || DEFAULT_CHAT_PREFS;
      const next = { ...current, [key]: nextValue };
      const currentPreferences = user?.preferences || {};
      try {
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, chatPreferences: next },
        });
        const ok = await persistUserFromMeResponse(result);
        if (!ok) {
          showToast({
            message: 'No se pudo actualizar la sesión. Intenta cerrar sesión y volver a entrar.',
            type: 'warning',
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        showToast({
          message: getApiErrorMessage(error) || TEXTS.PREFERENCES_ERROR,
          type: 'error',
        });
      }
    },
    [user, persistUserFromMeResponse, showToast]
  );

  const handleCycleResponseStyle = useCallback(async () => {
    const { RESPONSE_STYLES, RESPONSE_STYLE_LABELS } = require('../screens/settings/settingsScreenConstants');
    const currentStyle = user?.preferences?.responseStyle || 'balanced';
    const currentIndex = RESPONSE_STYLES.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % RESPONSE_STYLES.length;
    const nextStyle = RESPONSE_STYLES[nextIndex];
    const currentPreferences = user?.preferences || {};
    try {
      const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
        preferences: { ...currentPreferences, responseStyle: nextStyle },
      });
      const ok = await persistUserFromMeResponse(result);
      if (!ok) {
        showToast({
          message: 'No se pudo actualizar la sesión tras cambiar el estilo.',
          type: 'warning',
        });
        return;
      }
      showToast({
        message: `Estilo de respuesta cambiado a: ${RESPONSE_STYLE_LABELS[nextStyle]}`,
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error) || 'No se pudo actualizar el estilo de respuesta.',
        type: 'error',
      });
    }
  }, [user, persistUserFromMeResponse, showToast]);

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
