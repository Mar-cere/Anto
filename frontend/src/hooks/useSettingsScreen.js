/**
 * Hook con la lógica de la pantalla Configuración (preferencias, push, estilo de respuesta, logout, eliminar cuenta).
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { api, ENDPOINTS } from '../config/api';
import { getSupportedLanguage } from '../constants/translations';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { preferenceToApiTheme, useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  registerForPushNotifications,
  areNotificationsEnabled,
  requestNotificationPermissions,
  getStoredPushToken,
  removePushToken,
} from '../services/pushNotificationService';
import {
  NAVIGATION_ROUTES,
  RESPONSE_STYLE_LABELS,
  RESPONSE_STYLES,
  useSettingsTexts,
} from '../screens/settings/settingsScreenConstants';
/** Misma clave que AuthContext: sesión persistida tras PUT /api/users/me */
const STORAGE_USER_DATA = 'userData';

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

const DEFAULT_CHAT_PREFS = {
  reduceStockEmpathy: false,
  avoidApologyOpenings: false,
  preferQuestions: false,
};

const resolveSettingsErrorMessage = (error, fallbackMessage) => {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  const status = error?.response?.status;

  const isNetwork =
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('failed to fetch');
  if (isNetwork) return fallbackMessage;

  const isTooManyRequests =
    status === 429 ||
    normalizedMessage.includes('too many') ||
    normalizedMessage.includes('demasiados intentos');
  if (isTooManyRequests) return fallbackMessage;

  return fallbackMessage;
};

