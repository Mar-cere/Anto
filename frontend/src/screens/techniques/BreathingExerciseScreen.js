/**
 * Pantalla de Ejercicio de Respiración
 * Ejercicio interactivo guiado de respiración consciente
 */

import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React from 'react';
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
import { colors } from '../../styles/globalStyles';

const BreathingExerciseScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleComplete = (data) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Opcional: navegar de vuelta o mostrar mensaje de éxito
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <Header
        title="Ejercicio de Respiración"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});

export default BreathingExerciseScreen;

