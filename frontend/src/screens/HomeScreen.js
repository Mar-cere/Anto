/**
 * Pantalla de inicio de la aplicación
 * 
 * Muestra la pantalla de bienvenida con opciones para iniciar sesión,
 * registrarse y acceder al chat. Incluye animaciones de entrada y
 * un banner de emociones.
 * 
 * @author AntoApp Team
 */

import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import EmotionBanner from '../components/EmotionBanner';
import ParticleBackground from '../components/ParticleBackground';
import { ROUTES } from '../constants/routes';
import emotions from '../data/emotions';
import { colors, globalStyles } from '../styles/globalStyles';

// Constantes de animación
const ANIMATION_INITIAL_DELAY = 1500; // ms
const ANIMATION_DURATION = 800; // ms
const INITIAL_TRANSLATE_Y = 30;
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const FINAL_TRANSLATE_Y = 0;

// Constantes de valores iniciales de animación
const INITIAL_SCALE = 1;
const INITIAL_BUTTON_OPACITY = 1;

// Constantes de estilos
const IMAGE_OPACITY = 0.1;
const HORIZONTAL_PADDING = 30;
const TEXT_MARGIN_BOTTOM = 50;
const FOOTER_BOTTOM = 40;
const LOADING_SCALE = 1.5;

// Constantes de textos
const TEXTS = {
  WELCOME: '¡Bienvenido!',
  SUBTITLE: 'Nos alegra verte aquí.',
  SIGN_IN: 'Iniciar Sesión',
  REGISTER: 'Crear cuenta',
  FAQ: 'Preguntas Frecuentes',
  SIGN_IN_HINT: 'Toca para ir a la pantalla de inicio de sesión',
  REGISTER_HINT: 'Toca para ir a la pantalla de registro'
};

// Constantes de StatusBar
const STATUS_BAR_STYLE = 'light-content';

// Mapeo de rutas para navegación
const ROUTE_MAP = {
  [ROUTES.SIGN_IN]: ROUTES.SIGN_IN,
  [ROUTES.REGISTER]: ROUTES.REGISTER,
  [ROUTES.CHAT]: ROUTES.CHAT,
  'FaQ': 'FaQ'
};

const HomeScreen = () => {
  const navigation = useNavigation();
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
  const handleNavigation = (screen) => {
    const route = ROUTE_MAP[screen] || screen;
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={STATUS_BAR_STYLE} />
      <ImageBackground 
        source={require('../images/back.png')} 
        style={styles.background} 
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />
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
                <Text style={styles.titleText}>{TEXTS.WELCOME}</Text>
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
                <EmotionBanner 
                  emotions={emotions} 
                  onPress={() => handleNavigation(ROUTES.CHAT)}
                />
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

const styles = StyleSheet.create({
  ...globalStyles,
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
});

export default HomeScreen;