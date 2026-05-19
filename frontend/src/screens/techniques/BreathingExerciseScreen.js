/**
 * Pantalla de Ejercicio de Respiración
 * Ejercicio interactivo guiado de respiración consciente
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BreathingExercise from '../../components/therapeutic/BreathingExercise';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';

const DEFAULT_TEXTS = {
  TITLE: 'Ejercicio de Respiracion',
};

const BreathingExerciseScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.BREATHING_TITLE || DEFAULT_TEXTS.TITLE,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
        },
      }),
    [colors],
  );

  const handleComplete = (data) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Opcional: navegar de vuelta o mostrar mensaje de éxito
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title={TEXTS.TITLE}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <BreathingExercise
          onComplete={handleComplete}
          cycles={5}
        />
      </View>
    </SafeAreaView>
  );
};
// `styles` se deriva del tema dentro del componente.

export default BreathingExerciseScreen;

