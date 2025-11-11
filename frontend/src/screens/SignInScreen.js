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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { colors, globalStyles } from '../styles/globalStyles';

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
const ERROR_MESSAGES = {
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

// Constantes de códigos de estado HTTP
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429
};

// Constantes de textos
const TEXTS = {
  TITLE: 'Iniciar Sesión',
  SUBTITLE: 'Accede a tu cuenta',
  EMAIL_PLACEHOLDER: 'Correo Electrónico',
  PASSWORD_PLACEHOLDER: 'Contraseña',
  LOGIN_BUTTON: 'Ingresar',
  REGISTER_BUTTON: 'Crear Cuenta',
  FORGOT_PASSWORD: '¿Olvidaste tu contraseña?',
  BACK_BUTTON: 'Volver'
};

// Constantes de estilos
const IMAGE_OPACITY = 0.1;
const HORIZONTAL_PADDING = 20;
const TEXT_MARGIN_BOTTOM = 40;
const LOADING_SCALE = 1.5;
const MAX_FORM_WIDTH = 400;
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = colors.background;

// Constantes de opacidad
const DISABLED_OPACITY = 0.5;
const BUTTON_OPACITY = 0.9;
const BUTTON_DISABLED_OPACITY = 0.5;
const ACTIVE_OPACITY = 0.8;
const TOUCH_OPACITY = 0.7;

// Helper: validar email
const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

// Helper: validar campo individual
const validateField = (field, value) => {
  switch (field) {
    case 'email':
      if (!value) return ERROR_MESSAGES.EMAIL_REQUIRED;
      if (!validateEmail(value)) return ERROR_MESSAGES.EMAIL_INVALID;
      return '';
    case 'password':
      if (!value) return ERROR_MESSAGES.PASSWORD_REQUIRED;
      if (value.length < MIN_PASSWORD_LENGTH) return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
      return '';
    default:
      return '';
  }
};

// Helper: obtener mensaje de error según código de estado
const getErrorMessage = (error) => {
  if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
    return ERROR_MESSAGES.ACCOUNT_DISABLED;
  }
  if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (!error.response) {
    return ERROR_MESSAGES.CONNECTION_ERROR;
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

const SignInScreen = () => {
  const navigation = useNavigation();
  
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
      email: validateField('email', formData.email),
      password: validateField('password', formData.password)
    };
    
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  }, [formData]);

  // Manejo de cambios en los inputs
  const handleInputChange = useCallback((field, value) => {
    // Normalizar email a minúsculas
    if (field === 'email') {
      value = value.toLowerCase().trim();
    }
    
    setFormData((prevData) => ({ ...prevData, [field]: value }));
    
    // Validación en tiempo real
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    try {
      setIsSubmitting(true);

      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      const response = await api.post(ENDPOINTS.LOGIN, {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      // Verificar si la respuesta tiene los tokens esperados
      if ((response.accessToken || response.token) && response.user) {
        await saveAuthData(
          { accessToken: response.accessToken, token: response.token, refreshToken: response.refreshToken },
          response.user,
          formData.email
        );

        // Navegamos al Dashboard y limpiamos el stack de navegación
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.DASHBOARD }],
        });
      } else {
        Alert.alert('Error', ERROR_MESSAGES.LOGIN_FAILED);
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = getErrorMessage(error);
      Alert.alert('Error', errorMessage);
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
    errors.password
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
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

                  <View style={globalStyles.inputWrapper}>
                    <View style={[
                      globalStyles.inputContainer, 
                      errors.email && globalStyles.inputError
                    ]}>
                      <Ionicons 
                        name="mail-outline" 
                        size={20} 
                        color={colors.primary} 
                        style={globalStyles.inputIcon} 
                      />
                      <TextInput
                        style={globalStyles.input}
                        placeholder={TEXTS.EMAIL_PLACEHOLDER}
                        placeholderTextColor={errors.email ? '#FF6B6B' : colors.accent}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onChangeText={(text) => handleInputChange('email', text)}
                        value={formData.email}
                        accessibilityLabel={TEXTS.EMAIL_PLACEHOLDER}
                      />
                    </View>
                    {errors.email ? <Text style={globalStyles.errorText}>{errors.email}</Text> : null}
                  </View>

                  <View style={globalStyles.inputWrapper}>
                    <View style={[
                      globalStyles.inputContainer, 
                      errors.password && globalStyles.inputError
                    ]}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color={colors.primary} 
                        style={globalStyles.inputIcon} 
                      />
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
                          size={20} 
                          color={colors.accent} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={globalStyles.errorText}>{errors.password}</Text> : null}
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
                          backgroundColor: isButtonDisabled ? 
                            `rgba(26, 221, 219, ${BUTTON_DISABLED_OPACITY})` : 
                            `rgba(26, 221, 219, ${BUTTON_OPACITY})`
                        }
                      ]}
                      activeOpacity={ACTIVE_OPACITY}
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
                    >
                      <Text style={styles.secondaryButtonText}>{TEXTS.REGISTER_BUTTON}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    onPress={() => handlePressOut(ROUTES.RECOVER_PASSWORD)}
                    activeOpacity={TOUCH_OPACITY}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {TEXTS.FORGOT_PASSWORD}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={TOUCH_OPACITY}
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

const styles = StyleSheet.create({
  ...globalStyles,
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
    backgroundColor: `rgba(26, 221, 219, ${BUTTON_OPACITY})`,
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
    borderColor: `rgba(26, 221, 219, ${BUTTON_OPACITY})`,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  secondaryButtonText: {
    color: `rgba(26, 221, 219, ${BUTTON_OPACITY})`,
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
});

export default SignInScreen;
