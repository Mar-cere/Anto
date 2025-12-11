/**
 * Pantalla de registro de usuario
 * 
 * Permite a los usuarios crear una nueva cuenta con nombre, username,
 * email y contraseña. Incluye validación en tiempo real, animaciones
 * y manejo de errores.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ParticleBackground from '../components/ParticleBackground';
import { api, ENDPOINTS } from '../config/api';
import {
  ANIMATION_DELAYS,
  ANIMATION_DURATIONS,
  ANIMATION_SCALES,
  ANIMATION_VALUES,
} from '../constants/animations';
import { ROUTES } from '../constants/routes';
import { REGISTER as TEXTS } from '../constants/translations';
import { OPACITIES, SCALES, STATUS_BAR } from '../constants/ui';
import { VALIDATION_LENGTHS, VALIDATION_REGEX } from '../constants/validation';
import { colors, globalStyles } from '../styles/globalStyles';
import { checkServerStatus } from '../utils/networkUtils';

// Constantes de animación (usando constantes compartidas)
const ANIMATION_INITIAL_DELAY = ANIMATION_DELAYS.LONG;
const ANIMATION_DURATION = ANIMATION_DURATIONS.SLOW;
const INITIAL_TRANSLATE_Y = ANIMATION_VALUES.INITIAL_TRANSLATE_Y;
const INITIAL_OPACITY = ANIMATION_VALUES.INITIAL_OPACITY;
const FINAL_OPACITY = ANIMATION_VALUES.FINAL_OPACITY;
const FINAL_TRANSLATE_Y = ANIMATION_VALUES.FINAL_TRANSLATE_Y;
const BUTTON_PRESS_SCALE = ANIMATION_SCALES.BUTTON_PRESS;

// Constantes de validación (usando constantes compartidas)
const MIN_NAME_LENGTH = VALIDATION_LENGTHS.NAME_MIN;
const MAX_NAME_LENGTH = VALIDATION_LENGTHS.NAME_MAX;
const MIN_USERNAME_LENGTH = VALIDATION_LENGTHS.USERNAME_MIN;
const MAX_USERNAME_LENGTH = VALIDATION_LENGTHS.USERNAME_MAX;
const MIN_PASSWORD_LENGTH = VALIDATION_LENGTHS.PASSWORD_MIN;
const EMAIL_REGEX = VALIDATION_REGEX.EMAIL;
const USERNAME_REGEX = VALIDATION_REGEX.USERNAME;

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  SAVED_EMAIL: 'savedEmail'
};

// Constantes de mensajes de error (usando traducciones)
const ERROR_MESSAGES = TEXTS.ERRORS;

// Constantes de estilos específicas de esta pantalla
const IMAGE_OPACITY = OPACITIES.IMAGE_BACKGROUND;
const HORIZONTAL_PADDING = 20;
const VERTICAL_PADDING = 40;
const TITLE_MARGIN_TOP = 60;
const TITLE_MARGIN_BOTTOM = 10;
const SUBTITLE_MARGIN_BOTTOM = 30;
const LOADING_SCALE = SCALES.LOADING;
const STATUS_BAR_STYLE = STATUS_BAR.STYLE;
const STATUS_BAR_BACKGROUND = colors.background;
const CHECKBOX_SIZE = 20;
const CHECKBOX_BORDER_WIDTH = 2;
const CHECKBOX_BORDER_RADIUS = 4;
const CHECKBOX_MARGIN_RIGHT = 10;
const CHECKBOX_ICON_SIZE = 16;
const EYE_ICON_SIZE = 24;
const BUTTON_ICON_SIZE = 22;
const BUTTON_ICON_MARGIN = 8;
const ACTIVE_OPACITY = OPACITIES.HOVER;
const BUTTON_ACTIVE_OPACITY = 0.85;

// Constantes de servidor
const SERVER_CHECK_TIMEOUT = 3; // segundos

// Helper: validar email
const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

// Helper: validar campo individual
const validateField = (field, value, formData = {}) => {
  switch (field) {
    case 'name':
      if (value && value.trim()) {
        if (value.length < MIN_NAME_LENGTH) return ERROR_MESSAGES.NAME_MIN;
        if (value.length > MAX_NAME_LENGTH) return ERROR_MESSAGES.NAME_MAX;
      }
      return '';
    case 'username':
      if (!value.trim()) return ERROR_MESSAGES.USERNAME_REQUIRED;
      if (value.length < MIN_USERNAME_LENGTH) return ERROR_MESSAGES.USERNAME_MIN_SHORT;
      if (value.length > MAX_USERNAME_LENGTH) return ERROR_MESSAGES.USERNAME_MAX_SHORT;
      return '';
    case 'email':
      if (!value.trim()) return ERROR_MESSAGES.EMAIL_REQUIRED;
      if (!validateEmail(value)) return ERROR_MESSAGES.EMAIL_INVALID;
      return '';
    case 'password':
      if (!value) return ERROR_MESSAGES.PASSWORD_REQUIRED;
      if (value.length < MIN_PASSWORD_LENGTH) return ERROR_MESSAGES.PASSWORD_MIN;
      // Validar confirmPassword si existe
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        return '';
      }
      return '';
    case 'confirmPassword':
      if (!value) return ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
      if (formData.password && value !== formData.password) return ERROR_MESSAGES.PASSWORDS_MISMATCH;
      return '';
    default:
      return '';
  }
};

// Helper: obtener mensaje de error según tipo
const getErrorMessage = (error) => {
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('Network request failed')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (errorMessage.includes('already exists') || errorMessage.includes('ya está en uso')) {
    return ERROR_MESSAGES.ALREADY_EXISTS;
  }
  if (errorMessage.includes('Datos inválidos')) {
    return ERROR_MESSAGES.INVALID_DATA;
  }
  if (errorMessage.includes('Demasiados intentos')) {
    return ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return ERROR_MESSAGES.GENERIC_ERROR;
};

// Helper: guardar datos de autenticación
const saveAuthData = async (tokens, user, email) => {
  const itemsToSave = [
    [STORAGE_KEYS.USER_TOKEN, tokens.accessToken || tokens.token],
    [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
    [STORAGE_KEYS.SAVED_EMAIL, email]
  ];
  
  if (tokens.refreshToken) {
    itemsToSave.push([STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken]);
  }
  
  await Promise.all(
    itemsToSave.map(([key, value]) => AsyncStorage.setItem(key, value))
  );
};

const RegisterScreen = ({ navigation }) => {
  // Estado de red
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;
  // Referencias para animaciones
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(INITIAL_OPACITY)).current;
  const translateYAnim = useRef(new Animated.Value(INITIAL_TRANSLATE_Y)).current;

  // Estados
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isTermsAccepted, setTermsAccepted] = useState(false);
  const [isNameInfoModalVisible, setNameInfoModalVisible] = useState(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Efecto de entrada con animación
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: FINAL_OPACITY,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: FINAL_TRANSLATE_Y,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }, ANIMATION_INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateYAnim]);

  // Manejo de cambios en los inputs con validación en tiempo real
  const handleInputChange = (field, value) => {
    // Normalizar valores según el campo
    if (field === 'email') {
      value = value.toLowerCase().trim();
    } else if (field === 'username') {
      value = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);

    // Validación en tiempo real
    const error = validateField(field, value, updatedFormData);
    const updatedErrors = { ...errors };
    
    if (error) {
      updatedErrors[field] = error;
    } else {
      delete updatedErrors[field];
    }
    
    // Validar confirmPassword cuando cambia password
    if (field === 'password' && updatedFormData.confirmPassword) {
      const confirmError = validateField('confirmPassword', updatedFormData.confirmPassword, updatedFormData);
      if (confirmError) {
        updatedErrors.confirmPassword = confirmError;
      } else {
        delete updatedErrors.confirmPassword;
      }
    }
    
    // Validar password cuando cambia confirmPassword
    if (field === 'confirmPassword' && updatedFormData.password) {
      const passwordError = validateField('password', updatedFormData.password, updatedFormData);
      if (passwordError) {
        updatedErrors.password = passwordError;
      } else {
        delete updatedErrors.password;
      }
    }

    setErrors(updatedErrors);
  };

  // Validación completa del formulario
  const validateForm = () => {
    const newErrors = {
      name: validateField('name', formData.name, formData),
      username: validateField('username', formData.username, formData),
      email: validateField('email', formData.email, formData),
      password: validateField('password', formData.password, formData),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData)
    };
    
    // Eliminar errores vacíos
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    // Validar términos
    if (!isTermsAccepted) {
      newErrors.terms = ERROR_MESSAGES.TERMS_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo de animación al presionar
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_PRESS_SCALE,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Manejo del registro
  const handleRegister = async () => {
    try {
      if (!validateForm()) return;

      setIsSubmitting(true);
      setIsLoading(true);

      // Verificar si está offline antes de intentar registro
      if (isOffline) {
        Alert.alert(
          'Sin conexión',
          'No hay conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.',
          [{ text: 'Entendido' }]
        );
        setIsSubmitting(false);
        setIsLoading(false);
        return;
      }

      // Verificar conexión con el servidor
      const isServerAvailable = await checkServerStatus(SERVER_CHECK_TIMEOUT);
      if (!isServerAvailable) {
        Alert.alert('Error de conexión', ERROR_MESSAGES.SERVER_ERROR, [{ text: 'Entendido' }]);
        setIsSubmitting(false);
        setIsLoading(false);
        return;
      }

      const userData = {
        email: formData.email.toLowerCase().trim(),
        username: formData.username.toLowerCase().trim(),
        password: formData.password,
        ...(formData.name && formData.name.trim() ? { name: formData.name.trim() } : {})
      };

      const response = await api.post(ENDPOINTS.REGISTER, userData);

      // Verificar si la respuesta tiene los tokens esperados
      if ((response.accessToken || response.token) && response.user) {
        await saveAuthData(
          { accessToken: response.accessToken, token: response.token, refreshToken: response.refreshToken },
          response.user,
          formData.email
        );

        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.DASHBOARD }],
        });
      } else {
        throw new Error(ERROR_MESSAGES.NO_TOKEN);
      }

    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = getErrorMessage(error);
      
      Alert.alert(
        TEXTS.ERROR_TITLE,
        errorMessage,
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
      
      {/* Offline Banner */}
      <OfflineBanner />
      
      <ImageBackground 
        source={require('../images/back.png')} 
        style={styles.background} 
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />

        {isLoading ? (
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={styles.loadingIndicator} 
          />
        ) : (
          <Animated.View 
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }] 
              }
            ]}
          >
            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>

            {/* Campo de Nombre (Opcional) */}
            <View style={globalStyles.inputWrapper}>
              <View style={[
                globalStyles.inputContainer, 
                errors.name && globalStyles.inputError
              ]}>
                <Ionicons name="person" size={20} color={colors.primary} style={globalStyles.inputIcon} />
                <TextInput
                  style={globalStyles.input}
                  placeholder={TEXTS.NAME_PLACEHOLDER}
                  placeholderTextColor={colors.accent}
                  autoCapitalize="words"
                  onChangeText={(text) => handleInputChange('name', text)}
                  value={formData.name}
                  accessibilityLabel={TEXTS.NAME_PLACEHOLDER}
                />
              </View>
              {errors.name ? <Text style={globalStyles.errorText}>{errors.name}</Text> : null}
              
              {/* Link de información sobre nombre real */}
              <TouchableOpacity 
                onPress={() => setNameInfoModalVisible(true)}
                style={styles.nameInfoLink}
                activeOpacity={ACTIVE_OPACITY}
              >
                <Ionicons 
                  name="information-circle-outline" 
                  size={16} 
                  color={colors.primary}
                />
                <Text style={styles.nameInfoLinkText}>{TEXTS.NAME_INFO_LINK}</Text>
              </TouchableOpacity>
            </View>

            {/* Campo de Username */}
            <View style={globalStyles.inputWrapper}>
              <View style={[
                globalStyles.inputContainer, 
                errors.username && globalStyles.inputError
              ]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
                <TextInput
                  style={globalStyles.input}
                  placeholder={TEXTS.USERNAME_PLACEHOLDER}
                  placeholderTextColor={colors.accent}
                  autoCapitalize="none"
                  onChangeText={(text) => handleInputChange('username', text)}
                  value={formData.username}
                  accessibilityLabel={TEXTS.USERNAME_PLACEHOLDER}
                />
              </View>
              {errors.username ? <Text style={globalStyles.errorText}>{errors.username}</Text> : null}
            </View>

            {/* Campo de Correo */}
            <View style={globalStyles.inputWrapper}>
              <View style={[
                globalStyles.inputContainer, 
                errors.email && globalStyles.inputError
              ]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
                <TextInput
                  style={globalStyles.input}
                  placeholder={TEXTS.EMAIL_PLACEHOLDER}
                  placeholderTextColor={colors.accent}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text) => handleInputChange('email', text)}
                  value={formData.email}
                  accessibilityLabel={TEXTS.EMAIL_PLACEHOLDER}
                />
              </View>
              {errors.email ? <Text style={globalStyles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Campo de Contraseña */}
            <View style={globalStyles.inputWrapper}>
              <View style={[
                globalStyles.inputContainer, 
                errors.password && globalStyles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
                <TextInput
                  style={globalStyles.input}
                  placeholder={TEXTS.PASSWORD_PLACEHOLDER}
                  placeholderTextColor={colors.accent}
                  secureTextEntry={!isPasswordVisible}
                  onChangeText={(text) => handleInputChange('password', text)}
                  value={formData.password}
                  accessibilityLabel={TEXTS.PASSWORD_PLACEHOLDER}
                />
                <TouchableOpacity 
                  onPress={() => setPasswordVisible(!isPasswordVisible)}
                  style={globalStyles.inputIcon}
                >
                  <Ionicons 
                    name={isPasswordVisible ? "eye-off" : "eye"} 
                    size={EYE_ICON_SIZE} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={globalStyles.errorText}>{errors.password}</Text> : null}
            </View>
            
            {/* Confirmación de Contraseña */}
            <View style={globalStyles.inputWrapper}>
              <View style={[
                globalStyles.inputContainer, 
                errors.confirmPassword && globalStyles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
                <TextInput 
                  style={globalStyles.input} 
                  placeholder={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER} 
                  placeholderTextColor={colors.accent}
                  secureTextEntry={!isConfirmPasswordVisible}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)} 
                  value={formData.confirmPassword} 
                  accessibilityLabel={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
                />
                <TouchableOpacity 
                  onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  style={globalStyles.inputIcon}
                >
                  <Ionicons 
                    name={isConfirmPasswordVisible ? "eye-off" : "eye"} 
                    size={EYE_ICON_SIZE} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={globalStyles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>
            
            {/* Términos y condiciones */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setTermsAccepted(!isTermsAccepted)}
              activeOpacity={ACTIVE_OPACITY}
            >
              <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked]}>
                {isTermsAccepted && (
                  <Ionicons 
                    name="checkmark" 
                    size={CHECKBOX_ICON_SIZE} 
                    color={colors.white} 
                  />
                )}
              </View>
              <Text style={styles.termsText}>
                {TEXTS.TERMS_TEXT}
                <Text 
                  style={styles.termsLink} 
                  onPress={() => setTermsModalVisible(true)}
                >
                  {TEXTS.TERMS_LINK}
                </Text>.
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={globalStyles.errorText}>{errors.terms}</Text>}

            {/* Botón de registro */}
            <TouchableOpacity
              style={[globalStyles.modernButton, isSubmitting && globalStyles.disabledButton]}
              onPress={handleRegister}
              disabled={isSubmitting || isOffline}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              accessibilityLabel={TEXTS.REGISTER_BUTTON}
              testID="registerButton"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons 
                    name="person-add-outline" 
                    size={BUTTON_ICON_SIZE} 
                    color={colors.white} 
                    style={{ marginRight: BUTTON_ICON_MARGIN }} 
                  />
                  <Text style={globalStyles.buttonText}>{TEXTS.REGISTER_BUTTON}</Text>
                </>
              )}
            </TouchableOpacity>
            
            {/* Link a inicio de sesión */}
            <TouchableOpacity 
              onPress={() => navigation.navigate(ROUTES.SIGN_IN)} 
              style={styles.linkContainer}
              activeOpacity={ACTIVE_OPACITY}
            >
              <Text style={styles.linkText}>{TEXTS.SIGN_IN_LINK}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ImageBackground>

      {/* Modal de información sobre nombre real */}
      <Modal
        visible={isNameInfoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNameInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{TEXTS.NAME_INFO_MODAL_TITLE}</Text>
              <TouchableOpacity
                onPress={() => setNameInfoModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={ACTIVE_OPACITY}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalMessage}>{TEXTS.NAME_INFO_MODAL_MESSAGE}</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setNameInfoModalVisible(false)}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
            >
              <Text style={styles.modalButtonText}>{TEXTS.MODAL_CLOSE}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de términos y condiciones */}
      <Modal
        visible={isTermsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{TEXTS.TERMS_ALERT_TITLE}</Text>
              <TouchableOpacity
                onPress={() => setTermsModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={ACTIVE_OPACITY}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.modalMessage}>{TEXTS.TERMS_ALERT_MESSAGE}</Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setTermsModalVisible(false)}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
            >
              <Text style={styles.modalButtonText}>{TEXTS.MODAL_CLOSE}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    opacity: IMAGE_OPACITY,
    resizeMode: 'cover',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: VERTICAL_PADDING,
  },
  title: {
    fontSize: 34, 
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: TITLE_MARGIN_BOTTOM, 
    marginTop: TITLE_MARGIN_TOP,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 20, 
    color: '#A3B8E8',
    marginBottom: SUBTITLE_MARGIN_BOTTOM, 
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 5,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: CHECKBOX_BORDER_WIDTH,
    borderColor: colors.primary,
    borderRadius: CHECKBOX_BORDER_RADIUS,
    marginRight: CHECKBOX_MARGIN_RIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  termsText: {
    color: '#A3B8E8',
    fontSize: 16,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 16, 
    color: colors.primary,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    transform: [{ scale: LOADING_SCALE }],
  },
  nameInfoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginLeft: 5,
  },
  nameInfoLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    alignSelf: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalMessage: {
    fontSize: 16,
    color: '#A3B8E8',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left',
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;