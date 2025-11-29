/**
 * Componente de Ejercicio de Respiración
 * Ejercicio interactivo guiado de respiración consciente
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../../styles/globalStyles';

// Constantes de animación
const BREATH_CYCLE_DURATION = 8000; // 8 segundos por ciclo completo
const INHALE_DURATION = 4000; // 4 segundos inhalar
const HOLD_DURATION = 2000; // 2 segundos mantener
const EXHALE_DURATION = 6000; // 6 segundos exhalar

// Constantes de textos
const TEXTS = {
  INHALE: 'Inhala',
  HOLD: 'Mantén',
  EXHALE: 'Exhala',
  START: 'Comenzar',
  PAUSE: 'Pausar',
  RESUME: 'Continuar',
  RESET: 'Reiniciar',
  COMPLETE: 'Completado',
  CYCLES: 'Ciclos completados',
};

const BreathingExercise = ({ 
  onComplete,
  cycles = 5,
  inhaleDuration = INHALE_DURATION,
  holdDuration = HOLD_DURATION,
  exhaleDuration = EXHALE_DURATION,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('inhale');
  const [completedCycles, setCompletedCycles] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  // Animación de respiración
  useEffect(() => {
    if (!isActive || isPaused) return;

    let phaseTimer;
    let countdownInterval;

    const startPhase = (phase, duration) => {
      setCurrentPhase(phase);
      setCountdown(Math.ceil(duration / 1000));

      // Animación visual
      if (phase === 'inhale') {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (phase === 'exhale') {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Countdown
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Siguiente fase
      phaseTimer = setTimeout(() => {
        clearInterval(countdownInterval);
        if (phase === 'inhale') {
          startPhase('hold', holdDuration);
        } else if (phase === 'hold') {
          startPhase('exhale', exhaleDuration);
        } else if (phase === 'exhale') {
          const newCycles = completedCycles + 1;
          setCompletedCycles(newCycles);
          
          if (newCycles >= cycles) {
            setIsActive(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (onComplete) onComplete();
          } else {
            startPhase('inhale', inhaleDuration);
          }
        }
      }, duration);
    };

    startPhase('inhale', inhaleDuration);

    return () => {
      clearTimeout(phaseTimer);
      clearInterval(countdownInterval);
    };
  }, [isActive, isPaused, completedCycles, cycles, inhaleDuration, holdDuration, exhaleDuration]);

  // Manejar inicio/pausa
  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setIsPaused(!isPaused);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Manejar reinicio
  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentPhase('inhale');
    setCompletedCycles(0);
    setCountdown(0);
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.7);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Obtener texto de fase
  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale':
        return TEXTS.INHALE;
      case 'hold':
        return TEXTS.HOLD;
      case 'exhale':
        return TEXTS.EXHALE;
      default:
        return '';
    }
  };

  // Obtener color de fase
  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale':
        return colors.success;
      case 'hold':
        return colors.warning;
      case 'exhale':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              backgroundColor: `${getPhaseColor()}30`,
              borderColor: getPhaseColor(),
            },
          ]}
        >
          <Text style={[styles.phaseText, { color: getPhaseColor() }]}>
            {getPhaseText()}
          </Text>
          {countdown > 0 && (
            <Text style={styles.countdownText}>{countdown}</Text>
          )}
        </Animated.View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cyclesText}>
          {TEXTS.CYCLES}: {completedCycles} / {cycles}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleToggle}
        >
          <MaterialCommunityIcons
            name={isActive && !isPaused ? 'pause' : 'play'}
            size={24}
            color={colors.white}
          />
          <Text style={styles.buttonText}>
            {!isActive ? TEXTS.START : isPaused ? TEXTS.RESUME : TEXTS.PAUSE}
          </Text>
        </TouchableOpacity>

        {isActive && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleReset}
          >
            <MaterialCommunityIcons
              name="restart"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.buttonText, { color: colors.primary }]}>
              {TEXTS.RESET}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  circleContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
  },
  infoContainer: {
    marginBottom: 30,
  },
  cyclesText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  controlsContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default BreathingExercise;

