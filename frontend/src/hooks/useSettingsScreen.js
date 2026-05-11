/**
 * Hook con la lógica de la pantalla Configuración (preferencias, push, estilo de respuesta, logout, eliminar cuenta).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { api, ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { preferenceToApiTheme, useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

/** Misma clave que AuthContext: sesión persistida tras PUT /api/users/me */
const STORAGE_USER_DATA = 'userData';
import {
  registerForPushNotifications,
  areNotificationsEnabled,
  requestNotificationPermissions,
  getStoredPushToken,
  removePushToken,
} from '../services/pushNotificationService';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import {
  NAVIGATION_ROUTES,
  RESPONSE_STYLE_LABELS,
  RESPONSE_STYLES,
  TEXTS,
} from '../screens/settings/settingsScreenConstants';

export function useSettingsScreen({ navigation }) {
  const { user, logout: authLogout, refreshSession } = useAuth();
  const { showToast } = useToast();
  const { setPreference } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);
  const [timezoneSynced, setTimezoneSynced] = useState(false);

  const DEFAULT_NOTIFICATION_PREFERENCES = {
    enabled: true,
    morning: { enabled: false, hour: 9, minute: 0 },
    evening: { enabled: false, hour: 20, minute: 0 },
    types: {
      dailyReminders: true,
      habitReminders: true,
      taskReminders: true,
      motivationalMessages: true,
      betweenSessionsMessages: true,
    },
  };

  const persistUserFromMeResponse = useCallback(
    async (putResult) => {
      if (putResult?.user) {
        await AsyncStorage.setItem(
          STORAGE_USER_DATA,
          JSON.stringify(putResult.user),
        );
        await refreshSession();
        return true;
      }
      return false;
    },
    [refreshSession],
  );

  const persistNotificationPreferences = useCallback(
    async (enabled) => {
      const currentPreferences = user?.preferences || {};
      const currentNotificationPreferences =
        user?.notificationPreferences || {};
      const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
        preferences: { ...currentPreferences, notifications: enabled },
        notificationPreferences: { ...currentNotificationPreferences, enabled },
      });
      return persistUserFromMeResponse(result);
    },
    [user, persistUserFromMeResponse],
  );

  const getMergedNotificationPreferences = useCallback(
    (patch) => {
      const current = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user?.notificationPreferences || {}),
      };
      const currentTypes = {
        ...DEFAULT_NOTIFICATION_PREFERENCES.types,
        ...(current.types || {}),
      };
      const currentMorning = {
        ...DEFAULT_NOTIFICATION_PREFERENCES.morning,
        ...(current.morning || {}),
      };
      const currentEvening = {
        ...DEFAULT_NOTIFICATION_PREFERENCES.evening,
        ...(current.evening || {}),
      };

      const next = { ...current, ...patch };
      next.types = { ...currentTypes, ...(patch?.types || {}) };
      if (patch?.morning)
        next.morning = { ...currentMorning, ...patch.morning };
      else next.morning = currentMorning;
      if (patch?.evening)
        next.evening = { ...currentEvening, ...patch.evening };
      else next.evening = currentEvening;
      return next;
    },
    [user],
  );

  const handleUpdateNotificationPreferences = useCallback(
    async (patch) => {
      const currentPreferences = user?.preferences || {};
      const nextNotificationPreferences =
        getMergedNotificationPreferences(patch);
      try {
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: {
            ...currentPreferences,
            // Mantener consistencia: si el usuario marca enabled=false, también apagamos preferences.notifications.
            notifications:
              nextNotificationPreferences?.enabled === false
                ? false
                : (currentPreferences?.notifications ?? true),
          },
          notificationPreferences: nextNotificationPreferences,
        });
        const ok = await persistUserFromMeResponse(result);
        if (!ok) {
          showToast({
            message:
              'No se pudo actualizar la sesión tras guardar los ajustes de notificaciones.',
            type: 'warning',
          });
        }
        return ok;
      } catch (error) {
        showToast({
          message:
            getApiErrorMessage(error) ||
            'No se pudieron guardar los ajustes de notificaciones.',
          type: 'error',
        });
        return false;
      }
    },
    [
      getMergedNotificationPreferences,
      persistUserFromMeResponse,
      showToast,
      user,
    ],
  );

  const savePreference = useCallback(async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log('Error guardando preferencia:', e);
    }
  }, []);

  const guessTimezone = useCallback(() => {
    try {
      const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
      if (typeof tz === 'string' && tz.includes('/')) return tz;
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (!user || timezoneSynced) return;
    const currentTz = user?.preferences?.timezone;
    if (currentTz) {
      setTimezoneSynced(true);
      return;
    }
    const tz = guessTimezone();
    if (!tz) return;
    // Best-effort: persistir timezone para que el scheduler use hora local del usuario.
    (async () => {
      try {
        const currentPreferences = user?.preferences || {};
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, timezone: tz },
        });
        await persistUserFromMeResponse(result);
      } catch {
        // silencioso: no bloquear UX
      } finally {
        setTimezoneSynced(true);
      }
    })();
  }, [guessTimezone, persistUserFromMeResponse, timezoneSynced, user]);

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
      const enabledByServerPrefs =
        user?.notificationPreferences?.enabled !== false &&
        user?.preferences?.notifications !== false;
      setPushNotificationsEnabled(
        hasPermissions && !!token && enabledByServerPrefs,
      );
    } catch (error) {
      console.error('Error verificando estado de push notifications:', error);
    }
  }, [user]);

  const handleTogglePushNotifications = useCallback(
    async (value) => {
      try {
        if (value) {
          const hasPermissions = await requestNotificationPermissions();
          if (hasPermissions) {
            const token = await registerForPushNotifications();
            if (token) {
              // registerForPushNotifications ya envía token al backend; aquí persistimos el "enabled" del usuario.
              try {
                const ok = await persistNotificationPreferences(true);
                if (!ok) {
                  showToast({
                    message:
                      'Notificaciones habilitadas, pero no se pudo actualizar la sesión.',
                    type: 'warning',
                  });
                }
              } catch (prefErr) {
                showToast({
                  message:
                    getApiErrorMessage(prefErr) ||
                    'Notificaciones habilitadas, pero no se pudo guardar la preferencia.',
                  type: 'warning',
                });
              }
              setPushNotificationsEnabled(true);
              showToast({
                message:
                  'Notificaciones push habilitadas. Recibirás alertas sobre crisis y seguimientos.',
                type: 'success',
              });
            } else {
              setPushNotificationsEnabled(false);
              showToast({
                message:
                  'No se pudo registrar el dispositivo para notificaciones push.',
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
          // Deshabilitar: limpiar token local + backend y persistir preferencia en el perfil.
          await removePushToken();
          try {
            const ok = await persistNotificationPreferences(false);
            if (!ok) {
              showToast({
                message:
                  'Notificaciones deshabilitadas, pero no se pudo actualizar la sesión.',
                type: 'warning',
              });
            }
          } catch (prefErr) {
            showToast({
              message:
                getApiErrorMessage(prefErr) ||
                'Notificaciones deshabilitadas, pero no se pudo guardar la preferencia.',
              type: 'warning',
            });
          }
          setPushNotificationsEnabled(false);
          showToast({
            message:
              'Notificaciones deshabilitadas. No recibirás alertas sobre crisis.',
            type: 'warning',
          });
        }
      } catch (error) {
        showToast({
          message:
            getApiErrorMessage(error) ||
            'Error configurando notificaciones push.',
          type: 'error',
        });
      }
    },
    [persistNotificationPreferences, showToast],
  );

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
            message:
              'Notificación de seguimiento de prueba enviada al dispositivo.',
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
          message:
            getApiErrorMessage(error) ||
            'Error enviando notificación de prueba.',
          type: 'error',
        });
      }
    },
    [showToast],
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
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, chatPreferences: next },
        });
        const ok = await persistUserFromMeResponse(result);
        if (!ok) {
          showToast({
            message:
              'No se pudo actualizar la sesión. Intenta cerrar sesión y volver a entrar.',
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
    [user, persistUserFromMeResponse, showToast],
  );

  const handleSetResponseStyle = useCallback(
    async (styleKey) => {
      const key = typeof styleKey === 'string' ? styleKey.trim() : '';
      if (!RESPONSE_STYLES.includes(key)) return false;
      if (!user) return false;
      const currentPreferences = user?.preferences || {};
      try {
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, responseStyle: key },
        });
        const ok = await persistUserFromMeResponse(result);
        if (!ok) {
          showToast({
            message: 'No se pudo actualizar la sesión tras cambiar el estilo.',
            type: 'warning',
          });
          return false;
        }
        showToast({
          message: `Estilo de respuesta: ${RESPONSE_STYLE_LABELS[key] || key}`,
          type: 'success',
        });
        return true;
      } catch (error) {
        showToast({
          message:
            getApiErrorMessage(error) ||
            'No se pudo actualizar el estilo de respuesta.',
          type: 'error',
        });
        return false;
      }
    },
    [user, persistUserFromMeResponse, showToast],
  );

  const handleSetThemePreference = useCallback(
    async (mode) => {
      await setPreference(mode);
      if (!user) return true;
      const currentPreferences = user?.preferences || {};
      try {
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: {
            ...currentPreferences,
            theme: preferenceToApiTheme(mode),
          },
        });
        const ok = await persistUserFromMeResponse(result);
        if (!ok) {
          showToast({
            message:
              'El tema se aplicó en este dispositivo, pero no se pudo sincronizar con la cuenta.',
            type: 'warning',
          });
        }
        return ok;
      } catch (error) {
        showToast({
          message:
            getApiErrorMessage(error) ||
            TEXTS.PREFERENCES_ERROR,
          type: 'error',
        });
        return false;
      }
    },
    [user, setPreference, persistUserFromMeResponse, showToast],
  );

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
    handleUpdateNotificationPreferences,
    handleSetResponseStyle,
    handleSetThemePreference,
    handleChatPreferenceChange,
    checkPushNotificationStatus,
    handleTestNotification,
  };
}
