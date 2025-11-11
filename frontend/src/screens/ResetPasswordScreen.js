/**
 * Pantalla de Restablecimiento de Contraseña
 * 
 * Permite a los usuarios solicitar instrucciones para restablecer su contraseña
 * mediante su correo electrónico. Incluye validación de email y confirmación
 * de envío exitoso.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  TITLE: 'Restablecer Contraseña',
  SUBTITLE: 'Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.',
  EMAIL_PLACEHOLDER: 'Correo Electrónico',
  BUTTON_SEND: 'Enviar Instrucciones',
  BUTTON_BACK: 'Volver al Inicio de Sesión',
  SUCCESS_TITLE: 'Hemos enviado un correo con instrucciones para restablecer tu contraseña.',
  SUCCESS_INSTRUCTION: 'Por favor, revisa tu bandeja de entrada y sigue las instrucciones.',
  EMAIL_REQUIRED: 'Por favor, introduce tu correo electrónico',
  EMAIL_INVALID: 'Por favor, introduce un correo electrónico válido',
  ERROR_SEND_EMAIL: 'Error al enviar el correo de recuperación',
};

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
const TITLE_MARGIN_BOTTOM = 20;
const TITLE_MARGIN_TOP = 60;
const SUBTITLE_MARGIN_BOTTOM = 30;
const INPUT_WRAPPER_MARGIN_BOTTOM = 25;
const INPUT_BORDER_RADIUS = 10;
const INPUT_PADDING_VERTICAL = 15;
const INPUT_PADDING_HORIZONTAL = 20;
const INPUT_BORDER_WIDTH = 1;
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
const SUCCESS_ICON_SIZE = 60;

const ResetPasswordScreen = ({ navigation }) => {
  // Referencias para animaciones
  const buttonScale = useRef(new Animated.Value(BUTTON_SCALE_NORMAL)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(TRANSLATE_Y_ANIMATION_INITIAL)).current;

  // Estados
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Validar email
  const validateEmail = (email) => EMAIL_REGEX.test(email);

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

  // Manejo del restablecimiento de contraseña
  const handleResetPassword = async () => {
    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validar email
    if (!normalizedEmail) {
      setError(TEXTS.EMAIL_REQUIRED);
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError(TEXTS.EMAIL_INVALID);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await userService.recoverPassword(normalizedEmail);
      setSuccess(true);
    } catch (error) {
      setError(handleApiError(error) || TEXTS.ERROR_SEND_EMAIL);
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
                    <Text style={styles.buttonText}>{TEXTS.BUTTON_BACK}</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  {TEXTS.SUBTITLE}
                </Text>

                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={[styles.input, error && styles.inputError]} 
                    placeholder={TEXTS.EMAIL_PLACEHOLDER} 
                    placeholderTextColor={COLORS.ACCENT}
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text.toLowerCase().trim());
                      setError('');
                    }}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
                      <Text style={styles.buttonText}>{TEXTS.BUTTON_SEND}</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity 
                  onPress={() => navigation.navigate(ROUTES.SIGN_IN)} 
                  style={styles.linkContainer}
                  activeOpacity={BUTTON_ACTIVE_OPACITY}
                >
                  <Text style={styles.linkText}>{TEXTS.BUTTON_BACK}</Text>
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
  input: {
    width: '100%',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: INPUT_PADDING_VERTICAL,
    fontSize: 18, 
    color: COLORS.WHITE,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.ERROR,
    borderWidth: INPUT_BORDER_WIDTH,
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

export default ResetPasswordScreen; 