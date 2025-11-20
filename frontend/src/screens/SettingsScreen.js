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
import EmergencyContactsModal from '../components/EmergencyContactsModal';
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

// Constantes de textos
const TEXTS = {
  TITLE: 'Configuración',
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
  EMERGENCY_CONTACTS: 'Contactos de Emergencia',
  EMERGENCY_CONTACTS_DESC: 'Gestiona los contactos que recibirán alertas en situaciones de riesgo',
  NO_CONTACTS: 'No hay contactos configurados',
  EDIT_CONTACTS: 'Editar contactos',
  DELETE_CONTACT: 'Eliminar contacto',
  DELETE_CONTACT_CONFIRM: '¿Estás seguro de que deseas eliminar este contacto?',
  CONTACT_DELETED: 'Contacto eliminado exitosamente',
  CONTACT_DELETE_ERROR: 'Error al eliminar contacto',
  TOGGLE_CONTACT: 'Habilitar/Deshabilitar contacto',
  TEST_CONTACT: 'Probar contacto',
  TEST_ALERT: 'Probar alerta de emergencia',
  TEST_ALERT_CONFIRM: '¿Estás seguro de que deseas enviar una alerta de prueba a todos tus contactos de emergencia?',
  TEST_ALERT_SENT: 'Alerta de prueba enviada exitosamente',
  TEST_ALERT_ERROR: 'Error al enviar alerta de prueba',
  TEST_EMAIL_SENT: 'Email de prueba enviado exitosamente',
  TEST_EMAIL_ERROR: 'Error al enviar email de prueba',
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
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showEmergencyContactsModal, setShowEmergencyContactsModal] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

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

  // Cargar contactos de emergencia
  const loadEmergencyContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      console.log('[Settings] Cargando contactos de emergencia...');
      const response = await api.get(ENDPOINTS.EMERGENCY_CONTACTS);
      console.log('[Settings] Respuesta de contactos:', response);
      console.log('[Settings] Contactos recibidos:', response.contacts);
      setEmergencyContacts(response.contacts || []);
      console.log('[Settings] Contactos establecidos:', response.contacts || []);
    } catch (error) {
      console.error('[Settings] Error cargando contactos de emergencia:', error);
      setEmergencyContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Cargar contactos al montar el componente
  useEffect(() => {
    loadEmergencyContacts();
  }, [loadEmergencyContacts]);

  // Eliminar contacto
  const handleDeleteContact = useCallback(async (contactId) => {
    Alert.alert(
      TEXTS.DELETE_CONTACT,
      TEXTS.DELETE_CONTACT_CONFIRM,
      [
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
          }
        }
      ]
    );
  }, [loadEmergencyContacts]);

  // Toggle contacto (habilitar/deshabilitar)
  const handleToggleContact = useCallback(async (contactId) => {
    try {
      await api.patch(ENDPOINTS.EMERGENCY_CONTACT_TOGGLE(contactId));
      await loadEmergencyContacts();
    } catch (error) {
      console.error('Error cambiando estado del contacto:', error);
      Alert.alert(TEXTS.ERROR, 'No se pudo cambiar el estado del contacto');
    }
  }, [loadEmergencyContacts]);

  // Manejar guardado de contactos
  const handleEmergencyContactsSaved = useCallback(async () => {
    await loadEmergencyContacts();
  }, [loadEmergencyContacts]);

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
  }, []);

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
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
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

        {/* Separador */}
        <View style={styles.separator} />

        {/* Contactos de Emergencia */}
        <Text style={styles.sectionTitle}>{TEXTS.EMERGENCY_CONTACTS}</Text>
        <View style={styles.item}>
          <MaterialCommunityIcons name="alert-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <View style={styles.itemContent}>
            <Text style={styles.itemText}>{TEXTS.EMERGENCY_CONTACTS_DESC}</Text>
            {loadingContacts ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : emergencyContacts.length === 0 ? (
              <Text style={styles.emptyText}>{TEXTS.NO_CONTACTS}</Text>
            ) : (
              <View style={styles.contactsList}>
                {emergencyContacts.map((contact) => (
                  <View key={contact._id} style={styles.contactItem}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>
                        {contact.name} {!contact.enabled && '(Deshabilitado)'}
                      </Text>
                      <Text style={styles.contactEmail}>{contact.email}</Text>
                      {contact.phone && (
                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                      )}
                      {contact.relationship && (
                        <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                      )}
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            const response = await api.post(ENDPOINTS.EMERGENCY_CONTACT_TEST(contact._id));
                            if (response.testEmailSent) {
                              Alert.alert(TEXTS.SUCCESS, TEXTS.TEST_EMAIL_SENT);
                            } else {
                              Alert.alert(
                                'Aviso',
                                response.message || 'No se pudo enviar el email de prueba. Verifica la configuración del servidor de email.'
                              );
                            }
                          } catch (error) {
                            console.error('Error enviando email de prueba:', error);
                            Alert.alert(
                              'Aviso',
                              error.response?.data?.message || TEXTS.TEST_EMAIL_ERROR
                            );
                          }
                        }}
                        style={styles.contactActionButton}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color={COLORS.PRIMARY}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleToggleContact(contact._id)}
                        style={styles.contactActionButton}
                      >
                        <MaterialCommunityIcons
                          name={contact.enabled ? "bell-off" : "bell"}
                          size={20}
                          color={contact.enabled ? COLORS.ACCENT : COLORS.PRIMARY}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteContact(contact._id)}
                        style={styles.contactActionButton}
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color={COLORS.ERROR}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowEmergencyContactsModal(true)}
          accessibilityLabel={TEXTS.EDIT_CONTACTS}
        >
          <MaterialCommunityIcons name="plus-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.itemText}>
            {emergencyContacts.length === 0 ? 'Agregar Contactos' : TEXTS.EDIT_CONTACTS}
          </Text>
        </TouchableOpacity>
        
        {emergencyContacts.length > 0 && (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              Alert.alert(
                TEXTS.TEST_ALERT,
                TEXTS.TEST_ALERT_CONFIRM,
                [
                  { text: TEXTS.CANCEL, style: 'cancel' },
                  {
                    text: 'Enviar Prueba',
                    onPress: async () => {
                      try {
                        const response = await api.post(ENDPOINTS.EMERGENCY_CONTACTS_TEST_ALERT);
                        Alert.alert(
                          TEXTS.SUCCESS,
                          `${TEXTS.TEST_ALERT_SENT}\n\n${response.message || ''}`
                        );
                      } catch (error) {
                        console.error('Error enviando alerta de prueba:', error);
                        Alert.alert(TEXTS.ERROR, TEXTS.TEST_ALERT_ERROR);
                      }
                    }
                  }
                ]
              );
            }}
            accessibilityLabel={TEXTS.TEST_ALERT}
          >
            <MaterialCommunityIcons name="alert-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
            <Text style={styles.itemText}>{TEXTS.TEST_ALERT}</Text>
          </TouchableOpacity>
        )}

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

      {/* Modal de Contactos de Emergencia */}
      <EmergencyContactsModal
        visible={showEmergencyContactsModal}
        onClose={() => setShowEmergencyContactsModal(false)}
        onSave={handleEmergencyContactsSaved}
        existingContacts={emergencyContacts}
      />
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
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
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
  emptyText: {
    color: COLORS.ACCENT,
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  contactsList: {
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(163, 184, 232, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.2)',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactEmail: {
    color: COLORS.ACCENT,
    fontSize: 14,
    marginBottom: 2,
  },
  contactPhone: {
    color: COLORS.ACCENT,
    fontSize: 12,
    marginBottom: 2,
  },
  contactRelationship: {
    color: COLORS.ACCENT,
    fontSize: 12,
    fontStyle: 'italic',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionButton: {
    padding: 4,
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
});

export default SettingsScreen;
