/**
 * Overlay de resaltado para el tutorial de onboarding.
 * Coordenadas alineadas con FloatingNavBar (Inicio | Recordatorios | Chat | Técnicas | Ajustes).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const SCREEN_EDGE = SPACING.SCREEN_EDGE_INSET;
const NAV_CENTER_WIDTH = 64;

function navTabHighlight(index) {
  const barLeft = SCREEN_EDGE;
  const barWidth = width - SCREEN_EDGE * 2;
  const sideSlot = (barWidth - NAV_CENTER_WIDTH) / 4;
  const tabSize = 56;
  const navY = height - 92;

  const centerX =
    index === 0
      ? barLeft + sideSlot * 0.5
      : index === 1
        ? barLeft + sideSlot * 1.5
        : index === 2
          ? width / 2
          : index === 3
            ? barLeft + 2 * sideSlot + NAV_CENTER_WIDTH + sideSlot * 0.5
            : barLeft + 3 * sideSlot + NAV_CENTER_WIDTH + sideSlot * 0.5;

  return {
    x: centerX - tabSize / 2,
    y: index === 2 ? height - 98 : navY,
    width: tabSize,
    height: tabSize,
    borderRadius: tabSize / 2,
  };
}

/** Posiciones de elementos resaltables (recalculadas al montar). */
function buildElementPositions() {
  return {
    'home-focus': {
      x: SCREEN_EDGE,
      y: Math.max(100, height * 0.11),
      width: width - SCREEN_EDGE * 2,
      height: Math.min(260, height * 0.28),
      borderRadius: 16,
    },
    chat: navTabHighlight(2),
    reminders: navTabHighlight(1),
    /** Alias legacy del tutorial anterior */
    'tasks-habits': navTabHighlight(1),
    techniques: navTabHighlight(3),
    settings: navTabHighlight(4),
  };
}

const TutorialHighlight = ({ highlightElement, visible }) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const elementPositions = useMemo(() => buildElementPositions(), []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [colors],
  );

  useEffect(() => {
    if (visible && highlightElement) {
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
        ]),
      ).start();

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
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.5);
    }
  }, [visible, highlightElement, glowAnim, pulseAnim]);

  const element = highlightElement ? elementPositions[highlightElement] : null;

  if (!visible || !element) {
    return null;
  }

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.darkLayer} />

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

export default TutorialHighlight;
