/**
 * Pantalla de Configuración
 * 
 * Permite a los usuarios gestionar sus preferencias de aplicación, incluyendo
 * notificaciones, tema, idioma, y opciones de cuenta. Incluye modales para
 * confirmar acciones críticas como cerrar sesión o eliminar cuenta.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from "@react-navigation/native";
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import notifications from '../data/notifications';
import { api, ENDPOINTS } from '../config/api';
import { updateUser } from '../services/userService';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import {
  cancelAllNotifications,
  scheduleDailyNotification,
} from '../utils/notifications';
import {
  registerForPushNotifications,
  areNotificationsEnabled,
  requestNotificationPermissions,
  getStoredPushToken,
} from '../services/pushNotificationService';

// Constantes de textos
const TEXTS = {
  TITLE: 'Configuración',
  BACK: 'Volver',
  PREFERENCES: 'Preferencias',
  ACCOUNT: 'Cuenta',
  SUPPORT: 'Soporte',
  ABOUT: 'Acerca de',
  NOTIFICATIONS: 'Notificaciones',
  DARK_MODE: 'Tema oscuro',
  LANGUAGE: 'Idioma',
  MORNING_NOTIFICATION: 'Hora de notificación matutina',
  EVENING_NOTIFICATION: 'Hora de notificación vespertina',
  SAVE_PREFERENCES: 'Guardar preferencias',
  CHANGE_PASSWORD: 'Cambiar contraseña',
  LOGOUT: 'Cerrar sesión',
  DELETE_ACCOUNT: 'Eliminar cuenta',
  FAQ: 'Preguntas frecuentes',
  TEST_NOTIFICATION: 'Probar notificación',
  APP_INFO: 'Información de la aplicación',
  LOGOUT_TITLE: 'Cerrar sesión',
  LOGOUT_MESSAGE: '¿Estás seguro que deseas cerrar sesión?',
  DELETE_TITLE: 'Eliminar cuenta',
  DELETE_MESSAGE: '¿Estás seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
  CANCEL: 'Cancelar',
  CONFIRM: 'Confirmar',
  DELETE: 'Eliminar',
  CLOSE: 'Cerrar',
  PERMISSIONS_NEEDED: 'Permisos necesarios',
  PERMISSIONS_MESSAGE: 'Necesitamos tu permiso para enviar notificaciones',
  ALLOW: 'Permitir',
  NOTIFICATION_SENT: 'Notificación enviada',
  NOTIFICATION_SENT_MESSAGE: 'Deberías recibir una notificación de prueba en breve',
  OK: 'OK',
  SUCCESS: 'Éxito',
  PREFERENCES_SAVED: 'Preferencias de notificaciones guardadas',
  ERROR: 'Error',
  LOGOUT_ERROR: 'No se pudo cerrar sesión',
  DELETE_ERROR: 'No se pudo eliminar la cuenta',
  PREFERENCES_ERROR: 'No se pudieron guardar las preferencias',
  PERMISSIONS_ERROR: 'No se pudo verificar los permisos de notificación',
  NOTIFICATION_ERROR: 'No se pudo enviar la notificación de prueba',
  THERAPEUTIC_TECHNIQUES: 'Técnicas Terapéuticas',
  THERAPEUTIC_TECHNIQUES_DESC: 'Explora técnicas basadas en evidencia para tu bienestar',
  SUBSCRIPTION: 'Suscripción Premium',
  SUBSCRIPTION_DESC: 'Gestiona tu suscripción y planes disponibles',
  TRANSACTION_HISTORY: 'Historial de Transacciones',
  TRANSACTION_HISTORY_DESC: 'Ver historial completo de tus pagos y suscripciones',
};

// Constantes de idiomas
const LANGUAGES = ["Español", "Inglés"];

// Constantes de horarios por defecto
const DEFAULT_MORNING_HOUR = 8;
const DEFAULT_MORNING_MINUTE = 0;
const DEFAULT_EVENING_HOUR = 19;
const DEFAULT_EVENING_MINUTE = 0;

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  NOTIFICATIONS: 'notifications',
  DARK_MODE: 'darkMode',
  LANGUAGE: 'language',
};

// Constantes de navegación
const NAVIGATION_ROUTES = {
  SIGN_IN: 'SignIn',
  CHANGE_PASSWORD: 'ChangePassword',
  FAQ: 'FAQ',
  FAQ_ALT: 'FaQ',
};

// Constantes de estilos
const SCROLL_PADDING_BOTTOM = 32;
const ICON_SIZE = 24;
const MODAL_WIDTH = "80%";
const MODAL_OVERLAY_OPACITY = 0.5;
const ACTIVE_OPACITY = 0.7;
const TIME_FORMAT_OPTIONS = { hour: '2-digit', minute: '2-digit' };

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  SWITCH_DISABLED: '#ccc',
  ITEM_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  ITEM_BORDER: 'rgba(26, 221, 219, 0.1)',
  TIME_SELECTOR_BACKGROUND: '#22335C',
  MODAL_OVERLAY: `rgba(0, 0, 0, ${MODAL_OVERLAY_OPACITY})`,
  MODAL_BACKGROUND: '#1D2B5F',
  MODAL_BUTTON_CANCEL: 'rgba(26, 221, 219, 0.1)',
  MODAL_BUTTON_DELETE: 'rgba(255, 107, 107, 0.1)',
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateUser: updateUserContext } = useAuth();

  // Estado para las preferencias (usar siempre objetos Date)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [morningTime, setMorningTime] = useState(() => {
    const d = new Date();
    d.setHours(DEFAULT_MORNING_HOUR, DEFAULT_MORNING_MINUTE, 0, 0);
    return d;
  });
  const [eveningTime, setEveningTime] = useState(() => {
    const d = new Date();
    d.setHours(DEFAULT_EVENING_HOUR, DEFAULT_EVENING_MINUTE, 0, 0);
    return d;
  });
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushTokenStatus, setPushTokenStatus] = useState(null);

  // Guardar preferencias en AsyncStorage
  const savePreference = useCallback(async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log("Error guardando preferencia:", e);
    }
  }, []);

  // Manejar logout
  const handleLogout = useCallback(async () => {
    setShowLogoutModal(false);
    try {
      await AsyncStorage.clear();
      navigation.replace(NAVIGATION_ROUTES.SIGN_IN);
    } catch (e) {
      Alert.alert(TEXTS.ERROR, TEXTS.LOGOUT_ERROR);
    }
  }, [navigation]);

  // Manejar eliminación de cuenta
  const handleDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    try {
      // Aquí iría la lógica para eliminar la cuenta
      await AsyncStorage.clear();
      navigation.replace(NAVIGATION_ROUTES.SIGN_IN);
    } catch (e) {
      Alert.alert(TEXTS.ERROR, TEXTS.DELETE_ERROR);
    }
  }, [navigation]);


  useEffect(() => {
    if (user?.notificationPreferences) {
      const { morning, evening } = user.notificationPreferences;
      const morningDate = new Date();
      morningDate.setHours(morning.hour, morning.minute, 0, 0);
      setMorningTime(morningDate);
      const eveningDate = new Date();
      eveningDate.setHours(evening.hour, evening.minute, 0, 0);
      setEveningTime(eveningDate);
    }
  }, [user]);

  // Sincronizar estado de notificaciones con AsyncStorage al montar
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (value !== null) {
          setNotificationsEnabled(JSON.parse(value));
        }
      } catch (e) {
        console.log('Error cargando preferencia de notificaciones:', e);
      }
    };
    loadNotificationPreference();
  }, []);

  const handleNotificationToggle = useCallback(async (value) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(value));
    } catch (e) {
      console.log('Error guardando preferencia de notificaciones:', e);
    }
    if (value) {
      await scheduleDailyNotification(morningTime.getHours(), morningTime.getMinutes());
      await scheduleDailyNotification(eveningTime.getHours(), eveningTime.getMinutes());
    } else {
      await cancelAllNotifications();
    }
  }, [morningTime, eveningTime]);

  const handleTimeChange = useCallback((event, selectedTime, isMorning) => {
    if (Platform.OS === 'android') {
      setShowMorningPicker(false);
      setShowEveningPicker(false);
    }
    if (selectedTime) {
      if (isMorning) {
        setMorningTime(selectedTime);
      } else {
        setEveningTime(selectedTime);
      }
    }
  }, []);

  const saveNotificationPreferences = useCallback(async () => {
    const preferences = {
      morning: {
        hour: morningTime.getHours(),
        minute: morningTime.getMinutes()
      },
      evening: {
        hour: eveningTime.getHours(),
        minute: eveningTime.getMinutes()
      }
    };
    try {
      await updateUser(user._id, { notificationPreferences: preferences });
      updateUserContext({ ...user, notificationPreferences: preferences });
      if (notificationsEnabled) {
        await cancelAllNotifications();
        await scheduleDailyNotification(preferences.morning.hour, preferences.morning.minute);
        await scheduleDailyNotification(preferences.evening.hour, preferences.evening.minute);
      }
      Alert.alert(TEXTS.SUCCESS, TEXTS.PREFERENCES_SAVED);
    } catch (error) {
      Alert.alert(TEXTS.ERROR, TEXTS.PREFERENCES_ERROR);
    }
  }, [user, morningTime, eveningTime, notificationsEnabled, updateUserContext]);

  // Configurar notificaciones al cargar el componente
  useEffect(() => {
    configureNotifications();
    checkPushNotificationStatus();
  }, []);

  // Verificar estado de notificaciones push
  const checkPushNotificationStatus = async () => {
    try {
      const hasPermissions = await areNotificationsEnabled();
      const token = await getStoredPushToken();
      setPushNotificationsEnabled(hasPermissions && !!token);
      setPushTokenStatus(token ? 'registered' : 'not_registered');
    } catch (error) {
      console.error('Error verificando estado de push notifications:', error);
      setPushTokenStatus('error');
    }
  };

  // Habilitar/deshabilitar notificaciones push
  const handleTogglePushNotifications = async (value) => {
    try {
      if (value) {
        // Solicitar permisos y registrar token
        const hasPermissions = await requestNotificationPermissions();
        if (hasPermissions) {
          const token = await registerForPushNotifications();
          if (token) {
            setPushNotificationsEnabled(true);
            setPushTokenStatus('registered');
            Alert.alert(
              TEXTS.SUCCESS,
              'Notificaciones push habilitadas. Recibirás alertas sobre crisis y seguimientos.',
              [{ text: TEXTS.OK }]
            );
          } else {
            setPushNotificationsEnabled(false);
            Alert.alert(
              TEXTS.ERROR,
              'No se pudo registrar el dispositivo para notificaciones push. Asegúrate de tener conexión a internet.',
              [{ text: TEXTS.OK }]
            );
          }
        } else {
          setPushNotificationsEnabled(false);
          Alert.alert(
            TEXTS.PERMISSIONS_NEEDED,
            TEXTS.PERMISSIONS_MESSAGE,
            [{ text: TEXTS.OK }]
          );
        }
      } else {
        // Deshabilitar (el token se mantiene pero no se usará)
        setPushNotificationsEnabled(false);
        Alert.alert(
          'Notificaciones deshabilitadas',
          'Las notificaciones push han sido deshabilitadas. No recibirás alertas sobre crisis.',
          [{ text: TEXTS.OK }]
        );
      }
    } catch (error) {
      console.error('Error configurando push notifications:', error);
      Alert.alert(TEXTS.ERROR, 'Error configurando notificaciones push');
    }
  };

  const configureNotifications = async () => {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  // Enviar notificación de prueba
  const sendTestNotification = useCallback(async () => {
    try {
      // Seleccionar una notificación aleatoria
      const randomIndex = Math.floor(Math.random() * notifications.length);
      const notification = notifications[randomIndex];

      // Enviar la notificación de prueba
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // null significa que se enviará inmediatamente
      });

      Alert.alert(
        TEXTS.NOTIFICATION_SENT,
        TEXTS.NOTIFICATION_SENT_MESSAGE,
        [{ text: TEXTS.OK }]
      );
    } catch (error) {
      console.log("Error al enviar notificación:", error);
      Alert.alert(TEXTS.ERROR, TEXTS.NOTIFICATION_ERROR);
    }
  }, []);

  // Función para probar notificación
  const testNotification = useCallback(async () => {
    try {
      // Verificar permisos
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          TEXTS.PERMISSIONS_NEEDED,
          TEXTS.PERMISSIONS_MESSAGE,
          [
            {
              text: TEXTS.CANCEL,
              style: "cancel"
            },
            {
              text: TEXTS.ALLOW,
              onPress: async () => {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status === 'granted') {
                  sendTestNotification();
                }
              }
            }
          ]
        );
        return;
      }

      sendTestNotification();
    } catch (error) {
      console.log("Error al verificar permisos:", error);
      Alert.alert(TEXTS.ERROR, TEXTS.PERMISSIONS_ERROR);
    }
  }, [sendTestNotification]);

  // Renderizar selector de tiempo
  const renderTimeSelector = useCallback((label, time, isMorning) => {
    const showPicker = isMorning ? showMorningPicker : showEveningPicker;
    const setShowPicker = isMorning ? setShowMorningPicker : setShowEveningPicker;
    const setTime = isMorning ? setMorningTime : setEveningTime;

    return (
      <View style={styles.timeSelectorContainer}>
        <Text style={styles.timeSelectorLabel}>{label}</Text>
        <TouchableOpacity 
          style={styles.timeSelectorButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={ACTIVE_OPACITY}
        >
          <MaterialCommunityIcons name="clock-outline" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.timeSelectorText}>
            {time.toLocaleTimeString([], TIME_FORMAT_OPTIONS)}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalPickerContent}>
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    handleTimeChange(event, date, isMorning);
                    setShowPicker(false);
                  }}
                  textColor={COLORS.WHITE}
                  themeVariant="dark"
                />
                <TouchableOpacity 
                  onPress={() => setShowPicker(false)} 
                  style={styles.modalPickerClose}
                >
                  <Text style={styles.modalPickerCloseText}>{TEXTS.CLOSE}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }, [showMorningPicker, showEveningPicker, morningTime, eveningTime, handleTimeChange]);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={TEXTS.BACK}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={ICON_SIZE} 
              color={COLORS.WHITE} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Preferencias */}
        <Text style={styles.sectionTitle}>{TEXTS.PREFERENCES}</Text>
        <View style={styles.item}>
          <MaterialCommunityIcons name="bell" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.NOTIFICATIONS}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            thumbColor={notificationsEnabled ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
            accessibilityLabel="Activar o desactivar notificaciones"
            testID="switch-notifications"
          />
        </View>

        {notificationsEnabled && (
          <>
            {renderTimeSelector(TEXTS.MORNING_NOTIFICATION, morningTime, true)}
            {renderTimeSelector(TEXTS.EVENING_NOTIFICATION, eveningTime, false)}
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveNotificationPreferences}
            >
              <MaterialCommunityIcons name="content-save" size={ICON_SIZE} color={COLORS.WHITE} />
              <Text style={styles.saveButtonText}>{TEXTS.SAVE_PREFERENCES}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Notificaciones Push */}
        <View style={styles.item}>
          <MaterialCommunityIcons name="bell-ring" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Notificaciones Push</Text>
            <Text style={styles.itemSubtext}>
              Alertas sobre crisis y seguimientos
            </Text>
          </View>
          <Switch
            value={pushNotificationsEnabled}
            onValueChange={handleTogglePushNotifications}
            thumbColor={pushNotificationsEnabled ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
            accessibilityLabel="Activar o desactivar notificaciones push"
          />
        </View>

        {pushTokenStatus && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Estado: {pushTokenStatus === 'registered' ? '✅ Registrado' : pushTokenStatus === 'not_registered' ? '⚠️ No registrado' : '❌ Error'}
            </Text>
          </View>
        )}

        {/* Botones de prueba (solo en desarrollo) */}
        {__DEV__ && pushNotificationsEnabled && (
          <View style={styles.testButtonsContainer}>
            <Text style={styles.testSectionTitle}>Pruebas (Solo Desarrollo)</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                try {
                  await api.post(ENDPOINTS.TEST_NOTIFICATION_WARNING);
                  Alert.alert('Éxito', 'Notificación WARNING de prueba enviada');
                } catch (error) {
                  Alert.alert('Error', error.message || 'Error enviando notificación de prueba');
                }
              }}
            >
              <Text style={styles.testButtonText}>Probar WARNING</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                try {
                  await api.post(ENDPOINTS.TEST_NOTIFICATION_MEDIUM);
                  Alert.alert('Éxito', 'Notificación MEDIUM de prueba enviada');
                } catch (error) {
                  Alert.alert('Error', error.message || 'Error enviando notificación de prueba');
                }
              }}
            >
              <Text style={styles.testButtonText}>Probar MEDIUM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                try {
                  await api.post(ENDPOINTS.TEST_NOTIFICATION_FOLLOWUP);
                  Alert.alert('Éxito', 'Notificación de seguimiento de prueba enviada');
                } catch (error) {
                  Alert.alert('Error', error.message || 'Error enviando notificación de prueba');
                }
              }}
            >
              <Text style={styles.testButtonText}>Probar Seguimiento</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.item}>
          <MaterialCommunityIcons name="theme-light-dark" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.DARK_MODE}</Text>
          <Switch
            value={darkMode}
            onValueChange={val => {
              setDarkMode(val);
              savePreference(STORAGE_KEYS.DARK_MODE, val);
            }}
            thumbColor={darkMode ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
            accessibilityLabel="Activar o desactivar tema oscuro"
            testID="switch-darkmode"
          />
        </View>

        <View style={styles.item}>
          <MaterialCommunityIcons name="translate" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.LANGUAGE}</Text>
          <TouchableOpacity
            onPress={() => {
              const idx = LANGUAGES.indexOf(language);
              const nextLanguage = LANGUAGES[(idx + 1) % LANGUAGES.length];
              setLanguage(nextLanguage);
              savePreference(STORAGE_KEYS.LANGUAGE, nextLanguage);
            }}
            accessibilityLabel="Cambiar idioma"
            testID="button-language"
          >
            <Text style={styles.languageText}>{language}</Text>
          </TouchableOpacity>
        </View>

        {/* Estilo de Respuesta */}
        <View style={styles.item}>
          <MaterialCommunityIcons name="format-text" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>Estilo de Respuesta</Text>
            <Text style={styles.itemSubtext}>
              Cómo prefieres que Anto responda
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              const styles = ['brief', 'balanced', 'deep'];
              const labels = {
                brief: 'Breve',
                balanced: 'Equilibrado',
                deep: 'Profundo',
              };
              const currentStyle = user?.preferences?.responseStyle || 'balanced';
              const currentIndex = styles.indexOf(currentStyle);
              const nextIndex = (currentIndex + 1) % styles.length;
              const nextStyle = styles[nextIndex];

              try {
                await updateUser(user._id, {
                  'preferences.responseStyle': nextStyle,
                });
                updateUserContext({
                  ...user,
                  preferences: {
                    ...user.preferences,
                    responseStyle: nextStyle,
                  },
                });
                Alert.alert('Éxito', `Estilo de respuesta cambiado a: ${labels[nextStyle]}`);
              } catch (error) {
                Alert.alert(TEXTS.ERROR, 'No se pudo actualizar el estilo de respuesta');
              }
            }}
            accessibilityLabel="Cambiar estilo de respuesta"
          >
            <Text style={styles.languageText}>
              {user?.preferences?.responseStyle === 'brief' ? 'Breve' :
               user?.preferences?.responseStyle === 'deep' ? 'Profundo' : 'Equilibrado'}
            </Text>
          </TouchableOpacity>
        </View>


        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('TherapeuticTechniques');
          }}
          accessibilityLabel={TEXTS.THERAPEUTIC_TECHNIQUES}
        >
          <MaterialCommunityIcons name="book-open-variant" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <View style={styles.itemContent}>
            <Text style={styles.itemText}>{TEXTS.THERAPEUTIC_TECHNIQUES}</Text>
            <Text style={styles.itemSubtext}>{TEXTS.THERAPEUTIC_TECHNIQUES_DESC}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Suscripción */}
        <Text style={styles.sectionTitle}>Suscripción</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Subscription');
          }}
          accessibilityLabel={TEXTS.SUBSCRIPTION}
        >
          <MaterialCommunityIcons name="crown" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <View style={styles.itemContent}>
            <Text style={styles.itemText}>{TEXTS.SUBSCRIPTION}</Text>
            <Text style={styles.itemSubtext}>{TEXTS.SUBSCRIPTION_DESC}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('TransactionHistory');
          }}
          accessibilityLabel={TEXTS.TRANSACTION_HISTORY}
        >
          <MaterialCommunityIcons name="receipt" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <View style={styles.itemContent}>
            <Text style={styles.itemText}>{TEXTS.TRANSACTION_HISTORY}</Text>
            <Text style={styles.itemSubtext}>{TEXTS.TRANSACTION_HISTORY_DESC}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Cuenta */}
        <Text style={styles.sectionTitle}>{TEXTS.ACCOUNT}</Text>
        <TouchableOpacity 
          style={styles.item} 
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.CHANGE_PASSWORD)}
          accessibilityLabel="Cambiar contraseña"
          testID="button-change-password"
        >
          <MaterialCommunityIcons name="lock-reset" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.CHANGE_PASSWORD}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowLogoutModal(true)}
          accessibilityLabel="Cerrar sesión"
          testID="button-logout"
        >
          <MaterialCommunityIcons name="logout" size={ICON_SIZE} color={COLORS.ERROR} />
          <Text style={[styles.itemText, { color: COLORS.ERROR }]}>{TEXTS.LOGOUT}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowDeleteModal(true)}
          accessibilityLabel="Eliminar cuenta"
          testID="button-delete-account"
        >
          <MaterialCommunityIcons name="delete" size={ICON_SIZE} color={COLORS.ERROR} />
          <Text style={[styles.itemText, { color: COLORS.ERROR }]}>{TEXTS.DELETE_ACCOUNT}</Text>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Soporte */}
        <Text style={styles.sectionTitle}>{TEXTS.SUPPORT}</Text>
        <TouchableOpacity 
          style={styles.item}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.FAQ)}
          accessibilityLabel="Preguntas frecuentes"
          testID="button-faq"
        >
          <MaterialCommunityIcons name="help-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.FAQ}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.item}
          onPress={testNotification}
          accessibilityLabel="Probar notificación"
          testID="button-test-notification"
        >
          <MaterialCommunityIcons name="bell-ring" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.TEST_NOTIFICATION}</Text>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Acerca de */}
        <Text style={styles.sectionTitle}>{TEXTS.ABOUT}</Text>
        <TouchableOpacity 
          style={styles.item}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.FAQ_ALT)}
          accessibilityLabel="Información de la aplicación"
          testID="button-about"
        >
          <MaterialCommunityIcons name="information" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>{TEXTS.APP_INFO}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Logout */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{TEXTS.LOGOUT_TITLE}</Text>
            <Text style={styles.modalText}>{TEXTS.LOGOUT_MESSAGE}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonText}>{TEXTS.CANCEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
              >
                <Text style={styles.modalButtonText}>{TEXTS.CONFIRM}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Eliminar Cuenta */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{TEXTS.DELETE_TITLE}</Text>
            <Text style={styles.modalText}>{TEXTS.DELETE_MESSAGE}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>{TEXTS.CANCEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteAccount}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.ERROR }]}>{TEXTS.DELETE}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: 'rgba(29, 43, 95, 0.5)',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.ACCENT,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.ITEM_BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.ITEM_BORDER,
  },
  itemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: COLORS.WHITE,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  itemSubtext: {
    fontSize: 12,
    color: COLORS.ACCENT,
    marginTop: 4,
    opacity: 0.7,
    color: COLORS.WHITE,
  },
  languageText: {
    color: COLORS.ACCENT,
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.ITEM_BORDER,
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.MODAL_BACKGROUND,
    borderRadius: 12,
    padding: 24,
    width: MODAL_WIDTH,
    borderWidth: 1,
    borderColor: COLORS.ITEM_BORDER,
  },
  modalTitle: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalButtonCancel: {
    backgroundColor: COLORS.MODAL_BUTTON_CANCEL,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonDelete: {
    backgroundColor: COLORS.MODAL_BUTTON_DELETE,
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
  },
  itemContent: {
    flex: 1,
    marginLeft: 16,
  },
  loadingText: {
    color: COLORS.ACCENT,
    fontSize: 14,
    marginTop: 8,
  },
  timeSelectorContainer: {
    backgroundColor: COLORS.ITEM_BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.ITEM_BORDER,
  },
  timeSelectorLabel: {
    color: COLORS.ACCENT,
    fontSize: 14,
    marginBottom: 8,
  },
  timeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.TIME_SELECTOR_BACKGROUND,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  timeSelectorText: {
    color: COLORS.WHITE,
    fontSize: 18,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  modalPickerContent: {
    backgroundColor: COLORS.TIME_SELECTOR_BACKGROUND,
    borderRadius: 12,
    padding: 16,
  },
  modalPickerClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  modalPickerCloseText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  statusContainer: {
    backgroundColor: 'rgba(163, 184, 232, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 56, // Alinear con el contenido del item
  },
  statusText: {
    color: COLORS.ACCENT,
    fontSize: 12,
    textAlign: 'left',
  },
  testButtonsContainer: {
    backgroundColor: 'rgba(163, 184, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 56,
  },
  testSectionTitle: {
    color: COLORS.ACCENT,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
