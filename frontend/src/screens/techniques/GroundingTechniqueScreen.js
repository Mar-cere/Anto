/**
 * Pantalla de Técnica de Grounding
 * Ejercicio interactivo guiado de grounding 5-4-3-2-1
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
import GroundingExercise from '../../components/therapeutic/GroundingExercise';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';

const GroundingTechniqueScreen = () => {
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
        title="Técnica de Grounding"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <GroundingExercise onComplete={handleComplete} />
      </View>
    </SafeAreaView>
  );
};
// `styles` se deriva del tema dentro del componente.

export default GroundingTechniqueScreen;

