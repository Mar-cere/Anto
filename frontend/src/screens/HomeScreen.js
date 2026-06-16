/**
 * Pantalla de inicio de la aplicación
 * 
 * Muestra la pantalla de bienvenida con opciones para iniciar sesión,
 * registrarse y acceder al chat. Incluye animaciones de entrada y
 * un banner de emociones.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import {
  ANIMATION_DELAYS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES
} from '../constants/animations';
import { ROUTES } from '../constants/routes';
import { OPACITIES, SCALES, SPACING } from '../constants/ui';
import {
  NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN,
  openEmergencyChatFromHome,
} from '../navigation/navigationHelpers';
import { createGlobalStyles } from '../styles/globalStyles';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';

// Constantes específicas de esta pantalla
const ANIMATION_INITIAL_DELAY = ANIMATION_DELAYS.SCREEN_ENTRY;
const ANIMATION_DURATION = ANIMATION_DURATIONS.SLOW;
const INITIAL_TRANSLATE_Y = ANIMATION_VALUES.INITIAL_TRANSLATE_Y;
const INITIAL_OPACITY = ANIMATION_VALUES.INITIAL_OPACITY;
const FINAL_OPACITY = ANIMATION_VALUES.FINAL_OPACITY;
const FINAL_TRANSLATE_Y = ANIMATION_VALUES.FINAL_TRANSLATE_Y;
const INITIAL_SCALE = ANIMATION_VALUES.INITIAL_SCALE;
const INITIAL_BUTTON_OPACITY = ANIMATION_VALUES.INITIAL_BUTTON_OPACITY;

// Constantes de estilos específicas de esta pantalla
const IMAGE_OPACITY = OPACITIES.IMAGE_BACKGROUND;
const HORIZONTAL_PADDING = 30;
const TEXT_MARGIN_BOTTOM = 50;
const FOOTER_BOTTOM = 40;
const LOADING_SCALE = SCALES.LOADING;

// Mapeo de rutas para navegación
const ROUTE_MAP = {
  [ROUTES.SIGN_IN]: ROUTES.SIGN_IN,
  [ROUTES.REGISTER]: ROUTES.REGISTER,
  [ROUTES.CHAT]: ROUTES.CHAT,
  'FaQ': 'FaQ'
};
const DEFAULT_TEXTS = {
  WELCOME: '¡Bienvenido!',
  SUBTITLE: 'Nos alegra verte aquí.',
  SIGN_IN: 'Iniciar Sesión',
  REGISTER: 'Registrarse',
  FAQ: 'Preguntas frecuentes',
  SIGN_IN_HINT: 'Toca para ir a la pantalla de inicio de sesión',
  REGISTER_HINT: 'Toca para ir a la pantalla de registro',
  CONTINUE_WITHOUT_ACCOUNT_HINT:
    'Abre el chat de forma limitada sin iniciar sesión (útil en una emergencia)',
  EMERGENCY_CHAT_ENTRY: 'Ingresa al chat de emergencia',
  EMERGENCY_CHAT_ENTRY_A11Y: 'Abrir chat de emergencia',
  CHAT_LOGIN_REQUIRED_TITLE: 'Iniciar sesión requerido',
  CHAT_LOGIN_REQUIRED_MESSAGE:
    'Necesitas iniciar sesión para acceder al chat. ¿Deseas iniciar sesión ahora?',
  CANCEL: 'Cancelar',
  SIGN_IN_CTA: 'Iniciar sesión',
  ERROR_TITLE: 'Error',
  CHAT_SESSION_CHECK_ERROR:
    'Hubo un problema al verificar tu sesión. Por favor, intenta iniciar sesión.',
};

const HomeScreen = () => {
  const translated = useSectionTranslations('HOME');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      ...(translated || {}),
      EMERGENCY_CHAT_ENTRY:
        translated?.EMERGENCY_CHAT_ENTRY || DEFAULT_TEXTS.EMERGENCY_CHAT_ENTRY,
      EMERGENCY_CHAT_ENTRY_A11Y:
        translated?.EMERGENCY_CHAT_ENTRY_A11Y || DEFAULT_TEXTS.EMERGENCY_CHAT_ENTRY_A11Y,
      CHAT_LOGIN_REQUIRED_TITLE:
        translated?.CHAT_LOGIN_REQUIRED_TITLE || DEFAULT_TEXTS.CHAT_LOGIN_REQUIRED_TITLE,
      CHAT_LOGIN_REQUIRED_MESSAGE:
        translated?.CHAT_LOGIN_REQUIRED_MESSAGE ||
        DEFAULT_TEXTS.CHAT_LOGIN_REQUIRED_MESSAGE,
      CANCEL: translated?.CANCEL || DEFAULT_TEXTS.CANCEL,
      SIGN_IN_CTA: translated?.SIGN_IN || DEFAULT_TEXTS.SIGN_IN_CTA,
      ERROR_TITLE: translated?.ERROR_TITLE || DEFAULT_TEXTS.ERROR_TITLE,
      CHAT_SESSION_CHECK_ERROR:
        translated?.CHAT_SESSION_CHECK_ERROR ||
        DEFAULT_TEXTS.CHAT_SESSION_CHECK_ERROR,
    }),
    [translated],
  );
  const navigation = useNavigation();
  const { colors, statusBarStyle } = useTheme();
  const styles = useMemo(() => {
    const gs = createGlobalStyles(colors);
    return StyleSheet.create({
      container: gs.container,
      titleText: gs.titleText,
      subTitleText: gs.subTitleText,
      buttonContainer: gs.buttonContainer,
      FQText: gs.FQText,
      background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
      },
      imageStyle: {
        opacity: IMAGE_OPACITY,
      },
      contentContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: HORIZONTAL_PADDING,
      },
      loadingIndicator: {
        transform: [{ scale: LOADING_SCALE }],
      },
      textContainer: {
        alignItems: 'center',
        marginBottom: TEXT_MARGIN_BOTTOM,
      },
      footerContainer: {
        position: 'absolute',
        bottom: FOOTER_BOTTOM,
        width: '100%',
        alignItems: 'center',
      },
      emergencyContainer: {
        paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        paddingVertical: 12,
        marginBottom: 10,
      },
      emergencyText: {
        fontSize: 15,
        color: colors.primary,
        fontWeight: 'bold',
        textAlign: 'center',
      },
    });
  }, [colors]);

  const [isLoading, setIsLoading] = useState(true);
  
  // Valores para animaciones
  const fadeAnim = useRef(new Animated.Value(INITIAL_OPACITY)).current;
  const translateYAnim = useRef(new Animated.Value(INITIAL_TRANSLATE_Y)).current;
  const buttonScale = useRef(new Animated.Value(INITIAL_SCALE)).current;
  const buttonOpacity = useRef(new Animated.Value(INITIAL_BUTTON_OPACITY)).current;

  // Efecto para la animación inicial
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
        })
      ]).start();
    }, ANIMATION_INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateYAnim]);

  // Función para manejar la navegación
  const handleNavigation = async (screen) => {
    const route = ROUTE_MAP[screen] || screen;
    
    // Si intenta navegar al chat, verificar autenticación primero
    if (route === ROUTES.CHAT || screen === ROUTES.CHAT) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert(
            TEXTS.CHAT_LOGIN_REQUIRED_TITLE,
            TEXTS.CHAT_LOGIN_REQUIRED_MESSAGE,
            [
              { text: TEXTS.CANCEL, style: 'cancel' },
              {
                text: TEXTS.SIGN_IN_CTA,
                onPress: async () => {
                  try {
                    await AsyncStorage.setItem(NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN, '1');
                  } catch (_) {}
                  navigation.navigate(ROUTES.SIGN_IN);
                },
              },
            ]
          );
          return;
        }
        await openEmergencyChatFromHome(navigation);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        Alert.alert(TEXTS.ERROR_TITLE, TEXTS.CHAT_SESSION_CHECK_ERROR);
      }
    } else {
      navigation.navigate(route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />
      <ImageBackground 
        source={require('../images/back.png')} 
        style={styles.background} 
        imageStyle={styles.imageStyle}
      >
        <View style={styles.contentContainer}>
          {isLoading ? (
            <ActivityIndicator 
              size="large" 
              color={colors.primary} 
              style={styles.loadingIndicator} 
            />
          ) : (
            <>
              <Animated.View 
                style={[
                  styles.textContainer, 
                  { 
                    opacity: fadeAnim, 
                    transform: [{ translateY: translateYAnim }] 
                  }
                ]}
              >
                <Text testID="home-welcome-title" style={styles.titleText}>
                  {TEXTS.WELCOME}
                </Text>
                <Text style={styles.subTitleText}>{TEXTS.SUBTITLE}</Text>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.buttonContainer, 
                  { 
                    opacity: fadeAnim, 
                    transform: [{ translateY: translateYAnim }] 
                  }
                ]}
              >
                <AnimatedButton
                  testID="home-sign-in-button"
                  title={TEXTS.SIGN_IN}
                  onPress={() => handleNavigation(ROUTES.SIGN_IN)}
                  buttonScale={buttonScale}
                  buttonOpacity={buttonOpacity}
                  accessibilityLabel={TEXTS.SIGN_IN}
                  accessibilityHint={TEXTS.SIGN_IN_HINT}
                  isPrimary={true}
                />

                <AnimatedButton
                  title={TEXTS.REGISTER}
                  onPress={() => handleNavigation(ROUTES.REGISTER)}
                  buttonScale={buttonScale}
                  buttonOpacity={buttonOpacity}
                  accessibilityLabel={TEXTS.REGISTER}
                  accessibilityHint={TEXTS.REGISTER_HINT}
                  isPrimary={false}
                />
              </Animated.View>

              <View style={styles.footerContainer}>
                <TouchableOpacity
                  testID="emergency-chat-entry"
                  accessibilityLabel={TEXTS.EMERGENCY_CHAT_ENTRY_A11Y}
                  accessibilityHint={TEXTS.CONTINUE_WITHOUT_ACCOUNT_HINT}
                  style={styles.emergencyContainer}
                  onPress={() => handleNavigation(ROUTES.CHAT)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emergencyText}>{TEXTS.EMERGENCY_CHAT_ENTRY}</Text>
                </TouchableOpacity>
                <Text 
                  style={styles.FQText} 
                  onPress={() => handleNavigation('FaQ')}
                >
                  {TEXTS.FAQ}
                </Text>
              </View>
            </>
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

export default HomeScreen;