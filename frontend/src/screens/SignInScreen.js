/**
 * Pantalla de inicio de sesión
 * 
 * Permite a los usuarios iniciar sesión con su correo electrónico y contraseña.
 * Incluye validación en tiempo real, animaciones y manejo de errores.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import ParticleBackground from '../components/ParticleBackground';
import OfflineBanner from '../components/OfflineBanner';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import {
  NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN,
  openEmergencyChatFromHome,
} from '../navigation/navigationHelpers';
import chatService from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSectionTranslations } from '../hooks/useTranslations';

// Constantes de animación
const ANIMATION_INITIAL_DELAY = 500; // ms
const ANIMATION_DURATION = 800; // ms
const INITIAL_TRANSLATE_Y = 30;
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const FINAL_TRANSLATE_Y = 0;

// Constantes de animación de botones
const BUTTON_PRESS_SCALE = 0.95;
const BUTTON_PRESS_OPACITY = 0.8;
const BUTTON_ANIMATION_DURATION = 150; // ms
const BUTTON_SPRING_FRICTION = 8;
const BUTTON_SPRING_TENSION = 100;

// Constantes de validación
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  SAVED_EMAIL: 'savedEmail'
};

// Constantes de mensajes de error
const DEFAULT_ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'El correo es obligatorio',
  EMAIL_INVALID: 'Introduce un correo válido',
  PASSWORD_REQUIRED: 'La contraseña es obligatoria',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  LOGIN_FAILED: 'No se pudo iniciar sesión. Por favor, intenta de nuevo.',
  GENERIC_ERROR: 'Hubo un problema al iniciar sesión',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  ACCOUNT_DISABLED: 'Tu cuenta ha sido desactivada. Contacta al soporte.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Por favor, espera un momento',
  CONNECTION_ERROR: 'Error de conexión. Verifica tu internet'
};

// Constantes de textos
const DEFAULT_TEXTS = {
  TITLE: 'Iniciar Sesión',
  SUBTITLE: 'Accede a tu cuenta',
  EMAIL_PLACEHOLDER: 'Correo Electrónico',
  PASSWORD_PLACEHOLDER: 'Contraseña',
  LOGIN_BUTTON: 'Ingresar',
  REGISTER_BUTTON: 'Crear Cuenta',
  FORGOT_PASSWORD: '¿Olvidaste tu contraseña?',
  BACK_BUTTON: 'Volver',
  EMAIL_FIELD_HINT: 'Campo de correo electrónico',
  PASSWORD_VISIBLE_HINT: 'Contraseña visible',
  PASSWORD_HIDDEN_HINT: 'Contraseña oculta',
  HIDE_PASSWORD: 'Ocultar contraseña',
  SHOW_PASSWORD: 'Mostrar contraseña',
  LOGIN_LOADING: 'Ingresando...',
  LOGIN_HINT: 'Doble toque para iniciar sesión',
  REGISTER_HINT: 'Doble toque para crear una cuenta',
  RECOVER_HINT: 'Doble toque para recuperar contraseña',
  BACK_HINT: 'Volver a la pantalla anterior',
  OFFLINE_WARNING:
    'No hay conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.',
  EMAIL_NOT_VERIFIED_TITLE: 'Email no verificado',
  EMAIL_NOT_VERIFIED_MESSAGE:
    'Por favor verifica tu email antes de iniciar sesión.',
  VERIFY_NOW: 'Verificar ahora',
  CANCEL: 'Cancelar',
};

// Constantes de estilos
const IMAGE_OPACITY = 0.1;
const HORIZONTAL_PADDING = 20;
const TEXT_MARGIN_BOTTOM = 40;
const LOADING_SCALE = 1.5;
const MAX_FORM_WIDTH = 400;

// Constantes de opacidad
const BUTTON_OPACITY = 0.9;
const BUTTON_DISABLED_OPACITY = 0.5;
const ACTIVE_OPACITY = 0.8;
const TOUCH_OPACITY = 0.7;

// Helper: validar email
const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

// Helper: validar campo individual
const validateField = (field, value, errorMessages) => {
  switch (field) {
    case 'email':
      if (!value) return errorMessages.EMAIL_REQUIRED;
      if (!validateEmail(value)) return errorMessages.EMAIL_INVALID;
      return '';
    case 'password':
      if (!value) return errorMessages.PASSWORD_REQUIRED;
      if (value.length < MIN_PASSWORD_LENGTH) return errorMessages.PASSWORD_TOO_SHORT;
      return '';
    default:
      return '';
  }
};

const resolveSignInErrorMessage = (error, errorMessages) => {
  const status = error?.response?.status;
  const rawMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();

  const isNetworkIssue =
    !error?.response ||
    rawMessage.includes('network') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('timed out');

  if (isNetworkIssue) {
    return errorMessages.CONNECTION_ERROR;
  }

  if (status === 401) {
    return errorMessages.INVALID_CREDENTIALS;
  }
  if (status === 403) {
    return errorMessages.ACCOUNT_DISABLED;
  }
  if (status === 429) {
    return errorMessages.TOO_MANY_ATTEMPTS;
  }

  if (
    rawMessage.includes('invalid credentials') ||
    rawMessage.includes('incorrect password') ||
    rawMessage.includes('correo o contraseña') ||
    rawMessage.includes('credenciales')
  ) {
    return errorMessages.INVALID_CREDENTIALS;
  }

  if (
    rawMessage.includes('account disabled') ||
    rawMessage.includes('cuenta desactivada') ||
    rawMessage.includes('forbidden')
  ) {
    return errorMessages.ACCOUNT_DISABLED;
  }

  if (
    rawMessage.includes('too many') ||
    rawMessage.includes('demasiados intentos')
  ) {
    return errorMessages.TOO_MANY_ATTEMPTS;
  }

  if (status >= 500) {
    return errorMessages.GENERIC_ERROR;
  }

  return errorMessages.LOGIN_FAILED;
};

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
  try {
    await chatService.prepareGuestHandoffBeforeClear();
  } catch (_) {}
  try {
    await chatService.clearGuestChat();
  } catch (_) {}
};

const SignInScreen = () => {
  const AUTH = useSectionTranslations('AUTH');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(AUTH?.SIGN_IN || {}) }),
    [AUTH],
  );
  const ERROR_MESSAGES = useMemo(
    () => ({ ...DEFAULT_ERROR_MESSAGES, ...(AUTH?.SIGN_IN_ERRORS || {}) }),
    [AUTH],
  );
  const navigation = useNavigation();
  const { refreshSession } = useAuth();
  const { showToast } = useToast();
  const { colors, globalStyles: gs, statusBarStyle } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: gs.container,
        titleText: gs.titleText,
        subTitleText: gs.subTitleText,
        buttonContainer: gs.buttonContainer,
        background: {
          flex: 1,
          width: '100%',
          height: '100%',
        },
        imageStyle: {
          opacity: IMAGE_OPACITY,
        },
        contentContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: HORIZONTAL_PADDING,
        },
        formContainer: {
          width: '100%',
          maxWidth: MAX_FORM_WIDTH,
          alignItems: 'center',
        },
        loadingIndicator: {
          transform: [{ scale: LOADING_SCALE }],
        },
        textContainer: {
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: TEXT_MARGIN_BOTTOM,
        },
        mainButton: {
          backgroundColor: colors.primary,
          paddingVertical: 18,
          paddingHorizontal: 60,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          width: '100%',
          maxWidth: 300,
        },
        mainButtonText: {
          color: colors.white,
          fontSize: 20,
          fontWeight: 'bold',
        },
        secondaryButton: {
          borderColor: colors.primary,
          borderWidth: 2,
          paddingVertical: 18,
          paddingHorizontal: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 5,
          marginBottom: 16,
          width: '100%',
          maxWidth: 300,
          backgroundColor: colors.surface,
        },
        secondaryButtonText: {
          color: colors.primary,
          fontSize: 20,
          fontWeight: 'bold',
        },
        forgotPasswordText: {
          marginTop: 20,
          fontSize: 16,
          color: colors.primary,
          textAlign: 'center',
          fontWeight: 'bold',
        },
        backButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 50,
        },
        backButtonText: {
          fontSize: 16,
          color: colors.primary,
          marginLeft: 5,
        },
      }),
    [colors, gs],
  );

  // Estado de red
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(INITIAL_OPACITY)).current;
  const translateYAnim = useRef(new Animated.Value(INITIAL_TRANSLATE_Y)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  
  // Estados
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [focusedField, setFocusedField] = useState(null);

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

  // Cargar email guardado
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
        if (savedEmail) {
          setFormData(prev => ({ ...prev, email: savedEmail }));
        }
      } catch (error) {
        console.error('Error al cargar email guardado:', error);
      }
    };
    
    loadSavedEmail();
  }, []);

  // Manejadores de eventos de botones
  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: BUTTON_PRESS_SCALE,
        friction: BUTTON_SPRING_FRICTION,
        tension: BUTTON_SPRING_TENSION,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: BUTTON_PRESS_OPACITY,
        duration: BUTTON_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScale, buttonOpacity]);

  const handlePressOut = useCallback((navigateTo) => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: BUTTON_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (navigateTo) navigation.navigate(navigateTo);
    });
  }, [buttonScale, buttonOpacity, navigation]);

  // Validación del formulario completo
  const validateForm = useCallback(() => {
    const newErrors = {
      email: validateField('email', formData.email, ERROR_MESSAGES),
      password: validateField('password', formData.password, ERROR_MESSAGES),
    };
    
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  }, [formData, ERROR_MESSAGES]);

  // Manejo de cambios en los inputs
  const handleInputChange = useCallback((field, value) => {
    // Normalizar email a minúsculas
    if (field === 'email') {
      value = value.toLowerCase().trim();
    }
    
    setFormData((prevData) => ({ ...prevData, [field]: value }));
    
    // Validación en tiempo real
    const error = validateField(field, value, ERROR_MESSAGES);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [ERROR_MESSAGES]);

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    try {
      setIsSubmitting(true);

      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Verificar si está offline antes de intentar login
      if (isOffline) {
        showToast({
          message: TEXTS.OFFLINE_WARNING,
          type: 'warning',
        });
        setIsSubmitting(false);
        return;
      }

      const response = await api.post(ENDPOINTS.LOGIN, {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      // Verificar si requiere verificación de email
      if (response.requiresVerification) {
        Alert.alert(
          TEXTS.EMAIL_NOT_VERIFIED_TITLE,
          TEXTS.EMAIL_NOT_VERIFIED_MESSAGE,
          [
            {
              text: TEXTS.VERIFY_NOW,
              onPress: () => {
                navigation.navigate(ROUTES.VERIFY_EMAIL, {
                  email: response.email || formData.email,
                });
              },
            },
            {
              text: TEXTS.CANCEL,
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // Verificar si la respuesta tiene los tokens esperados
      if ((response.accessToken || response.token) && response.user) {
        await saveAuthData(
          { accessToken: response.accessToken, token: response.token, refreshToken: response.refreshToken },
          response.user,
          formData.email
        );
        await refreshSession();

        // Registrar token push para notificaciones (no bloquear si falla)
        try {
          const { registerForPushNotifications } = await import('../services/pushNotificationService');
          await registerForPushNotifications();
        } catch (error) {
          console.error('Error registrando notificaciones push:', error);
          // No bloquear el login si falla
        }

        // Entramos por tabs y limpiamos el stack; si venía del banner de emergencia en Home, abrir Chat
        try {
          const openChat = await AsyncStorage.getItem(NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN);
          if (openChat === '1') {
            await AsyncStorage.removeItem(NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN);
            await openEmergencyChatFromHome(navigation);
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.MAIN_TABS }],
            });
          }
        } catch (_) {
          navigation.reset({
            index: 0,
            routes: [{ name: ROUTES.MAIN_TABS }],
          });
        }
      } else {
        showToast({
          message: ERROR_MESSAGES.LOGIN_FAILED,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = resolveSignInErrorMessage(error, ERROR_MESSAGES);
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      setFormData({ email: '', password: '' });
      setErrors({ email: '', password: '' });
    };
  }, []);

  const isButtonDisabled = Boolean(
    isSubmitting || 
    isLoading || 
    !formData.email || 
    !formData.password ||
    errors.email || 
    errors.password ||
    isOffline // Deshabilitar botón si está offline
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      
      {/* Offline Banner */}
      <OfflineBanner />
      
      <ImageBackground 
        source={require('../images/back.png')} 
        style={styles.background} 
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.contentContainer}>
              {isLoading ? (
                <ActivityIndicator 
                  size="large" 
                  color={colors.primary} 
                  style={styles.loadingIndicator} 
                />
              ) : (
                <Animated.View 
                  style={[
                    styles.formContainer, 
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateY: translateYAnim }] 
                    }
                  ]}
                >
                  <View style={styles.textContainer}>
                    <Text style={styles.titleText}>{TEXTS.TITLE}</Text>
                    <Text style={styles.subTitleText}>{TEXTS.SUBTITLE}</Text>
                  </View>

                  <View style={gs.inputWrapper}>
                    <View style={[
                      gs.inputContainer, 
                      errors.email && gs.inputError,
                      focusedField === 'email' && gs.inputContainerFocused
                    ]}>
                      <Ionicons 
                        name="mail-outline" 
                        size={20} 
                        color={colors.primary} 
                        style={gs.inputIcon} 
                      />
                      <TextInput
                        style={gs.input}
                        placeholder={TEXTS.EMAIL_PLACEHOLDER}
                        placeholderTextColor={errors.email ? colors.error : colors.accent}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onChangeText={(text) => handleInputChange('email', text)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        value={formData.email}
                        accessibilityLabel={TEXTS.EMAIL_PLACEHOLDER}
                        accessibilityHint={errors.email ? errors.email : TEXTS.EMAIL_FIELD_HINT}
                        accessibilityState={{ invalid: Boolean(errors.email) }}
                      />
                    </View>
                    {errors.email ? <Text style={gs.errorText}>{errors.email}</Text> : null}
                  </View>

                  <View style={gs.inputWrapper}>
                    <View style={[
                      gs.inputContainer, 
                      errors.password && gs.inputError,
                      focusedField === 'password' && gs.inputContainerFocused
                    ]}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color={colors.primary} 
                        style={gs.inputIcon} 
                      />
                      <TextInput
                        style={gs.input}
                        placeholder={TEXTS.PASSWORD_PLACEHOLDER}
                        placeholderTextColor={colors.accent}
                        secureTextEntry={!isPasswordVisible}
                        onChangeText={(text) => handleInputChange('password', text)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        value={formData.password}
                        accessibilityLabel={TEXTS.PASSWORD_PLACEHOLDER}
                        accessibilityHint={
                          errors.password
                            ? errors.password
                            : (isPasswordVisible
                              ? TEXTS.PASSWORD_VISIBLE_HINT
                              : TEXTS.PASSWORD_HIDDEN_HINT)
                        }
                        accessibilityState={{ invalid: Boolean(errors.password) }}
                      />
                      <TouchableOpacity 
                        onPress={() => setPasswordVisible(!isPasswordVisible)} 
                        style={gs.inputIcon}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isPasswordVisible
                            ? TEXTS.HIDE_PASSWORD
                            : TEXTS.SHOW_PASSWORD
                        }
                        accessibilityHint={TEXTS.SHOW_PASSWORD}
                      >
                        <Ionicons 
                          name={isPasswordVisible ? "eye-off" : "eye"} 
                          size={20} 
                          color={colors.accent} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={gs.errorText}>{errors.password}</Text> : null}
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPressIn={handlePressIn}
                      onPress={handleLogin}
                      disabled={isButtonDisabled}
                      style={[
                        styles.mainButton,
                        {
                          transform: [{ scale: buttonScale }],
                          opacity: isButtonDisabled ? BUTTON_DISABLED_OPACITY : buttonOpacity,
                          backgroundColor: isButtonDisabled
                            ? hexToRgba(colors.primary, BUTTON_DISABLED_OPACITY)
                            : hexToRgba(colors.primary, BUTTON_OPACITY),
                        }
                      ]}
                      activeOpacity={ACTIVE_OPACITY}
                      accessibilityRole="button"
                      accessibilityLabel={isSubmitting ? TEXTS.LOGIN_LOADING : TEXTS.LOGIN_BUTTON}
                      accessibilityState={{ disabled: isButtonDisabled, busy: isSubmitting }}
                      accessibilityHint={TEXTS.LOGIN_HINT}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.mainButtonText}>{TEXTS.LOGIN_BUTTON}</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPressIn={handlePressIn}
                      onPressOut={() => handlePressOut(ROUTES.REGISTER)}
                      style={[
                        styles.secondaryButton, 
                        { transform: [{ scale: buttonScale }], opacity: buttonOpacity }
                      ]}
                      activeOpacity={ACTIVE_OPACITY}
                      accessibilityRole="button"
                      accessibilityLabel={TEXTS.REGISTER_BUTTON}
                      accessibilityHint={TEXTS.REGISTER_HINT}
                    >
                      <Text style={styles.secondaryButtonText}>{TEXTS.REGISTER_BUTTON}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    onPress={() => handlePressOut(ROUTES.RECOVER_PASSWORD)}
                    activeOpacity={TOUCH_OPACITY}
                    accessibilityRole="button"
                    accessibilityLabel={TEXTS.FORGOT_PASSWORD}
                    accessibilityHint={TEXTS.RECOVER_HINT}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {TEXTS.FORGOT_PASSWORD}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={TOUCH_OPACITY}
                    accessibilityRole="button"
                    accessibilityLabel={TEXTS.BACK_BUTTON}
                    accessibilityHint={TEXTS.BACK_HINT}
                  >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    <Text style={styles.backButtonText}>{TEXTS.BACK_BUTTON}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

export default SignInScreen;
