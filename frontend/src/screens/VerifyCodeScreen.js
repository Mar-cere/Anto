/**
 * Pantalla de Verificación de Código
 * 
 * Permite a los usuarios verificar el código de 6 dígitos enviado a su correo
 * electrónico para restablecer su contraseña. Incluye cuenta regresiva para
 * reenvío de código y validación en tiempo real.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ROUTES } from '../constants/routes';
import { SPACING } from '../constants/ui';
import { isCompleteVerificationCode } from '../utils/verificationCode';
import { userService } from '../services/userService';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { resolvePasswordRecoveryErrorMessage } from '../utils/passwordRecoveryErrors';

// Constantes de textos
const DEFAULT_TEXTS = {
  TITLE: 'Verificar Código',
  SUBTITLE: 'Ingresa el código de 6 dígitos que hemos enviado a:',
  BUTTON_VERIFY: 'Verificar Código',
  RESEND_CODE: 'Reenviar código',
  COUNTDOWN_MESSAGE: 'Puedes solicitar un nuevo código en',
  BACK_TO_SIGN_IN: 'Volver al Inicio de Sesión',
  CODE_REQUIRED: 'Por favor, introduce el código completo de 6 dígitos',
  CODE_INVALID: 'Código inválido o expirado',
  CODE_RESENT: 'Código reenviado',
  CODE_RESENT_MESSAGE: 'Se ha enviado un nuevo código a tu correo electrónico',
  ERROR: 'Error',
  RESEND_ERROR: 'Error al reenviar el código',
  BACK: 'Volver',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  CODE_EXPIRED: 'El código expiró. Solicita uno nuevo.',
};

// Constantes de validación
const CODE_LENGTH = 6;
const CODE_INPUTS_COUNT = 6;
const LAST_INPUT_INDEX = CODE_INPUTS_COUNT - 1;

// Constantes de tiempo
const COUNTDOWN_INITIAL = 900; // 15 minutos en segundos (alineado con backend)
const COUNTDOWN_INTERVAL = 1000; // 1 segundo
const SECONDS_PER_MINUTE = 60;

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
const BACK_BUTTON_TOP = 40;
const BACK_BUTTON_LEFT = 20;
const BACK_BUTTON_Z_INDEX = 10;
const TITLE_MARGIN_BOTTOM = 20;
const TITLE_MARGIN_TOP = 60;
const SUBTITLE_MARGIN_BOTTOM = 10;
const EMAIL_TEXT_MARGIN_BOTTOM = 30;
const CODE_CONTAINER_MARGIN_BOTTOM = 20;
const CODE_INPUT_WIDTH = 50;
const CODE_INPUT_HEIGHT = 60;
const CODE_INPUT_FONT_SIZE = 24;
const CODE_INPUT_MARGIN_HORIZONTAL = 5;
const CODE_INPUT_BORDER_RADIUS = 10;
const CODE_INPUT_BORDER_WIDTH = 1;
const ERROR_TEXT_MARGIN_TOP = 8;
const BUTTON_PADDING_VERTICAL = SPACING.HERO_INSET;
const BUTTON_BORDER_RADIUS = 25;
const BUTTON_MARGIN_TOP = 5;
const BUTTON_MARGIN_BOTTOM = 16;
const BUTTON_PADDING_HORIZONTAL = SPACING.HERO_INSET;
const BUTTON_SHADOW_OFFSET_Y = 4;
const BUTTON_SHADOW_OPACITY = 0.3;
const BUTTON_SHADOW_RADIUS = 5;
const BUTTON_ELEVATION = 5;
const BUTTON_MAX_WIDTH = 300;
const BUTTON_ANIMATED_MARGIN_TOP = 20;
const RESEND_CONTAINER_MARGIN_TOP = 20;
const LINK_CONTAINER_MARGIN_TOP = 30;
const TEXT_SHADOW_OFFSET_WIDTH = 1;
const TEXT_SHADOW_OFFSET_HEIGHT = 1;
const TEXT_SHADOW_RADIUS = 3;
const BACK_ICON_SIZE = 24;

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');

const VerifyCodeScreen = ({ navigation, route }) => {
  const AUTH = useSectionTranslations('AUTH');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(AUTH?.VERIFY_CODE || {}) }),
    [AUTH],
  );
  const { email, expiresIn: routeExpiresIn } = route.params || {};
  const initialCountdown =
    typeof routeExpiresIn === 'number' && routeExpiresIn > 0
      ? routeExpiresIn
      : COUNTDOWN_INITIAL;
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
        backButton: {
          position: 'absolute',
          top: BACK_BUTTON_TOP,
          left: BACK_BUTTON_LEFT,
          zIndex: BACK_BUTTON_Z_INDEX,
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
        emailText: {
          fontSize: 18,
          color: colors.primary,
          fontWeight: 'bold',
          marginBottom: EMAIL_TEXT_MARGIN_BOTTOM,
          textAlign: 'center',
        },
        codeContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: CODE_CONTAINER_MARGIN_BOTTOM,
          width: '100%',
        },
        codeInput: {
          backgroundColor: colors.chromeInput,
          borderRadius: CODE_INPUT_BORDER_RADIUS,
          width: CODE_INPUT_WIDTH,
          height: CODE_INPUT_HEIGHT,
          fontSize: CODE_INPUT_FONT_SIZE,
          fontWeight: 'bold',
          color: colors.text,
          textAlign: 'center',
          marginHorizontal: CODE_INPUT_MARGIN_HORIZONTAL,
          borderWidth: CODE_INPUT_BORDER_WIDTH,
          borderColor: 'transparent',
        },
        inputError: {
          borderColor: colors.error,
          borderWidth: CODE_INPUT_BORDER_WIDTH,
        },
        errorText: {
          color: colors.error,
          fontSize: 14,
          marginTop: ERROR_TEXT_MARGIN_TOP,
          textAlign: 'center',
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
        resendContainer: {
          marginTop: RESEND_CONTAINER_MARGIN_TOP,
          alignItems: 'center',
        },
        resendText: {
          color: colors.primary,
          fontSize: 16,
          fontWeight: 'bold',
          textDecorationLine: 'underline',
        },
        countdownText: {
          color: colors.textSecondary,
          fontSize: 16,
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
      }),
    [colors],
  );

  const buttonScale = useRef(new Animated.Value(BUTTON_SCALE_NORMAL)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(TRANSLATE_Y_ANIMATION_INITIAL)).current;

  // Referencias para inputs de código
  const inputRefs = useRef(
    Array.from({ length: CODE_INPUTS_COUNT }, () => React.createRef()),
  ).current;

  // Estados
  const [code, setCode] = useState(Array(CODE_INPUTS_COUNT).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(initialCountdown);
  const [canResend, setCanResend] = useState(false);

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

  // Cuenta regresiva para reenvío
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, COUNTDOWN_INTERVAL);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // Formatear tiempo
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / SECONDS_PER_MINUTE);
    const secs = seconds % SECONDS_PER_MINUTE;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  // Manejar cambio en input de código (incluye pegado de 6 dígitos)
  const handleCodeChange = useCallback((text, index) => {
    const digits = text.replace(/\D/g, '');

    if (digits.length > 1) {
      const pasted = digits.slice(0, CODE_LENGTH).split('');
      setCode((prevCode) => {
        const newCode = [...prevCode];
        pasted.forEach((digit, offset) => {
          const targetIndex = index + offset;
          if (targetIndex < CODE_INPUTS_COUNT) {
            newCode[targetIndex] = digit;
          }
        });
        return newCode;
      });
      const nextFocus = Math.min(index + pasted.length, LAST_INPUT_INDEX);
      setTimeout(() => {
        inputRefs[nextFocus].current?.focus();
      }, 0);
      if (error) setError('');
      return;
    }

    setCode((prevCode) => {
      const newCode = [...prevCode];
      newCode[index] = digits;

      if (digits !== '' && index < LAST_INPUT_INDEX) {
        setTimeout(() => {
          inputRefs[index + 1].current?.focus();
        }, 0);
      }

      return newCode;
    });

    if (error) setError('');
  }, [error, inputRefs]);

  // Manejar retroceso (backspace)
  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }, [code, inputRefs]);

  // Manejar animación al presionar
  const handlePressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_SCALE_PRESSED,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: BUTTON_SCALE_NORMAL,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  // Verificar código
  const handleVerifyCode = useCallback(async () => {
    const completeCode = code.join('');
    
    if (!isCompleteVerificationCode(completeCode)) {
      setError(TEXTS.CODE_REQUIRED);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await userService.verifyCode(email, completeCode);
      // Si el código es válido, navegar a la pantalla de nueva contraseña
      navigation.navigate(ROUTES.NEW_PASSWORD, { email, code: completeCode });
    } catch (error) {
      setError(
        resolvePasswordRecoveryErrorMessage(error, TEXTS, 'CODE_INVALID'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    code,
    email,
    navigation,
    TEXTS,
  ]);

  // Reenviar código
  const handleResendCode = useCallback(async () => {
    try {
      const data = await userService.recoverPassword(email);
      const nextCountdown =
        typeof data?.expiresIn === 'number' && data.expiresIn > 0
          ? data.expiresIn
          : COUNTDOWN_INITIAL;
      setCountdown(nextCountdown);
      setCanResend(false);
      Alert.alert(TEXTS.CODE_RESENT, TEXTS.CODE_RESENT_MESSAGE);
    } catch (error) {
      Alert.alert(
        TEXTS.ERROR,
        resolvePasswordRecoveryErrorMessage(error, TEXTS, 'RESEND_ERROR'),
      );
    }
  }, [
    email,
    TEXTS,
  ]);

  return (
    <KeyboardAwareScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              accessibilityLabel={TEXTS.BACK}
            >
              <Ionicons name="arrow-back" size={BACK_ICON_SIZE} color={colors.white} />
            </TouchableOpacity>

            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            
            <Text style={styles.subtitle}>
              {TEXTS.SUBTITLE}
            </Text>
            
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[styles.codeInput, error && styles.inputError]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0}
                />
              ))}
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Animated.View 
              style={{ 
                transform: [{ scale: buttonScale }], 
                width: '100%', 
                marginTop: BUTTON_ANIMATED_MARGIN_TOP 
              }}
            >
              <TouchableOpacity 
                style={[styles.button, isSubmitting && styles.disabledButton]} 
                onPress={handleVerifyCode} 
                disabled={isSubmitting}
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>{TEXTS.BUTTON_VERIFY}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.resendText}>{TEXTS.RESEND_CODE}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.countdownText}>
                  {TEXTS.COUNTDOWN_MESSAGE} {formatTime(countdown)}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate(ROUTES.SIGN_IN)} 
              style={styles.linkContainer}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
            >
              <Text style={styles.linkText}>{TEXTS.BACK_TO_SIGN_IN}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ImageBackground>
    </KeyboardAwareScrollView>
  );
};

export default VerifyCodeScreen; 