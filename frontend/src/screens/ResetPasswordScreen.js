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
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { ROUTES } from '../constants/routes';
import { SPACING } from '../constants/ui';
import { userService } from '../services/userService';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { resolvePasswordRecoveryErrorMessage } from '../utils/passwordRecoveryErrors';

// Constantes de textos
const DEFAULT_TEXTS = {
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
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  CONNECTION_ERROR: 'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
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
const CONTENT_PADDING_HORIZONTAL = SPACING.SCREEN_EDGE_INSET;
const CONTENT_PADDING_VERTICAL = SPACING.xxl;
const TITLE_MARGIN_BOTTOM = 20;
const TITLE_MARGIN_TOP = 60;
const SUBTITLE_MARGIN_BOTTOM = 30;
const INPUT_WRAPPER_MARGIN_BOTTOM = 25;
const INPUT_BORDER_RADIUS = 10;
const INPUT_PADDING_VERTICAL = SPACING.INPUT_INSET;
const INPUT_PADDING_HORIZONTAL = SPACING.INPUT_INSET;
const INPUT_BORDER_WIDTH = 1;
const ERROR_TEXT_MARGIN_TOP = 8;
const ERROR_TEXT_MARGIN_LEFT = 5;
const BUTTON_PADDING_VERTICAL = SPACING.HERO_INSET;
const BUTTON_BORDER_RADIUS = 25;
const BUTTON_MARGIN_TOP = 15;
const BUTTON_MARGIN_BOTTOM = 16;
const BUTTON_PADDING_HORIZONTAL = SPACING.HERO_INSET;
const BUTTON_SHADOW_OFFSET_Y = 4;
const BUTTON_SHADOW_OPACITY = 0.3;
const BUTTON_SHADOW_RADIUS = 5;
const BUTTON_ELEVATION = 5;
const BUTTON_MAX_WIDTH = 300;
const LINK_CONTAINER_MARGIN_TOP = 20;
const SUCCESS_CONTAINER_PADDING = SPACING.HERO_INSET;
const SUCCESS_CONTAINER_MARGIN_VERTICAL = 30;
const SUCCESS_CONTAINER_MARGIN_HORIZONTAL = 10;
const SUCCESS_CONTAINER_BORDER_RADIUS = 15;
const SUCCESS_CONTAINER_BORDER_WIDTH = 1;
const SUCCESS_TEXT_MARGIN_TOP = 20;
const SUCCESS_TEXT_MARGIN_BOTTOM = 10;
const TEXT_SHADOW_OFFSET_WIDTH = 1;
const TEXT_SHADOW_OFFSET_HEIGHT = 1;
const TEXT_SHADOW_RADIUS = 3;

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');

// Constantes de iconos
const SUCCESS_ICON_SIZE = 60;

const ResetPasswordScreen = ({ navigation }) => {
  const AUTH = useSectionTranslations('AUTH');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(AUTH?.RESET_PASSWORD || {}) }),
    [AUTH],
  );
  const { colors, statusBarStyle } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          color: colors.white,
          marginBottom: TITLE_MARGIN_BOTTOM,
          marginTop: TITLE_MARGIN_TOP,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: TEXT_SHADOW_OFFSET_WIDTH, height: TEXT_SHADOW_OFFSET_HEIGHT },
          textShadowRadius: TEXT_SHADOW_RADIUS,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 18,
          color: colors.textSecondary,
          marginBottom: SUBTITLE_MARGIN_BOTTOM,
          textAlign: 'center',
        },
        inputWrapper: {
          width: '100%',
          marginBottom: INPUT_WRAPPER_MARGIN_BOTTOM,
        },
        input: {
          width: '100%',
          backgroundColor: colors.chromeInput,
          borderRadius: INPUT_BORDER_RADIUS,
          paddingVertical: INPUT_PADDING_VERTICAL,
          fontSize: 18,
          color: colors.text,
          paddingHorizontal: INPUT_PADDING_HORIZONTAL,
          borderWidth: INPUT_BORDER_WIDTH,
          borderColor: 'transparent',
        },
        inputError: {
          borderColor: colors.error,
          borderWidth: INPUT_BORDER_WIDTH,
        },
        errorText: {
          color: colors.error,
          fontSize: 14,
          marginTop: ERROR_TEXT_MARGIN_TOP,
          marginLeft: ERROR_TEXT_MARGIN_LEFT,
        },
        button: {
          backgroundColor: colors.primary,
          paddingVertical: BUTTON_PADDING_VERTICAL,
          borderRadius: BUTTON_BORDER_RADIUS,
          width: '100%',
          alignItems: 'center',
          marginTop: BUTTON_MARGIN_TOP,
          marginBottom: BUTTON_MARGIN_BOTTOM,
          paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: BUTTON_SHADOW_OFFSET_Y },
          shadowOpacity: BUTTON_SHADOW_OPACITY,
          shadowRadius: BUTTON_SHADOW_RADIUS,
          elevation: BUTTON_ELEVATION,
          maxWidth: BUTTON_MAX_WIDTH,
          alignSelf: 'center',
        },
        buttonText: {
          color: colors.white,
          fontSize: 18,
          fontWeight: 'bold',
        },
        disabledButton: {
          backgroundColor: hexToRgba(colors.primary, 0.45),
        },
        linkContainer: {
          marginTop: LINK_CONTAINER_MARGIN_TOP,
        },
        linkText: {
          fontSize: 16,
          color: colors.primary,
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
          backgroundColor: colors.accentLineSoft,
          borderRadius: SUCCESS_CONTAINER_BORDER_RADIUS,
          borderWidth: SUCCESS_CONTAINER_BORDER_WIDTH,
          borderColor: colors.accentLine,
        },
        successText: {
          fontSize: 20,
          color: colors.text,
          textAlign: 'center',
          marginTop: SUCCESS_TEXT_MARGIN_TOP,
          marginBottom: SUCCESS_TEXT_MARGIN_BOTTOM,
          fontWeight: 'bold',
        },
        instructionText: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors],
  );

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
      setError(
        resolvePasswordRecoveryErrorMessage(error, TEXTS, 'ERROR_SEND_EMAIL'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ImageBackground 
        source={BACKGROUND_IMAGE} 
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
            
            {success ? (
              <>
                <View style={styles.successContainer}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={SUCCESS_ICON_SIZE} 
                    color={colors.primary} 
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
                    placeholderTextColor={colors.textSecondary}
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
                      <ActivityIndicator size="small" color={colors.white} />
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

export default ResetPasswordScreen; 