export function useSettingsScreen({ navigation }) {
  const TEXTS = useSettingsTexts();
  const { user, logout: authLogout, refreshSession } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const { setPreference } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);
  const [timezoneSynced, setTimezoneSynced] = useState(false);

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
            message: TEXTS.NOTIFICATIONS_SESSION_SYNC_WARNING,
            type: 'warning',
          });
        }
        return ok;
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(
            error,
            TEXTS.PREFERENCES_ERROR,
          ),
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
      TEXTS.PREFERENCES_ERROR,
      TEXTS.NOTIFICATIONS_SESSION_SYNC_WARNING,
    ],
  );

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
    } catch (_error) {
      showToast({ message: TEXTS.LOGOUT_ERROR, type: 'error' });
    }
  }, [navigation, authLogout, showToast, TEXTS.LOGOUT_ERROR]);

  const handleDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    try {
      await api.delete(ENDPOINTS.ME);
      await AsyncStorage.clear();
      await authLogout();
      navigation.replace(NAVIGATION_ROUTES.SIGN_IN);
      showToast({
        message: TEXTS.ACCOUNT_DELETED_SUCCESS,
        type: 'success',
        duration: 5000,
      });
    } catch (e) {
      console.error('Error eliminando cuenta:', e);
      showToast({ message: TEXTS.DELETE_ERROR, type: 'error' });
    }
  }, [
    navigation,
    authLogout,
    showToast,
    TEXTS.DELETE_ERROR,
    TEXTS.ACCOUNT_DELETED_SUCCESS,
  ]);

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
                    message: TEXTS.PUSH_ENABLED_SYNC_WARNING,
                    type: 'warning',
                  });
                }
              } catch (prefErr) {
                showToast({
                  message: resolveSettingsErrorMessage(
                    prefErr,
                    TEXTS.PREFERENCES_ERROR,
                  ),
                  type: 'warning',
                });
              }
              setPushNotificationsEnabled(true);
              showToast({
                message: TEXTS.PUSH_ENABLED_SUCCESS,
                type: 'success',
              });
            } else {
              setPushNotificationsEnabled(false);
              showToast({
                message: TEXTS.PUSH_REGISTER_ERROR,
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
                message: TEXTS.PUSH_DISABLED_SYNC_WARNING,
                type: 'warning',
              });
            }
          } catch (prefErr) {
            showToast({
              message: resolveSettingsErrorMessage(
                prefErr,
                TEXTS.PREFERENCES_ERROR,
              ),
              type: 'warning',
            });
          }
          setPushNotificationsEnabled(false);
          showToast({
            message: TEXTS.PUSH_DISABLED_SUCCESS,
            type: 'warning',
          });
        }
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(error, TEXTS.PREFERENCES_ERROR),
          type: 'error',
        });
      }
    },
    [
      persistNotificationPreferences,
      showToast,
      TEXTS.PERMISSIONS_NEEDED,
      TEXTS.PERMISSIONS_MESSAGE,
      TEXTS.PREFERENCES_ERROR,
      TEXTS.PUSH_ENABLED_SYNC_WARNING,
      TEXTS.PUSH_ENABLED_SUCCESS,
      TEXTS.PUSH_REGISTER_ERROR,
      TEXTS.PUSH_DISABLED_SYNC_WARNING,
      TEXTS.PUSH_DISABLED_SUCCESS,
    ],
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
            message: TEXTS.TEST_NOTIFICATION_WARNING_SENT,
            type: 'success',
          },
          TEST_NOTIFICATION_MEDIUM: {
            message: TEXTS.TEST_NOTIFICATION_MEDIUM_SENT,
            type: 'info',
          },
          TEST_NOTIFICATION_FOLLOWUP: {
            message: TEXTS.TEST_NOTIFICATION_FOLLOWUP_SENT,
            type: 'default',
          },
        };
        const payload = byKey[endpointKey] || {
          message: TEXTS.TEST_NOTIFICATION_SENT,
          type: 'success',
        };
        showToast(payload);
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(error, TEXTS.PREFERENCES_ERROR),
          type: 'error',
        });
      }
    },
    [
      showToast,
      TEXTS.PREFERENCES_ERROR,
      TEXTS.TEST_NOTIFICATION_WARNING_SENT,
      TEXTS.TEST_NOTIFICATION_MEDIUM_SENT,
      TEXTS.TEST_NOTIFICATION_FOLLOWUP_SENT,
      TEXTS.TEST_NOTIFICATION_SENT,
    ],
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
            message: TEXTS.CHAT_PREF_SYNC_WARNING,
            type: 'warning',
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(error, TEXTS.PREFERENCES_ERROR),
          type: 'error',
        });
      }
    },
    [
      user,
      persistUserFromMeResponse,
      showToast,
      TEXTS.PREFERENCES_ERROR,
      TEXTS.CHAT_PREF_SYNC_WARNING,
    ],
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
            message: TEXTS.RESPONSE_STYLE_SYNC_WARNING,
            type: 'warning',
          });
          return false;
        }
        showToast({
          message: `${TEXTS.RESPONSE_STYLE_UPDATED_PREFIX}: ${TEXTS[`RESPONSE_STYLE_LABEL_${key.toUpperCase()}`] || RESPONSE_STYLE_LABELS[key] || key}`,
          type: 'success',
        });
        return true;
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(error, TEXTS.PREFERENCES_ERROR),
          type: 'error',
        });
        return false;
      }
    },
    [
      user,
      persistUserFromMeResponse,
      showToast,
      TEXTS,
    ],
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
            message: TEXTS.THEME_SYNC_WARNING,
            type: 'warning',
          });
        }
        return ok;
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(error, TEXTS.PREFERENCES_ERROR),
          type: 'error',
        });
        return false;
      }
    },
    [
      user,
      setPreference,
      persistUserFromMeResponse,
      showToast,
      TEXTS.PREFERENCES_ERROR,
      TEXTS.THEME_SYNC_WARNING,
    ],
  );

  const handleSetLanguagePreference = useCallback(
    async (nextLanguage) => {
      const normalizedLanguage = getSupportedLanguage(nextLanguage);
      await setLanguage(normalizedLanguage);

      if (!user) return true;
      const currentPreferences = user?.preferences || {};

      try {
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: {
            ...currentPreferences,
            language: normalizedLanguage,
          },
        });
        const ok = await persistUserFromMeResponse(result);
        if (!ok) {
          showToast({
            message: TEXTS.LANGUAGE_CHANGED_SYNC_WARNING,
            type: 'warning',
          });
        } else {
          showToast({
            message: TEXTS.LANGUAGE_CHANGED_OK,
            type: 'success',
          });
        }
        return ok;
      } catch (error) {
        showToast({
          message: resolveSettingsErrorMessage(error, TEXTS.PREFERENCES_ERROR),
          type: 'error',
        });
        return false;
      }
    },
    [
      user,
      setLanguage,
      persistUserFromMeResponse,
      showToast,
      TEXTS.LANGUAGE_CHANGED_SYNC_WARNING,
      TEXTS.LANGUAGE_CHANGED_OK,
      TEXTS.PREFERENCES_ERROR,
    ],
  );

  return {
    user,
    language,
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
    handleSetLanguagePreference,
    handleChatPreferenceChange,
    checkPushNotificationStatus,
    handleTestNotification,
  };
}
