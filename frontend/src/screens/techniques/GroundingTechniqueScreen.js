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
import { useSectionTranslations } from '../../hooks/useTranslations';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';

const DEFAULT_TEXTS = {
  TITLE: 'Tecnica de Grounding',
};

const GroundingTechniqueScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.GROUNDING_TITLE || DEFAULT_TEXTS.TITLE,
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

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // #127: registrar completado cuando se abre desde sugerencia directa (best-effort)
    recordInterventionCompleted('grounding_technique');
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
        <GroundingExercise onComplete={handleComplete} />
      </View>
    </SafeAreaView>
  );
};
// `styles` se deriva del tema dentro del componente.

export default GroundingTechniqueScreen;

