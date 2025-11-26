/**
 * Componente de Resaltado para Tutorial
 * 
 * Crea un overlay que ilumina/resalta elementos específicos de la UI
 * durante el tutorial de onboarding.
 * 
 * @author AntoApp Team
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../styles/globalStyles';

const { width, height } = Dimensions.get('window');

// Posiciones y tamaños de los elementos a resaltar
const ELEMENT_POSITIONS = {
  chat: {
    // Botón central de chat en FloatingNavBar
    x: width / 2 - 30, // Centro menos la mitad del ancho del botón
    y: height - 100, // Cerca del fondo donde está la barra de navegación
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  'tasks-habits': {
    // Área de las tarjetas de tareas y hábitos (centro de la pantalla)
    x: 20,
    y: height * 0.3, // Aproximadamente donde están las tarjetas
    width: width - 40,
    height: 300, // Altura suficiente para cubrir ambas tarjetas
    borderRadius: 16,
  },
  settings: {
    // Botón de ajustes en FloatingNavBar (último botón a la derecha)
    x: width - 80, // Cerca del borde derecho
    y: height - 100, // Cerca del fondo
    width: 60,
    height: 60,
    borderRadius: 30,
  },
};

const TutorialHighlight = ({ highlightElement, visible }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible && highlightElement) {
      // Animación de pulso
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animación de brillo
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.5);
    }
  }, [visible, highlightElement]);

  if (!visible || !highlightElement || !ELEMENT_POSITIONS[highlightElement]) {
    return null;
  }

  const element = ELEMENT_POSITIONS[highlightElement];
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Capa oscura de fondo */}
      <View style={styles.darkLayer} />

      {/* Resplandor alrededor del elemento */}
      <Animated.View
        style={[
          styles.glow,
          {
            left: element.x - 15,
            top: element.y - 15,
            width: element.width + 30,
            height: element.height + 30,
            borderRadius: element.borderRadius + 15,
            opacity: glowOpacity,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.glowInner,
            {
              width: element.width + 30,
              height: element.height + 30,
              borderRadius: element.borderRadius + 15,
            },
          ]}
        />
      </Animated.View>

      {/* Borde resaltado del elemento */}
      <Animated.View
        style={[
          styles.hole,
          {
            left: element.x - 10,
            top: element.y - 10,
            width: element.width + 20,
            height: element.height + 20,
            borderRadius: element.borderRadius + 10,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  darkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  hole: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 15,
  },
  glow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowInner: {
    backgroundColor: colors.primary,
    opacity: 0.2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 15,
  },
});

export default TutorialHighlight;

