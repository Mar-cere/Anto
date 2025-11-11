/**
 * Pantalla de Nueva Contraseña
 * 
 * Permite a los usuarios establecer una nueva contraseña después de solicitar
 * un restablecimiento. Incluye validación de contraseñas y confirmación.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
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
import { handleApiError } from '../config/api';
import { ROUTES } from '../constants/routes';
import { userService } from '../services/userService';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  TITLE: 'Nueva Contraseña',
  SUBTITLE: 'Crea una nueva contraseña segura para tu cuenta.',
  PASSWORD_PLACEHOLDER: 'Nueva contraseña',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Confirma tu nueva contraseña',
  BUTTON_RESET: 'Cambiar Contraseña',
  BUTTON_SIGN_IN: 'Ir a Iniciar Sesión',
  LINK_BACK: 'Volver al Inicio de Sesión',
  SUCCESS_TITLE: '¡Tu contraseña ha sido cambiada exitosamente!',
  SUCCESS_INSTRUCTION: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
  VALIDATION_ERROR: 'Error de validación',
  ERROR: 'Error',
  ERROR_RESET_PASSWORD: 'Error al cambiar la contraseña',
  PASSWORD_REQUIRED: 'La contraseña es obligatoria',
  PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres',
  CONFIRM_PASSWORD_REQUIRED: 'Debes confirmar la contraseña',
  PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
  BACK: 'Volver',
};

// Constantes de validación
const MIN_PASSWORD_LENGTH = 6;

// Constantes de animación
const ANIMATION_INITIAL_DELAY = 500; // ms
const FADE_ANIMATION_DURATION = 800; // ms
const FADE_ANIMATION_TO_VALUE = 1;
const TRANSLATE_Y_ANIMATION_DURATION = 800; // ms
const TRANSLATE_Y_ANIMATION_TO_VALUE = 0;
const TRANSLATE_Y_ANIMATION_INITIAL = 30;
const BUTTON_SCALE_PRESSED = 0.95;
const BUTTON_SCALE_NORMAL = 1;
const BUTTON_ACTIVE_OPACITY = 0.7;
const LOADING_INDICATOR_SCALE = 1.5;

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = '#030A24';
const CONTENT_PADDING_HORIZONTAL = 20;
const CONTENT_PADDING_VERTICAL = 40;
const BACK_BUTTON_TOP = 40;
const BACK_BUTTON_LEFT = 20;
const BACK_BUTTON_Z_INDEX = 10;
const TITLE_MARGIN_BOTTOM = 20;
const TITLE_MARGIN_TOP = 60;
const SUBTITLE_MARGIN_BOTTOM = 30;
const INPUT_WRAPPER_MARGIN_BOTTOM = 20;
const PASSWORD_CONTAINER_BORDER_RADIUS = 10;
const PASSWORD_CONTAINER_BORDER_WIDTH = 1;
const PASSWORD_INPUT_PADDING_VERTICAL = 15;
const PASSWORD_INPUT_PADDING_HORIZONTAL = 20;
const EYE_ICON_PADDING_HORIZONTAL = 15;
const ERROR_TEXT_MARGIN_TOP = 8;
const ERROR_TEXT_MARGIN_LEFT = 5;
const BUTTON_PADDING_VERTICAL = 18;
const BUTTON_BORDER_RADIUS = 25;
const BUTTON_MARGIN_TOP = 15;
const BUTTON_MARGIN_BOTTOM = 16;
const BUTTON_PADDING_HORIZONTAL = 50;
const BUTTON_SHADOW_OFFSET_Y = 4;
const BUTTON_SHADOW_OPACITY = 0.3;
const BUTTON_SHADOW_RADIUS = 5;
const BUTTON_ELEVATION = 5;
const BUTTON_MAX_WIDTH = 300;
const LINK_CONTAINER_MARGIN_TOP = 20;
const SUCCESS_CONTAINER_PADDING = 20;
const SUCCESS_CONTAINER_MARGIN_VERTICAL = 30;
const SUCCESS_CONTAINER_MARGIN_HORIZONTAL = 10;
const SUCCESS_CONTAINER_BORDER_RADIUS = 15;
const SUCCESS_CONTAINER_BORDER_WIDTH = 1;
const SUCCESS_TEXT_MARGIN_TOP = 20;
const SUCCESS_TEXT_MARGIN_BOTTOM = 10;
const TEXT_SHADOW_OFFSET_WIDTH = 1;
const TEXT_SHADOW_OFFSET_HEIGHT = 1;
const TEXT_SHADOW_RADIUS = 3;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  INPUT_BACKGROUND: '#1D2B5F',
  BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.9)',
  BUTTON_DISABLED_BACKGROUND: 'rgba(26, 221, 219, 0.5)',
  BUTTON_SHADOW: colors.primary,
  SUCCESS_CONTAINER_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  SUCCESS_CONTAINER_BORDER: 'rgba(26, 221, 219, 0.3)',
  TEXT_SHADOW: 'rgba(0, 0, 0, 0.75)',
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');

// Constantes de iconos
const ICON_SIZE = 24;
const SUCCESS_ICON_SIZE = 60;
const EYE_ICON_SIZE = 24;

const NewPasswordScreen = ({ navigation, route }) => {
  // Referencias para animaciones
  const buttonScale = useRef(new Animated.Value(BUTTON_SCALE_NORMAL)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(TRANSLATE_Y_ANIMATION_INITIAL)).current;

  // Extraer el código y email de los parámetros de la ruta
  const { code, email } = route.params || {};

  // Estados
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  // Efecto de entrada con animación
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: FADE_ANIMATION_TO_VALUE,
          duration: FADE_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: TRANSLATE_Y_ANIMATION_TO_VALUE,
          duration: TRANSLATE_Y_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }, ANIMATION_INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateYAnim]);

  // Validar campo individual
  const validateField = (field, value, currentPassword = '') => {
    if (field === 'password') {
      if (!value) {
        return TEXTS.PASSWORD_REQUIRED;
      } else if (value.length < MIN_PASSWORD_LENGTH) {
        return TEXTS.PASSWORD_MIN_LENGTH;
      }
      return null;
    }

    if (field === 'confirmPassword') {
      if (!value) {
        return TEXTS.CONFIRM_PASSWORD_REQUIRED;
      } else if (value !== currentPassword) {
        return TEXTS.PASSWORDS_NOT_MATCH;
      }
      return null;
    }

    return null;
  };

  // Manejar cambio de input
  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    const updatedErrors = { ...errors };

    // Validar campo actual
    const fieldError = validateField(field, value, field === 'confirmPassword' ? formData.password : value);
    if (fieldError) {
      updatedErrors[field] = fieldError;
    } else {
      delete updatedErrors[field];
    }

    // Si se cambia password, validar confirmPassword si tiene valor
    if (field === 'password' && formData.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword, value);
      if (confirmError) {
        updatedErrors.confirmPassword = confirmError;
      } else {
        delete updatedErrors.confirmPassword;
      }
    }

    setErrors(updatedErrors);
  };

  // Manejo de animación al presionar
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_SCALE_PRESSED,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_SCALE_NORMAL,
      useNativeDriver: true,
    }).start();
  };

  // Validación del formulario completo
  const validateForm = () => {
    const newErrors = {};
    
    const passwordError = validateField('password', formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword, formData.password);
    if (confirmPasswordError) {
      newErrors.confirmPassword = confirmPasswordError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo del cambio de contraseña
  const handleResetPassword = async () => {
    if (!validateForm()) {
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        Alert.alert(TEXTS.VALIDATION_ERROR, errors[errorKeys[0]]);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.resetPassword(email, code, formData.password);
      setSuccess(true);
    } catch (error) {
      Alert.alert(TEXTS.ERROR, handleApiError(error) || TEXTS.ERROR_RESET_PASSWORD);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <StatusBar 
        barStyle={STATUS_BAR_STYLE} 
        backgroundColor={STATUS_BAR_BACKGROUND} 
      />
      <ImageBackground 
        source={BACKGROUND_IMAGE} 
        style={styles.background} 
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />

        {isLoading ? (
          <ActivityIndicator 
            size="large" 
            color={COLORS.PRIMARY} 
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
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              accessibilityLabel={TEXTS.BACK}
            >
              <Ionicons 
                name="arrow-back" 
                size={ICON_SIZE} 
                color={COLORS.WHITE} 
              />
            </TouchableOpacity>

            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            
            {success ? (
              <>
                <View style={styles.successContainer}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={SUCCESS_ICON_SIZE} 
                    color={COLORS.PRIMARY} 
                  />
                  <Text style={styles.successText}>
                    {TEXTS.SUCCESS_TITLE}
                  </Text>
                  <Text style={styles.instructionText}>
                    {TEXTS.SUCCESS_INSTRUCTION}
                  </Text>
                </View>
                
                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => navigation.navigate(ROUTES.SIGN_IN)}
                    activeOpacity={BUTTON_ACTIVE_OPACITY}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Text style={styles.buttonText}>{TEXTS.BUTTON_SIGN_IN}</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  {TEXTS.SUBTITLE}
                </Text>

                {/* Campo de Contraseña */}
                <View style={styles.inputWrapper}>
                  <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder={TEXTS.PASSWORD_PLACEHOLDER}
                      placeholderTextColor={COLORS.ACCENT}
                      secureTextEntry={!isPasswordVisible}
                      onChangeText={(text) => handleInputChange('password', text)}
                      value={formData.password}
                    />
                    <TouchableOpacity 
                      onPress={() => setPasswordVisible(!isPasswordVisible)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={isPasswordVisible ? "eye-off" : "eye"} 
                        size={EYE_ICON_SIZE} 
                        color={COLORS.ACCENT} 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>
                
                {/* Confirmación de Contraseña */}
                <View style={styles.inputWrapper}>
                  <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                    <TextInput 
                      style={styles.passwordInput} 
                      placeholder={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER} 
                      placeholderTextColor={COLORS.ACCENT}
                      secureTextEntry={!isConfirmPasswordVisible}
                      onChangeText={(text) => handleInputChange('confirmPassword', text)} 
                      value={formData.confirmPassword} 
                    />
                    <TouchableOpacity 
                      onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={isConfirmPasswordVisible ? "eye-off" : "eye"} 
                        size={EYE_ICON_SIZE} 
                        color={COLORS.ACCENT} 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
                  <TouchableOpacity 
                    style={[styles.button, isSubmitting && styles.disabledButton]} 
                    onPress={handleResetPassword} 
                    disabled={isSubmitting}
                    activeOpacity={BUTTON_ACTIVE_OPACITY}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.WHITE} />
                    ) : (
                      <Text style={styles.buttonText}>{TEXTS.BUTTON_RESET}</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity 
                  onPress={() => navigation.navigate(ROUTES.SIGN_IN)} 
                  style={styles.linkContainer}
                  activeOpacity={BUTTON_ACTIVE_OPACITY}
                >
                  <Text style={styles.linkText}>{TEXTS.LINK_BACK}</Text>
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: COLORS.BACKGROUND,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    opacity: BACKGROUND_OPACITY,
    resizeMode: 'cover',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
    paddingVertical: CONTENT_PADDING_VERTICAL,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: BACK_BUTTON_TOP,
    left: BACK_BUTTON_LEFT,
    zIndex: BACK_BUTTON_Z_INDEX,
  },
  title: {
    fontSize: 34, 
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: TITLE_MARGIN_BOTTOM, 
    marginTop: TITLE_MARGIN_TOP,
    textShadowColor: COLORS.TEXT_SHADOW,
    textShadowOffset: { width: TEXT_SHADOW_OFFSET_WIDTH, height: TEXT_SHADOW_OFFSET_HEIGHT },
    textShadowRadius: TEXT_SHADOW_RADIUS,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18, 
    color: COLORS.ACCENT,
    marginBottom: SUBTITLE_MARGIN_BOTTOM, 
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: INPUT_WRAPPER_MARGIN_BOTTOM,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: PASSWORD_CONTAINER_BORDER_RADIUS,
    borderWidth: PASSWORD_CONTAINER_BORDER_WIDTH,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    fontSize: 18, 
    color: COLORS.WHITE,
    paddingVertical: PASSWORD_INPUT_PADDING_VERTICAL,
    paddingHorizontal: PASSWORD_INPUT_PADDING_HORIZONTAL,
  },
  eyeIcon: {
    paddingHorizontal: EYE_ICON_PADDING_HORIZONTAL,
  },
  inputError: {
    borderColor: COLORS.ERROR,
    borderWidth: PASSWORD_CONTAINER_BORDER_WIDTH,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    marginTop: ERROR_TEXT_MARGIN_TOP,
    marginLeft: ERROR_TEXT_MARGIN_LEFT,
  },
  button: {
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    paddingVertical: BUTTON_PADDING_VERTICAL, 
    borderRadius: BUTTON_BORDER_RADIUS, 
    width: '100%',
    alignItems: 'center',
    marginTop: BUTTON_MARGIN_TOP,
    marginBottom: BUTTON_MARGIN_BOTTOM, 
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    shadowColor: COLORS.BUTTON_SHADOW,
    shadowOffset: { width: 0, height: BUTTON_SHADOW_OFFSET_Y },
    shadowOpacity: BUTTON_SHADOW_OPACITY,
    shadowRadius: BUTTON_SHADOW_RADIUS,
    elevation: BUTTON_ELEVATION,
    maxWidth: BUTTON_MAX_WIDTH,
    alignSelf: 'center',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 18, 
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.BUTTON_DISABLED_BACKGROUND,
  },
  linkContainer: {
    marginTop: LINK_CONTAINER_MARGIN_TOP,
  },
  linkText: {
    fontSize: 16, 
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    transform: [{ scale: LOADING_INDICATOR_SCALE }],
  },
  successContainer: {
    alignItems: 'center',
    padding: SUCCESS_CONTAINER_PADDING,
    marginVertical: SUCCESS_CONTAINER_MARGIN_VERTICAL,
    marginHorizontal: SUCCESS_CONTAINER_MARGIN_HORIZONTAL,
    backgroundColor: COLORS.SUCCESS_CONTAINER_BACKGROUND,
    borderRadius: SUCCESS_CONTAINER_BORDER_RADIUS,
    borderWidth: SUCCESS_CONTAINER_BORDER_WIDTH,
    borderColor: COLORS.SUCCESS_CONTAINER_BORDER,
  },
  successText: {
    fontSize: 20,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginTop: SUCCESS_TEXT_MARGIN_TOP,
    marginBottom: SUCCESS_TEXT_MARGIN_BOTTOM,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.ACCENT,
    textAlign: 'center',
  },
});

export default NewPasswordScreen; 