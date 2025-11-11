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
import { ROUTES } from '../constants/routes';
import { colors, globalStyles } from '../styles/globalStyles';
import { checkServerStatus } from '../utils/networkUtils';

// Constantes de animación
const ANIMATION_INITIAL_DELAY = 500; // ms
const ANIMATION_DURATION = 800; // ms
const INITIAL_TRANSLATE_Y = 30;
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const FINAL_TRANSLATE_Y = 0;
const BUTTON_PRESS_SCALE = 0.95;

// Constantes de validación
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9_]+$/;

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  SAVED_EMAIL: 'savedEmail'
};

// Constantes de mensajes de error
const ERROR_MESSAGES = {
  NAME_MIN: 'El nombre debe tener al menos 2 caracteres',
  NAME_MAX: 'El nombre debe tener máximo 50 caracteres',
  USERNAME_REQUIRED: 'El nombre de usuario es obligatorio',
  USERNAME_MIN: 'El nombre de usuario debe tener al menos 3 caracteres',
  USERNAME_MAX: 'El nombre de usuario debe tener máximo 20 caracteres',
  USERNAME_MIN_SHORT: 'Mínimo 3 caracteres',
  USERNAME_MAX_SHORT: 'Máximo 20 caracteres',
  EMAIL_REQUIRED: 'El correo es obligatorio',
  EMAIL_INVALID: 'Introduce un correo válido',
  PASSWORD_REQUIRED: 'La contraseña es obligatoria',
  PASSWORD_MIN: 'La contraseña debe tener al menos 8 caracteres',
  CONFIRM_PASSWORD_REQUIRED: 'Debes confirmar la contraseña',
  PASSWORDS_MISMATCH: 'Las contraseñas no coinciden',
  TERMS_REQUIRED: 'Debes aceptar los términos y condiciones',
  CONNECTION_ERROR: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.',
  SERVER_ERROR: 'No se pudo establecer conexión con el servidor. Por favor:\n\n1. Verifica tu conexión a internet\n2. Espera unos minutos y vuelve a intentar\n3. Si el problema persiste, contacta al soporte',
  NETWORK_ERROR: 'Error de conexión. Por favor:\n\n1. Verifica tu conexión a internet\n2. Intenta nuevamente en unos momentos\n3. Si el problema persiste, contacta al soporte',
  ALREADY_EXISTS: 'El email o nombre de usuario ya está registrado',
  INVALID_DATA: 'Por favor, verifica que todos los campos sean correctos',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos de registro. Por favor, espera un momento',
  NO_TOKEN: 'No se recibió token de autenticación',
  GENERIC_ERROR: 'Ocurrió un error durante el registro'
};

// Constantes de textos
const TEXTS = {
  TITLE: 'Crear Cuenta',
  SUBTITLE: 'Por favor, llena los campos para registrarte.',
  NAME_PLACEHOLDER: 'Nombre completo (opcional)',
  USERNAME_PLACEHOLDER: 'Nombre de usuario',
  EMAIL_PLACEHOLDER: 'Correo Electrónico',
  PASSWORD_PLACEHOLDER: 'Contraseña',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Confirma tu Contraseña',
  TERMS_TEXT: 'Acepto los ',
  TERMS_LINK: 'términos y condiciones',
  TERMS_ALERT_TITLE: 'Términos y Condiciones',
  TERMS_ALERT_MESSAGE: 'Aquí irían los términos y condiciones de la aplicación.',
  REGISTER_BUTTON: 'Registrarse',
  SIGN_IN_LINK: '¿Ya tienes una cuenta? Inicia Sesión',
  ERROR_TITLE: 'Error en el registro'
};

// Constantes de estilos
const IMAGE_OPACITY = 0.1;
const HORIZONTAL_PADDING = 20;
const VERTICAL_PADDING = 40;
const TITLE_MARGIN_TOP = 60;
const TITLE_MARGIN_BOTTOM = 10;
const SUBTITLE_MARGIN_BOTTOM = 30;
const LOADING_SCALE = 1.5;
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = colors.background;
const CHECKBOX_SIZE = 20;
const CHECKBOX_BORDER_WIDTH = 2;
const CHECKBOX_BORDER_RADIUS = 4;
const CHECKBOX_MARGIN_RIGHT = 10;
const CHECKBOX_ICON_SIZE = 16;
const EYE_ICON_SIZE = 24;
const BUTTON_ICON_SIZE = 22;
const BUTTON_ICON_MARGIN = 8;
const ACTIVE_OPACITY = 0.7;
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
                  onPress={() => Alert.alert(TEXTS.TERMS_ALERT_TITLE, TEXTS.TERMS_ALERT_MESSAGE)}
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
              disabled={isSubmitting}
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
});

export default RegisterScreen;