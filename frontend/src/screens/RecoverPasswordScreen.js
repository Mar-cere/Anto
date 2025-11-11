/**
 * Pantalla de Recuperación de Contraseña
 * 
 * Permite a los usuarios solicitar un código de recuperación de contraseña
 * mediante su correo electrónico. Incluye validación de email y navegación
 * a la pantalla de verificación de código.
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
import { colors, globalStyles } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  TITLE: 'Recuperar Contraseña',
  SUBTITLE: 'Introduce tu correo electrónico y te enviaremos un código de verificación para recuperar tu contraseña.',
  EMAIL_PLACEHOLDER: 'Correo Electrónico',
  EMAIL_LABEL: 'Correo Electrónico',
  BUTTON_SEND_CODE: 'Enviar Código',
  BUTTON_SEND_CODE_LABEL: 'Enviar Código',
  LINK_BACK: 'Volver al Inicio de Sesión',
  BACK: 'Volver',
  EMAIL_REQUIRED: 'Por favor, introduce tu correo electrónico',
  EMAIL_INVALID: 'Por favor, introduce un correo electrónico válido',
  ERROR_SEND_CODE: 'Error al enviar el código de recuperación',
};

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Constantes de navegación
const VERIFY_CODE_ROUTE = 'VerifyCode';

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
const LINK_CONTAINER_MARGIN_TOP = 20;
const TEXT_SHADOW_OFFSET_WIDTH = 1;
const TEXT_SHADOW_OFFSET_HEIGHT = 1;
const TEXT_SHADOW_RADIUS = 3;
const ICON_SIZE = 24;
const EMAIL_ICON_SIZE = 20;
const SEND_ICON_SIZE = 20;
const SEND_ICON_MARGIN_RIGHT = 8;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: colors.accent,
  TEXT_SHADOW: 'rgba(0, 0, 0, 0.75)',
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');

const RecoverPasswordScreen = ({ navigation }) => {
  // Referencias para animaciones
  const buttonScale = useRef(new Animated.Value(BUTTON_SCALE_NORMAL)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(TRANSLATE_Y_ANIMATION_INITIAL)).current;

  // Estados
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
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
  const handleRecoverPassword = async () => {
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
      // Navegar a la pantalla de verificación de código
      navigation.navigate(VERIFY_CODE_ROUTE, { email: normalizedEmail });
    } catch (error) {
      setError(handleApiError(error) || TEXTS.ERROR_SEND_CODE);
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
            
            <Text style={styles.subtitle}>
              {TEXTS.SUBTITLE}
            </Text>

            <View style={globalStyles.inputWrapper}>
              <View style={[
                globalStyles.inputContainer, 
                error && globalStyles.inputError
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={EMAIL_ICON_SIZE} 
                  color={COLORS.PRIMARY} 
                  style={globalStyles.inputIcon} 
                />
                <TextInput 
                  style={globalStyles.input}
                  placeholder={TEXTS.EMAIL_PLACEHOLDER} 
                  placeholderTextColor={COLORS.ACCENT}
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase().trim());
                    setError('');
                  }}
                  accessibilityLabel={TEXTS.EMAIL_LABEL}
                  testID="recoverEmailInput"
                />
              </View>
              {error ? <Text style={globalStyles.errorText}>{error}</Text> : null}
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <TouchableOpacity 
                style={[globalStyles.modernButton, isSubmitting && globalStyles.disabledButton]} 
                onPress={handleRecoverPassword} 
                disabled={isSubmitting}
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityLabel={TEXTS.BUTTON_SEND_CODE_LABEL}
                testID="sendCodeButton"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <>
                    <Ionicons 
                      name="send-outline" 
                      size={SEND_ICON_SIZE} 
                      color={COLORS.WHITE} 
                      style={{ marginRight: SEND_ICON_MARGIN_RIGHT }} 
                    />
                    <Text style={globalStyles.buttonText}>{TEXTS.BUTTON_SEND_CODE}</Text>
                  </>
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
});

export default RecoverPasswordScreen; 