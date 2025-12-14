/**
 * Pantalla de edición de perfil de usuario
 * 
 * Permite a los usuarios editar su perfil, incluyendo nombre, email y preferencias.
 * Incluye validación de formularios, subida de imágenes a Cloudinary y manejo de cambios sin guardar.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  LOADING: 'Cargando perfil...',
  ERROR: 'Error',
  ERROR_DEFAULT: 'Ha ocurrido un error',
  ERROR_NETWORK: 'Error de conexión. Por favor, verifica tu internet.',
  ERROR_TIMEOUT: 'La solicitud ha tardado demasiado. Intenta de nuevo.',
  RETRY: 'Reintentar',
  OK: 'OK',
  VALIDATION_ERRORS: 'Errores de validación',
  SUCCESS: 'Éxito',
  PROFILE_UPDATED: 'Perfil actualizado correctamente',
  UNSAVED_CHANGES: 'Cambios sin guardar',
  UNSAVED_CHANGES_MESSAGE: '¿Deseas descartar los cambios?',
  CANCEL: 'Cancelar',
  DISCARD: 'Descartar',
  PROFILE_TITLE: 'Mi Perfil',
  BACK: 'Volver',
  SAVE_CHANGES: 'Guardar cambios',
  EDIT_PROFILE: 'Editar perfil',
  PERSONAL_INFO: 'Información Personal',
  NAME: 'Nombre',
  USERNAME: 'Nombre de Usuario',
  USERNAME_HELPER: 'El nombre de usuario no se puede cambiar',
  EMAIL: 'Correo Electrónico',
  ADD_NAME: 'Agregar nombre',
  EMAIL_PLACEHOLDER: 'Correo electrónico',
  SAVED: '¡Guardado!',
  PERMISSION_REQUIRED: 'Permiso requerido',
  SESSION_EXPIRED: 'Sesión Expirada',
  SESSION_EXPIRED_MESSAGE: 'Por favor, inicia sesión nuevamente',
  NO_SESSION: 'No se encontró la sesión del usuario',
  ERROR_LOAD_USER: 'Error al obtener datos del usuario',
  ERROR_UPDATE_PROFILE: 'Error al actualizar el perfil',
  ERROR_UPLOAD_IMAGE: 'No se pudo subir la imagen. Intenta nuevamente.',
  NAME_MIN_LENGTH: 'El nombre debe tener al menos 3 caracteres',
  EMAIL_REQUIRED: 'El correo es requerido',
  EMAIL_INVALID: 'Correo inválido',
};

// Constantes de validación
const MIN_NAME_LENGTH = 3;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const FADE_ANIMATION_DURATION = 500;
const FADE_ANIMATION_TO_VALUE = 1;
const SAVE_SUCCESS_DELAY = 2000; // ms
const CONTENT_PADDING_BOTTOM = 48;
const HEADER_PADDING_HORIZONTAL = 16;
const HEADER_PADDING_VERTICAL = 12;
const HEADER_BUTTON_SIZE = 40;
const HEADER_BUTTON_BORDER_RADIUS = 20;
const HEADER_BORDER_WIDTH = 1;
const CONTENT_PADDING = 16;
const SECTION_MARGIN_BOTTOM = 24;
const SECTION_TITLE_MARGIN_BOTTOM = 16;
const INPUT_CONTAINER_MARGIN_BOTTOM = 16;
const LABEL_MARGIN_BOTTOM = 8;
const INPUT_BORDER_RADIUS = 12;
const INPUT_PADDING_HORIZONTAL = 16;
const INPUT_PADDING_VERTICAL = 12;
const INPUT_BORDER_WIDTH = 1;
const ERROR_TEXT_MARGIN_TOP = 4;
const HELPER_TEXT_MARGIN_TOP = 4;
const OPTION_BUTTON_BORDER_RADIUS = 12;
const OPTION_BUTTON_PADDING = 16;
const OPTION_BUTTON_MARGIN_BOTTOM = 12;
const OPTION_BUTTON_BORDER_WIDTH = 1;
const OPTION_TEXT_MARGIN_LEFT = 16;
const TOGGLE_WIDTH = 50;
const TOGGLE_HEIGHT = 28;
const TOGGLE_BORDER_RADIUS = 14;
const TOGGLE_PADDING = 2;
const TOGGLE_CIRCLE_SIZE = 24;
const TOGGLE_CIRCLE_BORDER_RADIUS = 12;
const TOGGLE_CIRCLE_TRANSLATE_X = 22;
const PROFILE_HEADER_PADDING_VERTICAL = 24;
const PROFILE_NAME_MARGIN_BOTTOM = 4;
const PROFILE_USERNAME_MARGIN_BOTTOM = 16;
const INPUT_DISABLED_OPACITY = 0.7;
const DISABLED_BUTTON_OPACITY = 0.5;
const INPUT_WRAPPER_PADDING_HORIZONTAL = 12;
const LOADING_TEXT_MARGIN_TOP = 10;
const SAVE_SUCCESS_PADDING_HORIZONTAL = 18;
const SAVE_SUCCESS_PADDING_VERTICAL = 10;
const SAVE_SUCCESS_BORDER_RADIUS = 20;
const SAVE_SUCCESS_TOP = '45%';
const SAVE_SUCCESS_Z_INDEX = 10;
const SAVE_SUCCESS_SHADOW_OFFSET_Y = 2;
const SAVE_SUCCESS_SHADOW_OPACITY = 0.3;
const SAVE_SUCCESS_SHADOW_RADIUS = 6;
const SAVE_SUCCESS_ELEVATION = 6;
const SAVE_SUCCESS_TEXT_MARGIN_LEFT = 8;
const ICON_SIZE = 24;
const EMAIL_ICON_SIZE = 20;
const EMAIL_ICON_MARGIN_RIGHT = 8;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  SUCCESS: '#4CAF50',
  HEADER_BACKGROUND: 'rgba(3, 10, 36, 0.8)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  HEADER_BUTTON_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.1)',
  INPUT_BACKGROUND: '#1D2B5F',
  INPUT_DISABLED_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  TOGGLE_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  TOGGLE_ACTIVE_BACKGROUND: 'rgba(26, 221, 219, 0.3)',
  SAVE_SUCCESS_BACKGROUND: 'rgba(76, 175, 80, 0.15)',
  SAVE_SUCCESS_SHADOW: '#4CAF50',
};

// Constantes de valores por defecto
const DEFAULT_FORM_DATA = {
  name: '',
  username: '',
  email: ''
};


// Constantes de AsyncStorage
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  // Verificar sesión
  const checkSession = useCallback(async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    if (!token) {
      Alert.alert(TEXTS.SESSION_EXPIRED, TEXTS.SESSION_EXPIRED_MESSAGE);
      navigation.replace(ROUTES.SIGN_IN);
      return null;
    }
    return token;
  }, [navigation]);

  // Efecto para cargar datos del usuario
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Efecto para animación de fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: FADE_ANIMATION_TO_VALUE,
      duration: FADE_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);


  // Cargar datos del usuario
  const loadUserData = useCallback(async () => {
    try {
      const token = await checkSession();
      if (!token) {
        return;
      }

      const response = await api.get(ENDPOINTS.ME);
      const userData = response.data || response;
      
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || ''
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [checkSession, handleError]);

  // Manejar errores
  const handleError = useCallback((error) => {
    console.error('Error:', error);
    
    let errorMessage = TEXTS.ERROR_DEFAULT;
    
    if (error.message?.includes('network')) {
      errorMessage = TEXTS.ERROR_NETWORK;
    } else if (error.message?.includes('timeout')) {
      errorMessage = TEXTS.ERROR_TIMEOUT;
    } else if (error.message) {
      errorMessage = error.message;
    }

    Alert.alert(
      TEXTS.ERROR,
      errorMessage,
      [
        { 
          text: TEXTS.RETRY, 
          onPress: () => loadUserData() 
        },
        { 
          text: TEXTS.OK,
          style: 'cancel'
        }
      ]
    );
  }, [loadUserData]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (formData.name && formData.name.length < MIN_NAME_LENGTH) {
      newErrors.name = TEXTS.NAME_MIN_LENGTH;
    }

    if (!formData.email) {
      newErrors.email = TEXTS.EMAIL_REQUIRED;
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = TEXTS.EMAIL_INVALID;
    }

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        TEXTS.VALIDATION_ERRORS,
        Object.values(newErrors).join('\n'),
        [{ text: TEXTS.OK }]
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.email]);

  // Guardar cambios
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const requestData = {
        name: formData.name.trim(),
        email: formData.email.trim()
      };

      const response = await api.put(ENDPOINTS.UPDATE_PROFILE, requestData);
      const updatedUser = response.data || response;
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      Alert.alert(
        TEXTS.SUCCESS,
        TEXTS.PROFILE_UPDATED,
        [{ text: TEXTS.OK, onPress: () => setEditing(false) }]
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), SAVE_SUCCESS_DELAY);
      setHasChanges(false);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error al guardar:', error);
      handleError(error);
    } finally {
      setSaving(false);
    }
  }, [validateForm, formData, handleError]);

  // Cambiar valor del formulario
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setHasChanges(true);
      return newData;
    });
  }, []);

  // Efecto para prevenir navegación con cambios sin guardar
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return;

      e.preventDefault();
      Alert.alert(
        TEXTS.UNSAVED_CHANGES,
        TEXTS.UNSAVED_CHANGES_MESSAGE,
        [
          { text: TEXTS.CANCEL, style: 'cancel', onPress: () => {} },
          {
            text: TEXTS.DISCARD,
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [hasChanges, navigation]);




  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
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
          <Text style={styles.headerTitle}>{TEXTS.PROFILE_TITLE}</Text>
          {editing ? (
            <TouchableOpacity 
              style={[styles.headerButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
              accessibilityLabel={TEXTS.SAVE_CHANGES}
            >
              <MaterialCommunityIcons 
                name="content-save" 
                size={ICON_SIZE} 
                color={saving ? COLORS.ACCENT : COLORS.PRIMARY} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setEditing(true)}
              accessibilityLabel={TEXTS.EDIT_PROFILE}
            >
              <MaterialCommunityIcons 
                name="pencil" 
                size={ICON_SIZE} 
                color={COLORS.PRIMARY} 
              />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, paddingBottom: CONTENT_PADDING_BOTTOM }]}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileName}>{formData.name || ""}</Text>
            <Text style={styles.profileUsername}>@{formData.username}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.PERSONAL_INFO}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{TEXTS.NAME}</Text>
              <TextInput
                style={[
                  styles.input,
                  !editing && styles.inputDisabled
                ]}
                value={formData.name}
                onChangeText={(text) => handleFormChange('name', text)}
                editable={editing}
                placeholder={TEXTS.ADD_NAME}
                placeholderTextColor={COLORS.ACCENT}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{TEXTS.USERNAME}</Text>
              <TextInput
                style={[styles.input, { color: COLORS.ACCENT }]}
                value={formData.username}
                editable={false}
              />
              <Text style={styles.helperText}>
                {TEXTS.USERNAME_HELPER}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{TEXTS.EMAIL}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons 
                  name="email" 
                  size={EMAIL_ICON_SIZE} 
                  color={COLORS.ACCENT} 
                  style={{ marginRight: EMAIL_ICON_MARGIN_RIGHT }} 
                />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={(text) => handleFormChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={editing}
                  placeholder={TEXTS.EMAIL_PLACEHOLDER}
                  placeholderTextColor={COLORS.ACCENT}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
          </View>

        </Animated.View>

        {saveSuccess && (
          <View style={styles.saveSuccessIndicator}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={ICON_SIZE} 
              color={COLORS.SUCCESS} 
            />
            <Text style={styles.saveSuccessText}>{TEXTS.SAVED}</Text>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  background: {
    flex: 1,
  },
  imageStyle: {
    opacity: BACKGROUND_OPACITY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    color: COLORS.ACCENT,
    fontSize: 18,
    marginTop: LOADING_TEXT_MARGIN_TOP,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: HEADER_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: HEADER_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.HEADER_BUTTON_BACKGROUND,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
  section: {
    marginBottom: SECTION_MARGIN_BOTTOM,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
  },
  inputContainer: {
    marginBottom: INPUT_CONTAINER_MARGIN_BOTTOM,
  },
  label: {
    fontSize: 14,
    color: COLORS.ACCENT,
    marginBottom: LABEL_MARGIN_BOTTOM,
  },
  input: {
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    paddingVertical: INPUT_PADDING_VERTICAL,
    fontSize: 16,
    color: COLORS.WHITE,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 12,
    marginTop: ERROR_TEXT_MARGIN_TOP,
  },
  helperText: {
    color: COLORS.ACCENT,
    fontSize: 12,
    marginTop: HELPER_TEXT_MARGIN_TOP,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: OPTION_BUTTON_BORDER_RADIUS,
    padding: OPTION_BUTTON_PADDING,
    marginBottom: OPTION_BUTTON_MARGIN_BOTTOM,
    borderWidth: OPTION_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: OPTION_TEXT_MARGIN_LEFT,
    fontSize: 16,
    color: COLORS.WHITE,
  },
  toggle: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_BORDER_RADIUS,
    backgroundColor: COLORS.TOGGLE_BACKGROUND,
    padding: TOGGLE_PADDING,
  },
  toggleActive: {
    backgroundColor: COLORS.TOGGLE_ACTIVE_BACKGROUND,
  },
  toggleCircle: {
    width: TOGGLE_CIRCLE_SIZE,
    height: TOGGLE_CIRCLE_SIZE,
    borderRadius: TOGGLE_CIRCLE_BORDER_RADIUS,
    backgroundColor: COLORS.ACCENT,
  },
  toggleCircleActive: {
    backgroundColor: COLORS.PRIMARY,
    transform: [{ translateX: TOGGLE_CIRCLE_TRANSLATE_X }],
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: PROFILE_HEADER_PADDING_VERTICAL,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: PROFILE_NAME_MARGIN_BOTTOM,
  },
  profileUsername: {
    fontSize: 16,
    color: COLORS.ACCENT,
    marginBottom: PROFILE_USERNAME_MARGIN_BOTTOM,
  },
  inputDisabled: {
    opacity: INPUT_DISABLED_OPACITY,
    backgroundColor: COLORS.INPUT_DISABLED_BACKGROUND,
  },
  disabledButton: {
    opacity: DISABLED_BUTTON_OPACITY,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  saveSuccessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SAVE_SUCCESS_BACKGROUND,
    paddingHorizontal: SAVE_SUCCESS_PADDING_HORIZONTAL,
    paddingVertical: SAVE_SUCCESS_PADDING_VERTICAL,
    borderRadius: SAVE_SUCCESS_BORDER_RADIUS,
    position: 'absolute',
    top: SAVE_SUCCESS_TOP,
    alignSelf: 'center',
    zIndex: SAVE_SUCCESS_Z_INDEX,
    shadowColor: COLORS.SAVE_SUCCESS_SHADOW,
    shadowOffset: { width: 0, height: SAVE_SUCCESS_SHADOW_OFFSET_Y },
    shadowOpacity: SAVE_SUCCESS_SHADOW_OPACITY,
    shadowRadius: SAVE_SUCCESS_SHADOW_RADIUS,
    elevation: SAVE_SUCCESS_ELEVATION,
  },
  saveSuccessText: {
    color: COLORS.SUCCESS,
    marginLeft: SAVE_SUCCESS_TEXT_MARGIN_LEFT,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
