/**
 * Pantalla de Verificación de Email
 * 
 * Permite al usuario verificar su email después del registro
 * ingresando el código recibido por correo.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import ParticleBackground from '../components/ParticleBackground';
import OfflineBanner from '../components/OfflineBanner';
import { api, ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants/routes';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { clearPersistedChatSession } from '../utils/chatSessionStorage';
import { useToast } from '../context/ToastContext';
import { SPACING } from '../constants/ui';
import { useSectionTranslations } from '../hooks/useTranslations';

// Constantes
const CODE_LENGTH = 6;
const CODE_EXPIRATION_MINUTES = 10;
const DEFAULT_TEXTS = {
  TITLE: 'Verifica tu Email',
  SUBTITLE: 'Ingresa el código de 6 dígitos que enviamos a:',
  CODE_INCOMPLETE: 'Por favor ingresa el código completo de 6 dígitos',
  EMAIL_MISSING: 'No se encontró el email. Por favor, regístrate nuevamente.',
  VERIFIED_TITLE: '¡Email verificado!',
  VERIFIED_MESSAGE: 'Tu cuenta ha sido verificada exitosamente.',
  CONTINUE: 'Continuar',
  TOKENS_MISSING: 'No se recibieron los tokens de autenticación',
  VERIFY_ERROR:
    'Error al verificar el código. Por favor, intenta nuevamente.',
  RESENT_OK: 'Se ha enviado un nuevo código de verificación a tu correo.',
  RESEND_ERROR: 'Error al reenviar el código. Por favor, intenta nuevamente.',
  EXPIRES_IN: 'El código expira en:',
  VERIFY: 'Verificar',
  RESEND: 'Reenviar código',
  INFO:
    'Si no recibiste el código, revisa tu carpeta de spam o solicita un nuevo código.',
  BACK: 'Volver',
  INVALID_CODE: 'El código ingresado no es válido.',
  CODE_EXPIRED: 'El código expiró. Solicita uno nuevo.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  RESEND_RATE_LIMIT: 'Espera unos segundos antes de reenviar un nuevo código.',
  CONNECTION_ERROR: 'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
};

const resolveVerifyEmailErrorMessage = (error, texts, fallbackKey) => {
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
    return texts.CONNECTION_ERROR || texts[fallbackKey];
  }

  if (status === 429 || rawMessage.includes('too many')) {
    return texts.TOO_MANY_ATTEMPTS;
  }

  if (
    rawMessage.includes('expired') ||
    rawMessage.includes('expir') ||
    rawMessage.includes('vencid')
  ) {
    return texts.CODE_EXPIRED;
  }

  if (
    rawMessage.includes('invalid code') ||
    rawMessage.includes('invalid verification') ||
    rawMessage.includes('invalid token') ||
    rawMessage.includes('código inválido') ||
    rawMessage.includes('codigo invalido') ||
    rawMessage.includes('incorrect')
  ) {
    return texts.INVALID_CODE;
  }

  return texts[fallbackKey];
};

const VerifyEmailScreen = () => {
  const AUTH = useSectionTranslations('AUTH');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(AUTH?.VERIFY_EMAIL || {}) }),
    [AUTH],
  );
  const navigation = useNavigation();
  const route = useRoute();
  const { refreshSession } = useAuth();
  const { showToast } = useToast();
  const { colors, statusBarStyle } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        background: {
          flex: 1,
        },
        imageStyle: {
          opacity: 0.3,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
        },
        backButton: {
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 10,
          padding: 8,
        },
        header: {
          alignItems: 'center',
          marginBottom: 40,
          marginTop: 60,
        },
        title: {
          fontSize: 28,
          fontWeight: 'bold',
          color: colors.white,
          marginTop: 20,
          marginBottom: 12,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 8,
        },
        email: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.primary,
          textAlign: 'center',
        },
        codeContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        codeInput: {
          width: 45,
          height: 60,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: 12,
          backgroundColor: colors.chromeInput,
          color: colors.text,
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        codeInputFilled: {
          borderColor: colors.primary,
          backgroundColor: colors.accentLineSoft,
        },
        timer: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
        },
        verifyButton: {
          backgroundColor: colors.primary,
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 16,
        },
        verifyButtonDisabled: {
          opacity: 0.5,
        },
        verifyButtonText: {
          color: colors.white,
          fontSize: 18,
          fontWeight: 'bold',
        },
        resendButton: {
          paddingVertical: 12,
          alignItems: 'center',
        },
        resendButtonText: {
          color: colors.primary,
          fontSize: 16,
          fontWeight: '600',
        },
        infoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 24,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        infoText: {
          flex: 1,
          fontSize: 14,
          color: colors.textSecondary,
          marginLeft: 8,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const email = route.params?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(CODE_EXPIRATION_MINUTES * 60);
  const inputRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Timer para mostrar tiempo restante
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index, value) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus siguiente input
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit cuando se completa el código
    if (value && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode = null) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== CODE_LENGTH) {
      showToast({
        message: TEXTS.CODE_INCOMPLETE,
        type: 'warning',
      });
      return;
    }

    if (!email) {
      showToast({
        message: TEXTS.EMAIL_MISSING,
        type: 'error',
      });
      navigation.navigate(ROUTES.REGISTER);
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await api.post(ENDPOINTS.VERIFY_EMAIL, {
        email,
        code: codeToVerify,
      });

      if (response.accessToken || response.token) {
        await clearPersistedChatSession();
        // Guardar tokens y datos del usuario
        await AsyncStorage.setItem('userToken', response.accessToken || response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        }
        await refreshSession();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          TEXTS.VERIFIED_TITLE,
          TEXTS.VERIFIED_MESSAGE,
          [
            {
              text: TEXTS.CONTINUE,
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: ROUTES.MAIN_TABS }],
                });
              },
            },
          ]
        );
      } else {
        throw new Error(TEXTS.TOKENS_MISSING);
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage = resolveVerifyEmailErrorMessage(
        error,
        TEXTS,
        'VERIFY_ERROR',
      );

      showToast({
        message: errorMessage,
        type: 'error',
      });
      
      // Limpiar código en caso de error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      showToast({
        message: TEXTS.EMAIL_MISSING,
        type: 'error',
      });
      navigation.navigate(ROUTES.REGISTER);
      return;
    }

    try {
      setIsResending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await api.post(ENDPOINTS.RESEND_VERIFICATION_CODE, { email });

      // Resetear timer
      setTimeRemaining(CODE_EXPIRATION_MINUTES * 60);
      
      // Limpiar código
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        message: TEXTS.RESENT_OK,
        type: 'success',
      });
    } catch (error) {
      console.error('Error reenviando código:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage = resolveVerifyEmailErrorMessage(
        error,
        {
          ...TEXTS,
          TOO_MANY_ATTEMPTS: TEXTS.RESEND_RATE_LIMIT || TEXTS.TOO_MANY_ATTEMPTS,
        },
        'RESEND_ERROR',
      );

      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <OfflineBanner />
      
      <ImageBackground
        source={require('../images/back.png')}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel={TEXTS.BACK}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Ionicons name="mail" size={64} color={colors.primary} />
              <Text style={styles.title}>{TEXTS.TITLE}</Text>
              <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>

            {/* Inputs de código */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isSubmitting}
                />
              ))}
            </View>

            {/* Timer */}
            {timeRemaining > 0 && (
              <Text style={styles.timer}>
                {TEXTS.EXPIRES_IN} {formatTime(timeRemaining)}
              </Text>
            )}

            {/* Botón de verificar */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isSubmitting || code.join('').length !== CODE_LENGTH) && styles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerify()}
              disabled={isSubmitting || code.join('').length !== CODE_LENGTH}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.verifyButtonText}>{TEXTS.VERIFY}</Text>
              )}
            </TouchableOpacity>

            {/* Botón de reenviar */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={isResending || timeRemaining > 0}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.resendButtonText}>
                  {timeRemaining > 0 
                    ? `${TEXTS.RESEND} (${formatTime(timeRemaining)})`
                    : TEXTS.RESEND}
                </Text>
              )}
            </TouchableOpacity>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {TEXTS.INFO}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

export default VerifyEmailScreen;

